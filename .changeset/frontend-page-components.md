---
"training-app": patch
---

Extract shared page-level UI components and tidy the frontend pages.

Add `PageContainer`, `Logo`, and `PageHeader` (with `inline`/`stacked` layouts and a `right` slot) to `components/ui`, and use them across the home, login, and share pages. Extend `Field` to render a real `<label htmlFor>` and use it for the login inputs.

Make the share page date locale-aware via `getFormatter` (instead of a hardcoded `pl-PL`), add an empty state with a new `share.noPlan` message, simplify the login submit cleanup with `finally`, and use a single conditional for the home empty state.

Rename `WorkoutPlansAccordion` to `WorkoutPlans` (component, file, and folder) since it is no longer an accordion-specific abstraction.
