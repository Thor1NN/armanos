#!/bin/bash

# Script to prepare release on develop and create release branch
# Usage: ./scripts/prepare-release.sh

set -euo pipefail

echo "🚀 Starting release preparation..."

# Step 1: Prepare release on develop
echo ""
echo "📦 Step 1: Preparing release on develop..."
git checkout develop
git pull origin develop

echo "Running changeset version..."
yarn changeset version

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
  echo "⚠️  No changes detected after 'yarn changeset version'"
  echo "   This might mean there are no changesets to process."
  exit 1
fi

echo "Staging changes..."
git add .

echo "Committing version bump..."
git commit -m "chore: version packages"

echo "Pushing to develop..."
git push origin develop

# Step 2: Create release branch
echo ""
echo "🌿 Step 2: Creating release branch..."

# Extract version from package.json
VERSION=$(node -p "require('./package.json').version")
RELEASE_BRANCH="release/v${VERSION}"

echo "Detected version: ${VERSION}"
echo "Creating branch: ${RELEASE_BRANCH}"

git checkout -b "${RELEASE_BRANCH}"
git push origin "${RELEASE_BRANCH}"

# Step 3: Open the release PR with the title the workflow expects ("release: vX.Y.Z")
echo ""
echo "🔀 Step 3: Opening release PR..."

PR_TITLE="release: v${VERSION}"

# Extract this version's section from CHANGELOG.md for the PR body.
ESCAPED_VERSION="${VERSION//./\\.}"
PR_BODY=$(awk "/^## ${ESCAPED_VERSION}/{f=1;next} /^## /{f=0} f" CHANGELOG.md)
if [ -z "${PR_BODY}" ]; then
  PR_BODY="Release v${VERSION}. See CHANGELOG.md for details."
fi

gh pr create \
  --base main \
  --head "${RELEASE_BRANCH}" \
  --title "${PR_TITLE}" \
  --body "${PR_BODY}"

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the PR opened above (${RELEASE_BRANCH} → main, title: \"${PR_TITLE}\")"
echo "2. Merge PR to main"
echo ""
echo "✨ After merge, workflow will automatically:"
echo "   - Create tag v${VERSION}"
echo "   - Create GitHub Release"
