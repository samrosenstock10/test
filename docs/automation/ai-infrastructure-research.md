# AI infrastructure research publication

The existing Google Sheet is canonical for research and investment judgment. This additive feed publishes expert observations, public supporting evidence, a short company ranking, review history and coverage. It does not derive from, replace or modify either legacy thesis feed.

- Sheet: `https://docs.google.com/spreadsheets/d/1yjmaEOFu5bE1FZkgDrrpKFI6ZvL6QDO9_YRZDfKkKjk/edit`
- Production research feed: `buy-window/ai-infrastructure-research.json`
- Existing combined feed: `buy-window/ai-infrastructure-theses.json`
- Existing legacy feed: `buy-window/semi-analysis-theses.json`
- Research contract and source-slot ownership: latest `samrosenstock10/semi-analysis-page` `AUTOMATION.md`

## Runtime submission

1. Read current `main`, this document and the complete canonical research Sheet records. Reconcile their public data before submission. Publication recovery reads verified Sheet state and does not repeat research.
2. Build one full candidate snapshot. Compare its semantic content against the existing research feed before creating a branch. A changed check time alone is not a publication.
3. Create a fresh same-repository branch from current `main`: `runtime/ai-research-YYYYMMDDTHHMMSSZ-<base-short-sha>`. The SHA suffix must be 7–40 lowercase hexadecimal characters and match the current base SHA prefix.
4. Add exactly one ordinary UTF-8 JSON file: `buy-window/inbox/ai-research/YYYYMMDDTHHMMSSZ.json`. Its timestamp must match both the branch and `requestedAt`, to the UTC second. Maximum candidate size is 10 MB.
5. Open a non-draft PR to `main` titled exactly `AI infrastructure research YYYYMMDDTHHMMSSZ`.
6. Never author production feed changes, workflow changes or any other file on a runtime branch. Never merge a runtime PR or weaken its validation.
7. Confirm publication only after `main` contains the generated research feed and the site reads it successfully. No Vercel deployment is needed for routine data updates.

The protected workflow checks the exact candidate revision, same-repository ownership, current base ancestry, one newly added candidate, schema and history. It deterministically prepares the research feed, verifies that both legacy feeds remain byte-identical, and permits only the research feed in the final cumulative diff. It rechecks `main` before pushing and merges only its exact validated head. Branch rules and required checks continue to apply.

Semantic no-op candidates are closed and their runtime branches deleted without a merge. A stale candidate must be rebuilt from current `main` and the complete current Sheet; never force-push or bypass a failed check. The initial feature PR installs code without a production feed. Its first Sheet-verified seed uses the same protected candidate path as every later update. Verification tolerates an absent research feed only while neither the checked-out history nor current `main` history has ever contained it. Once published, deletion is an error; this bootstrap exception cannot hide a later removed feed.

## Candidate and public schema

```json
{
  "schemaVersion": "1.0.0",
  "requestedAt": "2026-09-20T20:00:00Z",
  "sourceSheet": "https://docs.google.com/spreadsheets/d/1yjmaEOFu5bE1FZkgDrrpKFI6ZvL6QDO9_YRZDfKkKjk/edit",
  "sources": [],
  "observations": [],
  "evidence": [],
  "rankings": [],
  "reviews": [],
  "coverage": {
    "asOf": "2026-09-20T20:00:00Z",
    "kind": "targeted-seed",
    "completedChannels": [],
    "partialChannels": [],
    "unavailableChannels": [],
    "limitations": []
  }
}
```

The generated public schema replaces `requestedAt` with `updatedAt`. Optional public metadata such as `rankingMethodology` is allowed. It cannot replace any required field. URL metadata must remain public HTTPS provenance; no credentials, private endpoints, financial-account details or user holding quantities belong in this feed. The validator checks URL structure and safety, not whether a publisher actually made a claim; the research worker must open and verify the source.

### Sources and observations

Source registry records have `id`, `label`, `url`, `kind` and `priority`. `sourceId` on an observation refers to the channel registry; preserve a separate `itemId` for the episode, paper or session when useful.

Each observation requires:

- `id`, `sourceId`, `title`, `url`, `speaker`, `role`, `publishedDate`, `observedAt`.
- `contentAccess`: `full-transcript`, `article`, `slides`, `notes-only` or `catalog-only`.
- `independenceGroup`: the underlying speaker affiliation or evidence origin, not the distribution channel.
- `summary`, `claim`, `interpretation`, `beneficiaryTickers`, `countercase`, `nextTest`, `evidenceType`, `status`.

Use `publishedDate: null` when genuinely unknown. Other evidence dates cannot be in the future. `observedAt` must be a full UTC ISO timestamp and no later than the snapshot publication time. Keep recording dates separate from publication dates. A source date from a historical backfill remains historical, regardless of when it was discovered.

`status` is either `evidence` or `lead`. Notes and catalogs must be leads and cannot alone support a ranking or a score change. Full transcript availability does not mean every passage was reviewed: preserve the actual access scope in `verification` or other public metadata. Retain precise timestamps or section locations; do not copy entire copyrighted transcripts into the Sheet or feed.

