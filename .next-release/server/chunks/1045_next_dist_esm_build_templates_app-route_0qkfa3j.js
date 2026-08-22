module.exports=[808996,e=>{"use strict";var t=e.i(798012),r=e.i(740203),n=e.i(743124),i=e.i(726557),o=e.i(380097),a=e.i(407954),l=e.i(68169),s=e.i(962345),d=e.i(755589),u=e.i(289022),p=e.i(535272),c=e.i(731215),h=e.i(274976),m=e.i(452518),g=e.i(24020),f=e.i(193695);e.i(802255);var v=e.i(226608),S=e.i(874533),w=e.i(660526),I=e.i(812709),y=e.i(960882);async function R(){try{let e=await function(){switch(w.default.platform()){case"win32":let e,t;return e=(0,y.t)("pickFolder.title"),t=`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
# Invisible TopMost owner so the dialog opens in front of the browser.
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.ShowInTaskbar = $false
$owner.Opacity = 0
$owner.Width = 1
$owner.Height = 1
$owner.Show()
$owner.Activate()
$h = $owner.Handle
$path = $null
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
  $path = [ModernDialog.FolderPicker]::Pick('${e}', $h)
} catch {
  # Fallback: legacy tree dialog if the modern one can't be created.
  $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
  $dlg.Description = '${e}'
  $dlg.ShowNewFolderButton = $true
  if ($dlg.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { $path = $dlg.SelectedPath }
}
$owner.Dispose()
# Emit UTF-8 bytes as base64 — see the note above this template for why.
if ($path) { [Console]::Out.Write('B64:' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($path))) }
`,C("powershell.exe",["-NoProfile","-STA","-EncodedCommand",Buffer.from(t,"utf16le").toString("base64")]).then(E);case"darwin":let r;return r=(0,y.t)("pickFolder.title").replace(/\\/g,"\\\\").replace(/"/g,'\\"'),C("osascript",["-e",`set chosen to missing value
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
return POSIX path of chosen`]);default:return C("zenity",["--file-selection","--directory",`--title=${(0,y.t)("pickFolder.title")}`])}}();return I.NextResponse.json({path:e})}catch(e){return I.NextResponse.json({path:null,error:e.message},{status:500})}}function C(e,t,{allowNonZero:r=!1}={}){return new Promise((n,i)=>{(0,S.execFile)(e,t,{windowsHide:!0,timeout:3e5,maxBuffer:1048576},(e,t)=>{let i=(t??"").trim();if(e&&!r)return i?n(i):n(null);n(i||null)})})}function E(e){if(!e)return null;let t=e.lastIndexOf("B64:");return t<0?e:Buffer.from(e.slice(t+4),"base64").toString("utf8").trim()||null}e.s(["POST",0,R,"runtime",0,"nodejs"],239059);var T=e.i(239059);let P=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/pick-folder/route",pathname:"/api/pick-folder",filename:"route",bundlePath:""},distDir:".next-release",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/pick-folder/route.ts",nextConfigOutput:"standalone",userland:T,...{}}),{workAsyncStorage:A,workUnitAsyncStorage:F,serverHooks:x}=P;async function b(e,t,n){n.requestMeta&&(0,i.setRequestMeta)(e,n.requestMeta),P.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let S="/api/pick-folder/route";S=S.replace(/\/index$/,"")||"/";let w=await P.prepare(e,t,{srcPage:S,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:I,deploymentId:y,params:R,nextConfig:C,parsedUrl:E,isDraftMode:T,prerenderManifest:A,routerServerContext:F,isOnDemandRevalidate:x,revalidateOnlyGenerated:b,resolvedPathname:N,clientReferenceManifest:$,serverActionsManifest:O}=w,D=(0,l.normalizeAppPath)(S),k=!!(A.dynamicRoutes[D]||A.routes[N]),M=async()=>((null==F?void 0:F.render404)?await F.render404(e,t,E,!1):t.end("This page could not be found"),null);if(k&&!T){let e=!!A.routes[N],t=A.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(C.adapterPath)return await M();throw new f.NoFallbackError}}let U=null;!k||P.isDev||T||(U="/index"===(U=N)?"/":U);let _=!0===P.isDev||!k,G=k&&!_;O&&$&&(0,a.setManifestsSingleton)({page:S,clientReferenceManifest:$,serverActionsManifest:O});let H=e.method||"GET",B=(0,o.getTracer)(),q=B.getActiveScopeSpan(),L=!!(null==F?void 0:F.isWrappedByNextServer),W=!!(0,i.getRequestMeta)(e,"minimalMode"),z=(0,i.getRequestMeta)(e,"incrementalCache")||await P.getIncrementalCache(e,C,A,W);null==z||z.resetRequestCache(),globalThis.__incrementalCache=z;let j={params:R,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:_,incrementalCache:z,cacheLifeProfiles:C.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,i)=>P.onRequestError(e,t,n,i,F)},sharedContext:{buildId:I,deploymentId:y}},K=new s.NodeNextRequest(e),X=new s.NodeNextResponse(t),V=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i,a=async e=>P.handle(V,j).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=B.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${H} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),i&&i!==e&&(i.setAttribute("http.route",n),i.updateName(t))}else e.updateName(`${H} ${S}`)}),l=async i=>{var o,l;let s=async({previousCacheEntry:r})=>{try{if(!W&&x&&b&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await a(i);e.fetchMetrics=j.renderOpts.fetchMetrics;let l=j.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let s=j.renderOpts.collectedTags;if(!k)return await (0,c.sendResponse)(K,X,o,j.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);s&&(t[g.NEXT_CACHE_TAGS_HEADER]=s),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==j.renderOpts.collectedRevalidate&&!(j.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&j.renderOpts.collectedRevalidate,n=void 0===j.renderOpts.collectedExpire||j.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:j.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await P.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:G,isOnDemandRevalidate:x})},!1,F),t}},d=await P.handleResponse({req:e,nextConfig:C,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:x,revalidateOnlyGenerated:b,responseGenerator:s,waitUntil:n.waitUntil,isMinimalMode:W});if(!k)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});W||t.setHeader("x-nextjs-cache",x?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),T&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return W&&k||u.delete(g.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,m.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(K,X,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};L&&q?await l(q):(i=B.getActiveScopeSpan(),await B.withPropagatedContext(e.headers,()=>B.trace(u.BaseServerSpan.handleRequest,{spanName:`${H} ${S}`,kind:o.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l),void 0,!L))}catch(t){if(t instanceof f.NoFallbackError||await P.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:G,isOnDemandRevalidate:x})},!1,F),k)throw t;return await (0,c.sendResponse)(K,X,new Response(null,{status:500})),null}}e.s(["handler",0,b,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:F})},"routeModule",0,P,"serverHooks",0,x,"workAsyncStorage",0,A,"workUnitAsyncStorage",0,F],808996)}];