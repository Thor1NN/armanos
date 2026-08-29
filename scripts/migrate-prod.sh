#!/usr/bin/env bash
# Safe production migration runner.
#
# - On Vercel: runs `payload migrate` ONLY for production deployments
#   (VERCEL_ENV=production). Preview/development deployments are skipped, so a
#   preview build can never migrate — or even need to reach — the production
#   database. Point preview environments at a separate branch database.
# - Locally / CI: run with an explicit DATABASE_URL:
#     DATABASE_URL=postgres://... yarn migrate:prod
set -euo pipefail

if [ -n "${VERCEL:-}" ] && [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "migrate-prod: skipping migrations for VERCEL_ENV='${VERCEL_ENV:-unset}' (only 'production' migrates)."
  exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "migrate-prod: DATABASE_URL is not set." >&2
  exit 1
fi

echo "migrate-prod: running payload migrate…"
cross-env NODE_OPTIONS=--no-deprecation tsx node_modules/payload/bin.js migrate --disable-transpile
