#!/usr/bin/env bash

# Vercel Ignored Build Step Script (Static Export mode)
# Exit 1: Proceed with Vercel build
# Exit 0: Cancel / Skip Vercel build

echo "=== Vercel Ignored Build Step Check ==="

COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")

# 1. Force build if commit message contains [build] or [rebuild]
if [[ "$COMMIT_MSG" =~ \[build\] ]] || [[ "$COMMIT_MSG" =~ \[rebuild\] ]]; then
  echo "Commit message contains [build] flag. Proceeding with full build."
  exit 1
fi

# 2. Skip build if commit message contains [skip-build] or [skip ci]
if [[ "$COMMIT_MSG" =~ \[skip-build\] ]] || [[ "$COMMIT_MSG" =~ \[skip\ ci\] ]]; then
  echo "Commit message contains skip flag. Skipping Vercel build."
  exit 0
fi

# 3. Determine diff base (prefer Vercel's previous deployed SHA for multi-commit pushes)
BASE_REF="HEAD^"
if [ -n "${VERCEL_GIT_PREVIOUS_SHA:-}" ] && git cat-file -e "${VERCEL_GIT_PREVIOUS_SHA}^{commit}" 2>/dev/null; then
  BASE_REF="$VERCEL_GIT_PREVIOUS_SHA"
fi

CHANGED_FILES=$(git diff --name-only "$BASE_REF" HEAD 2>/dev/null)
if [ -z "$CHANGED_FILES" ]; then
  echo "Unable to determine changed files (initial commit or shallow clone). Proceeding with build."
  exit 1
fi

echo "Changed files since $BASE_REF:"
echo "$CHANGED_FILES"

# 4. In static export mode, any change to posts, app code, build scripts, public assets, or build configs requires a build
BUILD_PATTERNS='^(_posts/|app/|components/|lib/|types/|public/|scripts/build-|package\.json|pnpm-lock\.yaml|next\.config|vercel\.json|tailwind\.config|postcss\.config|tsconfig)'
if echo "$CHANGED_FILES" | grep -E -q "$BUILD_PATTERNS"; then
  echo "Site content or build-relevant files modified. Proceeding with Vercel build."
  exit 1
fi

echo "Only non-site files changed (e.g. docs/aux scripts). Skipping Vercel build."
exit 0
