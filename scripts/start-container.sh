#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

log() { printf '\033[36m[hyperteams]\033[0m %s\n' "$*"; }
warn() { printf '\033[93m⚠ %s\033[0m\n' "$*" >&2; }
die() { printf '\033[91m✗ %s\033[0m\n' "$*" >&2; exit 1; }

find_libstdcxx() {
  local node_real="" nix_first=0 d
  node_real=$(readlink -f "$(command -v node 2>/dev/null)" 2>/dev/null || true)
  case "$node_real" in /nix/store/*) nix_first=1 ;; esac

  local distro_dirs=(/usr/lib/*-linux-gnu /usr/lib64 /lib/*-linux-gnu /usr/lib)
  local nix_glob=(/nix/store/*/lib)

  local order=("${distro_dirs[@]}" "${nix_glob[@]}")
  [ "$nix_first" = "1" ] && order=("${nix_glob[@]}" "${distro_dirs[@]}")

  for d in "${order[@]}"; do
    if [ -e "$d/libstdc++.so.6" ]; then
      printf '%s\n' "$d"
      return 0
    fi
  done
  return 1
}

export PATH="/app/.npm-global/bin:$PATH"

STATE_DIR="${HYPERTEAMS_STATE_DIR:-/data}"

if mkdir -p "$STATE_DIR" 2>/dev/null && [ -w "$STATE_DIR" ]; then
  export DB_PATH="${DB_PATH:-$STATE_DIR/data.db}"
  mkdir -p "$STATE_DIR/workspaces" "$STATE_DIR/home"
  export HOME="$STATE_DIR/home"
else
  warn "'$STATE_DIR' 에 쓸 수 없습니다 — 영구 볼륨이 없는 것 같습니다."
  warn "  이대로도 뜨지만, 재배포하면 DB·작업 폴더·로그인 상태가 모두 사라집니다."
  warn "  플랫폼에서 볼륨을 '$STATE_DIR' 에 마운트하세요."
  warn "  로컬 시험 실행이면: HYPERTEAMS_STATE_DIR=\$(mktemp -d) bash scripts/start-container.sh"
fi

if [ -z "${DASHBOARD_PASSWORD_HASH:-}" ] && [ -z "${DASHBOARD_PASSWORD:-}" ]; then
  die "비밀번호가 설정되지 않았습니다.
    이 대시보드는 임의의 명령을 실행합니다 — 비밀번호 없이 컨테이너로 띄우면
    도메인을 아는 누구나 이 컨테이너의 셸을 갖게 됩니다.
    아래 둘 중 **하나**를 환경변수에 넣으세요:
      DASHBOARD_PASSWORD_HASH   'pnpm hash-password' 결과  (권장)
      DASHBOARD_PASSWORD        비밀번호 원본 그대로"
fi

if [ -z "${HYPERTEAMS_BEHIND_PROXY:-}" ]; then
  warn "HYPERTEAMS_BEHIND_PROXY 가 없습니다 — IP 허용목록이 loopback 으로 남습니다."
  warn "  앞단 프록시를 통해 들어오는 요청은 전부 403 이 됩니다. 앞단이 x-forwarded-for"
  warn "  를 덮어쓴다면(Traefik·nginx·Caddy 기본값) 이 값을 1 로 두세요."
fi

if [ -z "${DASHBOARD_PUBLIC_HOSTS:-}" ]; then
  warn "DASHBOARD_PUBLIC_HOSTS 가 없습니다 — 도메인으로 들어오는 요청이 403 이 됩니다."
  warn "  예: DASHBOARD_PUBLIC_HOSTS=hyperteams.example.com"
fi

if ! command -v claude >/dev/null 2>&1; then
  warn "PATH 에서 claude 를 찾지 못했습니다 — 작업을 시작하면 그 자리에서 실패합니다."
  warn "  이미지 빌드가 'npm install -g @anthropic-ai/claude-code' 를 건너뛴 것 같습니다."
elif [ -z "${ANTHROPIC_API_KEY:-}" ] && [ ! -d "$HOME/.claude" ]; then
  warn "ANTHROPIC_API_KEY 도, 저장된 로그인 상태($HOME/.claude)도 없습니다."
  warn "  둘 중 하나가 없으면 첫 작업이 인증 오류로 끝납니다."
fi

if [ -f .node-requirement.json ]; then
  NATIVE_CHECK_LOG="$(mktemp)"
  node -e '
