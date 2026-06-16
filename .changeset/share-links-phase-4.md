---
"training-app": minor
---

Add Share Links — Phase 4: results (logs) via share-token cookie. Middleware sets an HttpOnly `share-token` cookie on `/share/*` routes. New `canReadViaShareToken` access function validates the cookie and gates read access to `workout-logs` and `set-logs` for the plan owner's data. `WorkoutTracker` and `WorkoutPlansAccordion` gain a `showResults` prop — when true, logs are fetched client-side in read-only mode using the cookie for authorization.
