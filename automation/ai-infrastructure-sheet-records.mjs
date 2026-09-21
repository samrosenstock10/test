// Keep complete review history below Google Sheets' per-cell text limit.
// Public reviews retain their existing schema; this only defines canonical storage.
const MAX_CELL_CHARACTERS = 45000;
const SNAPSHOT_TAB = 'Review Snapshots';
const copy = value => JSON.parse(JSON.stringify(value));
const check = (condition, message) => { if (!condition) throw new Error(message); };
const safeCell = (value, label) => check(JSON.stringify(value).length <= MAX_CELL_CHARACTERS, `${label}: record exceeds safe cell size`);

export function encodeReviewForSheet(review) {
  check(['weekly', 'event'].includes(review.reviewType), 'Only genuine weekly/event reviews use snapshot rows');
  check(Array.isArray(review.thesisSnapshots), 'Missing complete thesis snapshots');
  const record = copy(review);
  const snapshotRecords = record.thesisSnapshots.map(thesisSnapshot => ({
    reviewId: record.id, ticker: thesisSnapshot.ticker, rank: thesisSnapshot.rank,
    thesisScore: thesisSnapshot.thesisScore, date: record.date, thesisSnapshot,
  }));
  check(new Set(snapshotRecords.map(row => row.ticker)).size === snapshotRecords.length, 'Duplicate snapshot ticker');
  for (const row of snapshotRecords) safeCell(row, `${record.id}/${row.ticker}`);
  delete record.thesisSnapshots;
  record.thesisSnapshotStorage = { tab: SNAPSHOT_TAB, version: 1, count: snapshotRecords.length };
  safeCell(record, record.id);
  return { record, snapshotRecords };
}

export function hydrateSheetReviews(historyRecords, snapshotRecords = []) {
  const used = new Set();
  const keys = snapshotRecords.map(row => `${row.reviewId}:${row.ticker}`);
  check(new Set(keys).size === keys.length, 'Duplicate review/ticker snapshot');
  check(new Set(historyRecords.map(row => row.id)).size === historyRecords.length, 'Duplicate review ID');
  const reviews = historyRecords.map(original => {
    const review = copy(original);
    const storage = review.thesisSnapshotStorage;
    if (!storage) return review; // Preserve pre-existing inline history exactly.
    check(storage.tab === SNAPSHOT_TAB && storage.version === 1, 'Unknown snapshot storage');
    check(!Object.hasOwn(review, 'thesisSnapshots'), 'Ambiguous inline and separate snapshots');
    check(Number.isInteger(storage.count) && storage.count >= 0, 'Invalid snapshot count');
    const rows = snapshotRecords.filter(row => row.reviewId === review.id).sort((a,b) => a.rank - b.rank);
    check(rows.length === storage.count, `${review.id}: incomplete snapshot rows`);
    for (const row of rows) {
      const thesis = row.thesisSnapshot;
      check(thesis && row.ticker === thesis.ticker && row.rank === thesis.rank && row.thesisScore === thesis.thesisScore && row.date === review.date, `${review.id}: snapshot metadata mismatch`);
      used.add(`${row.reviewId}:${row.ticker}`);
    }
    const expected = [...review.rankingSnapshot].sort((a,b) => a.rank - b.rank);
    check(JSON.stringify(rows.map(({ticker,rank,thesisScore}) => ({ticker,rank,thesisScore}))) === JSON.stringify(expected.map(({ticker,rank,thesisScore}) => ({ticker,rank,thesisScore}))), `${review.id}: ranking snapshot mismatch`);
    delete review.thesisSnapshotStorage;
    review.thesisSnapshots = rows.map(row => copy(row.thesisSnapshot));
    return review;
  });
  check(used.size === snapshotRecords.length, 'Orphan snapshot rows');
  return reviews;
}