const fs = require("node:fs"), path = require("node:path");
const req = JSON.parse(fs.readFileSync(".node-requirement.json", "utf8"));
if (req.platform !== process.platform || req.arch !== process.arch) {
  console.error(`PLATFORM ${req.platform}-${req.arch} ${process.platform}-${process.arch}`);
  process.exit(3);
}
const have = String(process.versions.modules);
const abis = Array.isArray(req.sqliteAbis) ? req.sqliteAbis : [];
if (abis.length && !abis.some((a) => String(a.abi) === have)) {
  console.error(`ABI ${abis.map((a) => a.major).join(",")} ${process.version}`);
  process.exit(4);
}
const src = path.join("bin", "native", "better-sqlite3", have, "better_sqlite3.node");
if (!fs.existsSync(src)) process.exit(0);
const targets = [path.join("node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node")];
const ext = path.join(".next-release", "node_modules");
if (fs.existsSync(ext)) {
  for (const n of fs.readdirSync(ext)) {
    if (!/^better-sqlite3($|-)/.test(n)) continue;
    const p = path.join(ext, n, "build", "Release", "better_sqlite3.node");
    if (fs.existsSync(p)) targets.push(p);
  }
}
for (const t of targets) { try { fs.copyFileSync(src, t); } catch {} }
for (const t of targets) {
  try {
    process.dlopen({ exports: {} }, path.resolve(t));
  } catch (e) {
    console.error(`DLOPEN ${String(e.message).split("\n")[0]}`);
    process.exit(5);
  }
}
' 2>"$NATIVE_CHECK_LOG" || {
    reason=$(cat "$NATIVE_CHECK_LOG" 2>/dev/null || true)
    case "$reason" in
      PLATFORM\ *)
        set -- $reason
        die "이 배포본은 **$2 용**입니다. 지금 컨테이너는 $3 입니다.
    배포본에는 패키징한 그 OS·아키텍처의 네이티브 바이너리가 그대로 들어 있어서,
    다른 플랫폼에서는 부팅 직후 better-sqlite3 로드에 실패합니다.
    리눅스 컨테이너용 아티팩트는 **리눅스에서** 패키징해야 합니다 (Docker 또는 CI)."
        ;;
      ABI\ *)
        set -- $reason
        die "이 배포본이 지원하지 않는 Node 입니다.
    지원 메이저: $2 · 현재: $3
    이미지의 Node 버전을 바꾸거나(생성된 Dockerfile·nixpacks.toml 은 패키징 버전에
    맞춰져 있습니다), 이 Node 를 대상으로 다시 패키징하세요."
        ;;
      DLOPEN\ *)
        if [ -z "${HYPERTEAMS_LDPATH_RETRY:-}" ] && libdir=$(find_libstdcxx); then
          warn "네이티브 모듈이 열리지 않았습니다 — LD_LIBRARY_PATH=$libdir 로 한 번 다시 시도합니다."
          export LD_LIBRARY_PATH="$libdir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
          export HYPERTEAMS_LDPATH_RETRY=1
          rm -f "$NATIVE_CHECK_LOG"
          exec bash "$0" "$@"
        fi
        die "네이티브 모듈을 열 수 없습니다 — 의존 라이브러리를 찾지 못했습니다.
    ${reason#DLOPEN }
    파일은 그 자리에 있고 형식도 이 플랫폼용입니다(위 검사를 통과했습니다).
    Nixpacks 로 배포본을 띄운 경우가 대부분입니다 — nix 로 설치된 Node 는 배포판의
    libstdc++ 을 찾지 못합니다. 빌드팩을 **Dockerfile** 로 바꾸세요(배포본에 함께
    들어 있습니다). 그쪽은 평범한 데비안 이미지라 그대로 로드됩니다."
        ;;
      *)
        warn "네이티브 모듈 점검을 마치지 못했습니다 — 그대로 진행합니다."
        [ -n "$reason" ] && warn "  $reason"
        ;;
    esac
  }
  rm -f "$NATIVE_CHECK_LOG"
fi

PORT="${PORT:-3000}"

BIND_HOST="${HYPERTEAMS_BIND_HOST:-0.0.0.0}"

if [ -f server.js ]; then
  export PORT
  export HOSTNAME="$BIND_HOST"
  log "Starting HyperTeams (packaged) on ${BIND_HOST}:${PORT} (db: ${DB_PATH:-./data.db})"
  exec node server.js
fi

if [ ! -d node_modules/next ]; then
  die "빌드된 앱을 찾지 못했습니다 (server.js 도 node_modules/next 도 없음).
    소스에서 실행하려면 먼저 'pnpm install && pnpm build' 가 끝나야 합니다.
    배포본이라면 아티팩트가 불완전한 것입니다 — server.js 가 루트에 있어야 합니다."
fi

log "Starting HyperTeams (source) on ${BIND_HOST}:${PORT} (db: ${DB_PATH:-./data.db})"
exec node node_modules/next/dist/bin/next start -H "$BIND_HOST" -p "$PORT"
