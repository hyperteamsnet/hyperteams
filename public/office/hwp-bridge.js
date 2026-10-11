// 한글 편집기 프레임의 다리 — public/office/hwp/index.html 이 업스트림 코드보다 **먼저** 부릅니다.
//
// 편집기(rhwp-studio, MIT)는 components/HwpEditor.tsx 가 `sandbox="allow-scripts allow-modals"`
// 프레임으로 엽니다. 오리진이 불투명(`null`)이라 대시보드의 쿠키·저장소·DOM 에 닿지 못하고, 프레임의
// CSP 가 네트워크를 막습니다(connect-src 'none'). 그 벽 때문에 업스트림 코드가 그대로는 못 하는 것
// 넷을 여기서 메웁니다. 업스트림 소스는 고치지 않습니다 — 판을 올릴 때 다시 빌드만 하면 되게.
//
// 1. 저장소 대역. 불투명 오리진에서 `localStorage` 는 읽기만 해도 SecurityError 를 던집니다.
//    메모리 저장소로 바꿔 끼우고, 처음 값은 부모가 주소의 #조각으로 실어 보냅니다(설정·테마 —
//    theme-init.js 가 동기로 읽으므로 postMessage 로는 늦습니다). 바뀐 값은 부모에게 알려
//    부모의 localStorage 에 남깁니다. 그래서 편집기 설정이 탭을 닫아도 유지됩니다.
//    테마는 대시보드를 따릅니다: 설정을 "시스템" 으로 두고 `prefers-color-scheme` 질의가 대시보드의
//    테마를 답하게 합니다. 업스트림은 그 질의의 change 에 테마를 다시 칠하므로(initThemeSync),
//    대시보드에서 테마를 바꾸면 편집기도 그 자리에서 바뀝니다.
// 2. 엔진 wasm. 글루가 `fetch(…/rhwp_bg-*.wasm)` 하는 것을 가로채 부모가 넘긴 바이트로 답합니다.
//    불투명 오리진의 요청은 HTTP 캐시를 나누지 못해 열 때마다 10MB 를 새로 받게 되고, 애초에
//    connect-src 'none' 이라 받을 수도 없습니다. 부모는 자기 캐시에서 한 번 받은 것을 넘깁니다.
// 3. ⌘S·Ctrl+S. 초점이 프레임 안에 있으면 키가 부모에게 가지 않습니다. 저장은 부모의 일이므로
//    알리기만 합니다(업스트림은 embed 모드에서 저장 명령을 지우고 키만 삼킵니다).
// 4. 고친 흔적(dirty). 업스트림은 미저장 상태를 밖으로 알리지 않지만, 그 상태일 때만
//    `beforeunload` 를 막는 처리기를 겁니다(DocumentDirtyState). 같은 이벤트를 흉내 내 보내
//    막혔는지 보면 상태를 알 수 있습니다. 입력이 있을 때와 짧은 주기로 물어봅니다.
//
// 부모와 주고받는 말은 `{ ht: "hwp", type, … }` 모양입니다(lib/hwp/studio-protocol.ts 가 부모 쪽 짝).
// 업스트림의 임베드 RPC(MessageChannel, `rhwp-*`)와는 섞이지 않습니다.
(() => {
  "use strict";
  const parentWin = window.parent;
  const post = (msg, transfer) => {
    // 불투명 오리진에서 부모의 오리진을 이름으로 부를 수 없습니다. 실리는 것은 설정·신호뿐입니다.
    try {
      parentWin.postMessage({ ht: "hwp", ...msg }, "*", transfer || []);
    } catch {
      /* 부모가 사라짐 */
    }
  };

  // ── 1. 저장소 ──────────────────────────────────────────────────────────────
  const seed = (() => {
    try {
      const m = /[#&]s=([^&]*)/.exec(location.hash);
      const parsed = m ? JSON.parse(decodeURIComponent(m[1])) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  })();
  const params = new URLSearchParams(location.search);
  // 대시보드의 테마가 이깁니다 — 편집기 안의 설정창에서 바꾼 값은 다음에 열 때 대시보드 테마로 돌아갑니다.
  const theme = params.get("theme");
  const followHost = theme === "dark" || theme === "light";
  let hostDark = theme === "dark";
  if (followHost) {
    let s = {};
    try {
      s = JSON.parse(seed["rhwp-settings"] || "{}") || {};
    } catch {
      s = {};
    }
    s.theme = { ...(s.theme || {}), mode: "system" };
    seed["rhwp-settings"] = JSON.stringify(s);
  }
  const schemeLists = new Set();
  const realMatchMedia = typeof window.matchMedia === "function" ? window.matchMedia.bind(window) : null;
  if (followHost) {
    window.matchMedia = (query) => {
      if (!/prefers-color-scheme\s*:\s*dark/.test(String(query))) return realMatchMedia ? realMatchMedia(query) : null;
      const listeners = new Set();
      const mql = {
        media: String(query),
        get matches() {
          return hostDark;
        },
        onchange: null,
        addEventListener: (type, fn) => type === "change" && listeners.add(fn),
        removeEventListener: (type, fn) => listeners.delete(fn),
        addListener: (fn) => listeners.add(fn),
        removeListener: (fn) => listeners.delete(fn),
        dispatchEvent: () => true,
      };
      schemeLists.add(() => {
        const ev = { matches: hostDark, media: mql.media };
        for (const fn of listeners) fn.call(mql, ev);
        if (typeof mql.onchange === "function") mql.onchange(ev);
      });
      return mql;
    };
  }

  const makeStorage = (initial, persist) => {
    const map = new Map(Object.entries(initial).filter(([, v]) => typeof v === "string"));
    let timer = 0;
    const changed = () => {
      if (!persist) return;
      clearTimeout(timer);
      timer = setTimeout(() => post({ type: "storage", items: Object.fromEntries(map) }), 300);
    };
    const store = {
      get length() {
        return map.size;
      },
      key: (i) => Array.from(map.keys())[i] ?? null,
      getItem: (k) => (map.has(String(k)) ? map.get(String(k)) : null),
      setItem: (k, v) => {
        map.set(String(k), String(v));
        changed();
      },
      removeItem: (k) => {
        map.delete(String(k));
        changed();
      },
      clear: () => {
        map.clear();
        changed();
      },
    };
    return store;
  };
  const usable = (name) => {
    try {
      const s = window[name];
      s.getItem("__ht");
      return true;
    } catch {
      return false;
    }
  };
  if (!usable("localStorage")) {
    Object.defineProperty(window, "localStorage", { value: makeStorage(seed, true), configurable: true });
  }
  if (!usable("sessionStorage")) {
    Object.defineProperty(window, "sessionStorage", { value: makeStorage({}, false), configurable: true });
  }

  // ── 2. 엔진 wasm ───────────────────────────────────────────────────────────
  let wasmResolve;
  let wasmReject;
  const wasmBytes = new Promise((resolve, reject) => {
    wasmResolve = resolve;
    wasmReject = reject;
  });
  const isEngineWasm = (input) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input && input.url;
      return /\/rhwp_bg[^/]*\.wasm$/.test(new URL(url, location.href).pathname);
    } catch {
      return false;
    }
  };
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (!isEngineWasm(input)) return realFetch(input, init);
    return wasmBytes.then(
      (bytes) => new Response(bytes, { status: 200, headers: { "Content-Type": "application/wasm" } }),
    );
  };

  window.addEventListener("message", (e) => {
    if (e.source !== parentWin) return;
    const msg = e.data;
    if (!msg || msg.ht !== "hwp") return;
    if (msg.type === "wasm") {
      if (msg.bytes instanceof ArrayBuffer) wasmResolve(msg.bytes);
      else wasmReject(new Error(String(msg.error || "engine unavailable")));
    } else if (msg.type === "theme" && followHost && typeof msg.dark === "boolean") {
      if (msg.dark !== hostDark) {
        hostDark = msg.dark;
        for (const fire of schemeLists) fire();
      }
    } else if (msg.type === "probe") {
      // 부모가 문서를 넣었거나 저장을 알린 직후 — 바뀌었든 아니든 지금 상태를 답합니다.
      probe(true);
    }
  });

  // ── 3. 저장 단축키 ─────────────────────────────────────────────────────────
  // `key` 가 아니라 `code` 로 봅니다 — 한글 입력 중이면 key 가 "ㄴ" 입니다.
  window.addEventListener(
    "keydown",
    (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.code === "KeyS") {
        e.preventDefault();
        post({ type: "save" });
      }
    },
    true,
  );

  // ── 4. 고친 흔적 ───────────────────────────────────────────────────────────
  // 부모가 보는 상태는 **이 다리가 마지막으로 알린 값** 하나뿐입니다. 부모는 이 값을 스스로
  // 고쳐 쓰지 않고, 필요하면 probe 를 청합니다 — 둘이 따로 고치면 어긋난 채로 남습니다.
  let dirty = false;
  const probe = (force) => {
    const ev = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(ev);
    const now = ev.defaultPrevented;
    if (force === true || now !== dirty) {
      dirty = now;
      post({ type: "dirty", dirty });
    }
  };
  let probeTimer = 0;
  let lastActivity = 0;
  const onActivity = () => {
    clearTimeout(probeTimer);
    // 편집 명령은 이벤트 처리 안에서 동기로 끝나지만, 한 박자 늦게 물어 그 뒤를 봅니다.
    probeTimer = setTimeout(probe, 60);
    const now = Date.now();
    if (now - lastActivity > 400) {
      lastActivity = now;
      post({ type: "activity" });
    }
  };
  for (const type of ["keyup", "input", "compositionend", "pointerup", "paste", "cut", "drop"]) {
    window.addEventListener(type, onActivity, true);
  }
  setInterval(probe, 1000);
  // 초점이 프레임을 떠남 — 대시보드의 단추(뒤로, 다른 탭)를 누르는 순간입니다. 그 단추가 이 iframe
  // 을 DOM 에서 떼기 전에 부모가 미저장 사본을 떠 두도록 바로 알립니다(HwpEditor 의 사본).
  window.addEventListener("blur", () => {
    probe();
    post({ type: "blur" });
  });

  post({ type: "boot" });
})();
