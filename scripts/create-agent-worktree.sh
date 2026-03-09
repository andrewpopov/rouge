#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/create-agent-worktree.sh <agent-number|agent-name> <ROUGE-ticket>

Examples:
  ./scripts/create-agent-worktree.sh 1 ROUGE-69
  ./scripts/create-agent-worktree.sh agent-4 ROUGE-51
EOF
}

if [[ $# -ne 2 ]]; then
  usage
  exit 1
fi

agent_input="$1"
ticket_input="$(printf '%s' "$2" | tr '[:lower:]' '[:upper:]')"

case "$agent_input" in
  1|agent-1|agent1|Agent1|Agent-1) agent_number="1" ;;
  2|agent-2|agent2|Agent2|Agent-2) agent_number="2" ;;
  3|agent-3|agent3|Agent3|Agent-3) agent_number="3" ;;
  4|agent-4|agent4|Agent4|Agent-4) agent_number="4" ;;
  5|agent-5|agent5|Agent5|Agent-5) agent_number="5" ;;
  *)
    echo "Unrecognized agent '$agent_input'." >&2
    usage
    exit 1
    ;;
esac

if [[ ! "$ticket_input" =~ ^ROUGE-[0-9]+$ ]]; then
  echo "Ticket must look like ROUGE-123." >&2
  usage
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
repo_name="$(basename "$repo_root")"
repo_parent="$(dirname "$repo_root")"
worktrees_root="$repo_parent/${repo_name}-worktrees"
ticket_slug="$(printf '%s' "$ticket_input" | tr '[:upper:]' '[:lower:]')"
branch_name="codex/agent${agent_number}-${ticket_slug}"
worktree_path="$worktrees_root/agent${agent_number}-${ticket_slug}"

mkdir -p "$worktrees_root"

if [[ -e "$worktree_path" ]]; then
  echo "Worktree path already exists: $worktree_path" >&2
  exit 1
fi

git fetch origin master --quiet

if git show-ref --verify --quiet "refs/heads/$branch_name"; then
  git worktree add "$worktree_path" "$branch_name"
else
  git worktree add -b "$branch_name" "$worktree_path" origin/master
fi

cat <<EOF
Created agent worktree.

Agent: Agent ${agent_number}
Ticket: ${ticket_input}
Branch: ${branch_name}
Path: ${worktree_path}

Required next steps:
1. cd "${worktree_path}"
2. Move ${ticket_input} to IN_PROGRESS in Tira before your first edit.
3. Do all ticket work in this worktree, not in ${repo_root}.
4. Rebase on the latest origin/master before landing.
5. Verify the active GitHub account is andrewpopov before pushing.
EOF
