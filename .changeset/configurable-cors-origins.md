---
"training-app": patch
---

Support multiple CORS / CSRF-trusted origins via the optional `PAYLOAD_CORS` env var (comma-separated). Defaults to `serverURL`, so existing single-origin deployments are unaffected. Useful for permitting an extra origin (e.g. a `www.` variant) without code changes.
