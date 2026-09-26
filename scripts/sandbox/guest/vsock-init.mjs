/**
 * microVM 안의 init 다음 단계 — `guest-init.sh` 가 파일시스템을 세운 뒤 이것을 exec 합니다.
 *
 * node 는 AF_VSOCK 을 직접 열지 못해서 socat 두 개로 다리를 놓습니다:
 *
 *   호스트 → 게스트  VSOCK-LISTEN:1024  →  /run/agent.sock  (이 파일의 게스트 에이전트)
 *   게스트 → 호스트  127.0.0.1:8787     →  VSOCK-CONNECT:2:1025  (호스트의 세션 브로커)
 *
 * 두 번째 다리가 VM 의 **유일한 바깥 출구**입니다. VM 에는 NIC 가 없어서(Firecracker 에
 * network-interface 를 붙이지 않습니다) 모델 요청은 이 한 줄로만 나가고, 그 끝에서 호스트의
 * 브로커가 업무 한정 토큰을 확인해 진짜 자격으로 바꿔 끼웁니다(lib/sandbox/broker.ts).
 * CID 2 는 vsock 에서 언제나 호스트입니다.
 */
import net from "node:net";
import { spawn } from "node:child_process";
import { unlinkSync } from "node:fs";
import { serveGuest } from "./guest-agent.mjs";

const AGENT_PORT = 1024;
const BROKER_VSOCK_PORT = 1025;
const BROKER_LOCAL_PORT = 8787;
const UDS = "/run/agent.sock";
const AGENT_UID = Number(process.env.GUEST_UID ?? 1000);

function bridge(args) {
  const p = spawn("socat", args, { stdio: "inherit" });
  p.on("error", () => {
    console.error("socat 이 없습니다 — rootfs 에 socat 을 넣으세요");
    process.exit(1);
  });
  p.on("exit", (code) => {
    console.error(`socat ${args[0]} 이 끝났습니다 (${code}) — VM 을 내립니다`);
    process.exit(1);
  });
}

try {
  unlinkSync(UDS);
} catch {
  /* 처음 부팅 */
}
const server = net.createServer((sock) =>
  serveGuest(sock, { rootDir: "/workspace", runAs: { uid: AGENT_UID, gid: AGENT_UID } }),
);
server.listen(UDS, () => {
  bridge([`VSOCK-LISTEN:${AGENT_PORT},reuseaddr,fork`, `UNIX-CONNECT:${UDS}`]);
  bridge([
    `TCP-LISTEN:${BROKER_LOCAL_PORT},bind=127.0.0.1,reuseaddr,fork`,
    `VSOCK-CONNECT:2:${BROKER_VSOCK_PORT}`,
  ]);
  console.log(`guest-agent: vsock ${AGENT_PORT} · broker 127.0.0.1:${BROKER_LOCAL_PORT}`);
});
