---
"training-app": minor
---

Workout tracker: client notes and colored blocks

- Exercise client note: unified add/edit UI (`NoteField`) with lucide icons (`Plus`/`Pencil`), label-prefixed display, moved to the bottom of the exercise card.
- Workout note: the per-session note (`workout-logs.notes`) is now editable in the tracker footer; relabeled from "session" to "workout" to avoid ambiguity.
- Colored blocks: groups can be merged into one colored band via the new `bundleWithPrevious` field on `workout-groups`. The loader bundles consecutive groups into `blocks` (index resets per section); the tracker renders one background per block.
- Workout ID is shown in the tracker header for identification.
