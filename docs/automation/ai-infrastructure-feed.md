# AI Infrastructure Thesis Tracker feed submission

The canonical Google Sheet remains the analytical source of truth. GitHub deterministically turns one complete candidate snapshot into the combined production feed and the legacy SemiAnalysis feed.

## Runtime submission

The scheduled worker must:

1. Read and reconcile both complete Sheet ledgers.
2. If their semantic content differs from the current combined feed, create a fresh same-repository branch named `runtime/ai-infrastructure-YYYY-MM-DDTHHMMSSZ-<base-short-sha>` from current `main`.
3. Add exactly one file under `buy-window/inbox/ai-infrastructure/<timestamp>.json`.
4. Open a non-draft pull request to `main` titled `AI infrastructure feed <timestamp>`.
5. Do not author either production feed directly, do not merge the PR, and do not create any other file.

The candidate schema is:

```json
{
  "schemaVersion": "1.0.0",
  "requestedAt": "ISO-8601 timestamp",
  "sourceSheet": "https://docs.google.com/spreadsheets/d/1yjmaEOFu5bE1FZkgDrrpKFI6ZvL6QDO9_YRZDfKkKjk/edit",
  "sources": {
    "semianalysis": { "label": "SemiAnalysis", "rows": [] },
    "a16z": { "label": "a16z Machine Age", "rows": [] }
  }
}
```

Use the exact existing row fields. Include every current row from both ledgers. The protected workflow sorts rows, validates schema/identity/score/date rules, derives the legacy feed exactly from SemiAnalysis, suppresses timestamp-only commits, and merges only the validated output. A no-change candidate is closed without a merge.
