#!/usr/bin/env bash

set -uo pipefail

HT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HT_ROOT"

log() { printf '\033[36m[hyperteams]\033[0m %s\n' "$*"; }
error() { printf '\033[91m✗ %s\033[0m\n' "$*" >&2; exit 1; }
success() { printf '\033[92m✓ %s\033[0m\n' "$*"; }

log "Checking the setup..."
command -v node >/dev/null 2>&1 || error "Node.js not found. Install it on this system and run again:
    https://nodejs.org/  (then check 'node --version')"

[ -f "server.js" ] || error "server.js is missing — the release package is corrupted."
[ -f ".env.local" ] || error ".env.local is missing. Configure it with:
    node scripts/setup.mjs"

success "Setup looks good"

if [ -f ".env.local" ]; then
  set -a
  source .env.local
  set +a
fi

log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Starting HyperTeams..."
log ""
log "The dashboard address is printed in the [supervise] lines below."
log ""
if [ -n "${HYPERTEAMS_BACKGROUND:-}" ]; then
  log "Stop: hyperteams stop"
else
  log "Stop: Ctrl-C"
fi
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log ""

exec node "$HT_ROOT/scripts/supervise.mjs"
