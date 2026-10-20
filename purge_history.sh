#!/usr/bin/env bash
# purge_history.sh - keep only the CURRENT version of a path in git history.
#
# Every older version of the files under $1 is removed from every commit, so the
# blobs become unreachable and `git gc` can actually free them. The current tree
# is then put back as a single commit on top, so HEAD still contains the files.
#
#   bash purge_history.sh UKMO
#
# Intended for a data directory that is overwritten wholesale each run. It
# rewrites history, so the branch has to be force-pushed afterwards.
set -euo pipefail

PATHSPEC="${1:-UKMO}"

if [ ! -e "$PATHSPEC" ]; then
    echo "purge: $PATHSPEC does not exist, nothing to do"
    exit 0
fi

if [ "$(git rev-list --count HEAD)" -le 1 ]; then
    echo "purge: only one commit, nothing to do"
    exit 0
fi

# the tree we want to keep, captured before the rewrite
TREE=$(git rev-parse 'HEAD^{tree}')
MSG=$(git log -1 --pretty=%B)
export FILTER_BRANCH_SQUELCH_WARNING=1

# 1. drop PATHSPEC from every commit. The commit that carried the new data
#    becomes empty, and --prune-empty removes it.
git filter-branch -f \
    --index-filter "git rm -r --cached --ignore-unmatch -- '$PATHSPEC'" \
    --prune-empty -- --all >/dev/null 2>&1

# 2. filter-branch leaves the old commits pinned by refs/original - drop those,
#    otherwise gc cannot free anything
if git for-each-ref --format='%(refname)' refs/original | grep -q .; then
    git for-each-ref --format='%(refname)' refs/original \
        | while read -r ref; do git update-ref -d "$ref"; done
fi

# 3. put the current tree back as one commit on the cleaned-up history.
#    commit-tree needs no working tree, which matters because filter-branch
#    has just checked out a tree without PATHSPEC.
BASE=$(git rev-parse HEAD)
NEW=$(git commit-tree "$TREE" -p "$BASE" -m "$MSG")
git reset --hard -q "$NEW"

# 4. make the old objects unreachable for real, then free them
git reflog expire --expire=now --all
git gc --prune=now --quiet

echo "purge: history is $(git rev-list --count HEAD) commit(s), .git $(du -sh .git | cut -f1)"
