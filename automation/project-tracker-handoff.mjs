import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validatePublicUrl, validateResearchFeed } from './ai-infrastructure-research.mjs';

// Pure planner: it has no Google/GitHub credentials and cannot change scores.
export const PROJECT_SHEET_ID = '1Q7_v1KKXj9a4Crt5kQxDOki1BxrO0b7xcfByqqWMmPM';
const RESOLVED = new Set(['Validated', 'Partially validated', 'Contradicted', 'Abandoned']);
const FIELDS = {
  Bottlenecks: ['Signal ID', 'Date', 'Scope', 'Domain', 'Bottleneck', 'Direction', 'Evidence Summary', 'Speaker / Entity', 'Authority Type', 'Source Quality', 'Source URL', 'Linked Project IDs', 'Notes'],
  Claims: ['Claim ID', 'Project ID', 'Claim Date', 'Claimant', 'Claim Type', 'Baseline', 'Target', 'Unit', 'Target Date', 'Original Claim', 'Source Quality', 'Source URL', 'Resolution Status', 'Resolution Date', 'Actual Result', 'Actual Unit', 'Realization %', 'Delay Days', 'Resolution Source', 'Notes'],
};
const copy = value => structuredClone(value);
const check = (value, message) => { if (!value) throw new Error(message); };
const required = (value, label) => check(typeof value === 'string' && value.trim() === value && value.length > 0, `Missing/invalid ${label}`);
const normalized = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const date = (value, label, observedAt) => {
  check(/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= observedAt.slice(0, 10), `Invalid/future ${label}`);
};
export function canonicalSourceUrl(value) {
  const url = validatePublicUrl(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  return url.toString().replace(/\/$/, '');
}
export function sourceVersion(table, row) {
  check(FIELDS[table], 'Unknown source table');
  // Next Review is scheduling metadata; moving it is not new evidence.
  const record = Object.fromEntries(FIELDS[table].map(field => [field, String(row[field] ?? '')]));
  return createHash('sha256').update(JSON.stringify(record)).digest('hex');
}
function sourceRows(input) {
  const rows = new Map();
  for (const table of Object.keys(FIELDS)) {
    check(Array.isArray(input[table]), `Missing complete ${table} snapshot`);
    for (const row of input[table]) {
      const sourceId = row[table === 'Claims' ? 'Claim ID' : 'Signal ID'];
      required(sourceId, 'source ID');
      check(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(sourceId), 'Unsafe source ID');
      const key = `${table}:${sourceId}`;
      check(!rows.has(key), `Duplicate upstream ID: ${key}`);
      rows.set(key, { table, sourceId, row, version: sourceVersion(table, row) });
    }
  }
  return rows;
}
function sourceUrls(record) {
  const provenance = record.provenance;
  return [record.url, provenance?.originalSourceUrl, provenance?.resolutionSourceUrl].filter(Boolean).map(canonicalSourceUrl);
}

export function planProjectHandoff({ source, feed, decisions = [], state = { version: 1, records: {} }, observedAt }) {
  check(typeof observedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(observedAt) && Number.isFinite(Date.parse(observedAt)) && new Date(observedAt).toISOString().slice(0, 19) === observedAt.slice(0, 19), 'Invalid observedAt');
  check(Date.parse(observedAt) <= Date.now(), 'Future observedAt');
  validateResearchFeed(feed);
  check(state.version === 1 && state.records && !Array.isArray(state.records), 'Invalid handoff state');
  const rows = sourceRows(source);
  const nextState = copy(state);
  const existing = [...feed.evidence, ...feed.observations];
  const additions = [], outcomes = [], touched = new Set();
  const save = (key, version, disposition, evidenceId, reason) => {
    nextState.records[key] = { version, disposition, ...(evidenceId ? { evidenceId } : {}), reason };
    outcomes.push({ key, disposition, ...(evidenceId ? { evidenceId } : {}) });
  };
  for (const decision of decisions) {
    const key = `${decision.table}:${decision.sourceId}`;
    check(!touched.has(key), `Duplicate decision: ${key}`); touched.add(key);
    const item = rows.get(key);
    check(item, `Unknown source ID: ${key}`);
    const { table, sourceId, row, version } = item;
    check(decision.version === version, `Source changed since review: ${key}`);
    required(decision.reason, 'selection reason');
    check(['import', 'link', 'skip'].includes(decision.action), 'Invalid decision action');
    if (decision.action === 'skip') {
      save(key, version, 'skipped', null, decision.reason); continue;
    }
    if (table === 'Claims') {
      check(RESOLVED.has(row['Resolution Status']), 'Claim is not substantively resolved');
      date(row['Resolution Date'], 'resolution date', observedAt);
      required(row['Resolution Source'], 'resolution source');
    }
    const originalDate = row[table === 'Claims' ? 'Claim Date' : 'Date'];
    date(originalDate, 'original date', observedAt);
    const originalClaim = row[table === 'Claims' ? 'Original Claim' : 'Evidence Summary'];
    required(originalClaim, 'original claim');
    const urls = [canonicalSourceUrl(row['Source URL'])];
    if (table === 'Claims') urls.push(canonicalSourceUrl(row['Resolution Source']));
    const id = `project-${sourceId.toLowerCase()}-${version.slice(0, 16)}`;
    const all = [...existing, ...additions];
    const replay = all.find(record => record.id === id);
    if (replay) {
      check(replay.provenance?.sourceVersion === version && replay.provenance?.sourceId === sourceId && replay.provenance?.table === table, 'Evidence ID collision');
      save(key, version, 'imported', id, decision.reason); continue;
    }
    const saved = nextState.records[key];
    if (saved?.version === version && ['imported', 'linked'].includes(saved.disposition)) {
      check(all.some(record => record.id === saved.evidenceId), 'State references missing evidence');
      save(key, version, saved.disposition, saved.evidenceId, saved.reason); continue;
    }
    const related = all.filter(record => sourceUrls(record).some(url => urls.includes(url)));
    if (decision.action === 'link') {
      check(related.some(record => record.id === decision.existingEvidenceId), 'Link must reference existing evidence with the same underlying source');
      save(key, version, 'linked', decision.existingEvidenceId, decision.reason); continue;
    }
    const evidence = decision.evidence;
    check(evidence && typeof evidence === 'object', 'Missing reviewed evidence');
    for (const field of ['title', 'summary', 'claim', 'interpretation', 'independenceGroup', 'verification', 'countercase', 'nextTest']) required(evidence[field], field);
    check(!/^(chatgpt|muse|project.?tracker)$/i.test(evidence.independenceGroup), 'Use underlying issuer, not tracker, for independenceGroup');
    const prior = all.filter(record => record.provenance?.tracker === 'ai-project-tracker' && record.provenance?.table === table && record.provenance?.sourceId === sourceId).at(-1);
    const exact = !prior && related.find(record => normalized(record.claim ?? record.summary ?? record.title) === normalized(evidence.claim));
    if (exact) {
      save(key, version, 'linked', exact.id, decision.reason); continue;
    }
    if (related.length && !prior) required(decision.distinctClaimReason, 'distinct claim reason for reused source');
    // Reuse the established origin label for the same document. A second tracker
    // or a second claim in one release is never an independent witness.
    const groups = new Set(related.map(record => record.independenceGroup));
    check(groups.size <= 1, 'Conflicting origin groups; resolve source attribution first');
    const provenance = {
      tracker: 'ai-project-tracker', finder: 'ChatGPT AI Project Tracker',
      table, sourceId, sourceVersion: version,
      projectIds: String(row[table === 'Claims' ? 'Project ID' : 'Linked Project IDs'] ?? '').split(/[,;\n]/).map(value => value.trim()).filter(Boolean),
      originalSourceUrl: row['Source URL'], originalDate, originalClaim,
      originator: row[table === 'Claims' ? 'Claimant' : 'Speaker / Entity'],
      sourceQuality: String(row['Source Quality'] ?? ''),
      notes: String(row.Notes ?? ''),
      ...(table === 'Claims' ? {
        claimId: sourceId, resolutionStatus: row['Resolution Status'],
        resolutionDate: row['Resolution Date'], resolutionSourceUrl: row['Resolution Source'],
        actualResult: String(row['Actual Result'] ?? ''), actualUnit: String(row['Actual Unit'] ?? ''),
        target: String(row.Target ?? ''), targetDate: String(row['Target Date'] ?? ''), unit: String(row.Unit ?? ''),
      } : { bottleneck: row.Bottleneck, direction: row.Direction }),
    };
    const record = {
      id, title: evidence.title, url: table === 'Claims' ? row['Resolution Source'] : row['Source URL'],
      kind: table === 'Claims' ? 'project-claim-resolution' : 'project-bottleneck',
      independenceGroup: related[0]?.independenceGroup ?? evidence.independenceGroup,
      publishedDate: evidence.publishedDate,
      observedAt, contentAccess: evidence.contentAccess, status: evidence.status,
      summary: evidence.summary, claim: evidence.claim, interpretation: evidence.interpretation,
      verification: evidence.verification, countercase: evidence.countercase, nextTest: evidence.nextTest,
      provenance, selectionReason: decision.reason,
      corroborationNote: 'Reused Project Tracker evidence; the source and this handoff count once, not as independent corroboration.',
      ...(decision.distinctClaimReason ? { distinctClaimReason: decision.distinctClaimReason } : {}),
      ...(prior ? { supersedes: prior.id, correctionReason: decision.reason } : {}),
    };
    check(JSON.stringify(record).length <= 45000, 'Evidence exceeds safe Sheet cell size');
    additions.push(record); save(key, version, 'imported', id, decision.reason);
  }
  // No mutation of rankings, valuation, history, coverage or source registries.
  const resultFeed = { ...copy(feed), evidence: [...copy(feed.evidence), ...additions] };
  if (additions.length) resultFeed.updatedAt = observedAt;
  validateResearchFeed(resultFeed);
  check(JSON.stringify(nextState).length <= 45000, 'Handoff state exceeds safe cell size; partition state before continuing');
  const pending = [...rows.entries()].filter(([key, item]) => nextState.records[key]?.version !== item.version && (item.table === 'Bottlenecks' || RESOLVED.has(item.row['Resolution Status']))).map(([key, item]) => ({ key, version: item.version }));
  return { additions, outcomes, pending, state: nextState, feed: resultFeed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , inputPath, outputPath] = process.argv;
  check(inputPath && outputPath, 'Usage: node automation/project-tracker-handoff.mjs INPUT.json PLAN.json');
  const result = planProjectHandoff(JSON.parse(await readFile(inputPath, 'utf8')));
  await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ added: result.additions.length, reviewed: result.outcomes.length, pending: result.pending.length }));
}
