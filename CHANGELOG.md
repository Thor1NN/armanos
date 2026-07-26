# training-app

## 1.4.0

### Minor Changes

- 2b1669d: Add plan and workout structure navigation in the admin panel and fix exercise catalog selection in the structure editor.
- 2d3214f: Allow workout exercises to use either repetition or duration targets.
- 4d7378b: Record left and right weights and repetitions separately for strength sets and exercise defaults.
- 8adc18d: Show group protocol details above exercises in workout tracking.

### Patch Changes

- 420d6b9: Support multiple CORS / CSRF-trusted origins via the optional `PAYLOAD_CORS` env var (comma-separated). Defaults to `serverURL`, so existing single-origin deployments are unaffected. Useful for permitting an extra origin (e.g. a `www.` variant) without code changes.
- fd08425: Reorganize training and sharing code into domain-oriented business modules. Move frontend components, server queries, and Payload Admin extensions behind explicit module boundaries without changing user-facing behavior.
- 66d61f7: Standardize rest duration labels as `Rest(s)` in workout group configuration.

## 1.3.0

### Minor Changes

- 53b1f57: Workout tracker: client notes and colored blocks

  - Exercise client note: unified add/edit UI (`NoteField`) with lucide icons (`Plus`/`Pencil`), label-prefixed display, moved to the bottom of the exercise card.
  - Workout note: the per-session note (`workout-logs.notes`) is now editable in the tracker footer; relabeled from "session" to "workout" to avoid ambiguity.
  - Colored blocks: groups can be merged into one colored band via the new `bundleWithPrevious` field on `workout-groups`. The loader bundles consecutive groups into `blocks` (index resets per section); the tracker renders one background per block.
  - Workout ID is shown in the tracker header for identification.

## 1.2.0

### Minor Changes

- 0b33cdd: Harden security across configuration, auth, and HTTP headers.

  **Requires running DB migrations on deploy** (two migrations included).

  Configuration & API surface:

  - Explicit `auth` config on `users` and `clients` (2h token expiration, 5 max login attempts, 10 min lockout, `secure` cookies in production, `sameSite: Lax`)
  - Add `serverURL`, CORS and CSRF whitelists scoped to `NEXT_PUBLIC_BASE_URL`
  - Disable the unused GraphQL API and remove its routes to shrink the public API surface
  - Restrict Media uploads to images and cap file size at 5 MB

  Auth & data:

  - Enforce a minimum password length of 15 characters (NIST) on `users` and `clients`
  - Enable versioning/audit history on `plans` and `clients` (migration `20260618_162028_security_versioning`)
  - Drop the `share-links` version tables and type to avoid retaining live tokens in history (migration `20260618_172305_drop_share_links_versions`)

  HTTP security headers (`next.config.ts`):

  - HSTS (with preload), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a `frame-ancestors 'self'` CSP

## 1.1.1

### Patch Changes

- d7d2235: Disable Postgres schema auto-push (`push: false`). Schema changes now go exclusively through migrations (`payload migrate:create` + `payload migrate`), so running `yarn dev` can no longer sync schema directly into a remote/production database. After this change a fresh database must be migrated before the app can run.

## 1.1.0

### Minor Changes

- 143180b: Add Share Links feature (Phase 1 & 2): new `share-links` Payload collection with token auto-generation, expiry date, and per-link permissions (plan preview / results). Custom admin UI component shows the full share URL with a one-click copy button.
- 60adf5f: Add Share Links — Phase 3: readOnly mode across component chain and share page refactor. Adds `readOnly` prop to `SeriesRow`, `ExerciseCard`, `WorkoutTracker`, and `WorkoutPlansAccordion` — hides all mutation controls when true. Replaces the hardcoded `PlanSection` on the share page with `WorkoutPlansAccordion readOnly={true}`. Bug fixes: microcycles and workouts collections now expose `read: isAuthenticated`; `training-plan-loader` calls `loadPlansItems` with `overrideAccess: true`. Refactoring: `fmtMinSec`, `isValidValue`, `buildExerciseMeta`, and `workoutGroupLabel` extracted to `lib/date.ts` / `lib/metrics.ts`; loader renamed to `load-plans-items.ts`.
- 275c280: Add Share Links — Phase 4: results (logs) via share-token cookie. Middleware sets an HttpOnly `share-token` cookie on `/share/*` routes. New `canReadViaShareToken` access function validates the cookie and gates read access to `workout-logs` and `set-logs` for the plan owner's data. `WorkoutTracker` and `WorkoutPlansAccordion` gain a `showResults` prop — when true, logs are fetched client-side in read-only mode using the cookie for authorization.

