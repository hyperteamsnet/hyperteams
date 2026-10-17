/**
 * 런처를 미리 빌드해 릴리스에 싣습니다 — scripts/package-release.mjs 가 부릅니다. 고객 컴퓨터에
 * Rust 가 없어도 «원클릭 설치» 가 되도록(lib/sandbox/installer.ts 는 지문이 같을 때만 이것을 씀).
 *
 *   node scripts/sandbox/krun/prebuild.mjs <out>   # 단독 실행 — <out>/vendor/sandbox/<os>-<arch>/
 *
 * cargo 가 없거나 libkrun 이 안 도는 플랫폼이면 건너뜁니다(null) — 그때는 설치기가 고객
 * 컴퓨터에서 소스로 빌드합니다.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launcherFingerprintSync } from "./fingerprint.mjs";

const KRUN_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {{ out: string; log?: (msg: string) => void; platform?: string; arch?: string }} opts
 * @returns {string | null} 만든 실행 파일의 경로, 건너뛰었으면 null
 */
export function prebuildLauncher({ out, log = console.log, platform = process.platform, arch = process.arch }) {
  const supported = (platform === "darwin" && arch === "arm64") || (platform === "linux" && (arch === "x64" || arch === "arm64"));
  if (!supported || platform !== process.platform || arch !== process.arch) {
    log(`microVM 런처 미리 빌드 건너뜀 (${platform}-${arch})`);
    return null;
  }
  const targetDir = path.join(os.tmpdir(), "hyperteams-package-krun-target");
  try {
    execFileSync("cargo", ["build", "--release", "--locked", "--manifest-path", path.join(KRUN_DIR, "Cargo.toml"), "--target-dir", targetDir], {
      stdio: ["ignore", "ignore", "inherit"],
    });
  } catch (e) {
    log(`⚠ microVM 런처를 미리 빌드하지 못했습니다 — 고객 컴퓨터의 설치기가 소스로 빌드합니다: ${e.message}`);
    return null;
  }
  const dir = path.join(out, "vendor", "sandbox", `${platform}-${arch}`);
  fs.mkdirSync(dir, { recursive: true });
  const bin = path.join(dir, "hyperteams-krun");
  fs.copyFileSync(path.join(targetDir, "release", "hyperteams-krun"), bin);
  fs.chmodSync(bin, 0o755);
  if (platform === "darwin") {
    // 하이퍼바이저 권한 — 설치기도 복사한 뒤 다시 서명하지만, 여기서 해 두면 그대로도 돕니다.
    execFileSync("/usr/bin/codesign", ["-s", "-", "-f", "--entitlements", path.join(KRUN_DIR, "entitlements.plist"), bin], { stdio: "ignore" });
  }
  fs.writeFileSync(`${bin}.json`, JSON.stringify({ fingerprint: launcherFingerprintSync(KRUN_DIR) }, null, 2));
  log(`microVM 런처 미리 빌드 — vendor/sandbox/${platform}-${arch}/hyperteams-krun`);
  return bin;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const out = process.argv[2];
  if (!out) {
    console.error("usage: node scripts/sandbox/krun/prebuild.mjs <out>");
    process.exit(2);
  }
  if (!prebuildLauncher({ out })) process.exit(1);
}
