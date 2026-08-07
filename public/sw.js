/// <reference lib="webworker" />
/*
 * Hand-written service worker for HyperTeams — no Workbox, no build-time
 * codegen (see AGENTS.md: this is a customized Next 16 fork; a library that
 * hooks the build would tangle with the A/B deploy slots and source-hiding gate
 * in next.config.ts for no benefit here).
 *
 * The worker does two unrelated jobs, kept apart below: caching, and push
 * notifications. Nothing is shared between them but the file.
 *
 * The caching strategy is three rules, because this dashboard is a LIVE control
 * plane, not content. Caching its data would paint dead terminals and stale git
 * state as if they were live — the one thing this app must never do.
 *
 *   1. /api/** and SSE   -> do not intercept (leave the live streams alone).
 *   2. /_next/static/**  -> cache-first (the hash in the path IS the version).
 *   3. navigations        -> network-first, fall back to /offline only.
 *
 * The push half is the reason this worker earns its keep on a phone: a closed
 * PWA has no page, no stream and no timer, so the only thing that can tell you
 * a task finished is a service worker the push service wakes. See lib/push.ts
 * for what gets sent and lib/task-notify.ts for what it says.
 *
 * The cache is versioned by the git SHA, which the page passes in via the
 * registration query (?v=<sha>). A new deploy = a new SHA = a new cache name =
 * old chunks evicted on activate, so the worker can never serve a chunk from a
 * build the server has already moved past.
 */

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_PREFIX = "hyperteams-shell-";
const CACHE = `${CACHE_PREFIX}${VERSION}`;
const OFFLINE_URL = "/offline";

// Just enough to render the offline fallback. We deliberately do NOT precache
// the dashboard itself — it is authenticated and live, so it must always be
// fetched fresh.
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  // No skipWaiting() here on purpose: a new worker parks in `waiting` so the
  // page can show an update banner and let the user reload deliberately. That
  // deliberate reload is what keeps an updated tab from racing the auto-deploy
  // into a chunk mismatch.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Everything except the current cache, NOT just `CACHE_PREFIX` matches.
      // The prefix used to be part of the product name, and when the name
      // changed the filter stopped recognising its own older caches — they
      // survived every deploy, and because the offline fallback below was a
      // CacheStorage-wide match, the oldest one (created first, matched first)
      // kept winning. The result was an offline page still carrying a product
      // name that had not existed for weeks. This origin's CacheStorage is
      // ours alone, so "delete what isn't current" is both correct and immune
      // to the next rename.
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// The page posts this after the user clicks "reload" on the update banner.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ------------------------------------------------------------------ *
 * Push notifications — "your task finished", when nothing of ours is running.
 *
 * The dashboard's SSE stream already covers an open page. This covers the
 * closed one: the push service wakes this worker with the message, and the
 * worker is the only thing that exists at that moment.
 * ------------------------------------------------------------------ */

/** Where a click lands when the payload didn't say. */
const DEFAULT_URL = "/";

/**
 * VAPID key, base64url text → the bytes `pushManager.subscribe` wants.
 *
 * The spec allows handing it the string directly, but the browsers that need
 * this worker most are the ones least likely to have caught up with that, and
 * the failure mode is an unhelpful InvalidCharacterError at subscribe time.
 * Mirrored in components/usePush.ts, which subscribes on the page side.
 */
function vapidKeyToBytes(base64url) {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

self.addEventListener("push", (event) => {
  /**
   * Always an OS notification — including when the dashboard is open in front
   * of you.
   *
   * An earlier version checked whether a window client was visible and, if so,
   * suppressed the notification in favour of a card drawn inside the page. It
   * worked, and it was still wrong: a notification you can only see by already
   * looking at the tab is the one you least needed, and it meant the same event
   * arrived in two different shapes depending on where your eyes were. One
   * shape, one place — the OS notification centre, which is also where it stays
   * until you deal with it.
   *
   * This is the easier side of that fork to be on, incidentally: Chrome's
   * penalty for a push that shows nothing ("이 사이트가 백그라운드에서
   * 업데이트되었습니다") can no longer be triggered, because there is no path
   * through here that shows nothing.
   */
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        payload = event.data ? event.data.json() : {};
      } catch {
        // A push we can't parse is still a push. Falling through with an empty
        // payload shows the generic title below rather than dropping it.
      }

      const title = payload.title || "작업이 끝났습니다";
      await self.registration.showNotification(title, {
        body: payload.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        // One notification per task, replaced rather than stacked: a follow-up
        // that finishes while the first is still on screen is an update to the
        // same thing, not a second thing to read.
        tag: payload.tag || "task",
        renotify: true,
        // Nothing here about sound. `silent` was set from a per-device setting
        // for a while, and it was a switch that could only ever take sound
        // *away* — the API has no way to ask for a sound, only to forbid one.
        // Left unset, the browser and the OS apply the notification settings
        // the user already has for this app, which is the only place those
        // belong and the only place they will be looked for.
        // Read on click below. The notification outlives this worker, so the
        // destination has to travel with it rather than in a variable.
        data: { url: payload.url || DEFAULT_URL },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || DEFAULT_URL;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Prefer an open tab: this dashboard holds live terminals and editor
      // buffers, and opening a second window to show a card would put a second
      // copy of all of that beside the one you already had.
      for (const client of clients) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        // The page routes this itself (components/Pwa.tsx) instead of being
        // navigated, so the tab switches without reloading the app.
        client.postMessage({ type: "notification-click", url });
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});

/**
 * The browser rotated this subscription out from under us.
 *
 * Rare, but permanent when missed: the old endpoint stops working and the
 * server keeps sending to it until the 410 sweep drops the row, at which point
 * the device has silently stopped getting notifications with the toggle still
 * showing "on". Re-subscribing here is the only chance to fix it without the
 * user noticing something is wrong and toggling it by hand.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch("/api/push/subscribe");
        if (!res.ok) return;
        const { publicKey } = await res.json();
        if (!publicKey) return;
        const sub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKeyToBytes(publicKey),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
      } catch {
        // Offline, or the session has expired and the fetch came back 401.
        // The page re-registers on its next load (components/usePush.ts).
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only GET is interceptable; POST/PUT/etc. pass straight through.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never touch cross-origin requests (the tunnel, any CDN).
  if (url.origin !== self.location.origin) return;

  // Rule 1 — the live control plane. An SSE stream handed to respondWith would
  // be buffered and break; a cached API reply would show dead state as live.
  if (url.pathname.startsWith("/api/")) return;
  if ((req.headers.get("accept") || "").includes("text/event-stream")) return;

  // Rule 2 — content-hashed immutable build assets. A cache hit can never be
  // stale because the hash in the path changes when the content does.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Rule 3 — navigations (HTML). Network-first; if the network is gone, serve
  // the static offline page and nothing else. We never fall back to a cached
  // dashboard: its auth state and live data would be wrong.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        // Scoped to THIS build's cache, not the CacheStorage-wide
        // `caches.match()`. That one searches every cache in creation order and
        // returns the first hit, so a leftover cache from an older build serves
        // its offline page ahead of the current one — stale copy, forever, no
        // matter how many deploys land. Only this build's copy is allowed to
        // answer; if it is missing, the failure is honest.
        caches
          .open(CACHE)
          .then((cache) => cache.match(OFFLINE_URL, { ignoreSearch: true }))
          .then((hit) => hit || Response.error()),
      ),
    );
    return;
  }

  // Everything else (fonts, images, RSC payloads): straight to network,
  // uncached. RSC in particular must never be cached — it carries live data.
});
