---
"training-app": patch
---

Split `ExerciseCard` into sub-components (`ExerciseHeader`, `MetaLine`, `SeriesList`, `AddSetActions`), rename its `ex` prop to `exercise`, and use `sets.at(-1)`.

Adopt a one-folder-per-component convention for feature components: every sub-component now lives in its own `components/{name}/` folder with an `index.ts` barrel (no flat sub-component files). Restructured `exercise-card`, `series-form`, and `workout-plans` accordingly. This is documented in the new `frontend-build-components` skill.
