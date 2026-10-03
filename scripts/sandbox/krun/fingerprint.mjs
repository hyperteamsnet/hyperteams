/**
 * 런처 소스의 지문 — 설치된(또는 릴리스에 미리 빌드해 넣은) 런처가 **지금 소스**로 빌드된
 * 것인지 가립니다. 설치기(lib/sandbox/installer.ts)와 패키징(scripts/package-release.mjs)이
 * 같은 값을 내야 해서 한 곳에 둡니다 — 패키징 스크립트는 TS 를 import 하지 못합니다.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const LAUNCHER_SOURCES = ["Cargo.toml", "Cargo.lock", "src/main.rs", "entitlements.plist"];

/** @param {Array<[string, Buffer]>} files */
function digest(files) {
  const h = createHash("sha256");
  for (const [name, body] of files) {
    h.update(name);
    h.update(body);
  }
  return h.digest("hex").slice(0, 16);
}

/** @param {string} krunDir scripts/sandbox/krun */
export async function launcherFingerprint(krunDir) {
  const files = [];
  for (const f of LAUNCHER_SOURCES) files.push([f, await readFile(path.join(krunDir, f))]);
  return digest(files);
}

/** @param {string} krunDir */
export function launcherFingerprintSync(krunDir) {
  return digest(LAUNCHER_SOURCES.map((f) => [f, readFileSync(path.join(krunDir, f))]));
}
