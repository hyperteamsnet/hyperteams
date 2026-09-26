module.exports=[80385,e=>{"use strict";var t=e.i(798012),r=e.i(740203),n=e.i(743124),o=e.i(726557),a=e.i(380097),i=e.i(407954),l=e.i(68169),s=e.i(962345),d=e.i(755589),u=e.i(289022),c=e.i(535272),p=e.i(731215),h=e.i(274976),w=e.i(452518),f=e.i(24020),g=e.i(193695);e.i(802255);var m=e.i(226608),R=e.i(874533),$=e.i(912714),x=e.i(660526),W=e.i(750227),v=e.i(812709),T=e.i(834847),P=e.i(960882);async function I(e){let{path:t}=await e.json().catch(()=>({}));if(!t)return v.NextResponse.json({error:(0,P.t)("err.pathRequired")},{status:400});if(!(0,T.withinWorkspaces)(t))return v.NextResponse.json({error:(0,P.t)("err.outsideWorkspaceOpen")},{status:403});let r=W.default.resolve(t);try{if(!(await (0,$.stat)(r)).isDirectory())return v.NextResponse.json({error:(0,P.t)("err.notADirectoryPlain")},{status:400})}catch{return v.NextResponse.json({error:(0,P.t)("err.folderNotFound")},{status:404})}try{let e=await function(e){if("win32"===x.default.platform()){let t,r,n;return t=e.replace(/'/g,"''"),r=`
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
if (-not $wnd) { throw '${(0,P.t)("err.explorerWindowNotFound").replace(/'/g,"''")}' }

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
`,n=Buffer.from(r,"utf16le").toString("base64"),new Promise((e,t)=>{(0,R.execFile)("powershell.exe",["-NoProfile","-STA","-EncodedCommand",n],{windowsHide:!0,timeout:2e4},(r,n,o)=>{if(r)return t(Error((o??"").trim().split("\n")[0]||(0,P.t)("err.explorerFailed")));e((n??"").trim().endsWith("foreground")?"foreground":"opened")})})}}(r);return v.NextResponse.json({ok:!0,result:e})}catch(e){return v.NextResponse.json({error:e.message},{status:500})}}e.s(["POST",0,I,"runtime",0,"nodejs"],396590);var y=e.i(396590);let N=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/open-folder/route",pathname:"/api/open-folder",filename:"route",bundlePath:""},distDir:".next-release",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/open-folder/route.ts",nextConfigOutput:"standalone",userland:y,...{}}),{workAsyncStorage:b,workUnitAsyncStorage:E,serverHooks:S}=N;async function O(e,t,n){n.requestMeta&&(0,o.setRequestMeta)(e,n.requestMeta),N.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let R="/api/open-folder/route";R=R.replace(/\/index$/,"")||"/";let $=await N.prepare(e,t,{srcPage:R,multiZoneDraftMode:!1});if(!$)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:x,deploymentId:W,params:v,nextConfig:T,parsedUrl:P,isDraftMode:I,prerenderManifest:y,routerServerContext:b,isOnDemandRevalidate:E,revalidateOnlyGenerated:S,resolvedPathname:O,clientReferenceManifest:C,serverActionsManifest:A}=$,D=(0,l.normalizeAppPath)(R),_=!!(y.dynamicRoutes[D]||y.routes[O]),k=async()=>((null==b?void 0:b.render404)?await b.render404(e,t,P,!1):t.end("This page could not be found"),null);if(_&&!I){let e=!!y.routes[O],t=y.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(T.adapterPath)return await k();throw new g.NoFallbackError}}let q=null;!_||N.isDev||I||(q="/index"===(q=O)?"/":q);let H=!0===N.isDev||!_,F=_&&!H;A&&C&&(0,i.setManifestsSingleton)({page:R,clientReferenceManifest:C,serverActionsManifest:A});let U=e.method||"GET",M=(0,a.getTracer)(),j=M.getActiveScopeSpan(),L=!!(null==b?void 0:b.isWrappedByNextServer),G=!!(0,o.getRequestMeta)(e,"minimalMode"),B=(0,o.getRequestMeta)(e,"incrementalCache")||await N.getIncrementalCache(e,T,y,G);null==B||B.resetRequestCache(),globalThis.__incrementalCache=B;let K={params:v,previewProps:y.preview,renderOpts:{experimental:{authInterrupts:!!T.experimental.authInterrupts},cacheComponents:!!T.cacheComponents,supportsDynamicResponse:H,incrementalCache:B,cacheLifeProfiles:T.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,o)=>N.onRequestError(e,t,n,o,b)},sharedContext:{buildId:x,deploymentId:W}},V=new s.NodeNextRequest(e),X=new s.NodeNextResponse(t),Z=d.NextRequestAdapter.fromNodeNextRequest(V,(0,d.signalFromNodeResponse)(t));try{let o,i=async e=>N.handle(Z,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${U} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),o&&o!==e&&(o.setAttribute("http.route",n),o.updateName(t))}else e.updateName(`${U} ${R}`)}),l=async o=>{var a,l;let s=async({previousCacheEntry:r})=>{try{if(!G&&E&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await i(o);e.fetchMetrics=K.renderOpts.fetchMetrics;let l=K.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let s=K.renderOpts.collectedTags;if(!_)return await (0,p.sendResponse)(V,X,a,K.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(a.headers);s&&(t[f.NEXT_CACHE_TAGS_HEADER]=s),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,n=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:m.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:R,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:E})},!1,b),t}},d=await N.handleResponse({req:e,nextConfig:T,cacheKey:q,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:E,revalidateOnlyGenerated:S,responseGenerator:s,waitUntil:n.waitUntil,isMinimalMode:G});if(!_)return null;if((null==d||null==(a=d.value)?void 0:a.kind)!==m.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});G||t.setHeader("x-nextjs-cache",E?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),I&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return G&&_||u.delete(f.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,w.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(V,X,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};L&&j?await l(j):(o=M.getActiveScopeSpan(),await M.withPropagatedContext(e.headers,()=>M.trace(u.BaseServerSpan.handleRequest,{spanName:`${U} ${R}`,kind:a.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},l),void 0,!L))}catch(t){if(t instanceof g.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:E})},!1,b),_)throw t;return await (0,p.sendResponse)(V,X,new Response(null,{status:500})),null}}e.s(["handler",0,O,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:b,workUnitAsyncStorage:E})},"routeModule",0,N,"serverHooks",0,S,"workAsyncStorage",0,b,"workUnitAsyncStorage",0,E],80385)}];