import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isIP } from 'node:net';
import { SOURCE_SHEET } from './ai-infrastructure-feed.mjs';

export { SOURCE_SHEET };
export const RESEARCH_FEED = 'buy-window/ai-infrastructure-research.json';
const VERSIONS = new Set(['1.0.0', '1.1.0']);
const ACCESS = new Set(['full-transcript', 'article', 'slides', 'notes-only', 'catalog-only']);
const USABLE_ACCESS = new Set(['full-transcript', 'article', 'slides']);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function object(value, path) {
  invariant(value && typeof value === 'object' && !Array.isArray(value), `${path}_not_object`);
}

function text(value, path, minimum = 1) {
  invariant(typeof value === 'string' && value === value.trim() && value.length >= minimum, `${path}_invalid`);
}

function array(value, path) {
  invariant(Array.isArray(value), `${path}_not_array`);
}

function unique(values, path) {
  invariant(new Set(values).size === values.length, `${path}_duplicate`);
}

function timestamp(value, path, ceiling) {
  text(value, path);
  invariant(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value)), `${path}_invalid`);
  invariant(new Date(value).toISOString().slice(0, 19) === value.slice(0, 19), `${path}_invalid`);
  invariant(Date.parse(value) <= ceiling, `${path}_future`);
}

function date(value, path, ceiling) {
  invariant(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), `${path}_invalid`);
  const parsed = new Date(`${value}T00:00:00Z`);
  invariant(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, `${path}_invalid`);
  invariant(value <= new Date(ceiling).toISOString().slice(0, 10), `${path}_future`);
}

// Links are public provenance, never fetch instructions. This checks URL safety,
// not whether the publisher actually made the linked statement.
export function validatePublicUrl(value, path = 'url') {
  text(value, path);
  let parsed;
  try { parsed = new URL(value); } catch { /* Fail below. */ }
  invariant(parsed && parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.port, `${path}_unsafe`);
  const host = parsed.hostname.toLowerCase();
  invariant(!isIP(host.replace(/^\[|\]$/g, '')) && host.includes('.') && !host.endsWith('.') && !/^(localhost|0x[0-9a-f]+)$/.test(host), `${path}_unsafe_host`);
  invariant(!['.localhost', '.local', '.internal', '.test', '.invalid', '.example', '.onion'].some(suffix => host.endsWith(suffix)), `${path}_unsafe_host`);
  invariant(!/[\s\\]/.test(value) && !/%[0-9a-f]{2}/i.test(value.slice(0, value.indexOf('/', 8) === -1 ? value.length : value.indexOf('/', 8))), `${path}_unsafe_authority`);
  return parsed;
}

function ids(rows, path) {
  array(rows, path);
  const result = new Map();
  for (const [index, row] of rows.entries()) {
    object(row, `${path}_${index}`);
    text(row.id, `${path}_${index}_id`);
    invariant(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(row.id), `${path}_${index}_id_invalid`);
    invariant(!result.has(row.id), `${path}_duplicate_id:${row.id}`);
    result.set(row.id, row);
  }
  return result;
}

function stringArray(value, path) {
  array(value, path);
  value.forEach((item, index) => text(item, `${path}_${index}`));
  unique(value, path);
}

function evidenceLinks(value, path, evidence) {
  stringArray(value, path);
  for (const id of value) invariant(evidence.has(id), `${path}_unknown_evidence:${id}`);
}

function safeMetadata(value, path, ceiling) {
  // Additional public metadata is allowed without weakening the core schema.
  // All conventionally named URL/date fields still receive validation.
  if (Array.isArray(value)) {
    value.forEach((child, index) => safeMetadata(child, `${path}_${index}`, ceiling));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (child === null || child === '') continue;
      if (/url$/i.test(key) && typeof child === 'string') validatePublicUrl(child, `${path}_${key}`);
      else if (/urls$/i.test(key) && Array.isArray(child)) child.forEach((url, index) => validatePublicUrl(url, `${path}_${key}_${index}`));
      else if (['publishedDate', 'recordedDate', 'priceDate', 'quoteDate', 'tradingDate', 'eventDate'].includes(key)) date(child, `${path}_${key}`, ceiling);
      else if (['publishedAt', 'accessedAt', 'latestTradeTimeUtc'].includes(key) && typeof child === 'string') {
        if (child.includes('T')) timestamp(child, `${path}_${key}`, ceiling);
        else date(child, `${path}_${key}`, ceiling);
      }
      else safeMetadata(child, `${path}_${key}`, ceiling);
    }
  }
}

