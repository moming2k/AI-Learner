#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <server-host-or-user@host> [remote-dir]" >&2
  exit 1
fi

TARGET="$1"
REMOTE_DIR="${2:-/home/openclaw-project/AI-Learner}"
SSH_OPTS=(-p 22022 -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_DIR"

rsync -az \
  --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env.local' \
  --exclude '*.db' \
  --exclude 'data/' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$REPO_DIR/" "$TARGET:$REMOTE_DIR/"

echo "Safe sync complete. Protected: .env.local, *.db, data/"
echo "Next steps on server: build with AI_LEARNER_DATA_DIR set, then restart ai-learner service."
