---
"training-app": patch
---

Extract reusable UI components and split large workout components.

Add two generic primitives in `components/ui`: `Alert` (error banner with an optional dismiss button, replacing inline `errorBannerClass` usage in login, series-form, and workout-tracker) and `Field` (label + control wrapper, replacing the inline label pattern in series-form, session-times, and the metric field router).

Split `MetricFieldInput` into focused files (`DurationInput`, `BodyweightField`) so it becomes a thin branch router, and extract `ActiveContextBanner`, `MicrocyclePicker`, and `WorkoutPicker` out of `WorkoutPlansAccordion`. No behavior changes - markup and classes are preserved.
