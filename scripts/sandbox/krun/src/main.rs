//! hyperteams-krun — microVM 한 대 = 이 프로세스 하나.
//!
//! libkrun 의 `krun_start_enter()` 는 부른 프로세스를 VM 으로 바꾸고 돌아오지 않습니다. 그래서
//! 서버(Node)가 직접 부르지 않고, 실행마다 이 작은 실행 파일을 하나 띄웁니다 — Podman 의
//! krunkit·crun 의 krun 핸들러와 같은 방식입니다. 설정은 JSON 파일 하나로 받습니다
//! (lib/sandbox/krun.ts 가 씁니다).
//!
//! ```text
//! hyperteams-krun --version
//! hyperteams-krun <config.json>
//! ```
//!
//! ## 벽의 모양 (설정이 정하고, 이 파일은 그대로 옮깁니다)
//!
//! - 커널은 **외부 커널**(`krun_set_kernel`)이고 명령줄도 우리가 줍니다. libkrun 의 기본 init
//!   (init.krun)과 virtio-fs 루트를 쓰지 않습니다 — 업무 VM 은 `root=/dev/vda ro` 에서
//!   `/sbin/guest-init` 으로 뜹니다.
//! - 디스크는 준 순서대로 vda, vdb … 입니다. 루트는 읽기 전용으로 붙입니다.
//! - vsock 은 **TSI(투명 소켓 대행) 없이** 붙습니다(`tsi: false`). 그러면 게스트의 AF_INET 은
//!   바깥으로 나가지 못하고, 출구는 설정에 적은 vsock 포트 ↔ 유닉스 소켓뿐입니다.
//!   `listen: true` — 호스트 쪽에서 이 프로세스가 소켓을 열고, 붙는 연결을 게스트 포트로 넘김.
//!   `listen: false` — 게스트가 포트로 걸면 호스트의 그 소켓(누군가 열어 둔)으로 넘김.
//! - 이미지 굽기용 VM 만 `tsi: true` + virtio-fs 루트를 씁니다(lib/sandbox/installer.ts).
//!
//! ## 부모가 사라지면 VM 도
//!
//! 서버가 죽으면 이 프로세스의 stdin(파이프)이 닫힙니다. 그것을 보는 스레드가 곧바로
//! 프로세스를 끝냅니다 — 고아 VM 이 CPU·메모리를 붙든 채 남지 않게. 콘솔은 stdin 을 쓰지
//! 않도록 /dev/null 에서 읽고, 출력은 설정의 로그 파일로 갑니다(부팅 실패의 단서).

use serde::Deserialize;
use std::ffi::CString;
use std::io::Read;
use std::process::exit;

const LIBKRUN_VERSION: &str = "1.19.5";

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Config {
    cpus: u8,
    mem_mib: u32,
    kernel: Kernel,
    #[serde(default)]
    disks: Vec<Disk>,
    /// virtio-fs 루트로 쓸 호스트 폴더(이미지 굽기 VM 만).
    #[serde(default)]
    root_dir: Option<String>,
    #[serde(default)]
    vsock: Vsock,
    /// 게스트 콘솔(hvc0)을 받아 적을 파일. 없으면 버립니다.
    #[serde(default)]
    console_log: Option<String>,
    /// libkrun 로그 수준 0(끔)–5(trace). stderr 로 나갑니다.
    #[serde(default)]
    log_level: u32,
    /// stdin 이 닫히면 VM 을 내립니다(기본 켬).
    #[serde(default = "yes")]
    exit_on_stdin_eof: bool,
}

