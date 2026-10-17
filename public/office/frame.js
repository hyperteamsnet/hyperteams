// 워드·파워포인트 프레임의 몸통. 주고받는 말은 lib/office/frame-protocol.ts 와 짝입니다.
// 이 문서는 불투명 오리진의 샌드박스라 부모의 쿠키·저장소·DOM 에 닿지 못하고,
// CSP 가 네트워크를 막습니다. 판독기가 문서 안의 무엇에 속더라도 그 안에서 끝납니다.

const params = new URLSearchParams(location.search);
const kind = params.get("kind") === "pptx" ? "pptx" : "docx";
document.body.dataset.kind = kind;
const root = document.getElementById("root");

const STEPS = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400];

/** @type {null | number} 사람이 고른 배율(%). null 이면 맞춤. */
let chosen = null;
let viewer = null; // pptx
let natural = 0; // docx: 확대 전 문서 폭
let wrapper = null; // docx: 쪽들을 담은 판 — 확대는 여기에 겁니다
let pages = 0;

const post = (msg) => parent.postMessage(msg, "*");

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`load failed: ${src}`));
    document.head.append(s);
  });
}

// 판독기는 바이트를 기다리는 동안 미리 받아 둡니다.
const lib =
  kind === "docx"
    ? loadScript("vendor/jszip.min.js").then(() => loadScript("vendor/docx-preview.min.js")).then(() => globalThis.docx)
    : import("./vendor/pptx-renderer.js");
lib.catch(() => {});

function report() {
  if (kind === "docx") {
    const scale = Number(wrapper?.style.zoom || 1);
    post({ type: "scale", percent: Math.round(scale * 100), fit: chosen == null });
  } else if (viewer) {
    post({ type: "scale", percent: Math.round(viewer.zoomPercent), fit: chosen == null || chosen === 100 });
  }
}

function fitDocx() {
  if (!wrapper || !natural) return;
  const fit = Math.min(1, document.documentElement.clientWidth / natural);
  wrapper.style.zoom = String(chosen == null ? fit : chosen / 100);
  report();
}

async function renderDocx(bytes) {
  const docx = await lib;
  const keep = scrollRatio();
  const body = document.createElement("div");
  const styles = document.createElement("div");
  await docx.renderAsync(bytes, body, styles, {
    className: "docx",
    inWrapper: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: true,
    experimental: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    renderComments: false,
    renderChanges: false,
    // 문서에 끼워 넣은 HTML 조각(altChunk)은 그리지 않습니다 — 그 자체가 또 하나의 문서입니다.
    renderAltChunks: false,
    useBase64URL: false,
  });
  root.replaceChildren(styles, ...body.childNodes);
  wrapper = root.querySelector(".docx-wrapper");
  const sections = [...root.querySelectorAll(".docx-wrapper > section.docx")];
  pages = sections.length;
  natural = Math.max(0, ...sections.map((s) => s.offsetWidth)) + 32;
  fitDocx();
  restoreScroll(keep);
  post({ type: "loaded", pages });
  trackPage();
}

async function renderPptx(bytes) {
  const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await lib;
  const keep = scrollRatio();
  const index = viewer ? viewer.currentSlideIndex : 0;
  viewer?.destroy();
  // 판독기는 담는 칸의 clientWidth(여백 포함)에 슬라이드를 맞춥니다. 여백은 바깥 칸이 갖습니다.
  const host = document.createElement("div");
  root.replaceChildren(host);
  viewer = await PptxViewer.open(bytes, host, {
    zipLimits: RECOMMENDED_ZIP_LIMITS,
    fitMode: "contain",
    zoomPercent: chosen ?? 100,
    // EMF 안의 PDF 미리보기는 pdf.js 를 따로 받아야 합니다. 이 프레임은 네트워크가 없습니다.
    pdfjs: false,
    lazyMedia: true,
    lazySlides: true,
    renderMode: "list",
    listOptions: { windowed: true, initialSlides: 4, batchSize: 4 },
    onSlideChange: (i) => post({ type: "page", index: i, count: viewer?.slideCount ?? pages }),
  });
  pages = viewer.slideCount;
  if (keep > 0 && index > 0) await viewer.goToSlide(index, { behavior: "instant" });
  report();
  post({ type: "loaded", pages });
  post({ type: "page", index: viewer.currentSlideIndex, count: pages });
}

function scrollRatio() {
  const el = document.scrollingElement;
  return el && el.scrollHeight > 0 ? el.scrollTop / el.scrollHeight : 0;
}
function restoreScroll(ratio) {
  const el = document.scrollingElement;
  if (el && ratio > 0) el.scrollTop = ratio * el.scrollHeight;
}

let tracking = 0;
function trackPage() {
  if (kind !== "docx" || tracking) return;
  tracking = requestAnimationFrame(() => {
    tracking = 0;
    const sections = root.querySelectorAll(".docx-wrapper > section.docx");
    const mid = innerHeight / 3;
    let index = 0;
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= mid) index = i;
    });
    post({ type: "page", index, count: sections.length });
  });
}
addEventListener("scroll", trackPage, { passive: true });

function zoom(op) {
  const current = kind === "docx" ? Number(wrapper?.style.zoom || 1) * 100 : (viewer?.zoomPercent ?? 100);
  if (op === "fit") chosen = null;
  else if (op === "in") chosen = STEPS.find((s) => s > current + 0.5) ?? STEPS[STEPS.length - 1];
  else if (op === "out") chosen = [...STEPS].reverse().find((s) => s < current - 0.5) ?? STEPS[0];
  if (kind === "docx") fitDocx();
  else viewer?.setZoom(chosen ?? 100).then(report);
}

addEventListener("resize", () => {
  if (kind === "docx" && chosen == null) fitDocx();
});

// Ctrl/⌘ + 휠(트랙패드 핀치도 이것으로 옵니다)은 브라우저 전체가 아니라 문서를 키웁니다.
addEventListener(
  "wheel",
  (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoom(e.deltaY < 0 ? "in" : "out");
  },
  { passive: false },
);

// 링크는 이 프레임이 따라가지 않습니다(샌드박스가 창을 못 엽니다). 문서 안 책갈피는
// 여기서 스크롤하고, 바깥 주소는 부모에게 넘겨 거기서 거르게 합니다.
addEventListener(
  "click",
  (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) {
      const id = decodeURIComponent(href.slice(1));
      (document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`))?.scrollIntoView();
      return;
    }
    post({ type: "link", href });
  },
  true,
);

addEventListener("message", (e) => {
  if (e.source !== parent) return;
  const msg = e.data;
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "theme") {
    document.documentElement.dataset.theme = msg.theme === "dark" ? "dark" : "light";
  } else if (msg.type === "zoom") {
    zoom(msg.op);
  } else if (msg.type === "goto" && kind === "pptx" && viewer) {
    viewer.goToSlide(Math.max(0, Math.min(pages - 1, msg.index | 0)));
  } else if (msg.type === "load" && msg.bytes instanceof ArrayBuffer) {
    const run = kind === "docx" ? renderDocx(msg.bytes) : renderPptx(msg.bytes);
    run.catch((err) => post({ type: "error", message: String((err && err.message) || err) }));
  }
});

post({ type: "ready" });
