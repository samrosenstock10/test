import test from 'node:test';
import assert from 'node:assert/strict';
import { planProjectHandoff, sourceVersion, canonicalSourceUrl } from './project-tracker-handoff.mjs';
import { SOURCE_SHEET, prepareResearchCandidate } from './ai-infrastructure-research.mjs';

const observedAt = '2026-09-21T12:00:00Z';
const bottleneck = { 'Signal ID': 'B-1', Date: '2026-09-14', 'Evidence Summary': 'Factory opened.', 'Speaker / Entity': 'Issuer', 'Source URL': 'https://issuer.com/factory', 'Linked Project IDs': 'P-1', 'Source Quality': '5', Bottleneck: 'Manufacturing Capacity', Direction: 'Easing' };
const claim = { 'Claim ID': 'C-1', 'Project ID': 'P-1', 'Claim Date': '2026-09-01', Claimant: 'Issuer', 'Original Claim': 'Build 100 units.', Target: '100', Unit: 'units', 'Target Date': '2026-09-20', 'Source URL': 'https://issuer.com/target', 'Resolution Status': 'Validated', 'Resolution Date': '2026-09-20', 'Resolution Source': 'https://issuer.com/results', 'Actual Result': '100', 'Actual Unit': 'units' };
function fixture() {
  return {
    source: { Bottlenecks: [structuredClone(bottleneck)], Claims: [structuredClone(claim)] },
    feed: { schemaVersion: '1.0.0', sourceSheet: SOURCE_SHEET, sources: [], observations: [], evidence: [], rankings: [], reviews: [], updatedAt: '2026-09-20T12:00:00Z', coverage: { asOf: '2026-09-20T12:00:00Z', kind: 'test', completedChannels: [], partialChannels: [], unavailableChannels: [], limitations: [] } },
    observedAt,
  };
}
function decision(row = bottleneck, table = 'Bottlenecks') {
  return { table, sourceId: row[table === 'Claims' ? 'Claim ID' : 'Signal ID'], version: sourceVersion(table, row), action: 'import', reason: 'Reviewed electrical equipment capacity mechanism.', evidence: { title: 'Reviewed deployment', summary: 'Issuer reports added production.', claim: 'Factory opened.', interpretation: 'Capacity may ease construction delays.', independenceGroup: 'issuer', publishedDate: '2026-09-20', contentAccess: 'article', status: 'evidence', verification: 'Read the issuer release; no independent audit.', countercase: 'No utilization measure.', nextTest: 'Check deliveries.' } };
}
test('preserves provenance and publishes through existing immutable-history validator', () => {
  const input = fixture(), before = structuredClone(input);
  const result = planProjectHandoff({ ...input, decisions: [decision()] });
  assert.deepEqual(input, before);
  assert.equal(result.additions[0].provenance.sourceId, 'B-1');
  assert.equal(result.additions[0].provenance.originalDate, bottleneck.Date);
  assert.deepEqual(result.additions[0].provenance.projectIds, ['P-1']);
  for (const key of Object.keys(input.feed).filter(key => !['evidence', 'updatedAt'].includes(key))) assert.deepEqual(result.feed[key], input.feed[key]);
  const { updatedAt, ...content } = result.feed;
  assert.equal(prepareResearchCandidate({ ...content, requestedAt: updatedAt }, input.feed).changed, true);
});
test('retries after evidence write, even before state write, are no-ops', () => {
  const input = fixture(), first = planProjectHandoff({ ...input, decisions: [decision()] });
  const replay = planProjectHandoff({ ...input, feed: first.feed, decisions: [decision()], observedAt: '2026-09-21T13:00:00Z' });
  assert.equal(replay.additions.length, 0);
  assert.deepEqual(replay.feed, first.feed);
});
test('source corrections append superseding evidence and preserve original records', () => {
  const input = fixture(), first = planProjectHandoff({ ...input, decisions: [decision()] });
  input.source.Bottlenecks[0]['Evidence Summary'] = 'Factory opening was delayed.';
  const nextDecision = decision(input.source.Bottlenecks[0]);
  nextDecision.evidence.claim = 'Factory opening was delayed.';
  const next = planProjectHandoff({ ...input, feed: first.feed, state: first.state, decisions: [nextDecision] });
  assert.deepEqual(next.feed.evidence[0], first.feed.evidence[0]);
  assert.equal(next.additions[0].supersedes, first.additions[0].id);
});
test('same source and claim links within destination, preserving existing origin', () => {
  const input = fixture(), first = planProjectHandoff({ ...input, decisions: [decision()] });
  first.feed.evidence[0].id = 'already-found'; delete first.feed.evidence[0].provenance;
  const result = planProjectHandoff({ ...input, feed: first.feed, decisions: [decision()] });
  assert.equal(result.additions.length, 0);
  assert.equal(result.outcomes[0].evidenceId, 'already-found');
});
test('semantic links require same source; distinct claims require explanation and share origin', () => {
  const input = fixture(), first = planProjectHandoff({ ...input, decisions: [decision()] });
  first.feed.evidence[0].id = 'existing'; delete first.feed.evidence[0].provenance;
  const d = decision(); d.evidence.claim = 'Capacity expands.'; d.evidence.independenceGroup = 'different-label';
  assert.throws(() => planProjectHandoff({ ...input, feed: first.feed, decisions: [d] }), /distinct claim/);
  d.distinctClaimReason = 'Separately quantified capacity rather than opening date.';
  assert.equal(planProjectHandoff({ ...input, feed: first.feed, decisions: [d] }).additions[0].independenceGroup, 'issuer');
  d.action = 'link'; d.existingEvidenceId = 'missing';
  assert.throws(() => planProjectHandoff({ ...input, feed: first.feed, decisions: [d] }), /same underlying source/);
});
test('open, too early and unverified claims cannot be imported as resolutions', () => {
  for (const status of ['Open', 'Too early', 'Unverified']) {
    const input = fixture(); input.source.Claims[0]['Resolution Status'] = status;
    assert.throws(() => planProjectHandoff({ ...input, decisions: [decision(input.source.Claims[0], 'Claims')] }), /not substantively resolved/);
  }
});
test('resolved claim retains original target, source, resolution and claim ID', () => {
  const input = fixture(); const result = planProjectHandoff({ ...input, decisions: [decision(claim, 'Claims')] });
  const record = result.additions[0];
  assert.equal(record.url, claim['Resolution Source']);
  assert.equal(record.provenance.claimId, 'C-1');
  assert.equal(record.provenance.originalSourceUrl, claim['Source URL']);
  assert.equal(record.provenance.resolutionDate, claim['Resolution Date']);
  assert.equal(record.provenance.actualResult, '100');
  assert.equal(sourceVersion('Claims', { ...claim, 'Next Review': '2026-10-01' }), sourceVersion('Claims', claim));
});
test('rejects stale selections, duplicate upstream IDs and missing snapshots', () => {
  const input = fixture(); input.source.Bottlenecks[0].Notes = 'Correction';
  assert.throws(() => planProjectHandoff({ ...input, decisions: [decision()] }), /changed since review/);
  input.source.Bottlenecks.push(input.source.Bottlenecks[0]);
  assert.throws(() => planProjectHandoff(input), /Duplicate upstream/);
  delete input.source.Bottlenecks;
  assert.throws(() => planProjectHandoff(input), /Missing complete/);
});
test('independent resolution evidence is not deduped or attributed to the original promise', () => {
  const input = fixture();
  const first = planProjectHandoff({ ...input, decisions: [decision()] });
  input.source.Claims[0]['Source URL'] = bottleneck['Source URL'];
  input.source.Claims[0]['Resolution Source'] = 'https://auditor.com/results';
  const d = decision(input.source.Claims[0], 'Claims');
  d.evidence.independenceGroup = 'independent-auditor';
  const result = planProjectHandoff({ ...input, feed: first.feed, decisions: [d] });
  assert.equal(result.additions.length, 1);
  assert.equal(result.additions[0].independenceGroup, 'independent-auditor');
  assert.equal(result.additions[0].provenance.originalSourceUrl, bottleneck['Source URL']);
  const linked = { ...d, action: 'link', existingEvidenceId: first.additions[0].id };
  assert.throws(() => planProjectHandoff({ ...input, feed: first.feed, decisions: [linked] }), /same underlying source/);
});
test('rejects unsafe links, invalid dates and unsupported evidence status', () => {
  for (const change of [d => { d.evidence.publishedDate = '2030-01-01'; }, d => { d.evidence.contentAccess = 'notes-only'; }, d => { d.evidence.independenceGroup = 'ChatGPT'; }]) {
    const d = decision(); change(d); assert.throws(() => planProjectHandoff({ ...fixture(), decisions: [d] }));
  }
  const input = fixture(); input.source.Claims[0]['Resolution Source'] = 'https://127.0.0.1/a';
  assert.throws(() => planProjectHandoff({ ...input, decisions: [decision(input.source.Claims[0], 'Claims')] }), /unsafe/);
  assert.equal(canonicalSourceUrl('https://issuer.com/factory?utm_source=x#body'), canonicalSourceUrl(bottleneck['Source URL']));
});
test('zero additions valid; unreviewed and changed skipped records stay pending', () => {
  const input = fixture(), empty = planProjectHandoff(input);
  assert.deepEqual(empty.feed, input.feed); assert.equal(empty.pending.length, 2);
  const skipped = planProjectHandoff({ ...input, decisions: [{ ...decision(), action: 'skip' }] });
  assert.equal(skipped.pending.length, 1);
  input.source.Bottlenecks[0].Notes = 'New material detail';
  assert.equal(planProjectHandoff({ ...input, state: skipped.state }).pending.length, 2);
});
