import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeReviewForSheet, hydrateSheetReviews } from './ai-infrastructure-sheet-records.mjs';

const review = {
  id: 'review-test', reviewType: 'event', date: '2026-09-21',
  rankingSnapshot: [{ticker:'NVDA',rank:1,thesisScore:90},{ticker:'ANET',rank:2,thesisScore:80}],
  thesisSnapshots: [
    {ticker:'NVDA',rank:1,thesisScore:90,thesis:'A'.repeat(30000)},
    {ticker:'ANET',rank:2,thesisScore:80,thesis:'B'.repeat(30000)},
  ], valuationSnapshot:{basis:'ttm'}, changes:[],
};

test('large reviews round trip through bounded cells without changing historical content', () => {
  assert.ok(JSON.stringify(review).length > 50000);
  const encoded = encodeReviewForSheet(review);
  assert.ok(JSON.stringify(encoded.record).length < 45000);
  assert.ok(encoded.snapshotRecords.every(row => JSON.stringify(row).length < 45000));
  const legacy = {id:'initial',date:'2026-09-20',rankingSnapshot:[]};
  assert.deepEqual(hydrateSheetReviews([legacy,encoded.record], encoded.snapshotRecords),[legacy,review]);
});

test('partial, duplicated, mismatched, or orphaned snapshots cannot publish', () => {
  const {record,snapshotRecords:rows} = encodeReviewForSheet(review);
  assert.throws(()=>hydrateSheetReviews([record],rows.slice(1)),/incomplete/);
  assert.throws(()=>hydrateSheetReviews([record],[...rows,rows[0]]),/Duplicate/);
  assert.throws(()=>hydrateSheetReviews([record],[{...rows[0],thesisScore:85},rows[1]]),/metadata mismatch/);
  assert.throws(()=>hydrateSheetReviews([],rows),/Orphan/);
});

test('oversized individual company records fail before a Sheet mutation', () => {
  const tooLarge = structuredClone(review);
  tooLarge.thesisSnapshots[0].thesis = 'X'.repeat(50000);
  assert.throws(()=>encodeReviewForSheet(tooLarge),/safe cell size/);
});
