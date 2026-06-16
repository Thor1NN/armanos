---
"training-app": patch
---

Disable Postgres schema auto-push (`push: false`). Schema changes now go exclusively through migrations (`payload migrate:create` + `payload migrate`), so running `yarn dev` can no longer sync schema directly into a remote/production database. After this change a fresh database must be migrated before the app can run.