fn yes() -> bool {
    true
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Kernel {
    path: String,
    /// "raw"(aarch64 Image) · "elf"(x86_64 vmlinux)
    format: String,
    cmdline: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Disk {
    id: String,
    path: String,
    #[serde(default)]
    read_only: bool,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct Vsock {
    #[serde(default)]
    tsi: bool,
    #[serde(default)]
    ports: Vec<VsockPort>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct VsockPort {
    port: u32,
    path: String,
    listen: bool,
}

// libkrun 의 상수(include/libkrun.h)
const KRUN_KERNEL_FORMAT_RAW: u32 = 0;
const KRUN_KERNEL_FORMAT_ELF: u32 = 1;
const KRUN_DISK_FORMAT_RAW: u32 = 0;
const KRUN_TSI_HIJACK_INET: u32 = 1;

fn die(what: &str, detail: impl std::fmt::Display) -> ! {
    eprintln!("hyperteams-krun: {what}: {detail}");
    exit(70);
}

/// libkrun 호출의 음수 반환은 -errno 입니다.
fn check(what: &str, ret: i32) {
    if ret < 0 {
        let err = std::io::Error::from_raw_os_error(-ret);
        die(what, err);
    }
}

fn cstr(s: &str) -> CString {
    CString::new(s).unwrap_or_else(|_| die("bad string", s))
}

fn main() {
    let arg = std::env::args().nth(1).unwrap_or_else(|| die("usage", "hyperteams-krun <config.json> | --version"));
    if arg == "--version" {
        println!("hyperteams-krun {} (libkrun {})", env!("CARGO_PKG_VERSION"), LIBKRUN_VERSION);
        return;
    }
    let raw = std::fs::read_to_string(&arg).unwrap_or_else(|e| die("read config", e));
    let cfg: Config = serde_json::from_str(&raw).unwrap_or_else(|e| die("parse config", e));

    if cfg.exit_on_stdin_eof {
        std::thread::spawn(|| {
            let mut buf = [0u8; 64];
            let mut stdin = std::io::stdin();
            loop {
                match stdin.read(&mut buf) {
                    Ok(0) | Err(_) => exit(0),
                    Ok(_) => {}
                }
            }
        });
    }

    // 모든 FFI 는 libkrun 의 C API 그대로입니다 — 문자열은 호출 동안 살아 있으면 됩니다.
    unsafe {
        check("set_log_level", krun::krun_set_log_level(cfg.log_level));
        let ctx = krun::krun_create_ctx();
        check("create_ctx", ctx);
        let ctx = ctx as u32;

        check("set_vm_config", krun::krun_set_vm_config(ctx, cfg.cpus, cfg.mem_mib));

        let format = match cfg.kernel.format.as_str() {
            "raw" => KRUN_KERNEL_FORMAT_RAW,
            "elf" => KRUN_KERNEL_FORMAT_ELF,
            other => die("kernel format", other),
        };
        let kpath = cstr(&cfg.kernel.path);
        let kcmd = cstr(&cfg.kernel.cmdline);
        check(
            "set_kernel",
            krun::krun_set_kernel(ctx, kpath.as_ptr(), format, std::ptr::null(), kcmd.as_ptr()),
        );

        if let Some(dir) = &cfg.root_dir {
            let d = cstr(dir);
            check("set_root", krun::krun_set_root(ctx, d.as_ptr()));
        }

        for disk in &cfg.disks {
            let id = cstr(&disk.id);
            let p = cstr(&disk.path);
            check(
                "add_disk",
                krun::krun_add_disk2(ctx, id.as_ptr(), p.as_ptr(), KRUN_DISK_FORMAT_RAW, disk.read_only),
            );
        }

        // vsock — 암묵 설정(네트워크가 없으면 TSI 를 켜는 libkrun 의 추측)을 끄고 명시합니다.
        check("disable_implicit_vsock", krun::krun_disable_implicit_vsock(ctx));
        let tsi = if cfg.vsock.tsi { KRUN_TSI_HIJACK_INET } else { 0 };
        check("add_vsock", krun::krun_add_vsock(ctx, tsi));
        for p in &cfg.vsock.ports {
            let path = cstr(&p.path);
            check("add_vsock_port", krun::krun_add_vsock_port2(ctx, p.port, path.as_ptr(), p.listen));
        }

        // 콘솔(hvc0): 출력 파일을 주면 libkrun 은 입력을 비워 둡니다 — stdin 은 위의 감시 스레드
        // 몫입니다. (파일 대신 fd 를 주면, 터미널이 아닌 출력은 libkrun 이 자기 로그로 돌립니다.)
        let log = cstr(cfg.console_log.as_deref().unwrap_or("/dev/null"));
        check("set_console_output", krun::krun_set_console_output(ctx, log.as_ptr()));

        // 성공하면 돌아오지 않습니다 — 게스트가 꺼지면 libkrun 이 프로세스를 끝냅니다.
        let ret = krun::krun_start_enter(ctx);
        check("start_enter", ret);
    }
}