function validateEvidenceItem(item, path, ceiling) {
  text(item.title, `${path}_title`);
  validatePublicUrl(item.url, `${path}_url`);
  text(item.independenceGroup, `${path}_independenceGroup`);
  invariant(ACCESS.has(item.contentAccess), `${path}_contentAccess_invalid`);
  invariant(['evidence', 'lead'].includes(item.status), `${path}_status_invalid`);
  invariant(USABLE_ACCESS.has(item.contentAccess) || item.status === 'lead', `${path}_limited_access_must_be_lead`);
  invariant(Object.hasOwn(item, 'publishedDate'), `${path}_publishedDate_missing`);
  timestamp(item.observedAt, `${path}_observedAt`, ceiling);
  if (item.publishedDate !== undefined && item.publishedDate !== null) date(item.publishedDate, `${path}_publishedDate`, ceiling);
  if (item.publishedDate !== null) invariant(item.publishedDate <= item.observedAt.slice(0, 10), `${path}_published_after_observed`);
  if (item.observedAt !== undefined) timestamp(item.observedAt, `${path}_observedAt`, ceiling);
  safeMetadata(item, path, ceiling);
}

function usableEvidence(item) {
  return item.status === 'evidence' && USABLE_ACCESS.has(item.contentAccess);
}

export function annualizedPriceReturn(scenario) {
  return ((1 + scenario.epsGrowthPct / 100) * (scenario.terminalMultiple / scenario.entryMultiple) ** (1 / (scenario.years ?? 5)) - 1) * 100;
}

function validateRanking(row, path, evidence, ceiling) {
  invariant(Number.isInteger(row.rank) && row.rank > 0, `${path}_rank_invalid`);
  invariant(typeof row.ticker === 'string' && /^[A-Z0-9][A-Z0-9.-]{0,11}$/.test(row.ticker), `${path}_ticker_invalid`);
  text(row.name, `${path}_name`);
  invariant(Number.isInteger(row.thesisScore) && row.thesisScore >= 0 && row.thesisScore <= 100 && row.thesisScore % 5 === 0, `${path}_thesisScore_invalid`);
  for (const field of ['confidence', 'evidenceQuality', 'thesis', 'whyThisRank', 'strongestBearCase', 'thesisKiller', 'valuationStatus', 'valuationReason']) text(row[field], `${path}_${field}`);
  if (typeof row.leadership === 'string') text(row.leadership, `${path}_leadership`);
  else {
    object(row.leadership, `${path}_leadership`);
    for (const field of ['name', 'role', 'assessment']) text(row.leadership[field], `${path}_leadership_${field}`);
    invariant(evidence.has(row.leadership.sourceId), `${path}_leadership_unknown_evidence`);
  }
  stringArray(row.watchMetrics, `${path}_watchMetrics`);
  invariant(row.watchMetrics.length > 0, `${path}_watchMetrics_empty`);
  evidenceLinks(row.supportingEvidenceIds, `${path}_supportingEvidenceIds`, evidence);
  evidenceLinks(row.challengingEvidenceIds, `${path}_challengingEvidenceIds`, evidence);
  invariant(row.supportingEvidenceIds.length > 0 && row.supportingEvidenceIds.some(id => usableEvidence(evidence.get(id))), `${path}_no_usable_supporting_evidence`);
  // One source can contain both supportive operating facts and material risks.
  invariant(Object.hasOwn(row, 'priceSnapshot'), `${path}_priceSnapshot_missing`);
  if (row.priceSnapshot !== null) {
    object(row.priceSnapshot, `${path}_priceSnapshot`);
    for (const field of ['date', 'asOf', 'quoteDate']) {
      const value = row.priceSnapshot[field];
      if (value !== undefined && value !== null) {
        if (value.includes('T')) timestamp(value, `${path}_priceSnapshot_${field}`, ceiling);
        else date(value, `${path}_priceSnapshot_${field}`, ceiling);
      }
    }
    if (row.priceSnapshot.price !== undefined) invariant(Number.isFinite(row.priceSnapshot.price) && row.priceSnapshot.price > 0, `${path}_priceSnapshot_price_invalid`);
    if (row.priceSnapshot.priceUsd !== undefined) invariant(Number.isFinite(row.priceSnapshot.priceUsd) && row.priceSnapshot.priceUsd > 0, `${path}_priceSnapshot_priceUsd_invalid`);
  }
  array(row.returnScenarios, `${path}_returnScenarios`);
  unique(row.returnScenarios.map(scenario => `${String(scenario?.case).toLowerCase()}:${scenario?.entryMultiple}`), `${path}_returnScenarios_cells`);
  for (const [index, scenario] of row.returnScenarios.entries()) {
    const scenarioPath = `${path}_scenario_${index}`;
    object(scenario, scenarioPath);
    invariant(typeof scenario.case === 'string' && ['bear', 'base', 'bull'].includes(scenario.case.toLowerCase()), `${scenarioPath}_case_invalid`);
    invariant(Number.isFinite(scenario.entryMultiple) && scenario.entryMultiple > 0, `${scenarioPath}_entryMultiple_invalid`);
    invariant(Number.isFinite(scenario.terminalMultiple) && scenario.terminalMultiple > 0, `${scenarioPath}_terminalMultiple_invalid`);
    invariant(Number.isFinite(scenario.epsGrowthPct) && scenario.epsGrowthPct > -100, `${scenarioPath}_epsGrowthPct_invalid`);
    invariant(scenario.years === undefined || [5, 10].includes(scenario.years), `${scenarioPath}_years_invalid`);
    text(scenario.assumptionNote, `${scenarioPath}_assumptionNote`, 10);
    invariant(Number.isFinite(scenario.annualizedPriceReturnPct) && Math.abs(scenario.annualizedPriceReturnPct - annualizedPriceReturn(scenario)) <= 0.051, `${scenarioPath}_return_formula_mismatch`);
  }
  for (const multiple of new Set(row.returnScenarios.map(scenario => scenario.entryMultiple))) {
    invariant(row.returnScenarios.filter(scenario => scenario.entryMultiple === multiple).length === 3, `${path}_returnScenarios_require_bear_base_bull`);
  }
  safeMetadata(row, path, ceiling);
}

