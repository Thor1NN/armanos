# Compliance Review — Payload CMS / Next.js

Run this after the spec checklist passes. Validates the spec against Payload CMS and Next.js project hard rules.

---

## Compliance Matrix

| Rule | Source | Status | Notes |
|------|--------|--------|-------|
| New collection registered in `payload.config.ts` and exported from `collections/index.ts` | AGENTS.md | ✅ / ❌ / N/A | |
| Migration generated (`migrate:create`) and applied (`migrate`) after schema change | AGENTS.md | ✅ / ❌ / N/A | |
| `yarn generate:types` run after schema change | AGENTS.md | ✅ / ❌ / N/A | |
| `overrideAccess: true` used only in server-side loaders, never in client-side handlers | security | ✅ / ❌ / N/A | |
| Auth-sensitive IDs always sourced from DB doc, never from HTTP request params | security | ✅ / ❌ / N/A | |
| All 4 access operations (create, read, update, delete) explicitly defined on every collection | convention | ✅ / ❌ / N/A | |
| Custom admin components added to importMap (`yarn generate:importmap`) | Payload | ✅ / ❌ / N/A | |
| `yarn build` run after each phase | AGENTS.md | ✅ / ❌ / N/A | |
| User-facing strings only via i18n (`messages/pl.json` + `en.json`), never hardcoded | convention | ✅ / ❌ / N/A | |

---

## Verdict

- **APPROVED** — All rules pass or are explicitly N/A with justification.
- **CHANGES REQUIRED** — List violations below.

### Violations (if any)

- …
