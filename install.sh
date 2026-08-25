#!/usr/bin/env bash

set -uo pipefail

DIST_REPO_URL="${DIST_REPO_URL:-https://github.com/hyperteamsnet/hyperteams.git}"

STATE_ROOT="${STATE_ROOT:-$HOME/.hyperteams}"
INSTALL_DIR="${INSTALL_DIR:-$STATE_ROOT/app}"

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
error() { printf '\033[91m✗ %s\033[0m\n' "$*" >&2; hold_open; exit 1; }
success() { printf '\033[92m✓ %s\033[0m\n' "$*"; }
warning() { printf '\033[93m⚠ %s\033[0m\n' "$*"; }
prompt() { printf '\033[36m❓ %s\033[0m ' "$*"; }

HOLD_DONE=0
hold_open() {
  [ "$HOLD_DONE" = "1" ] && return 0
  HOLD_DONE=1
  [ "${HYPERTEAMS_NO_PAUSE:-}" = "1" ] && return 0
  [ "${TTY_OK:-0}" = "1" ] || return 0
  printf '\n\033[90m%s\033[0m ' "Press Enter to close this window..."
  IFS= read -r _ < /dev/tty || true
  return 0
}

trap 'rc=$?; if [ "$rc" -ne 0 ]; then hold_open; fi; exit "$rc"' EXIT

TTY_OK=0
{ : < /dev/tty; } 2>/dev/null && TTY_OK=1
no_tty() {
  error "Interactive input is required, but no terminal could be opened.
  Download the script to a file and run it instead:
    curl -fsSL <install script URL> -o install.sh && bash install.sh"
}
ask() {
  [ "$TTY_OK" = "1" ] || no_tty
  local __var="$1" __val=""
  prompt "$2"
  IFS= read -r __val < /dev/tty
  printf -v "$__var" '%s' "$__val"
}

detect_branch() {
  local os arch
  case "$(uname -s)" in
    Darwin) os="darwin" ;;
    Linux)  os="linux" ;;
    MINGW*|MSYS*|CYGWIN*) os="win32" ;;
    *) error "Unsupported OS: $(uname -s) — on Windows, use install.ps1." ;;
  esac
  case "$(uname -m)" in
    arm64|aarch64) arch="arm64" ;;
    x86_64|amd64)  arch="x64" ;;
    *) error "Unsupported architecture: $(uname -m)" ;;
  esac
  echo "dist-${os}-${arch}"
}

BRANCH="${BRANCH:-$(detect_branch)}"

log "This system: $(uname -s) $(uname -m) → branch '${BRANCH}'"

command -v git >/dev/null 2>&1 || error "git is required (it is used to download the artifact)."
if command -v node >/dev/null 2>&1; then
  success "Required tools OK (git, node $(node --version 2>/dev/null))"
else
  error "Node.js is required (it runs the app — unlike before, it is no longer bundled in the artifact).
  Install: https://nodejs.org/  (or nvm/fnm). Then verify with 'node --version'.
  The major version the artifact needs is checked at boot, and reported there if it does not match."
fi

if command -v claude >/dev/null 2>&1; then
  claude_ver="$(claude --version 2>/dev/null | head -1)"
  if [ -n "$claude_ver" ]; then
    success "Claude Code OK ($claude_ver)"
  else
    warning "Claude Code (claude) is on PATH but does not run — check that the installation is intact."
    log "  Check:     claude --version"
    log "  Diagnose:  claude doctor"
    log "  Reinstall: curl -fsSL https://claude.ai/install.sh | bash"
  fi
else
  warning "Claude Code (claude) not found — without it the dashboard starts but no task will run."
  log "  Install: curl -fsSL https://claude.ai/install.sh | bash"
  log "  Sign in: run 'claude' once in a terminal and log in (subscription or API key)."
  log "  Verify:  once 'claude --version' works you are ready (auth reuses that login)."
fi

echo ""

PRESERVE=(data.db data.db-wal data.db-shm .env.local previews.map)
RESTORE_FROM=""

