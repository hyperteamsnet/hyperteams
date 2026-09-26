/**
 * 게스트 에이전트 — microVM **안**에서 도는 작은 프로세스.
 *
 * 호스트는 vsock 으로 붙어 이 에이전트에게만 말을 겁니다. 하는 일:
 *
 *   ping                    살아 있음 확인
 *   exec   {cmd,args,cwd,env}  프로세스를 띄우고 **곧바로** 답합니다. 그 뒤로
 *                           stdout/stderr/exit 가 `of: <요청 id>` 를 단 이벤트로 흐릅니다.
 *                           Claude Code CLI 가 이것으로 돕니다 — SDK 가 stdin/stdout 으로
 *                           말하므로 끝날 때까지 모았다 돌려주는 방식으로는 못 돕니다.
 *   stdin  {of,data}        그 프로세스의 stdin 에 씁니다(base64)
 *   stdin-end {of}          stdin 을 닫습니다
 *   signal {of,signal}      신호를 보냅니다
 *   run    {cmd,args,cwd,env}  끝날 때까지 기다려 {exit,stdout,stderr} 를 한 번에(git 등)
 *   put-file {path,data,mode?} / get-file {path}
 *
 * **이 에이전트는 벽이 아닙니다.** VM 안의 신뢰 못 할 코드가 이것과 같은 커널을 씁니다.
 * 벽은 microVM 경계이고, 에이전트는 호스트가 게스트 파일시스템을 마운트하지 않고도
 * (Firecracker 는 공유 폴더가 없습니다) 파일을 넣고 빼는 유일한 창구일 뿐입니다.
 *
 * 자식의 환경은 **에이전트 자신의 환경을 물려받지 않습니다.** 호스트가 준 것과 PATH 만
 * 갑니다 — 이미지에 무엇이 들어 있든 자식 env 로 새는 경로를 하나 줄입니다.
 *
 * 전송은 주입합니다. VM 안에서는 vsock-init.mjs 가 (socat 이 vsock 을 넘겨 준) 유닉스
 * 소켓으로, 시험에서는 그냥 유닉스 소켓으로 — 같은 코드가 양쪽에서 돕니다.
 */
import { spawn } from "node:child_process";
import { chmod, chown, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { FrameChannel } from "./framing.mjs";

const DEFAULT_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";

/**
 * @param opts.runAs VM 안에서 에이전트는 root 로 돌지만(디스크를 붙여야 합니다) 자식은
 *   일반 사용자로 띄웁니다. 시험(호스트에서 도는 가짜 게스트)에서는 비웁니다.
 */
export function serveGuest(stream, { rootDir = "/workspace", basePath = DEFAULT_PATH, runAs = null } = {}) {
  const ch = new FrameChannel(stream);
  /** exec 로 띄운, 아직 살아 있는 자식들 — 요청 id → child */
  const live = new Map();

  const childEnv = (env) => ({ PATH: basePath, ...(env ?? {}) });
  const ids = runAs ? { uid: runAs.uid, gid: runAs.gid } : {};

  ch.on("close", () => {
    // 호스트가 떠났으면 남은 자식을 거둡니다. 고아가 VM 안에서 계속 돌 이유가 없습니다.
    for (const child of live.values()) {
      try {
        child.kill("SIGKILL");
      } catch {
        /* 이미 죽었을 수 있습니다 */
      }
    }
    live.clear();
  });

  ch.on("request", async (m, reply) => {
    try {
      if (m.op === "ping") return reply({ ok: true, pong: true });

      if (m.op === "exec") {
        let child;
        try {
          child = spawn(m.cmd, m.args ?? [], {
            cwd: m.cwd ?? rootDir,
            env: childEnv(m.env),
            stdio: ["pipe", "pipe", "pipe"],
            ...ids,
          });
        } catch (e) {
          return reply({ ok: false, error: String(e?.message ?? e) });
        }
        const id = m.id;
        live.set(id, child);
        let replied = false;
        child.once("spawn", () => {
          replied = true;
          reply({ ok: true, started: true, pid: child.pid });
        });
        child.on("error", (e) => {
          if (!replied) {
            replied = true;
            live.delete(id);
            reply({ ok: false, error: String(e?.message ?? e) });
          }
        });
        child.stdin.on("error", () => {
          /* 자식이 먼저 닫으면 EPIPE — 호스트가 곧 exit 을 봅니다 */
        });
        child.stdout.on("data", (d) => ch.send({ event: "stdout", of: id, data: d.toString("base64") }));
        child.stderr.on("data", (d) => ch.send({ event: "stderr", of: id, data: d.toString("base64") }));
        child.on("close", (code, signal) => {
          live.delete(id);
          if (replied) ch.send({ event: "exit", of: id, code, signal });
        });
        return;
      }

      if (m.op === "stdin") {
        const child = live.get(m.of);
        if (!child) return reply({ ok: false, error: "no such process" });
        child.stdin.write(Buffer.from(m.data, "base64"));
        return reply({ ok: true });
      }

      if (m.op === "stdin-end") {
        live.get(m.of)?.stdin.end();
        return reply({ ok: true });
      }

      if (m.op === "signal") {
        const child = live.get(m.of);
        if (!child) return reply({ ok: false, error: "no such process" });
        return reply({ ok: child.kill(m.signal ?? "SIGTERM") });
      }

      if (m.op === "run") {
        const child = spawn(m.cmd, m.args ?? [], {
          cwd: m.cwd ?? rootDir,
          env: childEnv(m.env),
          stdio: ["ignore", "pipe", "pipe"],
          ...ids,
        });
        let out = "";
        let err = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (err += d));
        child.on("error", (e) => reply({ ok: false, error: String(e?.message ?? e) }));
        child.on("close", (code) => reply({ ok: true, exit: code, stdout: out, stderr: err }));
        return;
      }

      if (m.op === "put-file") {
        const buf = Buffer.from(m.data, "base64");
        await mkdir(dirname(m.path), { recursive: true });
        await writeFile(m.path, buf);
        if (typeof m.mode === "number") await chmod(m.path, m.mode);
        if (runAs) await chown(m.path, runAs.uid, runAs.gid);
        return reply({ ok: true, bytes: buf.length });
      }

      if (m.op === "get-file") {
        const buf = await readFile(m.path);
        return reply({ ok: true, data: buf.toString("base64"), bytes: buf.length });
      }

      reply({ ok: false, error: `unknown op: ${m.op}` });
    } catch (e) {
      reply({ ok: false, error: String(e?.message ?? e) });
    }
  });
  return ch;
}
