# Agent Context

## Active training plan

The training plan "5 Plan treningowy" has id=5 in the database.

Make future content modifications via `payload.update` on specific records linked to this plan — do not wipe and reimport.

When fixing an exercise, group, or section — find the record by `plan: 5` (via microcycle/workout/group) and run `payload.update` on the specific ID. Do not run `import-plan-v2 --force` unless the user explicitly asks for a full reimport.
