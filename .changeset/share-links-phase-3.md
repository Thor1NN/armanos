---
"training-app": minor
---

Add Share Links — Phase 3: readOnly mode across component chain and share page refactor. Adds `readOnly` prop to `SeriesRow`, `ExerciseCard`, `WorkoutTracker`, and `WorkoutPlansAccordion` — hides all mutation controls when true. Replaces the hardcoded `PlanSection` on the share page with `WorkoutPlansAccordion readOnly={true}`. Bug fixes: microcycles and workouts collections now expose `read: isAuthenticated`; `training-plan-loader` calls `loadPlansItems` with `overrideAccess: true`. Refactoring: `fmtMinSec`, `isValidValue`, `buildExerciseMeta`, and `workoutGroupLabel` extracted to `lib/date.ts` / `lib/metrics.ts`; loader renamed to `load-plans-items.ts`.
