# Final Compliance Review

Run this after the spec checklist passes. Load the tech-specific compliance file for the project's stack, then fill in the matrix.

---

## Which file to load

| Stack | File |
|-------|------|
| Medusa.js | [compliance-review-medusa.md](compliance-review-medusa.md) |
| Payload CMS / Next.js | [compliance-review-payload.md](compliance-review-payload.md) |

If the project uses a stack not listed above, create a new `compliance-review-[stack].md` in this directory and add it to the table.

---

## Universal checks (all stacks)

These apply regardless of technology:

| Check | Status | Notes |
|-------|--------|-------|
| No auth-sensitive values accepted from HTTP request params | ✅ / ❌ / N/A | |
| All user-facing strings go through i18n, never hardcoded | ✅ / ❌ / N/A | |
| `yarn build` (or equivalent) verified after each phase | ✅ / ❌ / N/A | |
| Open Questions section removed or all items resolved | ✅ / ❌ / N/A | |

---

## Verdict

- **APPROVED** — All rules (universal + stack-specific) pass or are explicitly N/A with justification.
- **CHANGES REQUIRED** — List violations below.

### Violations (if any)

- …
