module.exports=[270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},653828,660094,e=>{"use strict";var t=e.i(353500),r=e.i(80232),n=e.i(812759);function i(e,t){return null!=e?e.trim()||null:t?.trim()||null}function o(e){let i=r.db.select().from(n.schema.appSettings).where((0,t.eq)(n.schema.appSettings.key,e)).get();return i?.value??null}e.s(["preferStored",0,i,"resolveRunToken",0,function(e){if(null!==e.storedToken&&void 0!==e.storedToken)return e.storedToken.trim()||null;let t=e.envToken?.trim();if(!t)return null;let r=e.storedKey?.trim();return r&&r!==e.envKey?.trim()?null:t}],660094),e.s(["getSetting",0,o,"getSettingOrEnv",0,function(e,t){return i(o(e),t)},"setSetting",0,function(e,t){r.db.insert(n.schema.appSettings).values({key:e,value:t,updatedAt:Math.floor(Date.now()/1e3)}).onConflictDoUpdate({target:n.schema.appSettings.key,set:{value:t,updatedAt:Math.floor(Date.now()/1e3)}}).run()}],653828)},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},750227,(e,t,r)=>{t.exports=e.x("node:path",()=>require("node:path"))},951389,(e,t,r)=>{t.exports=e.x("better-sqlite3-a9b1042fd0ef418e",()=>require("better-sqlite3-a9b1042fd0ef418e"))},874533,(e,t,r)=>{t.exports=e.x("node:child_process",()=>require("node:child_process"))},660526,(e,t,r)=>{t.exports=e.x("node:os",()=>require("node:os"))},530862,e=>{"use strict";var t=e.i(713772),r=e.i(423693),n=e.i(792294),i=e.i(914761),o=e.i(918167),a=e.i(368750),s=e.i(919487),l=e.i(498466),d=e.i(883242),p=e.i(829785),u=e.i(965562),c=e.i(427424),h=e.i(923461),m=e.i(235205),g=e.i(459906),f=e.i(193695);e.i(152731);var v=e.i(736998),S=e.i(874533),w=e.i(660526),x=e.i(538834),y=e.i(960882);async function I(){try{let e=await function(){switch(w.default.platform()){case"win32":let e,t;return e=(0,y.t)("pickFolder.title"),t=`
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
if ($path) { [Console]::Out.Write($path) }
`,R("powershell.exe",["-NoProfile","-STA","-EncodedCommand",Buffer.from(t,"utf16le").toString("base64")]);case"darwin":let r;return r=(0,y.t)("pickFolder.title").replace(/\\/g,"\\\\").replace(/"/g,'\\"'),R("osascript",["-e",`set chosen to missing value
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
return POSIX path of chosen`]);default:return R("zenity",["--file-selection","--directory",`--title=${(0,y.t)("pickFolder.title")}`])}}();return x.NextResponse.json({path:e})}catch(e){return x.NextResponse.json({path:null,error:e.message},{status:500})}}function R(e,t,{allowNonZero:r=!1}={}){return new Promise((n,i)=>{(0,S.execFile)(e,t,{windowsHide:!0,timeout:3e5,maxBuffer:1048576},(e,t)=>{let i=(t??"").trim();if(e&&!r)return i?n(i):n(null);n(i||null)})})}e.s(["POST",0,I,"runtime",0,"nodejs"],239059);var C=e.i(239059);let T=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/pick-folder/route",pathname:"/api/pick-folder",filename:"route",bundlePath:""},distDir:".next-release",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/pick-folder/route.ts",nextConfigOutput:"standalone",userland:C,...{}}),{workAsyncStorage:E,workUnitAsyncStorage:P,serverHooks:A}=T;async function F(e,t,n){n.requestMeta&&(0,i.setRequestMeta)(e,n.requestMeta),T.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let S="/api/pick-folder/route";S=S.replace(/\/index$/,"")||"/";let w=await T.prepare(e,t,{srcPage:S,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:x,deploymentId:y,params:I,nextConfig:R,parsedUrl:C,isDraftMode:E,prerenderManifest:P,routerServerContext:A,isOnDemandRevalidate:F,revalidateOnlyGenerated:b,resolvedPathname:k,clientReferenceManifest:N,serverActionsManifest:$}=w,D=(0,s.normalizeAppPath)(S),O=!!(P.dynamicRoutes[D]||P.routes[k]),M=async()=>((null==A?void 0:A.render404)?await A.render404(e,t,C,!1):t.end("This page could not be found"),null);if(O&&!E){let e=!!P.routes[k],t=P.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(R.adapterPath)return await M();throw new f.NoFallbackError}}let q=null;!O||T.isDev||E||(q="/index"===(q=k)?"/":q);let U=!0===T.isDev||!O,_=O&&!U;$&&N&&(0,a.setManifestsSingleton)({page:S,clientReferenceManifest:N,serverActionsManifest:$});let G=e.method||"GET",j=(0,o.getTracer)(),H=j.getActiveScopeSpan(),L=!!(null==A?void 0:A.isWrappedByNextServer),W=!!(0,i.getRequestMeta)(e,"minimalMode"),B=(0,i.getRequestMeta)(e,"incrementalCache")||await T.getIncrementalCache(e,R,P,W);null==B||B.resetRequestCache(),globalThis.__incrementalCache=B;let z={params:I,previewProps:P.preview,renderOpts:{experimental:{authInterrupts:!!R.experimental.authInterrupts},cacheComponents:!!R.cacheComponents,supportsDynamicResponse:U,incrementalCache:B,cacheLifeProfiles:R.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,i)=>T.onRequestError(e,t,n,i,A)},sharedContext:{buildId:x,deploymentId:y}},K=new l.NodeNextRequest(e),X=new l.NodeNextResponse(t),V=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i,a=async e=>T.handle(V,z).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=j.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${G} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),i&&i!==e&&(i.setAttribute("http.route",n),i.updateName(t))}else e.updateName(`${G} ${S}`)}),s=async i=>{var o,s;let l=async({previousCacheEntry:r})=>{try{if(!W&&F&&b&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await a(i);e.fetchMetrics=z.renderOpts.fetchMetrics;let s=z.renderOpts.pendingWaitUntil;s&&n.waitUntil&&(n.waitUntil(s),s=void 0);let l=z.renderOpts.collectedTags;if(!O)return await (0,c.sendResponse)(K,X,o,z.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[g.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==z.renderOpts.collectedRevalidate&&!(z.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&z.renderOpts.collectedRevalidate,n=void 0===z.renderOpts.collectedExpire||z.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:z.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await T.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:_,isOnDemandRevalidate:F})},!1,A),t}},d=await T.handleResponse({req:e,nextConfig:R,cacheKey:q,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:P,isRoutePPREnabled:!1,isOnDemandRevalidate:F,revalidateOnlyGenerated:b,responseGenerator:l,waitUntil:n.waitUntil,isMinimalMode:W});if(!O)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(s=d.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});W||t.setHeader("x-nextjs-cache",F?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let p=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return W&&O||p.delete(g.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||p.get("Cache-Control")||p.set("Cache-Control",(0,m.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(K,X,new Response(d.value.body,{headers:p,status:d.value.status||200})),null};L&&H?await s(H):(i=j.getActiveScopeSpan(),await j.withPropagatedContext(e.headers,()=>j.trace(p.BaseServerSpan.handleRequest,{spanName:`${G} ${S}`,kind:o.SpanKind.SERVER,attributes:{"http.method":G,"http.target":e.url}},s),void 0,!L))}catch(t){if(t instanceof f.NoFallbackError||await T.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:_,isOnDemandRevalidate:F})},!1,A),O)throw t;return await (0,c.sendResponse)(K,X,new Response(null,{status:500})),null}}e.s(["handler",0,F,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:P})},"routeModule",0,T,"serverHooks",0,A,"workAsyncStorage",0,E,"workUnitAsyncStorage",0,P],530862)}];