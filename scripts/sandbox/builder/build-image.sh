#!/bin/sh
# 루트 이미지를 굽는 VM 의 init — lib/sandbox/image-builder.ts 가 alpine 최소 루트(virtio-fs)
# 위에서 이것을 PID 1 로 띄웁니다. docker 가 하던 일을 VM 안에서 합니다.
#
#   /dev/vda  빈 파일 → 업무 VM 의 루트 이미지(ext4)가 됩니다
#   /dev/vdb  빈 파일 → 업무 디스크 원판(빈 ext4)이 됩니다
#   /input    호스트가 넣어 둔 것: layers/NNN.tar.gz(OCI 레이어, 순서대로), guest/(게스트 파일 —
#             브라우저 도구 다리 포함), build.env(CLI 판·Playwright 판·DNS). 결과는 /input/result 에
#             한 줄로 남깁니다(ok | fail <단계>).
#
# 네트워크는 libkrun 의 TSI 입니다 — 이 VM 에만 켭니다(업무 VM 에는 없습니다). apt·npm·설치
# 스크립트가 여기서 돌고, 그 결과만 ext4 로 남습니다. 자격증명은 어디에도 들어가지 않습니다.
set -eu
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
step=boot

finish() {
  code=$?
  if [ "$code" -eq 0 ] && [ "$step" = "done" ]; then
    echo ok > /input/result
    echo "BUILD-OK"
  else
    echo "fail $step" > /input/result
    echo "BUILD-FAIL $step (exit $code)"
  fi
  sync
  umount -R /mnt/r 2>/dev/null || true
  sync
  poweroff -f
}
trap finish EXIT

mount -t proc proc /proc
mount -t sysfs sys /sys
mount -t devtmpfs dev /dev 2>/dev/null || true
mount -t tmpfs tmp /tmp
. /input/build.env
echo "nameserver ${DNS:-1.1.1.1}" > /etc/resolv.conf
ip link set lo up 2>/dev/null || ifconfig lo 127.0.0.1 up 2>/dev/null || true

step=tools
echo "== [1/6] 도구 (e2fsprogs, GNU tar)"
apk add --no-cache e2fsprogs tar >/dev/null

step=mkfs
echo "== [2/6] ext4 만들기"
mkfs.ext4 -q -F -L rootfs /dev/vda
mkfs.ext4 -q -F -L work /dev/vdb
mkdir -p /mnt/r
mount /dev/vda /mnt/r

step=layers
echo "== [3/6] 이미지 레이어 풀기"
# OCI 화이트아웃: `.wh..wh..opq` 는 그 폴더의 아래 레이어 내용을 비우고, `.wh.<이름>` 은 그
# 이름을 지웁니다. 이 레이어의 파일을 풀기 **전에** 적용해야 같은 레이어의 새 파일이 살아남습니다.
for layer in /input/layers/*.tar.gz; do
  tar -tzf "$layer" | grep -E '(^|/)\.wh\.' | while IFS= read -r wh; do
    dir=$(dirname "$wh")
    base=$(basename "$wh")
    if [ "$base" = ".wh..wh..opq" ]; then
      [ -d "/mnt/r/$dir" ] && find "/mnt/r/$dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    else
      rm -rf "/mnt/r/$dir/${base#.wh.}"
    fi
  done || true
  tar -xzf "$layer" -C /mnt/r --numeric-owner --exclude='.wh.*'
done

step=guest
echo "== [4/6] 게스트 에이전트"
mkdir -p /mnt/r/opt/guest /mnt/r/workspace
cp /input/guest/framing.mjs /input/guest/guest-agent.mjs /input/guest/vsock-init.mjs /mnt/r/opt/guest/
# 브라우저 도구 다리(agy 가 stdio MCP 로 띄움)와 그 옆의 도구 목록 — lib/engines/agy/browser.ts
cp /input/guest/hyperteams-browser-agent.mjs /input/guest/hyperteams-browser-tools.json \
   /input/guest/hyperteams-team-tools.json /mnt/r/opt/guest/
cp /input/guest/guest-init.sh /mnt/r/sbin/guest-init
chmod 0755 /mnt/r/sbin/guest-init

step=packages
echo "== [5/6] 패키지와 CLI (apt · npm · Antigravity · Chromium)"
cp /etc/resolv.conf /mnt/r/etc/resolv.conf
mount -t proc proc /mnt/r/proc
mount -t sysfs sys /mnt/r/sys
mount --bind /dev /mnt/r/dev
mount -t tmpfs tmp /mnt/r/tmp
chroot /mnt/r /usr/bin/env -i \
  HOME=/root PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  DEBIAN_FRONTEND=noninteractive LANG=C.UTF-8 \
  CLAUDE_PKG="$CLAUDE_PKG" CODEX_PKG="$CODEX_PKG" PLAYWRIGHT_VERSION="$PLAYWRIGHT_VERSION" \
  /bin/sh -eu -c '
    apt-get update -qq
    apt-get install -y -qq --no-install-recommends git socat ca-certificates curl iproute2 procps ripgrep \
      fonts-noto-cjk >/dev/null
    # VM 안 브라우저 — 호스트의 playwright-core 와 **같은 판**의 Chromium(CDP 가 어긋나지 않게).
    # 호스트가 connectOverCDP 로 붙으므로 헤드리스 셸은 쓰지 않습니다(lib/sandbox/vm-browser.ts).
    PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright npx -y "playwright@$PLAYWRIGHT_VERSION" install --with-deps chromium >/dev/null
    rm -rf /opt/ms-playwright/chromium_headless_shell-*
    chrome=$(find /opt/ms-playwright -maxdepth 4 -type f -name chrome -perm -u+x | head -1)
    test -n "$chrome"
    ln -sf "$chrome" /usr/local/bin/hyperteams-chromium
    chmod -R a+rX /opt/ms-playwright
    rm -rf /var/lib/apt/lists/*
    npm install -g --no-fund --no-audit "$CLAUDE_PKG" "$CODEX_PKG" >/dev/null
    npm cache clean --force >/dev/null 2>&1
    # Antigravity CLI — 단일 바이너리. 설치 스크립트가 ~/.local/bin 에 두므로 PATH 로 옮깁니다.
    # --compressed: 그 서버가 이 curl(Debian 7.88, HTTP/2)에게는 묻지 않은 gzip 본문을 보낸다 —
    # 풀지 않으면 bash 가 압축 바이트를 읽다 죽는다(실측 2026-10-08, image-builder.test.ts).
    curl -fsSL --compressed https://antigravity.google/cli/install.sh | bash >/dev/null
    install -m 0755 /root/.local/bin/agy /usr/local/bin/agy
    rm -rf /root/.local /root/.npm /root/.cache
    id -u 1000 >/dev/null 2>&1 || useradd -u 1000 -m agent
    printf "127.0.0.1\tlocalhost\n::1\tlocalhost\n" > /etc/hosts
    echo hyperteams-vm > /etc/hostname
    : > /etc/resolv.conf
    claude --version && codex --version && agy --version && hyperteams-chromium --version
  '

step=seal
echo "== [6/6] 마무리"
umount /mnt/r/tmp /mnt/r/dev /mnt/r/sys /mnt/r/proc
sync
umount /mnt/r
step=done
