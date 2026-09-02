import { readFile, writeFile, appendFile } from 'node:fs/promises';

export const SOURCE_SHEET =
  'https://docs.google.com/spreadsheets/d/1yjmaEOFu5bE1FZkgDrrpKFI6ZvL6QDO9_YRZDfKkKjk/edit';

const SOURCE_CONFIG = {
  semianalysis: {
    label: 'SemiAnalysis',
    fields: ['loggedDate', 'sourceDate', 'company', 'bullishness', 'summary'],
  },
  a16z: {
    label: 'a16z Machine Age',
    fields: [
      'loggedDate',
      'sourceDate',
      'company',
      'bullishness',
      'category',
      'partner',
      'signalType',
      'summary',
    ],
  },
};

const SIGNAL_TYPES = new Set([
  'Direct investment',
  'Fund mandate / thematic',
  'Partner thesis',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function validateExactKeys(value, allowed, path) {
  invariant(value && typeof value === 'object' && !Array.isArray(value), `${path}_not_object`);
  const keys = Object.keys(value).sort();
  const expected = [...allowed].sort();
  invariant(JSON.stringify(keys) === JSON.stringify(expected), `${path}_keys_invalid:${keys.join(',')}`);
}

function validateIsoTimestamp(value, path) {
  invariant(typeof value === 'string' && value.length > 0, `${path}_missing`);
  invariant(Number.isFinite(Date.parse(value)), `${path}_invalid:${value}`);
}

function validateDate(value, path) {
  invariant(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), `${path}_invalid:${value}`);
  const date = new Date(`${value}T00:00:00Z`);
  invariant(!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value, `${path}_invalid:${value}`);
}

function validateText(value, path, minimum = 1) {
  invariant(typeof value === 'string' && value.trim().length >= minimum, `${path}_invalid`);
  invariant(value === value.trim(), `${path}_untrimmed`);
}

function rowComparator(left, right) {
  const sourceDate = right.sourceDate.localeCompare(left.sourceDate);
  if (sourceDate !== 0) return sourceDate;
  return right.loggedDate.localeCompare(left.loggedDate);
}

function validateRows(sourceKey, rows) {
  const config = SOURCE_CONFIG[sourceKey];
  invariant(Array.isArray(rows), `${sourceKey}_rows_not_array`);
  const identities = new Set();

  rows.forEach((row, index) => {
    const path = `${sourceKey}_row_${index}`;
    validateExactKeys(row, config.fields, path);
    validateDate(row.loggedDate, `${path}_loggedDate`);
    validateDate(row.sourceDate, `${path}_sourceDate`);
    validateText(row.company, `${path}_company`, 2);
    invariant(Number.isInteger(row.bullishness) && row.bullishness >= 1 && row.bullishness <= 5, `${path}_bullishness_invalid`);
    validateText(row.summary, `${path}_summary`, 40);

    if (sourceKey === 'a16z') {
      validateText(row.category, `${path}_category`, 2);
      validateText(row.partner, `${path}_partner`, 2);
      validateText(row.signalType, `${path}_signalType`, 2);
      invariant(SIGNAL_TYPES.has(row.signalType), `${path}_signalType_invalid:${row.signalType}`);
    }

    const identity = row.company.toLocaleLowerCase('en-US');
    invariant(!identities.has(identity), `${sourceKey}_duplicate_company:${row.company}`);
    identities.add(identity);

    if (index > 0) {
      invariant(rowComparator(rows[index - 1], row) <= 0, `${sourceKey}_rows_not_sorted:${index}`);
    }
  });
}

export function validateCombinedFeed(feed) {
  validateExactKeys(feed, ['updatedAt', 'sourceSheet', 'sources'], 'combined');
  validateIsoTimestamp(feed.updatedAt, 'combined_updatedAt');
  invariant(feed.sourceSheet === SOURCE_SHEET, 'combined_source_sheet_invalid');
  validateExactKeys(feed.sources, ['semianalysis', 'a16z'], 'combined_sources');

  for (const [sourceKey, config] of Object.entries(SOURCE_CONFIG)) {
    const source = feed.sources[sourceKey];
    validateExactKeys(source, ['label', 'rows'], `combined_${sourceKey}`);
    invariant(source.label === config.label, `${sourceKey}_label_invalid`);
    validateRows(sourceKey, source.rows);
  }

  return {
    semianalysisRows: feed.sources.semianalysis.rows.length,
    a16zRows: feed.sources.a16z.rows.length,
  };
}

export function validateLegacyFeed(legacy, combined) {
  validateExactKeys(legacy, ['updatedAt', 'sourceSheet', 'rows'], 'legacy');
  validateIsoTimestamp(legacy.updatedAt, 'legacy_updatedAt');
  invariant(legacy.sourceSheet === SOURCE_SHEET, 'legacy_source_sheet_invalid');
  validateRows('semianalysis', legacy.rows);
  invariant(legacy.updatedAt === combined.updatedAt, 'legacy_updated_at_mismatch');
  invariant(
    JSON.stringify(legacy.rows) === JSON.stringify(combined.sources.semianalysis.rows),
    'legacy_rows_mismatch',
  );
  return { rows: legacy.rows.length };
}

export function validateFeedPair(combined, legacy) {
  const combinedResult = validateCombinedFeed(combined);
  const legacyResult = validateLegacyFeed(legacy, combined);
  return { ...combinedResult, legacyRows: legacyResult.rows };
}

function normalizeRows(sourceKey, rows) {
  const fields = SOURCE_CONFIG[sourceKey].fields;
  invariant(Array.isArray(rows), `${sourceKey}_rows_not_array`);
  return rows
    .map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])))
    .sort(rowComparator);
}

