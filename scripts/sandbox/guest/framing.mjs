/**
 * 게스트 쪽 프레이밍 — `lib/sandbox/framing.ts` 와 **같은 선**을 말합니다.
 *
 * VM 안에서는 맨 node 로 돌아서 TS 를 import 할 수 없어 사본을 둡니다. 형식은
 * 4바이트 길이(BE) + UTF-8 JSON 하나뿐이고, 두 사본이 같은지는
 * `lib/sandbox/firecracker.test.ts` 가 이 파일을 쓰는 진짜 게스트를 붙여 확인합니다.
 */
import { EventEmitter } from "node:events";

const MAX_FRAME_BYTES = 256 * 1024 * 1024;

export function encodeFrame(obj) {
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(body.length, 0);
  return Buffer.concat([len, body]);
}

export class FrameChannel extends EventEmitter {
  constructor(stream) {
    super();
    this.stream = stream;
    this.buf = Buffer.alloc(0);
    stream.on("data", (chunk) => this._push(chunk));
    stream.on("close", () => this.emit("close"));
    stream.on("error", (e) => this.emit("error", e));
  }
  _push(chunk) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    for (;;) {
      if (this.buf.length < 4) return;
      const len = this.buf.readUInt32BE(0);
      if (len > MAX_FRAME_BYTES) {
        this.emit("error", new Error("frame too large"));
        this.stream.destroy();
        return;
      }
      if (this.buf.length < 4 + len) return;
      const body = this.buf.subarray(4, 4 + len);
      this.buf = this.buf.subarray(4 + len);
      let msg;
      try {
        msg = JSON.parse(body.toString("utf8"));
      } catch (e) {
        this.emit("error", e);
        return;
      }
      this.emit("request", msg, (resp) => this.send({ ...resp, reply: msg.id }));
    }
  }
  send(obj) {
    if (!this.stream.destroyed) this.stream.write(encodeFrame(obj));
  }
}
