#!/usr/bin/env bash
set -euo pipefail
cd /home/openclaw-project/AI-Learner
export HOST=127.0.0.1
export PORT=3011
exec pnpm start --hostname 127.0.0.1 --port 3011
