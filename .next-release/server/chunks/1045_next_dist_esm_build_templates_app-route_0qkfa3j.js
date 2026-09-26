module.exports=[808996,e=>{"use strict";var t=e.i(798012),r=e.i(740203),n=e.i(743124),i=e.i(726557),o=e.i(380097),a=e.i(407954),l=e.i(68169),s=e.i(962345),d=e.i(755589),u=e.i(289022),p=e.i(535272),c=e.i(731215),h=e.i(274976),m=e.i(452518),g=e.i(24020),f=e.i(193695);e.i(802255);var S=e.i(226608),I=e.i(874533),w=e.i(660526),v=e.i(812709),T=e.i(960882);async function y(){try{let e=await function(){switch(w.default.platform()){case"win32":let e,t;return e=(0,T.t)("pickFolder.title"),t=`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class Foreground
{
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr pid);
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
}
"@
$modern = $true
try {
  $code = @"
using System;
using System.Runtime.InteropServices;

namespace ModernDialog
{
    [ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IShellItem
    {
        void BindToHandler(IntPtr pbc, [MarshalAs(UnmanagedType.LPStruct)] Guid bhid, [MarshalAs(UnmanagedType.LPStruct)] Guid riid, out IntPtr ppv);
        void GetParent(out IShellItem ppsi);
        void GetDisplayName(uint sigdnName, out IntPtr ppszName);
        void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);
        void Compare(IShellItem psi, uint hint, out int piOrder);
    }

    [ComImport, Guid("42F85136-DB7E-439C-85F1-E4075D135FC8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IFileDialog
    {
        [PreserveSig] int Show(IntPtr parent);
        void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);
        void SetFileTypeIndex(uint iFileType);
        void GetFileTypeIndex(out uint piFileType);
        void Advise(IntPtr pfde, out uint pdwCookie);
        void Unadvise(uint dwCookie);
        void SetOptions(uint fos);
        void GetOptions(out uint pfos);
        void SetDefaultFolder(IShellItem psi);
        void SetFolder(IShellItem psi);
        void GetFolder(out IShellItem ppsi);
        void GetCurrentSelection(out IShellItem ppsi);
        void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        void GetFileName(out IntPtr pszName);
        void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);
        void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);
        void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);
        void GetResult(out IShellItem ppsi);
        void AddPlace(IShellItem psi, int fdap);
        void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);
        void Close(int hr);
        void SetClientGuid([MarshalAs(UnmanagedType.LPStruct)] Guid guid);
        void ClearClientData();
        void SetFilter(IntPtr pFilter);
    }

    [ComImport, Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")]
    internal class FileOpenDialogRCW { }

    public static class FolderPicker
    {
        public static string Pick(string title, IntPtr owner)
        {
            IFileDialog dialog = (IFileDialog)(new FileOpenDialogRCW());
            uint options;
            dialog.GetOptions(out options);
            // FOS_PICKFOLDERS (0x20) | FOS_FORCEFILESYSTEM (0x40)
            dialog.SetOptions(options | 0x20 | 0x40);
            if (!string.IsNullOrEmpty(title)) dialog.SetTitle(title);
            int hr = dialog.Show(owner);
            if (hr != 0) return null; // cancelled
            IShellItem item;
            dialog.GetResult(out item);
            IntPtr pszPath;
            item.GetDisplayName(0x80058000, out pszPath); // SIGDN_FILESYSPATH
            string path = Marshal.PtrToStringUni(pszPath);
            Marshal.FreeCoTaskMem(pszPath);
            return path;
        }
    }
}
"@
  Add-Type -TypeDefinition $code | Out-Null
} catch {
  $modern = $false
}

# Invisible 1x1 owner: the dialog hangs off it, so raising it raises the dialog.
$owner = New-Object System.Windows.Forms.Form
$owner.ShowInTaskbar = $false
$owner.Opacity = 0
$owner.Width = 1
$owner.Height = 1
$owner.Show()
$h = $owner.Handle

# Borrow the foreground thread's input queue for the moment it takes to raise
# the owner. Without it this process holds no foreground rights, and BOTH the
# raise and the topmost lift are refused in silence -- see the note above.
$fg = [Foreground]::GetForegroundWindow()
$fgThread = [Foreground]::GetWindowThreadProcessId($fg, [IntPtr]::Zero)
$myThread = [Foreground]::GetCurrentThreadId()
$attached = $false
if ($fgThread -ne 0 -and $fgThread -ne $myThread) {
  $attached = [Foreground]::AttachThreadInput($myThread, $fgThread, $true)
}
try {
  # HWND_TOPMOST then HWND_NOTOPMOST lifts the owner clear of the browser
  # without leaving the picker pinned above every other window while it is open.
  # SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE = 0x1|0x2|0x10
  [Foreground]::SetWindowPos($h, [IntPtr](-1), 0, 0, 0, 0, 0x13) | Out-Null
  [Foreground]::SetWindowPos($h, [IntPtr](-2), 0, 0, 0, 0, 0x13) | Out-Null
  [Foreground]::BringWindowToTop($h) | Out-Null
  [Foreground]::SetForegroundWindow($h) | Out-Null
} finally {
  if ($attached) { [Foreground]::AttachThreadInput($myThread, $fgThread, $false) | Out-Null }
}

$path = $null
if ($modern) {
  try {
    $path = [ModernDialog.FolderPicker]::Pick('${e}', $h)
  } catch {
    $modern = $false
  }
}
if (-not $modern) {
  # Fallback: legacy tree dialog if the modern one can't be created.
  $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
  $dlg.Description = '${e}'
  $dlg.ShowNewFolderButton = $true
  if ($dlg.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { $path = $dlg.SelectedPath }
}
$owner.Dispose()
# Emit UTF-8 bytes as base64 — see the note above this template for why.
if ($path) { [Console]::Out.Write('B64:' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($path))) }
`,P("powershell.exe",["-NoProfile","-STA","-EncodedCommand",Buffer.from(t,"utf16le").toString("base64")]).then(F);case"darwin":let r;return r=(0,T.t)("pickFolder.title").replace(/\\/g,"\\\\").replace(/"/g,'\\"'),P("osascript",["-e",`set chosen to missing value
try
	tell application "System Events"
		activate
		set chosen to (choose folder with prompt "${r}")
	end tell
on error errMsg number errNum
	if errNum is -128 then return ""
	try
		set chosen to (choose folder with prompt "${r}")
	on error
		return ""
	end try
end try
if chosen is missing value then return ""
return POSIX path of chosen`]);default:return P("zenity",["--file-selection","--directory",`--title=${(0,T.t)("pickFolder.title")}`])}}();return v.NextResponse.json({path:e})}catch(e){return v.NextResponse.json({path:null,error:e.message},{status:500})}}function P(e,t,{allowNonZero:r=!1}={}){return new Promise((n,i)=>{(0,I.execFile)(e,t,{windowsHide:!0,timeout:3e5,maxBuffer:1048576},(e,t)=>{let i=(t??"").trim();if(e&&!r)return i?n(i):n(null);n(i||null)})})}function F(e){if(!e)return null;let t=e.lastIndexOf("B64:");return t<0?e:Buffer.from(e.slice(t+4),"base64").toString("utf8").trim()||null}e.s(["POST",0,y,"runtime",0,"nodejs"],239059);var R=e.i(239059);let $=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/pick-folder/route",pathname:"/api/pick-folder",filename:"route",bundlePath:""},distDir:".next-release",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/pick-folder/route.ts",nextConfigOutput:"standalone",userland:R,...{}}),{workAsyncStorage:C,workUnitAsyncStorage:E,serverHooks:x}=$;async function b(e,t,n){n.requestMeta&&(0,i.setRequestMeta)(e,n.requestMeta),$.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let I="/api/pick-folder/route";I=I.replace(/\/index$/,"")||"/";let w=await $.prepare(e,t,{srcPage:I,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:v,deploymentId:T,params:y,nextConfig:P,parsedUrl:F,isDraftMode:R,prerenderManifest:C,routerServerContext:E,isOnDemandRevalidate:x,revalidateOnlyGenerated:b,resolvedPathname:A,clientReferenceManifest:O,serverActionsManifest:N}=w,D=(0,l.normalizeAppPath)(I),W=!!(C.dynamicRoutes[D]||C.routes[A]),k=async()=>((null==E?void 0:E.render404)?await E.render404(e,t,F,!1):t.end("This page could not be found"),null);if(W&&!R){let e=!!C.routes[A],t=C.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(P.adapterPath)return await k();throw new f.NoFallbackError}}let M=null;!W||$.isDev||R||(M="/index"===(M=A)?"/":M);let G=!0===$.isDev||!W,U=W&&!G;N&&O&&(0,a.setManifestsSingleton)({page:I,clientReferenceManifest:O,serverActionsManifest:N});let _=e.method||"GET",H=(0,o.getTracer)(),B=H.getActiveScopeSpan(),q=!!(null==E?void 0:E.isWrappedByNextServer),L=!!(0,i.getRequestMeta)(e,"minimalMode"),z=(0,i.getRequestMeta)(e,"incrementalCache")||await $.getIncrementalCache(e,P,C,L);null==z||z.resetRequestCache(),globalThis.__incrementalCache=z;let j={params:y,previewProps:C.preview,renderOpts:{experimental:{authInterrupts:!!P.experimental.authInterrupts},cacheComponents:!!P.cacheComponents,supportsDynamicResponse:G,incrementalCache:z,cacheLifeProfiles:P.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,i)=>$.onRequestError(e,t,n,i,E)},sharedContext:{buildId:v,deploymentId:T}},K=new s.NodeNextRequest(e),V=new s.NodeNextResponse(t),X=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i,a=async e=>$.handle(X,j).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${_} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),i&&i!==e&&(i.setAttribute("http.route",n),i.updateName(t))}else e.updateName(`${_} ${I}`)}),l=async i=>{var o,l;let s=async({previousCacheEntry:r})=>{try{if(!L&&x&&b&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await a(i);e.fetchMetrics=j.renderOpts.fetchMetrics;let l=j.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let s=j.renderOpts.collectedTags;if(!W)return await (0,c.sendResponse)(K,V,o,j.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);s&&(t[g.NEXT_CACHE_TAGS_HEADER]=s),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==j.renderOpts.collectedRevalidate&&!(j.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&j.renderOpts.collectedRevalidate,n=void 0===j.renderOpts.collectedExpire||j.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:j.renderOpts.collectedExpire;return{value:{kind:S.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await $.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:x})},!1,E),t}},d=await $.handleResponse({req:e,nextConfig:P,cacheKey:M,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:x,revalidateOnlyGenerated:b,responseGenerator:s,waitUntil:n.waitUntil,isMinimalMode:L});if(!W)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==S.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});L||t.setHeader("x-nextjs-cache",x?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),R&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return L&&W||u.delete(g.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,m.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(K,V,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};q&&B?await l(B):(i=H.getActiveScopeSpan(),await H.withPropagatedContext(e.headers,()=>H.trace(u.BaseServerSpan.handleRequest,{spanName:`${_} ${I}`,kind:o.SpanKind.SERVER,attributes:{"http.method":_,"http.target":e.url}},l),void 0,!q))}catch(t){if(t instanceof f.NoFallbackError||await $.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:x})},!1,E),W)throw t;return await (0,c.sendResponse)(K,V,new Response(null,{status:500})),null}}e.s(["handler",0,b,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:E})},"routeModule",0,$,"serverHooks",0,x,"workAsyncStorage",0,C,"workUnitAsyncStorage",0,E],808996)}];