function semanticView(feed) {
  return { sourceSheet: feed.sourceSheet, sources: feed.sources };
}

export function prepareCandidate(candidate, existingCombined = null) {
  validateExactKeys(candidate, ['schemaVersion', 'requestedAt', 'sourceSheet', 'sources'], 'candidate');
  invariant(candidate.schemaVersion === '1.0.0', 'candidate_schema_version_invalid');
  validateIsoTimestamp(candidate.requestedAt, 'candidate_requestedAt');
  invariant(candidate.sourceSheet === SOURCE_SHEET, 'candidate_source_sheet_invalid');
  validateExactKeys(candidate.sources, ['semianalysis', 'a16z'], 'candidate_sources');

  const sources = {};
  for (const [sourceKey, config] of Object.entries(SOURCE_CONFIG)) {
    const source = candidate.sources[sourceKey];
    validateExactKeys(source, ['label', 'rows'], `candidate_${sourceKey}`);
    invariant(source.label === config.label, `${sourceKey}_label_invalid`);
    sources[sourceKey] = { label: config.label, rows: normalizeRows(sourceKey, source.rows) };
  }

  const combined = {
    updatedAt: candidate.requestedAt,
    sourceSheet: SOURCE_SHEET,
    sources,
  };
  const legacy = {
    updatedAt: candidate.requestedAt,
    sourceSheet: SOURCE_SHEET,
    rows: sources.semianalysis.rows,
  };
  validateFeedPair(combined, legacy);

  let changed = true;
  if (existingCombined) {
    validateCombinedFeed(existingCombined);
    changed = JSON.stringify(semanticView(existingCombined)) !== JSON.stringify(semanticView(combined));
  }

  return { changed, combined, legacy };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${String(value).replaceAll('\n', ' ')}`).join('\n');
  await appendFile(process.env.GITHUB_OUTPUT, `${lines}\n`);
}

async function main() {
  const [command = 'validate', ...args] = process.argv.slice(2);
  if (command === 'validate') {
    const [combinedPath = 'buy-window/ai-infrastructure-theses.json', legacyPath = 'buy-window/semi-analysis-theses.json'] = args;
    const result = validateFeedPair(await readJson(combinedPath), await readJson(legacyPath));
    console.log(`AI infrastructure feeds valid: ${JSON.stringify(result)}`);
    return;
  }
  if (command === 'prepare') {
    const [candidatePath, combinedPath = 'buy-window/ai-infrastructure-theses.json', legacyPath = 'buy-window/semi-analysis-theses.json'] = args;
    invariant(candidatePath, 'candidate_path_required');
    const candidate = await readJson(candidatePath);
    let existingCombined = null;
    try {
      existingCombined = await readJson(combinedPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    const result = prepareCandidate(candidate, existingCombined);
    if (result.changed) {
      await writeJson(combinedPath, result.combined);
      await writeJson(legacyPath, result.legacy);
    }
    await writeOutputs({ changed: result.changed, semianalysis_rows: result.combined.sources.semianalysis.rows.length, a16z_rows: result.combined.sources.a16z.rows.length });
    console.log(JSON.stringify({ changed: result.changed, semianalysisRows: result.combined.sources.semianalysis.rows.length, a16zRows: result.combined.sources.a16z.rows.length }));
    return;
  }
  throw new Error(`unknown_command:${command}`);
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