migrate_flat_layout() {
  [ -e "$STATE_ROOT/server.js" ] || return 0

  log "Old layout detected — moving the installation to $INSTALL_DIR"

  pkill -f "$STATE_ROOT/scripts/ptyd.mjs" 2>/dev/null || true

  mkdir -p "$INSTALL_DIR" "$STATE_ROOT/run" "$STATE_ROOT/logs" || error "Could not create directories"

  rm -f "$STATE_ROOT"/ptyd-*.sock "$STATE_ROOT"/ptyd-*.token 2>/dev/null || true
  [ -e "$STATE_ROOT/whisperd.json" ] && mv -f "$STATE_ROOT/whisperd.json" "$STATE_ROOT/run/" 2>/dev/null
  [ -e "$STATE_ROOT/whisperd.log" ] && mv -f "$STATE_ROOT/whisperd.log" "$STATE_ROOT/logs/" 2>/dev/null

  local entry name
  shopt -s dotglob nullglob
  for entry in "$STATE_ROOT"/*; do
    name="$(basename "$entry")"
    case "$name" in
      app|run|models|logs|shim.json) continue ;;
    esac
    mv -f "$entry" "$INSTALL_DIR/" || error "Migration failed: $entry"
  done
  shopt -u dotglob nullglob

  success "Migration done — models and logs were left in place"
}

migrate_flat_layout

log "Install directory: $INSTALL_DIR"
if [ -d "$INSTALL_DIR" ]; then
  log "  ⚠ Reinstalling deletes this directory. The DB and settings are backed up and restored automatically."
  log "    (Stop it first if it is running — backing up mid-write can produce an inconsistent copy.)"
  ask answer "Delete the existing installation and reinstall? (y/N): "
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    pkill -f "$INSTALL_DIR/scripts/ptyd.mjs" 2>/dev/null || true

    RESTORE_FROM="${INSTALL_DIR}.backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$RESTORE_FROM"
    for f in "${PRESERVE[@]}"; do
      [ -e "$INSTALL_DIR/$f" ] && cp -p "$INSTALL_DIR/$f" "$RESTORE_FROM/" 2>/dev/null
    done
    [ -d "$INSTALL_DIR/cloudflared" ] && cp -Rp "$INSTALL_DIR/cloudflared" "$RESTORE_FROM/" 2>/dev/null
    success "Data backed up: $RESTORE_FROM"
    rm -rf "$INSTALL_DIR"
  else
    log "  Keeping the existing installation"
  fi
fi

echo ""

if [ ! -d "$INSTALL_DIR" ]; then
  log "Downloading the artifact (${BRANCH})..."
  GIT_TERMINAL_PROMPT=0 git clone --depth 1 --branch "$BRANCH" "$DIST_REPO_URL" "$INSTALL_DIR" 2>&1 | grep -v "^hint:" || {
    error "Download failed — check the following:
- your internet connection
- whether the branch for this OS, '${BRANCH}', exists in the dist repository
  (it may not have been packaged/published for this OS yet)
  See the README for how to build from source instead."
  }
  success "Download complete"
fi

cd "$INSTALL_DIR" || error "Could not enter the install directory: $INSTALL_DIR"

echo ""

[ -f "server.js" ] || error "server.js is missing — this branch is not an artifact, or it is corrupted."
[ -f ".node-requirement.json" ] || warning ".node-requirement.json is missing — this may be an old artifact (the Node version check will be skipped)."

for n in caddy cloudflared; do
  [ -f "bin/$n" ] || [ -f "bin/$n.exe" ] || {
    warning "bin/$n is missing — remote access (tunnel) will not work (local use is unaffected)."
    log "  Security software may have quarantined it. Restore the file, or reinstall."
  }
done
success "Artifact verified"

echo ""

if [ -n "$RESTORE_FROM" ] && [ -d "$RESTORE_FROM" ]; then
  for f in "${PRESERVE[@]}"; do
    [ -e "$RESTORE_FROM/$f" ] && cp -p "$RESTORE_FROM/$f" "$INSTALL_DIR/" 2>/dev/null
  done
  [ -d "$RESTORE_FROM/cloudflared" ] && cp -Rp "$RESTORE_FROM/cloudflared" "$INSTALL_DIR/" 2>/dev/null
  success "Data restored (DB and settings kept)"
  log "  The backup was left in place: $RESTORE_FROM"
  echo ""
fi

if [ ! -f .env.local ]; then
  if [ "$TTY_OK" = "1" ]; then
    log "Initial configuration is required. Starting the interactive setup..."
    node scripts/setup.mjs < /dev/tty || {
      warning "Setup was skipped — run it yourself later:"
      log "    node \"$INSTALL_DIR/scripts/setup.mjs\""
    }
  else
    warning "No terminal available, so initial setup was skipped — run it from a terminal:"
    log "    node \"$INSTALL_DIR/scripts/setup.mjs\""
  fi
else
  log ".env.local found — keeping the existing configuration"
fi

echo ""

SHIM_OK=0
if command -v node >/dev/null 2>&1; then
  if SHIM_BIN_DIR="$(node "$INSTALL_DIR/scripts/cli.mjs" install-shim)"; then
    SHIM_OK=1
  else
    warning "Could not register the global command - use the full path to run it."
  fi
fi

echo ""

success "Installation complete! ✨"
log ""
if [ "$SHIM_OK" = "1" ]; then
  log "Start:"
  log "  hyperteams"
  log ""
  if ! command -v hyperteams >/dev/null 2>&1; then
    warning "Open a new terminal, or run this first:"
    log "  exec \$SHELL -l"
    log ""
  fi
  log "To start it automatically when this computer starts:"
  log "  hyperteams autostart"
  log ""
  log "To reconfigure:"
  log "  hyperteams setup"
  log ""
  log "To upgrade later:"
  log "  hyperteams upgrade"
  log ""
  log "To uninstall:"
  log "  hyperteams uninstall"
else
  log "Start:"
  log "  \"$INSTALL_DIR/scripts/start.sh\""
  log ""
  log "To reconfigure:"
  log "  node \"$INSTALL_DIR/scripts/setup.mjs\""
fi

exit 0
