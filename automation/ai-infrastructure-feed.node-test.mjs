import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCandidate, validateFeedPair, SOURCE_SHEET } from './ai-infrastructure-feed.mjs';

const semi = (company, sourceDate = '2026-09-01') => ({
  loggedDate: '2026-09-02',
  sourceDate,
  company,
  bullishness: 4,
  summary: 'A substantive technical and economic thesis summary with enough supporting detail.',
});
const a16z = (company, sourceDate = '2026-08-28') => ({
  loggedDate: '2026-09-02',
  sourceDate,
  company,
  bullishness: 5,
  category: 'Cross-stack / Fund Thesis',
  partner: 'Named Partner',
  signalType: 'Direct investment',
  summary: 'A substantive technical and economic thesis summary with enough supporting detail.',
});
const candidate = (requestedAt = '2026-09-02T12:00:00Z') => ({
  schemaVersion: '1.0.0',
  requestedAt,
  sourceSheet: SOURCE_SHEET,
  sources: {
    semianalysis: { label: 'SemiAnalysis', rows: [semi('Older', '2026-08-01'), semi('Newer')] },
    a16z: { label: 'a16z Machine Age', rows: [a16z('Theme')] },
  },
});

test('prepares sorted combined and exact legacy feeds', () => {
  const result = prepareCandidate(candidate());
  assert.equal(result.combined.sources.semianalysis.rows[0].company, 'Newer');
  assert.deepEqual(result.legacy.rows, result.combined.sources.semianalysis.rows);
  assert.deepEqual(validateFeedPair(result.combined, result.legacy), { semianalysisRows: 2, a16zRows: 1, legacyRows: 2 });
});

test('ignores timestamp-only changes', () => {
  const first = prepareCandidate(candidate()).combined;
  const second = prepareCandidate(candidate('2026-09-02T13:00:00Z'), first);
  assert.equal(second.changed, false);
});

test('accepts legacy row order for comparison and canonicalizes the next semantic change', () => {
  const existing = prepareCandidate(candidate()).combined;
  existing.sources.semianalysis.rows.reverse();

  const noChange = prepareCandidate(candidate('2026-09-02T13:00:00Z'), existing);
  assert.equal(noChange.changed, false);

  const changedCandidate = candidate('2026-09-02T14:00:00Z');
  changedCandidate.sources.a16z.rows.push(a16z('Another Theme', '2026-09-02'));
  const changed = prepareCandidate(changedCandidate, existing);
  assert.equal(changed.changed, true);
  assert.equal(changed.combined.sources.semianalysis.rows[0].company, 'Newer');
  assert.deepEqual(changed.legacy.rows, changed.combined.sources.semianalysis.rows);
});

test('rejects duplicate current company identities', () => {
  const value = candidate();
  value.sources.semianalysis.rows.push(semi('Newer', '2026-07-01'));
  assert.throws(() => prepareCandidate(value), /duplicate_company/);
});

test('rejects out-of-range bullishness', () => {
  const value = candidate();
  value.sources.a16z.rows[0].bullishness = 6;
  assert.throws(() => prepareCandidate(value), /bullishness_invalid/);
});

test('rejects legacy divergence', () => {
  const result = prepareCandidate(candidate());
  result.legacy.rows = result.legacy.rows.slice(1);
  assert.throws(() => validateFeedPair(result.combined, result.legacy), /legacy_rows_mismatch/);
});