### Patch Changes

- 9ec4638: Split `ExerciseCard` into sub-components (`ExerciseHeader`, `MetaLine`, `SeriesList`, `AddSetActions`), rename its `ex` prop to `exercise`, and use `sets.at(-1)`.

  Adopt a one-folder-per-component convention for feature components: every sub-component now lives in its own `components/{name}/` folder with an `index.ts` barrel (no flat sub-component files). Restructured `exercise-card`, `series-form`, and `workout-plans` accordingly. This is documented in the new `frontend-build-components` skill.

- 1375bb9: Extract reusable UI components and split large workout components.

  Add two generic primitives in `components/ui`: `Alert` (error banner with an optional dismiss button, replacing inline `errorBannerClass` usage in login, series-form, and workout-tracker) and `Field` (label + control wrapper, replacing the inline label pattern in series-form, session-times, and the metric field router).

  Split `MetricFieldInput` into focused files (`DurationInput`, `BodyweightField`) so it becomes a thin branch router, and extract `ActiveContextBanner`, `MicrocyclePicker`, and `WorkoutPicker` out of `WorkoutPlansAccordion`. No behavior changes - markup and classes are preserved.

- c695fab: Extract shared page-level UI components and tidy the frontend pages.

  Add `PageContainer`, `Logo`, and `PageHeader` (with `inline`/`stacked` layouts and a `right` slot) to `components/ui`, and use them across the home, login, and share pages. Extend `Field` to render a real `<label htmlFor>` and use it for the login inputs.

  Make the share page date locale-aware via `getFormatter` (instead of a hardcoded `pl-PL`), add an empty state with a new `share.noPlan` message, simplify the login submit cleanup with `finally`, and use a single conditional for the home empty state.

  Rename `WorkoutPlansAccordion` to `WorkoutPlans` (component, file, and folder) since it is no longer an accordion-specific abstraction.

- 275c280: Refactor `lib/date` and `lib/metrics` for readability and consistency.

  `lib/date`: rename `fmt*` helpers to `format*` (`formatDuration`, `formatMinSec`, `formatSec`), document the local-timezone behavior of the ISO/input helpers, and make `pad2` accept `string | number`. Behavior changes: `combineDateTime` now returns `null` for an invalid date/time instead of throwing, and `formatDuration` returns `null` for a zero-length duration instead of `"0min"`. The seconds label in `formatMinSec` is now `"s"` to match `formatSec`.

  `lib/metrics`: extract a `unitFactor` helper to remove duplicated unit lookups, dedupe the bodyweight check in `metricBody`, add a clarifying note for the `'x'` placeholder in `isValidValue`, and reuse `PROTOCOL_LABEL` (with a new `Protocol` type) in `workoutGroupLabel` instead of hardcoded protocol names.

  Introduce `lib/metric-keys` with shared composite-field key helpers (`minKey`, `secKey`, `unitKey`, `BODYWEIGHT_KEY`) used by `metrics`, `series-form`, and `metric-field-input`, so the write and read sides of the form cannot drift apart.

- f71ee34: Extend spec-writing skill with stack-specific compliance reviews. Split the Medusa-only compliance matrix into a universal dispatcher plus separate `compliance-review-medusa.md` and `compliance-review-payload.md` reference files. Update `SKILL.md` and `spec-template.md` to point to the correct file per project stack.

## 1.0.1

### Patch Changes

- Add release automation and improve repository documentation and presentation
