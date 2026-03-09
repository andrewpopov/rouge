#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/land-agent-worktree.sh <worktree-path>

This script rebases an agent worktree on the latest origin/master and prints the
final push/remove steps needed to land onto master cleanly.
EOF
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

worktree_path="$1"

if [[ ! -d "$worktree_path" ]]; then
  echo "Worktree path does not exist: $worktree_path" >&2
  exit 1
fi

if [[ "$(git -C "$worktree_path" rev-parse --is-inside-work-tree 2>/dev/null || true)" != "true" ]]; then
  echo "Path is not a git worktree: $worktree_path" >&2
  exit 1
fi

branch_name="$(git -C "$worktree_path" branch --show-current)"

if [[ -z "$branch_name" || "$branch_name" != codex/* ]]; then
  echo "Expected a codex/* agent branch, found '${branch_name:-<detached>}'." >&2
  exit 1
fi

if [[ -n "$(git -C "$worktree_path" status --short)" ]]; then
  echo "Worktree is not clean. Commit or stash changes before landing." >&2
  exit 1
fi

git -C "$worktree_path" fetch origin master --quiet
git -C "$worktree_path" rebase origin/master

cat <<EOF
Worktree is rebased and ready to land.

Branch: ${branch_name}
Path: ${worktree_path}

Required final steps:
1. Verify the active GitHub account is andrewpopov.
2. Push the rebased branch onto master:
   git -C "${worktree_path}" push origin HEAD:master
3. Update the Tira ticket comment and move it to DONE only after the push succeeds.
4. Remove the worktree:
   git worktree remove "${worktree_path}"
EOF
