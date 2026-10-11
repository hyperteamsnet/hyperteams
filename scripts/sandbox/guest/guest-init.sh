#!/bin/sh
# microVM 의 PID 1 — 커널 부트 인자 `init=/sbin/guest-init` 가 가리킵니다.
#
# 할 일은 셋뿐입니다: 가상 파일시스템을 올리고, 업무 디스크(/dev/vdb, 호스트가 붙인
# 두 번째 드라이브)를 /workspace 에 붙이고, 루프백을 켠 뒤 게스트 에이전트로 넘깁니다.
# 루트(/dev/vda)는 읽기 전용으로 붙어 있으므로 쓰기가 필요한 곳은 tmpfs 입니다.
set -eu
mount -t proc proc /proc
mount -t sysfs sys /sys
mount -t devtmpfs dev /dev 2>/dev/null || true
mount -t tmpfs tmp /tmp
mount -t tmpfs run /run
mkdir -p /workspace
mount /dev/vdb /workspace
mkdir -p /workspace/home /workspace/repo
chown -R 1000:1000 /workspace
ip link set lo up 2>/dev/null || ifconfig lo 127.0.0.1 up
export HOME=/workspace/home
exec /usr/local/bin/node /opt/guest/vsock-init.mjs
