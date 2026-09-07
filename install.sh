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

AUTO_DEPS="${HYPERTEAMS_AUTO_DEPS:-ask}"
RUNTIME_DIR="$STATE_ROOT/runtime"
MANAGED_NODE_DIR="$RUNTIME_DIR/node"
NODE_FALLBACK_MAJOR="${HYPERTEAMS_NODE_MAJOR:-22}"

case "$(uname -s)" in
  Darwin) OS_KIND="darwin" ;;
  Linux)  OS_KIND="linux" ;;
  *)      OS_KIND="win32" ;;
esac
case "$(uname -m)" in
  arm64|aarch64) ARCH_KIND="arm64" ;;
  *)             ARCH_KIND="x64" ;;
esac

SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then SUDO="sudo"; fi

may_install() {
  local what="$1" needs_sudo="${2:-0}" ans=""
  [ "$AUTO_DEPS" = "0" ] && return 1
  [ "$AUTO_DEPS" = "1" ] && return 0
  [ "$(id -u)" = "0" ] && needs_sudo=0
  if [ "$TTY_OK" != "1" ]; then
    [ "$needs_sudo" = "1" ] && return 1
    return 0
  fi
  ask ans "Install ${what}? [Y/n]"
  case "$ans" in [Nn]*) return 1 ;; *) return 0 ;; esac
}

prepend_path() {
  case ":$PATH:" in *":$1:"*) ;; *) PATH="$1:$PATH" ;; esac
  export PATH
  hash -r 2>/dev/null || true
}

pm_install() {
  case "$OS_KIND" in linux) ;; *) return 1 ;; esac
  if [ "$(id -u)" != "0" ] && [ -z "$SUDO" ]; then
    warning "Administrator rights are needed to install: $* — but 'sudo' is not available here."
    return 1
  fi
  log "Installing with this system's package manager: $*"
  if   command -v apt-get >/dev/null 2>&1; then $SUDO apt-get update -qq && $SUDO apt-get install -y "$@"
  elif command -v dnf     >/dev/null 2>&1; then $SUDO dnf install -y "$@"
  elif command -v yum     >/dev/null 2>&1; then $SUDO yum install -y "$@"
  elif command -v zypper  >/dev/null 2>&1; then $SUDO zypper --non-interactive install "$@"
  elif command -v pacman  >/dev/null 2>&1; then $SUDO pacman -Sy --noconfirm "$@"
  elif command -v apk     >/dev/null 2>&1; then $SUDO apk add --no-cache "$@"
  else
    warning "No known package manager was found on this system."
    return 1
  fi
  hash -r 2>/dev/null || true
}

DL=""
detect_downloader() {
  if   command -v curl >/dev/null 2>&1; then DL="curl"
  elif command -v wget >/dev/null 2>&1; then DL="wget"
  else DL=""
  fi
  [ -n "$DL" ]
}

ensure_downloader() {
  detect_downloader && return 0
  warning "Neither curl nor wget is installed — one of them is what downloads Node and Claude Code."
  if may_install "curl" 1 && pm_install curl ca-certificates && detect_downloader; then
    success "curl installed"
    return 0
  fi
  warning "Install one of them and run this installer again:  apt-get install curl  /  dnf install curl"
  return 1
}

fetch_text() {
  case "$DL" in
    curl) curl -fsSL --max-time "${2:-60}" "$1" ;;
    wget) wget -qO- --timeout="${2:-60}" "$1" ;;
    *) return 1 ;;
  esac
}

fetch_file() {
  local quiet=0
  [ -t 2 ] || quiet=1
  case "$DL" in
    curl)
      if [ "$quiet" = "1" ]; then curl -fsL --max-time 900 -o "$2" "$1"
      else curl -fL --progress-bar --max-time 900 -o "$2" "$1"; fi ;;
    wget)
      if [ "$quiet" = "1" ]; then wget -q --timeout=900 -O "$2" "$1"
      else wget -q --show-progress --timeout=900 -O "$2" "$1"; fi ;;
    *) return 1 ;;
  esac
}

have_git() {
  if [ "$OS_KIND" = "darwin" ] && [ "$(command -v git 2>/dev/null)" = "/usr/bin/git" ]; then
    xcode-select -p >/dev/null 2>&1 || return 1
  fi
  git --version >/dev/null 2>&1
}

