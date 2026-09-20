import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SOURCE_SHEET, annualizedPriceReturn, prepareResearchCandidate, validateResearchFeed, validatePublicUrl } from './ai-infrastructure-research.mjs';

const now = Date.parse('2026-09-20T23:59:59Z');
const options = { now };
const observedAt = '2026-09-20T12:00:00Z';
const scenario = (name, growth, exit = 30, entry = 40) => {
  const item = { case: name, entryMultiple: entry, epsGrowthPct: growth, terminalMultiple: exit, assumptionNote: 'Explicit illustrative per-share growth and terminal valuation assumptions.' };
  return { ...item, annualizedPriceReturnPct: Math.round(annualizedPriceReturn(item) * 10) / 10 };
};
function candidate() {
  const rankings = [{
    rank: 1, ticker: 'NVDA', name: 'NVIDIA', thesisScore: 90,
    confidence: 'High thesis conviction', evidenceQuality: 'Issuer facts with operator evidence',
    leadership: { name: 'Named leader', role: 'CEO', assessment: 'Execution supports the hypothesis.', sourceId: 'financial-1' },
    thesis: 'Systems advantages can translate to durable per-share earnings growth.',
    whyThisRank: 'Strongest combined growth and franchise judgment.',
    strongestBearCase: 'Customers retain more of the economics.',
    thesisKiller: 'Durable loss of customer deployment and pricing power.',
    watchMetrics: ['Customer deployment economics'], supportingEvidenceIds: ['financial-1'], challengingEvidenceIds: ['operator-1'],
    valuationStatus: 'needs-normalized-baseline', valuationReason: 'No comparable earning baseline is verified.', priceSnapshot: null,
    returnScenarios: [scenario('bear', 0, 20), scenario('base', 15), scenario('bull', 25, 40)],
  }];
  return {
    schemaVersion: '1.0.0', requestedAt: observedAt, sourceSheet: SOURCE_SHEET,
    sources: [{ id: 'latent-space', label: 'Latent Space', url: 'https://www.latent.space/', kind: 'podcast', priority: 'core' }],
    observations: [{
      id: 'operator-1', sourceId: 'latent-space', title: 'Resource coordination matters', url: 'https://www.latent.space/p/operator',
      speaker: 'Named operator', role: 'Infrastructure CTO', publishedDate: '2026-09-18', observedAt,
      contentAccess: 'full-transcript', independenceGroup: 'operator-company', summary: 'A firsthand operational observation with meaningful limitations.',
      claim: 'Serving workloads are bursty.', interpretation: 'Coordination may raise utilization.', beneficiaryTickers: ['NVDA'],
      countercase: 'Efficiency may lower purchases for fixed workloads.', nextTest: 'Measure actual production utilization.', evidenceType: 'firsthand-operator-claim', status: 'evidence',
    }],
    evidence: [{ id: 'financial-1', title: 'Issuer results', url: 'https://investor.nvidia.com/results', kind: 'issuer-financial-release', independenceGroup: 'nvidia', publishedDate: '2026-08-26', observedAt, contentAccess: 'article', status: 'evidence' }],
    rankings,
    reviews: [{ id: 'review-20260920', date: '2026-09-20', observedAt, status: 'baseline', summary: 'Initial evidence-led baseline; no artificial score movement.', changes: [], rankingSnapshot: [{ ticker: 'NVDA', rank: 1, thesisScore: 90 }], nextReviewOn: '2026-09-27' }],
    coverage: { asOf: observedAt, kind: 'targeted-seed', completedChannels: ['latent-space'], partialChannels: [], unavailableChannels: [], limitations: ['Relevant material reviewed; not a full historical scan.'] },
  };
}
function feed() { return prepareResearchCandidate(candidate(), null, options).feed; }
function changedCandidate(previous) {
  const value = candidate();
  value.requestedAt = '2026-09-20T15:00:00Z';
  value.rankings[0].thesisScore = 85;
  value.reviews.push({ id: 'review-20260920-change', date: '2026-09-20', observedAt: value.requestedAt, status: 'changed', summary: 'New reviewed deployment evidence weakens the prior conclusion.', changes: [{ ticker: 'NVDA', oldRank: 1, newRank: 1, oldScore: 90, newScore: 85, reason: 'Operator evidence reveals a material utilization limitation.', evidenceIds: ['operator-1'] }], rankingSnapshot: [{ ticker: 'NVDA', rank: 1, thesisScore: 85 }], nextReviewOn: '2026-09-27' });
  return value;
}

