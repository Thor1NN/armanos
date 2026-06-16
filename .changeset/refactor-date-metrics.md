---
"training-app": patch
---

Refactor `lib/date` and `lib/metrics` for readability and consistency.

`lib/date`: rename `fmt*` helpers to `format*` (`formatDuration`, `formatMinSec`, `formatSec`), document the local-timezone behavior of the ISO/input helpers, and make `pad2` accept `string | number`. Behavior changes: `combineDateTime` now returns `null` for an invalid date/time instead of throwing, and `formatDuration` returns `null` for a zero-length duration instead of `"0min"`. The seconds label in `formatMinSec` is now `"s"` to match `formatSec`.

`lib/metrics`: extract a `unitFactor` helper to remove duplicated unit lookups, dedupe the bodyweight check in `metricBody`, add a clarifying note for the `'x'` placeholder in `isValidValue`, and reuse `PROTOCOL_LABEL` (with a new `Protocol` type) in `workoutGroupLabel` instead of hardcoded protocol names.

Introduce `lib/metric-keys` with shared composite-field key helpers (`minKey`, `secKey`, `unitKey`, `BODYWEIGHT_KEY`) used by `metrics`, `series-form`, and `metric-field-input`, so the write and read sides of the form cannot drift apart.
