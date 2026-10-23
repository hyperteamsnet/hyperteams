module.exports=[902157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},750227,(e,t,r)=>{t.exports=e.x("node:path",()=>require("node:path"))},951389,(e,t,r)=>{t.exports=e.x("better-sqlite3-a9b1042fd0ef418e",()=>require("better-sqlite3-a9b1042fd0ef418e"))},874533,(e,t,r)=>{t.exports=e.x("node:child_process",()=>require("node:child_process"))},660526,(e,t,r)=>{t.exports=e.x("node:os",()=>require("node:os"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},80385,e=>{"use strict";var t=e.i(798012),r=e.i(740203),n=e.i(743124),o=e.i(726557),a=e.i(380097),i=e.i(407954),s=e.i(68169),l=e.i(962345),d=e.i(755589),u=e.i(289022),p=e.i(535272),c=e.i(731215),h=e.i(274976),w=e.i(452518),f=e.i(24020),x=e.i(193695);e.i(802255);var g=e.i(226608),m=e.i(874533),R=e.i(912714),v=e.i(660526),$=e.i(750227),b=e.i(812709),W=e.i(834847),y=e.i(960882);async function T(e){let{path:t}=await e.json().catch(()=>({}));if(!t)return b.NextResponse.json({error:(0,y.t)("err.pathRequired")},{status:400});if(!(0,W.withinWorkspaces)(t))return b.NextResponse.json({error:(0,y.t)("err.outsideWorkspaceOpen")},{status:403});let r=$.default.resolve(t);try{if(!(await (0,R.stat)(r)).isDirectory())return b.NextResponse.json({error:(0,y.t)("err.notADirectoryPlain")},{status:400})}catch{return b.NextResponse.json({error:(0,y.t)("err.folderNotFound")},{status:404})}try{let e=await function(e){if("win32"===v.default.platform()){let t,r,n;return t=e.replace(/'/g,"''"),r=`
$ErrorActionPreference = 'Stop'
$target = '${t}'

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr pid);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
}
"@

function Norm([string]$p) { return $p.TrimEnd('\\').ToLowerInvariant() }

# The open Explorer window showing this exact folder, or $null.
function Find-Window([string]$p) {
  $shell = New-Object -ComObject Shell.Application
  foreach ($w in $shell.Windows()) {
    try {
      $url = $w.LocationURL
      if (-not $url) { continue }
      # LocalPath turns file:///C:/x and file://wsl.localhost/y back into real
      # Windows paths (the second being a UNC path, which WSL folders use).
      if ((Norm ([Uri]$url).LocalPath) -eq (Norm $p)) { return $w }
    } catch { }
  }
  return $null
}

$wnd = Find-Window $target
if (-not $wnd) {
  Start-Process explorer.exe -ArgumentList ('"' + $target + '"')
  # Explorer takes a moment to register the new window with the shell.
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Milliseconds 100
    $wnd = Find-Window $target
    if ($wnd) { break }
  }
}
if (-not $wnd) { throw '${(0,y.t)("err.explorerWindowNotFound").replace(/'/g,"''")}' }

$hwnd = [IntPtr]$wnd.HWND
if ([Win]::IsIconic($hwnd)) { [Win]::ShowWindow($hwnd, 9) | Out-Null }  # SW_RESTORE

# Windows only lets the process that owns the foreground window hand focus
# away. This server isn't it, so SetForegroundWindow would be ignored and the
# taskbar would merely blink. Attaching OUR thread's input queue to the current
# foreground thread's makes Windows treat us as that thread for the moment it
# takes to raise the window. Attach *our* thread — attaching any other pair
# grants this process nothing.
$fg = [Win]::GetForegroundWindow()
$fgThread = [Win]::GetWindowThreadProcessId($fg, [IntPtr]::Zero)
$myThread = [Win]::GetCurrentThreadId()
$attached = $false
if ($fgThread -ne 0 -and $fgThread -ne $myThread) {
  $attached = [Win]::AttachThreadInput($myThread, $fgThread, $true)
}
try {
  # HWND_TOPMOST then HWND_NOTOPMOST: lifts the window clear of whatever was
  # covering it, without leaving it permanently pinned above everything.
  # SWP_NOMOVE|SWP_NOSIZE|SWP_SHOWWINDOW = 0x1|0x2|0x40
  [Win]::SetWindowPos($hwnd, [IntPtr](-1), 0, 0, 0, 0, 0x43) | Out-Null
  [Win]::SetWindowPos($hwnd, [IntPtr](-2), 0, 0, 0, 0, 0x43) | Out-Null
  [Win]::BringWindowToTop($hwnd) | Out-Null
  [Win]::SetForegroundWindow($hwnd) | Out-Null
} finally {
  if ($attached) { [Win]::AttachThreadInput($myThread, $fgThread, $false) | Out-Null }
}

# Report what actually ended up in front, so the caller isn't guessing.
$now = [Win]::GetForegroundWindow()
if ($now -eq $hwnd) { Write-Output 'foreground' } else { Write-Output 'opened' }
`,n=Buffer.from(r,"utf16le").toString("base64"),new Promise((e,t)=>{(0,m.execFile)("powershell.exe",["-NoProfile","-STA","-EncodedCommand",n],{windowsHide:!0,timeout:2e4},(r,n,o)=>{if(r)return t(Error((o??"").trim().split("\n")[0]||(0,y.t)("err.explorerFailed")));e((n??"").trim().endsWith("foreground")?"foreground":"opened")})})}}(r);return b.NextResponse.json({ok:!0,result:e})}catch(e){return b.NextResponse.json({error:e.message},{status:500})}}e.s(["POST",0,T,"runtime",0,"nodejs"],396590);var P=e.i(396590);let I=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/open-folder/route",pathname:"/api/open-folder",filename:"route",bundlePath:""},distDir:".next-release",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/open-folder/route.ts",nextConfigOutput:"standalone",userland:P,...{}}),{workAsyncStorage:N,workUnitAsyncStorage:E,serverHooks:S}=I;async function O(e,t,n){n.requestMeta&&(0,o.setRequestMeta)(e,n.requestMeta),I.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let m="/api/open-folder/route";m=m.replace(/\/index$/,"")||"/";let R=await I.prepare(e,t,{srcPage:m,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:v,deploymentId:$,params:b,nextConfig:W,parsedUrl:y,isDraftMode:T,prerenderManifest:P,routerServerContext:N,isOnDemandRevalidate:E,revalidateOnlyGenerated:S,resolvedPathname:O,clientReferenceManifest:C,serverActionsManifest:A}=R,q=(0,s.normalizeAppPath)(m),k=!!(P.dynamicRoutes[q]||P.routes[O]),_=async()=>((null==N?void 0:N.render404)?await N.render404(e,t,y,!1):t.end("This page could not be found"),null);if(k&&!T){let e=!!P.routes[O],t=P.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(W.adapterPath)return await _();throw new x.NoFallbackError}}let D=null;!k||I.isDev||T||(D="/index"===(D=O)?"/":D);let j=!0===I.isDev||!k,H=k&&!j;A&&C&&(0,i.setManifestsSingleton)({page:m,clientReferenceManifest:C,serverActionsManifest:A});let F=e.method||"GET",U=(0,a.getTracer)(),M=U.getActiveScopeSpan(),L=!!(null==N?void 0:N.isWrappedByNextServer),G=!!(0,o.getRequestMeta)(e,"minimalMode"),B=(0,o.getRequestMeta)(e,"incrementalCache")||await I.getIncrementalCache(e,W,P,G);null==B||B.resetRequestCache(),globalThis.__incrementalCache=B;let K={params:b,previewProps:P.preview,renderOpts:{experimental:{authInterrupts:!!W.experimental.authInterrupts},cacheComponents:!!W.cacheComponents,supportsDynamicResponse:j,incrementalCache:B,cacheLifeProfiles:W.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,o)=>I.onRequestError(e,t,n,o,N)},sharedContext:{buildId:v,deploymentId:$}},V=new l.NodeNextRequest(e),X=new l.NodeNextResponse(t),Z=d.NextRequestAdapter.fromNodeNextRequest(V,(0,d.signalFromNodeResponse)(t));try{let o,i=async e=>I.handle(Z,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=U.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${F} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),o&&o!==e&&(o.setAttribute("http.route",n),o.updateName(t))}else e.updateName(`${F} ${m}`)}),s=async o=>{var a,s;let l=async({previousCacheEntry:r})=>{try{if(!G&&E&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await i(o);e.fetchMetrics=K.renderOpts.fetchMetrics;let s=K.renderOpts.pendingWaitUntil;s&&n.waitUntil&&(n.waitUntil(s),s=void 0);let l=K.renderOpts.collectedTags;if(!k)return await (0,c.sendResponse)(V,X,a,K.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(a.headers);l&&(t[f.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,n=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await I.onRequestError(e,t,{routerKind:"App Router",routePath:m,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:E})},!1,N),t}},d=await I.handleResponse({req:e,nextConfig:W,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:P,isRoutePPREnabled:!1,isOnDemandRevalidate:E,revalidateOnlyGenerated:S,responseGenerator:l,waitUntil:n.waitUntil,isMinimalMode:G});if(!k)return null;if((null==d||null==(a=d.value)?void 0:a.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(s=d.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});G||t.setHeader("x-nextjs-cache",E?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),T&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return G&&k||u.delete(f.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,w.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(V,X,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};L&&M?await s(M):(o=U.getActiveScopeSpan(),await U.withPropagatedContext(e.headers,()=>U.trace(u.BaseServerSpan.handleRequest,{spanName:`${F} ${m}`,kind:a.SpanKind.SERVER,attributes:{"http.method":F,"http.target":e.url}},s),void 0,!L))}catch(t){if(t instanceof x.NoFallbackError||await I.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:E})},!1,N),k)throw t;return await (0,c.sendResponse)(V,X,new Response(null,{status:500})),null}}e.s(["handler",0,O,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:N,workUnitAsyncStorage:E})},"routeModule",0,I,"serverHooks",0,S,"workAsyncStorage",0,N,"workUnitAsyncStorage",0,E],80385)}];