test('builds a complete valid research snapshot without deriving legacy feeds', () => {
  const result = prepareResearchCandidate(candidate(), null, options);
  assert.equal(result.changed, true);
  assert.deepEqual(Object.keys(result).sort(), ['changed', 'feed']);
  assert.deepEqual(validateResearchFeed(result.feed, options), { sources: 1, observations: 1, evidence: 1, rankings: 1, reviews: 1 });
});

test('timestamp-only and object-key-order replays are semantic no-ops', () => {
  const existing = feed();
  const next = candidate();
  next.requestedAt = '2026-09-20T14:00:00Z';
  next.coverage.asOf = next.requestedAt;
  next.evidence[0] = Object.fromEntries(Object.entries(next.evidence[0]).reverse());
  assert.equal(prepareResearchCandidate(next, existing, options).changed, false);
});

test('rejects unsafe and deceptively credentialed provenance URLs', () => {
  for (const url of ['javascript:alert(1)', 'http://www.latent.space/p/x', 'https://www.latent.space@evil.com/x', 'https://127.0.0.1/x', 'https://[::1]/x', 'https://10.0.0.1/x', 'https://metadata.internal/x', 'https://www.latent.space\\@evil.com/x', 'https://www.latent.space:8443/x']) {
    assert.throws(() => validatePublicUrl(url), /url_/);
  }
  assert.equal(validatePublicUrl('https://www.latent.space/p/modal2026').hostname, 'www.latent.space');
});

test('rejects future and impossible source dates, observation timestamps and quote dates', () => {
  const mutations = [
    value => { value.observations[0].publishedDate = '2026-09-21'; },
    value => { value.observations[0].publishedDate = '2026-02-30'; },
    value => { value.evidence[0].observedAt = '2026-09-21T00:00:00Z'; },
    value => { value.requestedAt = '2026-02-30T00:00:00Z'; },
    value => { value.rankings[0].priceSnapshot = { priceUsd: 100, tradingDate: '2026-09-21' }; },
  ];
  for (const mutate of mutations) { const value = candidate(); mutate(value); assert.throws(() => prepareResearchCandidate(value, null, options), /future|invalid/); }
});

test('rejects duplicate IDs within and across evidence registries', () => {
  const duplicate = candidate(); duplicate.observations.push(structuredClone(duplicate.observations[0]));
  assert.throws(() => prepareResearchCandidate(duplicate, null, options), /duplicate_id/);
  const global = candidate(); global.evidence[0].id = 'operator-1';
  assert.throws(() => prepareResearchCandidate(global, null, options), /duplicate_global_evidence_id/);
});

test('rejects unknown source and ranking evidence IDs', () => {
  const source = candidate(); source.observations[0].sourceId = 'invented';
  assert.throws(() => prepareResearchCandidate(source, null, options), /unknown_source/);
  const evidence = candidate(); evidence.rankings[0].supportingEvidenceIds = ['invented'];
  assert.throws(() => prepareResearchCandidate(evidence, null, options), /unknown_evidence/);
});

test('notes and catalog entries are leads and cannot alone support admission', () => {
  for (const contentAccess of ['notes-only', 'catalog-only']) {
    const value = candidate(); value.observations[0].contentAccess = contentAccess;
    assert.throws(() => prepareResearchCandidate(value, null, options), /limited_access_must_be_lead/);
    value.observations[0].status = 'lead';
    value.rankings[0].supportingEvidenceIds = ['operator-1'];
    assert.throws(() => prepareResearchCandidate(value, null, options), /no_usable_supporting_evidence/);
  }
});

test('missing access metadata cannot launder a lead as evidence', () => {
  const value = candidate(); delete value.evidence[0].contentAccess;
  assert.throws(() => prepareResearchCandidate(value, null, options), /contentAccess_invalid/);
});

test('one source may support facts and challenge economics without being independent twice', () => {
  const value = candidate(); value.rankings[0].challengingEvidenceIds.push('financial-1');
  assert.doesNotThrow(() => prepareResearchCandidate(value, null, options));
});