install_git() {
  case "$OS_KIND" in
    darwin)
      if command -v brew >/dev/null 2>&1; then
        log "Installing git with Homebrew..."
        brew install git && have_git && return 0
        return 1
      fi
      log "Requesting the Xcode Command Line Tools — click [Install] in the dialog that appears."
      xcode-select --install >/dev/null 2>&1 || true
      local waited=0
      while [ "$waited" -lt 1800 ]; do
        have_git && return 0
        sleep 5
        waited=$((waited + 5))
        [ $((waited % 120)) -eq 0 ] && log "  still waiting for the Command Line Tools... (${waited}s)"
      done
      warning "Timed out waiting for the Command Line Tools."
      return 1
      ;;
    linux)
      pm_install git && have_git
      ;;
    *) return 1 ;;
  esac
}

if have_git; then
  :
else
  warning "git not found — it is what downloads the artifact."
  if may_install "git" 1 && install_git; then
    success "git installed ($(git --version 2>/dev/null))"
  else
    error "git is required (it is used to download the artifact).
  macOS:  xcode-select --install     (or: brew install git)
  Debian/Ubuntu:  sudo apt-get install git
  Fedora/RHEL:    sudo dnf install git
  Then run this installer again."
  fi
fi

node_ok() { node -e '' >/dev/null 2>&1; }
node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null; }

use_managed_node() {
  [ -x "$MANAGED_NODE_DIR/bin/node" ] || return 1
  prepend_path "$MANAGED_NODE_DIR/bin"
  node_ok
}

install_managed_node() {
  local want="$1" ver slug url tmp expect actual sha_cmd=""
  case "$OS_KIND" in darwin|linux) ;; *)
    NODE_PLATFORM_UNSUPPORTED=1
    warning "On Windows, use install.ps1 — it installs Node (and git, and Claude Code) for you:"
    log "  iex (irm https://raw.githubusercontent.com/hyperteamsnet/hyperteams/main/install.ps1)"
    return 1 ;;
  esac
  ensure_downloader || return 1
  if [ "$OS_KIND" = "linux" ] && { [ -f /etc/alpine-release ] || ldd --version 2>&1 | grep -qi musl; }; then
    NODE_PLATFORM_UNSUPPORTED=1
    warning "This looks like a musl system (Alpine). The prebuilt artifact is glibc-only, so it"
    warning "cannot run here even with Node installed — its native modules are built against glibc."
    log "  Use a glibc distribution (Debian/Ubuntu/Fedora/Arch...), or build from source:"
    log "    git clone https://github.com/hyperteamsnet/hyperteams && cd hyperteams"
    log "    pnpm install && pnpm setup && pnpm start"
    return 1
  fi

  log "Looking up the newest Node ${want}.x ..."
  ver="$(fetch_text https://nodejs.org/dist/index.json 30 2>/dev/null \
         | tr ',' '\n' | grep -o "\"v${want}\.[0-9][0-9]*\.[0-9][0-9]*\"" | head -1 | tr -d '"')"
  if [ -z "$ver" ]; then
    warning "Could not reach nodejs.org to find a Node ${want} release."
    return 1
  fi

  slug="node-${ver}-${OS_KIND}-${ARCH_KIND}"
  url="https://nodejs.org/dist/${ver}/${slug}.tar.gz"
  tmp="$(mktemp -d "${TMPDIR:-/tmp}/hyperteams-node.XXXXXX")" || return 1

  log "Downloading Node ${ver} (${OS_KIND}-${ARCH_KIND})..."
  fetch_file "$url" "$tmp/node.tar.gz" || {
    rm -rf "$tmp"; warning "Download failed: $url"; return 1
  }

  command -v sha256sum >/dev/null 2>&1 && sha_cmd="sha256sum"
  if [ -z "$sha_cmd" ] && command -v shasum >/dev/null 2>&1; then sha_cmd="shasum -a 256"; fi
  if [ -n "$sha_cmd" ]; then
    expect="$(fetch_text "https://nodejs.org/dist/${ver}/SHASUMS256.txt" 60 2>/dev/null \
              | grep " ${slug}\.tar\.gz\$" | awk '{print $1}')"
    if [ -n "$expect" ]; then
      actual="$($sha_cmd "$tmp/node.tar.gz" | awk '{print $1}')"
      if [ "$expect" != "$actual" ]; then
        rm -rf "$tmp"
        warning "The downloaded Node archive did not match its published checksum — not installing it."
        return 1
      fi
      log "  checksum OK"
    fi
  fi

  tar -xzf "$tmp/node.tar.gz" -C "$tmp" || { rm -rf "$tmp"; warning "Could not unpack the Node archive."; return 1; }
  mkdir -p "$RUNTIME_DIR" || { rm -rf "$tmp"; return 1; }
  rm -rf "$MANAGED_NODE_DIR.old"
  [ -d "$MANAGED_NODE_DIR" ] && mv "$MANAGED_NODE_DIR" "$MANAGED_NODE_DIR.old"
  if ! mv "$tmp/$slug" "$MANAGED_NODE_DIR"; then
    [ -d "$MANAGED_NODE_DIR.old" ] && mv "$MANAGED_NODE_DIR.old" "$MANAGED_NODE_DIR"
    rm -rf "$tmp"
    warning "Could not move Node into place: $MANAGED_NODE_DIR"
    return 1
  fi
  rm -rf "$tmp" "$MANAGED_NODE_DIR.old"
  use_managed_node || { warning "Node was unpacked but does not run: $MANAGED_NODE_DIR/bin/node"; return 1; }
  return 0
}