function snapshot(rows) {
  return rows.map(({ ticker, rank, thesisScore }) => ({ ticker, rank, thesisScore })).sort((a, b) => a.rank - b.rank);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}

function equal(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function validateSnapshot(rows, path) {
  array(rows, path);
  unique(rows.map(row => row.ticker), `${path}_tickers`);
  unique(rows.map(row => row.rank), `${path}_ranks`);
  for (const [index, row] of [...rows].sort((a, b) => a.rank - b.rank).entries()) {
    text(row.ticker, `${path}_${index}_ticker`);
    invariant(row.rank === index + 1, `${path}_rank_not_contiguous`);
    invariant(Number.isInteger(row.thesisScore) && row.thesisScore >= 0 && row.thesisScore <= 100 && row.thesisScore % 5 === 0, `${path}_score_invalid`);
  }
}

function validateReview(review, path, evidence, ceiling) {
  date(review.date, `${path}_date`, ceiling);
  timestamp(review.observedAt, `${path}_observedAt`, ceiling);
  invariant(review.date <= review.observedAt.slice(0, 10), `${path}_date_after_observed`);
  text(review.status, `${path}_status`);
  text(review.summary, `${path}_summary`, 10);
  validateSnapshot(review.rankingSnapshot, `${path}_rankingSnapshot`);
  array(review.changes, `${path}_changes`);
  unique(review.changes.map(change => change.ticker), `${path}_change_tickers`);
  for (const [index, change] of review.changes.entries()) {
    const changePath = `${path}_change_${index}`;
    text(change.ticker, `${changePath}_ticker`);
    text(change.reason, `${changePath}_reason`, 10);
    evidenceLinks(change.evidenceIds, `${changePath}_evidenceIds`, evidence);
    for (const key of ['oldRank', 'newRank']) invariant(change[key] === null || (Number.isInteger(change[key]) && change[key] > 0), `${changePath}_${key}_invalid`);
    for (const key of ['oldScore', 'newScore']) invariant(change[key] === null || (Number.isInteger(change[key]) && change[key] >= 0 && change[key] <= 100 && change[key] % 5 === 0), `${changePath}_${key}_invalid`);
    invariant((change.oldRank === null) === (change.oldScore === null) && (change.newRank === null) === (change.newScore === null), `${changePath}_partial_null`);
    invariant(change.oldRank !== change.newRank || change.oldScore !== change.newScore, `${changePath}_no_rank_or_score_change`);
    invariant(change.evidenceIds.length > 0, `${changePath}_evidence_required`);
    invariant(change.evidenceIds.some(id => usableEvidence(evidence.get(id))), `${changePath}_no_usable_change_evidence`);
    const current = review.rankingSnapshot.find(row => row.ticker === change.ticker);
    invariant((current?.rank ?? null) === change.newRank && (current?.thesisScore ?? null) === change.newScore, `${changePath}_snapshot_mismatch`);
  }
  // Future review dates are plans, unlike evidence dates, and intentionally allowed.
  date(review.nextReviewOn, `${path}_nextReviewOn`, Date.parse('9999-12-31T23:59:59Z'));
  invariant(review.nextReviewOn > review.date, `${path}_nextReviewOn_not_later`);
}

function validateTransition(before, review, path) {
  const beforeMap = new Map(before.map(row => [row.ticker, row]));
  const afterMap = new Map(review.rankingSnapshot.map(row => [row.ticker, row]));
  const changes = new Map(review.changes.map(row => [row.ticker, row]));
  for (const ticker of new Set([...beforeMap.keys(), ...afterMap.keys()])) {
    const old = beforeMap.get(ticker);
    const next = afterMap.get(ticker);
    if (old?.rank === next?.rank && old?.thesisScore === next?.thesisScore) {
      invariant(!changes.has(ticker), `${path}_spurious_change:${ticker}`);
      continue;
    }
    const change = changes.get(ticker);
    invariant(change, `${path}_unrecorded_ranking_change:${ticker}`);
    invariant(change.oldRank === (old?.rank ?? null) && change.oldScore === (old?.thesisScore ?? null) && change.newRank === (next?.rank ?? null) && change.newScore === (next?.thesisScore ?? null), `${path}_old_or_new_snapshot_mismatch:${ticker}`);
  }
  invariant([...changes.keys()].every(ticker => beforeMap.has(ticker) || afterMap.has(ticker)), `${path}_unknown_changed_ticker`);
}

function validateValuationContext(context, rankings, ceiling) {
  object(context, 'valuationContext');
  invariant(context.basis === 'ttm', 'valuation_basis_must_be_ttm');
  date(context.asOf, 'valuation_asOf', ceiling);
  timestamp(context.observedAt, 'valuation_observedAt', ceiling);
  object(context.companies, 'valuation_companies');
  const validatePE = (item, path, benchmark = false) => {
    object(item, path);
    invariant(item.basis === 'ttm', `${path}_basis_must_be_ttm`);
    invariant(['verified', 'unavailable', ...(benchmark ? ['proxy'] : [])].includes(item.status), `${path}_status_invalid`);
    if (item.status === 'unavailable') {
      invariant(item.value === null, `${path}_unavailable_value_must_be_null`);
      text(item.reason, `${path}_unavailable_reason`);
      return;
    }
    invariant(Number.isFinite(item.value) && item.value > 0, `${path}_value_invalid`);
    date(item.asOf, `${path}_asOf`, ceiling);
    timestamp(item.observedAt, `${path}_observedAt`, ceiling);
    invariant(item.asOf <= item.observedAt.slice(0, 10), `${path}_date_after_observed`);
    validatePublicUrl(item.sourceUrl, `${path}_sourceUrl`);
    text(item.provider, `${path}_provider`);
    if (benchmark) {
      invariant(item.method === (item.status === 'proxy' ? 'nasdaq100-median-proxy' : 'constituent-median'), `${path}_median_method_invalid`);
      text(item.universe, `${path}_universe`);
      text(item.notes, `${path}_notes`);
      if (item.status === 'verified') {
        array(item.constituents, `${path}_constituents`);
        invariant(item.constituents.length > 0, `${path}_constituents_empty`);
        unique(item.constituents.map(c => c.id), `${path}_constituents`);
        const values = item.constituents.filter(c => Number.isFinite(c.pe) && c.pe > 0).map(c => c.pe).sort((a,b) => a-b);
        invariant(values.length > 0, `${path}_no_valid_constituents`);
        const middle = Math.floor(values.length / 2);
        const median = values.length % 2 ? values[middle] : (values[middle-1]+values[middle])/2;
        invariant(Math.abs(item.value - median) <= 0.051, `${path}_median_mismatch`);
      }
    }
  };
  for (const row of rankings) validatePE(context.companies[row.ticker], `valuation_${row.ticker}`);
  validatePE(context.qqqMedianPE, 'valuation_qqqMedianPE', true);
}

export function validateResearchFeed(feed, { now = Date.now() } = {}) {
  object(feed, 'research');
  invariant(VERSIONS.has(feed.schemaVersion), 'research_schema_version_invalid');
  timestamp(feed.updatedAt, 'research_updatedAt', now);
  const ceiling = Date.parse(feed.updatedAt);
  invariant(feed.sourceSheet === SOURCE_SHEET, 'research_source_sheet_invalid');
  const sources = ids(feed.sources, 'sources');
  for (const source of feed.sources) {
    text(source.label, `source_${source.id}_label`);
    validatePublicUrl(source.url, `source_${source.id}_url`);
    text(source.kind, `source_${source.id}_kind`);
    invariant(typeof source.priority === 'string' || Number.isInteger(source.priority), `source_${source.id}_priority_invalid`);
  }
  const observations = ids(feed.observations, 'observations');
  const evidence = ids(feed.evidence, 'evidence');
  for (const item of feed.evidence) {
    invariant(!observations.has(item.id), `duplicate_global_evidence_id:${item.id}`);
    validateEvidenceItem(item, `evidence_${item.id}`, ceiling);
    text(item.kind, `evidence_${item.id}_kind`);
  }
  for (const observation of feed.observations) {
    const path = `observation_${observation.id}`;
    validateEvidenceItem(observation, path, ceiling);
    invariant(sources.has(observation.sourceId), `${path}_unknown_source`);
    for (const field of ['speaker', 'role', 'summary', 'claim', 'interpretation', 'countercase', 'nextTest', 'evidenceType']) text(observation[field], `${path}_${field}`);
    invariant(Object.hasOwn(observation, 'publishedDate'), `${path}_publishedDate_missing`);
    timestamp(observation.observedAt, `${path}_observedAt`, ceiling);
    if (observation.publishedDate !== null) invariant(observation.publishedDate <= observation.observedAt.slice(0, 10), `${path}_published_after_observed`);
    invariant(ACCESS.has(observation.contentAccess), `${path}_contentAccess_invalid`);
    invariant(['evidence', 'lead'].includes(observation.status), `${path}_status_invalid`);
    invariant(USABLE_ACCESS.has(observation.contentAccess) || observation.status === 'lead', `${path}_limited_access_must_be_lead`);
    stringArray(observation.beneficiaryTickers, `${path}_beneficiaryTickers`);
    evidence.set(observation.id, observation);
  }
  array(feed.rankings, 'rankings');
  unique(feed.rankings.map(row => row.ticker), 'rankings_tickers');
  unique(feed.rankings.map(row => row.rank), 'rankings_ranks');
  for (const [index, row] of feed.rankings.entries()) {
    validateRanking(row, `ranking_${row.ticker}`, evidence, ceiling);
    invariant(row.rank === index + 1, 'rankings_not_contiguous_or_sorted');
    if (index > 0) invariant(feed.rankings[index - 1].thesisScore >= row.thesisScore, 'rankings_score_order_invalid');
  }
  if (feed.schemaVersion === '1.1.0') {
    invariant(feed.rankings.every(row => row.returnScenarios.every(s => s.years === 10)), 'research_requires_ten_year_scenarios');
    invariant(feed.rankingMethodology?.returnMethod?.years === 10, 'research_return_method_years_invalid');
    validateValuationContext(feed.valuationContext, feed.rankings, ceiling);
  }
  ids(feed.reviews, 'reviews');
  for (const [index, review] of feed.reviews.entries()) {
    validateReview(review, `review_${review.id}`, evidence, ceiling);
    if (index > 0) {
      invariant(Date.parse(review.observedAt) >= Date.parse(feed.reviews[index - 1].observedAt), 'reviews_not_chronological');
      validateTransition(feed.reviews[index - 1].rankingSnapshot, review, `review_${review.id}`);
    }
  }
  if (feed.rankings.length > 0) invariant(feed.reviews.length > 0, 'rankings_missing_review');
  if (feed.reviews.length > 0) invariant(equal(snapshot(feed.rankings), snapshot(feed.reviews.at(-1).rankingSnapshot)), 'rankings_latest_review_mismatch');
  object(feed.coverage, 'coverage');
  timestamp(feed.coverage.asOf, 'coverage_asOf', ceiling);
  text(feed.coverage.kind, 'coverage_kind');
  const covered = [];
  for (const key of ['completedChannels', 'partialChannels', 'unavailableChannels']) {
    stringArray(feed.coverage[key], `coverage_${key}`);
    for (const id of feed.coverage[key]) invariant(sources.has(id), `coverage_unknown_source:${id}`);
    covered.push(...feed.coverage[key]);
  }
  unique(covered, 'coverage_channels');
  invariant(typeof feed.coverage.limitations === 'string' || Array.isArray(feed.coverage.limitations), 'coverage_limitations_invalid');
  safeMetadata(feed, 'research', ceiling);
  return { sources: feed.sources.length, observations: feed.observations.length, evidence: feed.evidence.length, rankings: feed.rankings.length, reviews: feed.reviews.length };
}

function retainHistory(previous, next, field) {
  const nextRows = new Map(next[field].map(row => [row.id, row]));
  for (const row of previous[field]) invariant(nextRows.has(row.id) && equal(row, nextRows.get(row.id)), `${field}_history_rewritten:${row.id}`);
}

function semanticView(feed) {
  const { updatedAt, ...content } = feed;
  const { asOf, ...coverage } = content.coverage;
  return { ...content, coverage };
}

export function prepareResearchCandidate(candidate, existing = null, options = {}) {
  object(candidate, 'candidate');
  invariant(!Object.hasOwn(candidate, 'updatedAt'), 'candidate_updatedAt_not_allowed');
  const { requestedAt, ...content } = candidate;
  const feed = { ...content, updatedAt: requestedAt };
  validateResearchFeed(feed, options);
  if (existing) {
    validateResearchFeed(existing, options);
    if (existing.schemaVersion === '1.1.0') invariant(feed.schemaVersion === '1.1.0', 'candidate_schema_downgrade_forbidden');
    invariant(Date.parse(feed.updatedAt) >= Date.parse(existing.updatedAt), 'candidate_older_than_current');
    for (const field of ['sources', 'observations', 'evidence', 'reviews']) retainHistory(existing, feed, field);
    invariant(equal(feed.reviews.slice(0, existing.reviews.length), existing.reviews), 'reviews_history_reordered');
    const firstNewReview = feed.reviews[existing.reviews.length];
    if (firstNewReview) validateTransition(snapshot(existing.rankings), firstNewReview, 'candidate_first_review');
    else invariant(equal(snapshot(existing.rankings), snapshot(feed.rankings)), 'ranking_change_requires_new_review');
  }
  return { changed: !existing || !equal(semanticView(existing), semanticView(feed)), feed };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function main() {
  const [command = 'validate', candidateOrFeed = RESEARCH_FEED, feedPath = RESEARCH_FEED] = process.argv.slice(2);
  if (command === 'validate') {
    console.log(`AI infrastructure research valid: ${JSON.stringify(validateResearchFeed(await readJson(candidateOrFeed)))}`);
    return;
  }
  invariant(command === 'prepare', `unknown_command:${command}`);
  invariant(candidateOrFeed !== RESEARCH_FEED, 'candidate_path_required');
  let existing = null;
  try { existing = await readJson(feedPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const result = prepareResearchCandidate(await readJson(candidateOrFeed), existing);
  if (result.changed) await writeFile(feedPath, `${JSON.stringify(result.feed, null, 2)}\n`, 'utf8');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\n`);
  console.log(JSON.stringify({ changed: result.changed, ...validateResearchFeed(result.feed) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