test('scores use five-point steps, ordered ranks are unique and contiguous', () => {
  for (const score of [86, 105, -5]) {
    const value = candidate(); value.rankings[0].thesisScore = score;
    assert.throws(() => prepareResearchCandidate(value, null, options), /thesisScore_invalid/);
  }
  const value = candidate(); value.rankings[0].rank = 2;
  assert.throws(() => prepareResearchCandidate(value, null, options), /rankings_not_contiguous/);
});

test('return assumptions reproduce price CAGR and allow a multi-entry sensitivity grid', () => {
  const value = candidate();
  value.rankings[0].returnScenarios.push(scenario('bear', 0, 20, 50), scenario('base', 15, 30, 50), scenario('bull', 25, 40, 50));
  assert.doesNotThrow(() => prepareResearchCandidate(value, null, options));
  value.rankings[0].returnScenarios[0].annualizedPriceReturnPct += 1;
  assert.throws(() => prepareResearchCandidate(value, null, options), /return_formula_mismatch/);
});

test('return grids reject missing cases and absent assumptions', () => {
  const missing = candidate(); missing.rankings[0].returnScenarios.pop();
  assert.throws(() => prepareResearchCandidate(missing, null, options), /require_bear_base_bull/);
  const assumption = candidate(); assumption.rankings[0].returnScenarios[0].assumptionNote = '';
  assert.throws(() => prepareResearchCandidate(assumption, null, options), /assumptionNote_invalid/);
});

test('valid ranking changes are reviewable and idempotent', () => {
  const existing = feed(); const value = changedCandidate(existing);
  const first = prepareResearchCandidate(value, existing, options);
  assert.equal(first.changed, true);
  assert.equal(prepareResearchCandidate(value, first.feed, options).changed, false);
});

test('rank changes require a new review with accurate prior rank and score', () => {
  const existing = feed(); const noReview = candidate();
  noReview.rankings[0].thesisScore = 85;
  assert.throws(() => prepareResearchCandidate(noReview, existing, options), /latest_review_mismatch/);
  const inaccurate = changedCandidate(existing); inaccurate.reviews[1].changes[0].oldScore = 95;
  assert.throws(() => prepareResearchCandidate(inaccurate, existing, options), /old_or_new_snapshot_mismatch/);
});

test('old observations, source records, financial evidence and reviews cannot be rewritten or removed', () => {
  const existing = feed();
  for (const field of ['observations', 'sources', 'evidence', 'reviews']) {
    const value = candidate(); value[field][0].extra = 'Retroactive edit';
    assert.throws(() => prepareResearchCandidate(value, existing, options), /history_rewritten/);
  }
  const value = candidate(); value.observations = []; value.rankings[0].challengingEvidenceIds = [];
  assert.throws(() => prepareResearchCandidate(value, existing, options), /observations_history_rewritten/);
});

test('coverage gaps are explicit, known and mutually exclusive', () => {
  const value = candidate(); value.coverage.partialChannels = ['latent-space'];
  assert.throws(() => prepareResearchCandidate(value, null, options), /coverage_channels_duplicate/);
  value.coverage.partialChannels = ['invented'];
  assert.throws(() => prepareResearchCandidate(value, null, options), /coverage_unknown_source/);
});

test('CLI preparation leaves existing legacy bytes unchanged and no-op keeps output bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ai-research-test-'));
  try {
    const input = join(directory, 'candidate.json'); const output = join(directory, 'research.json');
    const legacy = join(directory, 'semi-analysis-theses.json'); const combined = join(directory, 'ai-infrastructure-theses.json');
    await writeFile(input, JSON.stringify(candidate()));
    await writeFile(legacy, '{"legacy":"must remain byte identical"}\n');
    await writeFile(combined, '{"combined":"must remain byte identical"}\n');
    const script = resolve('automation/ai-infrastructure-research.mjs');
    const run = () => spawnSync(process.execPath, [script, 'prepare', input, output], { cwd: directory, encoding: 'utf8' });
    const first = run(); assert.equal(first.status, 0, first.stderr);
    const bytes = await readFile(output, 'utf8');
    const second = run(); assert.equal(second.status, 0, second.stderr); assert.match(second.stdout, /"changed":false/);
    assert.equal(await readFile(output, 'utf8'), bytes);
    assert.equal(await readFile(legacy, 'utf8'), '{"legacy":"must remain byte identical"}\n');
    assert.equal(await readFile(combined, 'utf8'), '{"combined":"must remain byte identical"}\n');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