node_ok || use_managed_node >/dev/null 2>&1
if node_ok; then
  success "Required tools OK (git, node $(node --version 2>/dev/null))"
else
  warning "Node.js not found — it is what runs the app."
  if may_install "Node ${NODE_FALLBACK_MAJOR} into ${MANAGED_NODE_DIR} (user-local; no administrator rights, your system is untouched)" 0 \
     && install_managed_node "$NODE_FALLBACK_MAJOR"; then
    success "Node $(node --version) installed in $MANAGED_NODE_DIR"
  elif [ "${NODE_PLATFORM_UNSUPPORTED:-0}" = "1" ]; then
    error "Cannot continue on this platform (see the note above)."
  else
    error "Node.js is required (it runs the app — unlike before, it is no longer bundled in the artifact).
  Install: https://nodejs.org/  (or nvm/fnm). Then verify with 'node --version'.
  The major version the artifact needs is checked at boot, and reported there if it does not match."
  fi
fi

CLAUDE_JUST_INSTALLED=0

install_claude() {
  case "$OS_KIND" in darwin|linux) ;; *)
    warning "On Windows, use install.ps1 — it installs Claude Code for you."
    return 1 ;;
  esac
  if ! command -v curl >/dev/null 2>&1; then
    if ! (may_install "curl (Claude Code's installer requires it)" 1 && pm_install curl ca-certificates); then
      warning "Claude Code's installer requires curl."
      return 1
    fi
  fi
  log "Installing Claude Code..."
  curl -fsSL https://claude.ai/install.sh | bash || return 1
  prepend_path "$HOME/.local/bin"
  claude --version >/dev/null 2>&1
}

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
  if may_install "Claude Code (user-local, into ~/.local/bin)" 0 && install_claude; then
    success "Claude Code installed ($(claude --version 2>/dev/null | head -1))"
    CLAUDE_JUST_INSTALLED=1
  else
    log "  Install: curl -fsSL https://claude.ai/install.sh | bash"
    log "  Sign in: run 'claude' once in a terminal and log in (subscription or API key)."
    log "  Verify:  once 'claude --version' works you are ready (auth reuses that login)."
  fi
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

if [ -f ".node-requirement.json" ]; then
  SUPPORTED_MAJORS="$(grep -o '"major"[[:space:]]*:[[:space:]]*[0-9][0-9]*' .node-requirement.json \
                      | grep -o '[0-9][0-9]*$' | sort -n | uniq)"
  HAVE_MAJOR="$(node_major)"
  if [ -n "$SUPPORTED_MAJORS" ] && ! printf '%s\n' "$SUPPORTED_MAJORS" | grep -qx "${HAVE_MAJOR:-none}"; then
    WANT_MAJOR="$(printf '%s\n' "$SUPPORTED_MAJORS" | tail -1)"
    warning "This artifact does not support Node ${HAVE_MAJOR:-?} (supported: $(printf '%s' "$SUPPORTED_MAJORS" | tr '\n' ',' | sed 's/,$//'))."
    if may_install "Node ${WANT_MAJOR} into ${MANAGED_NODE_DIR} (used by HyperTeams only — your system Node stays as it is)" 0 \
       && install_managed_node "$WANT_MAJOR"; then
      success "HyperTeams will run on Node $(node --version)"
    else
      warning "The app will refuse to boot until a supported Node is available."
      log "  Install one of: Node $(printf '%s' "$SUPPORTED_MAJORS" | tr '\n' ',' | sed 's/,$//')  —  https://nodejs.org/"
    fi
  fi
fi

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

if [ "${CLAUDE_JUST_INSTALLED:-0}" = "1" ]; then
  log ""
  warning "One step left: sign in to Claude Code."
  log "  Run 'claude' once in a terminal and log in (subscription or API key)."
  log "  Until then the dashboard opens, but tasks will not run."
fi

exit 0
