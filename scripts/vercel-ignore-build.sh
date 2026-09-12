#!/usr/bin/env bash

# Vercel Ignored Build Step Script
# Exit 1: Proceed with Vercel build
# Exit 0: Cancel / Skip Vercel build

echo "=== Vercel Ignored Build Step Check ==="

# 1. Force build if commit message contains [build] or [rebuild]
COMMIT_MSG=$(git log -1 --pretty=%B)
if [[ "$COMMIT_MSG" =~ "\[build\]" ]] || [[ "$COMMIT_MSG" =~ "\[rebuild\]" ]]; then
  echo "Commit message contains [build] flag. Proceeding with full build."
  exit 1
fi

# 2. Skip build if commit message contains [skip-build] or [skip ci]
if [[ "$COMMIT_MSG" =~ "\[skip-build\]" ]] || [[ "$COMMIT_MSG" =~ "\[skip ci\]" ]]; then
  echo "Commit message contains [skip-build] flag. Skipping Vercel build."
  exit 0
fi

# 3. Check what files changed in the latest commit
echo "Analyzing modified files between HEAD^ and HEAD..."
CHANGED_FILES=$(git diff --name-only HEAD^ HEAD)

# If any core application code changed, must build
CORE_PATTERNS="app/|components/|lib/|types/|public/|package.json|pnpm-lock.yaml|next.config|tailwind.config|tsconfig"
if echo "$CHANGED_FILES" | grep -E -q "$CORE_PATTERNS"; then
  echo "Core application code modified. Proceeding with build."
  exit 1
fi

# 4. Check if only existing posts were edited (no new post created)
# If a new markdown was added (status 'A'), we must build so the new file exists in Vercel Serverless container
ADDED_POSTS=$(git diff --name-status HEAD^ HEAD | grep -E '^A[[:space:]]+_posts/')
if [ -n "$ADDED_POSTS" ]; then
  echo "New post added to _posts/. Proceeding with fast build to include file in serverless bundle."
  exit 1
fi

# If only existing markdown files were modified (e.g. typos, minor edits)
if echo "$CHANGED_FILES" | grep -E -q "^_posts/"; then
  echo "Only existing articles modified in _posts/. Skipping Vercel build (On-Demand ISR handles update)."
  exit 0
fi

echo "No build-triggering changes detected. Skipping build."
exit 0