Public company financial/technical evidence records require `id`, `title`, `url`, `kind`, `independenceGroup`, `publishedDate` (nullable), `observedAt`, `contentAccess` and `status`. They use the same access rules. Search snippets and unreviewed transcript excerpts remain `notes-only` leads. Observation and evidence IDs share one global namespace.

Both a company's CEO and its engineer belong to the same independence group. Syndicated interviews and repeated claims are not new independent confirmations. A source can support one part of a thesis and challenge another, so it may be referenced on both sides of a company assessment.

### Rankings and return scenarios

`rankings` is an ordered array. Each company requires:

- `rank`, `ticker`, `name`, `thesisScore`, `confidence`, `evidenceQuality`.
- `leadership` as a concise string or `{name, role, assessment, sourceId}` with a verified evidence reference.
- `thesis`, `whyThisRank`, `strongestBearCase`, `thesisKiller`, `watchMetrics`.
- `supportingEvidenceIds`, `challengingEvidenceIds`, `valuationStatus`, `valuationReason`, `priceSnapshot`, `returnScenarios`.

Ranks are distinct, contiguous and begin at one. Scores are holistic thesis judgments from 0–100 in five-point steps, descending with rank; ties are valid and their order is explained in `whyThisRank`. They are not probabilities, weighted formulas, portfolio weights, source bullishness or measured expected returns. A source's enthusiasm never becomes our score by averaging. Apply common sense to the growth opportunity, durable competitive advantage, leadership, value capture, evidence and downside. Neither a weekly review nor a new podcast requires a score move or a new company.

Every ranking needs at least one usable reviewed supporting source; this is a schema floor, not the investment admission standard. The research worker must still establish a credible earnings mechanism, contrary evidence and the specific uncertainties. Prefer independent customer/procurement validation over repeated supplier claims. Missing financial normalization is explicit and keeps a thesis ranking separate from a current-price buying recommendation.

`priceSnapshot` may be null when no reliable quote is available. Dated quotes remain quotes; do not relabel an extended-hours print as an official close. Preserve currency, listing and ADR treatment in metadata.

Each five-year return scenario contains `case` (`bear`, `base`, `bull`), `entryMultiple`, `epsGrowthPct`, `terminalMultiple`, `annualizedPriceReturnPct`, and a substantive `assumptionNote`. If `years` is included it must equal 5. A grid may include several assumed entry multiples, with all three cases for each distinct multiple. The validator recalculates:

```text
annualizedPriceReturnPct =
  ((1 + epsGrowthPct / 100) * (terminalMultiple / entryMultiple) ** (1 / 5) - 1) * 100
```

Only normal decimal rounding is tolerated. Growth is per-share earnings growth, so share-count changes are already incorporated. These are price returns before dividends, fees, taxes and currency effects, not total returns. Illustrative assumed entry multiples are not the stock's current multiple. Do not substitute a raw price or one unusually strong quarter for a verified normalized earnings baseline. State these distinctions in `rankingMethodology` and in the user-facing return view. Case labels do not imply probabilities.

### Review history and coverage

Each review requires `id`, `date`, `observedAt`, `status`, `summary`, `changes`, `rankingSnapshot`, and `nextReviewOn`. `rankingSnapshot` records `{ticker, rank, thesisScore}` for every admitted company. Reviews are chronological and append-only. The latest snapshot must match the current rankings.

Each changed company requires `{ticker, oldRank, newRank, oldScore, newScore, reason, evidenceIds}`. Admissions have null old rank/score; removals have null new rank/score. Include ordinal moves caused by another company's admission or removal. Prior values must match the previous review, and referenced evidence must include usable reviewed material. The first seed review may use an empty `changes` list because it establishes a baseline. Subsequent reviews may also be unchanged, but must preserve a real dated analytical conclusion rather than manufacturing movement.

Previously published source, observation, evidence and review records are immutable. Corrections append a new ID with a clear `supersedes` reference and reason; update the current ranking's references when warranted. Never rewrite a historical interpretation as if it was known earlier. Existing review order is protected. Replaying the exact candidate is idempotent.

Coverage lists contain registry source IDs, with no channel in multiple status lists. `completedChannels` means the declared scan scope was completed, not all historical material. `partialChannels` and `unavailableChannels` state specific access or coverage limitations. A changing `coverage.asOf` or publication time alone is a semantic no-op. Detailed run bookkeeping belongs in the Sheet run ledger, not the user's Second Brain.

## Local validation

```bash
node --test automation/ai-infrastructure-research.node-test.mjs
node automation/ai-infrastructure-research.mjs validate
node automation/ai-infrastructure-research.mjs prepare buy-window/inbox/ai-research/YYYYMMDDTHHMMSSZ.json
```

`prepare` writes only the research feed when its semantic content changes. Its GitHub output is `changed=true` or `changed=false`. Meaningful tests cover access-level admission, unsafe URLs, future dates, identity/reference integrity, recomputable returns, immutable review transitions, replay/no-op behavior and byte preservation of the two existing feeds.
