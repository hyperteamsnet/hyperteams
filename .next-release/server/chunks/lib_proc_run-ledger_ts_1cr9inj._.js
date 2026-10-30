module.exports=[689235,e=>{"use strict";var n=e.i(388242),t=e.i(947788),r=e.i(462573),s=e.i(119688),l=e.i(984649),o=e.i(874533),i=e.i(666680);e.i(912714);let a=(0,e.i(812057).promisify)(o.execFile),d="HYPERTEAMS_RUN",$=/^[0-9a-f]{32}$/,u=String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
if (-not [Environment]::Is64BitProcess) { throw 'helper must run as a 64-bit process' }
$ab = [AppDomain]::CurrentDomain.DefineDynamicAssembly((New-Object System.Reflection.AssemblyName('HtRun')), 'Run')
$tb = $ab.DefineDynamicModule('HtRun').DefineType('N', 'Public,Class')
function Def([string]$n, [string]$dll, [Type]$ret, [Type[]]$ps) {
  $m = $tb.DefinePInvokeMethod($n, $dll, 'Public,Static,PinvokeImpl', 'Standard', $ret, $ps, 'Winapi', 'Auto')
  $m.SetImplementationFlags('PreserveSig')
}
$IP = [IntPtr]
$LR = [long].MakeByRefType()
Def 'OpenProcess' 'kernel32.dll' $IP ([Type[]]@([uint32], [bool], [int]))
Def 'CloseHandle' 'kernel32.dll' ([bool]) ([Type[]]@($IP))
Def 'ReadProcessMemory' 'kernel32.dll' ([bool]) ([Type[]]@($IP, $IP, [byte[]], $IP, $IP.MakeByRefType()))
Def 'IsWow64Process' 'kernel32.dll' ([bool]) ([Type[]]@($IP, [bool].MakeByRefType()))
Def 'GetProcessTimes' 'kernel32.dll' ([bool]) ([Type[]]@($IP, $LR, $LR, $LR, $LR))
Def 'TerminateProcess' 'kernel32.dll' ([bool]) ([Type[]]@($IP, [uint32]))
Def 'NtQueryInformationProcess' 'ntdll.dll' ([int]) ([Type[]]@($IP, [int], [byte[]], [int], [int].MakeByRefType()))
$NT = $tb.CreateType()
$TAB = [char]9

function ReadMem($h, [long]$addr, [int]$n) {
  $buf = [byte[]]::new($n)
  $got = [IntPtr]::Zero
  if (-not $NT::ReadProcessMemory($h, [IntPtr]$addr, $buf, [IntPtr]$n, [ref]$got)) { return $null }
  if ($got.ToInt64() -ne $n) { return $null }
  return ,$buf
}

function Created($h) {
  $c = 0L; $e = 0L; $k = 0L; $u = 0L
  if (-not $NT::GetProcessTimes($h, [ref]$c, [ref]$e, [ref]$k, [ref]$u)) { return -1L }
  return [long][math]::Floor(($c - 116444736000000000L) / 10000.0)
}

function EnvText($h, [bool]$wow) {
  $r = 0
  if ($wow) {
    $pb = [byte[]]::new(8)
    if ($NT::NtQueryInformationProcess($h, 26, $pb, 8, [ref]$r) -ne 0) { return $null }
    $peb = [BitConverter]::ToInt64($pb, 0)
    if ($peb -eq 0) { return $null }
    $a = ReadMem $h ($peb + 0x10) 4
    if ($null -eq $a) { return $null }
    $parms = [long][BitConverter]::ToUInt32($a, 0)
    if ($parms -eq 0) { return $null }
    $e = ReadMem $h ($parms + 0x48) 4
    if ($null -eq $e) { return $null }
    $env = [long][BitConverter]::ToUInt32($e, 0)
    $s = ReadMem $h ($parms + 0x290) 4
    if ($null -eq $s) { return $null }
    $size = [long][BitConverter]::ToUInt32($s, 0)
  } else {
    $pb = [byte[]]::new(48)
    if ($NT::NtQueryInformationProcess($h, 0, $pb, 48, [ref]$r) -ne 0) { return $null }
    $peb = [BitConverter]::ToInt64($pb, 8)
    if ($peb -eq 0) { return $null }
    $a = ReadMem $h ($peb + 0x20) 8
    if ($null -eq $a) { return $null }
    $parms = [BitConverter]::ToInt64($a, 0)
    if ($parms -eq 0) { return $null }
    $e = ReadMem $h ($parms + 0x80) 8
    if ($null -eq $e) { return $null }
    $env = [BitConverter]::ToInt64($e, 0)
    $s = ReadMem $h ($parms + 0x3F0) 8
    if ($null -eq $s) { return $null }
    $size = [BitConverter]::ToInt64($s, 0)
  }
  if ($env -eq 0) { return $null }
  if ($size -le 0 -or $size -gt 1048576) { $size = 65536 }
  $blk = ReadMem $h $env ([int]$size)
  if ($null -eq $blk) { return $null }
  return [Text.Encoding]::Unicode.GetString($blk)
}

function DoScan([string]$name) {
  $key = $name + '='
  $sb = New-Object System.Text.StringBuilder
  $ok = 0; $na = 0
  foreach ($p in [Diagnostics.Process]::GetProcesses()) {
    $id = $p.Id
    $p.Dispose()
    if ($id -le 4) { continue }
    $h = $NT::OpenProcess(0x1410, $false, $id)
    if ($h -eq [IntPtr]::Zero) { $na++; continue }
    try {
      $w = $false
      [void]$NT::IsWow64Process($h, [ref]$w)
      $created = Created $h
      $pbi = [byte[]]::new(48)
      $r = 0
      $ppid = 0L
      if ($NT::NtQueryInformationProcess($h, 0, $pbi, 48, [ref]$r) -eq 0) { $ppid = [BitConverter]::ToInt64($pbi, 40) }
      $text = EnvText $h $w
      $state = 'na'
      $value = ''
      if ($null -ne $text) {
        $state = 'ok'
        foreach ($kv in $text.Split([char]0)) {
          if ($kv.Length -eq 0) { break }
          if ($kv.StartsWith($key, [StringComparison]::OrdinalIgnoreCase)) { $value = $kv.Substring($key.Length); break }
        }
        $ok++
      } else { $na++ }
      [void]$sb.Append($id).Append($TAB).Append($ppid).Append($TAB).Append($created).Append($TAB).Append($state).Append($TAB).Append($value).Append([char]10)
    } finally { [void]$NT::CloseHandle($h) }
  }
  [void]$sb.Append('#stats ok=' + $ok + ' na=' + $na + [char]10)
  [void]$sb.Append('#done' + [char]10)
  [Console]::Out.Write($sb.ToString())
}

function DoKill([string]$spec) {
  $sb = New-Object System.Text.StringBuilder
  foreach ($pair in $spec.Split(',')) {
    if ($pair.Length -eq 0) { continue }
    $parts = $pair.Split(':')
    $id = [int]$parts[0]
    $want = [long]$parts[1]
    $h = $NT::OpenProcess(0x1001, $false, $id)
    if ($h -eq [IntPtr]::Zero) {
      $state = 'gone'
      try { $q = [Diagnostics.Process]::GetProcessById($id); $q.Dispose(); $state = 'denied' } catch { }
    } else {
      try {
        $have = Created $h
        if ($have -lt 0 -or [math]::Abs($have - $want) -gt 5) { $state = 'changed' }
        elseif ($NT::TerminateProcess($h, 1)) { $state = 'killed' }
        else { $state = 'denied' }
      } finally { [void]$NT::CloseHandle($h) }
    }
    [void]$sb.Append($id).Append($TAB).Append($state).Append([char]10)
  }
  [void]$sb.Append('#done' + [char]10)
  [Console]::Out.Write($sb.ToString())
}
`;async function p(e,n){try{let t,{stdout:r}=await a("powershell.exe",["-NoProfile","-NonInteractive","-Command",u+e],{maxBuffer:0x1000000,windowsHide:!0,timeout:n,env:(t={...process.env},delete t[d],t)});return{ok:!0,stdout:r}}catch(n){var t;let e;if(n.killed)return{ok:!1,reason:"timed out"};return{ok:!1,reason:((e=[...(t=n.stderr||n.message||"").matchAll(/<S S="Error">([\s\S]*?)<\/S>/g)].map(e=>e[1])).length>0?e.join(""):t).replace(/_x000D__x000A_/g," ").replace(/\s+/g," ").trim().slice(0,300)||"powershell failed"}}}async function c(){{let e=await p(`DoScan '${d}'`,2e4);return e.ok?function(e){let n=e.split(/\r?\n/);if(!n.includes("#done"))return{kind:"failed",reason:"scan output was cut short"};let t=[],r=0;for(let e of n){if(!e||e.startsWith("#"))continue;let[n,s,l,o,i]=e.split("	"),a=Number(n);if(!Number.isInteger(a)||a<=0)continue;let d=Number(l);"ok"!==o&&r++,t.push({pid:a,ppid:Number.isInteger(Number(s))?Number(s):0,started:Number.isFinite(d)&&d>0?d:null,token:"ok"===o&&i&&$.test(i)?i:null})}return{kind:"ok",procs:t,unreadable:r}}(e.stdout):{kind:"failed",reason:e.reason}}}async function f(e){if(0===e.length)return{kind:"ok",killed:[],gone:[],changed:[],denied:[]};let n=e.filter(e=>Number.isInteger(e.pid)&&e.pid>4&&Number.isFinite(e.started));{let e=n.map(e=>`${e.pid}:${Math.round(e.started)}`).join(","),t=await p(`DoKill '${e}'`,2e4);return t.ok?function(e){let n=e.split(/\r?\n/);if(!n.includes("#done"))return{kind:"failed",reason:"kill output was cut short"};let t={killed:[],gone:[],changed:[],denied:[]};for(let e of n){let[n,r]=e.split("	"),s=Number(n);Number.isInteger(s)&&!(s<=0)&&("killed"===r?t.killed.push(s):"gone"===r?t.gone.push(s):"changed"===r?t.changed.push(s):t.denied.push(s))}return{kind:"ok",...t}}(t.stdout):{kind:"failed",reason:t.reason}}}let h=e=>({token:e.token,taskId:e.taskId,engine:e.engine,ownerPid:e.ownerPid,ownerStarted:e.ownerStarted,openedAt:e.openedAt,endedAt:e.endedAt,reapedAt:e.reapedAt}),g=e=>(e instanceof Error?e.message:String(e)).split("\n")[0].slice(0,200),k=globalThis;k.__runLedger?.version!==1&&(k.__runLedger={version:1,ledger:function(e){let s=r.schema.runLeases,o=()=>Math.floor(e.nowMs()/1e3),a=null,$=null,u=!1,p=new Map,c=0,f=0;function k(r){return t.db.select().from(s).where((0,n.and)((0,n.isNotNull)(s.endedAt),(0,n.isNull)(s.reapedAt),(0,n.eq)(s.ownerPid,e.self.pid),void 0===r?void 0:(0,n.eq)(s.taskId,r))).all().map(h).filter(n=>null==n.ownerStarted||(0,l.sameStart)(n.ownerStarted,e.self.started,3e3))}function m(e){0!==e.length&&t.db.update(s).set({reapedAt:o()}).where((0,n.inArray)(s.token,e)).run()}function b(){let e=o();t.db.delete(s).where((0,n.or)((0,n.and)((0,n.isNotNull)(s.reapedAt),(0,n.lt)(s.reapedAt,e-86400)),(0,n.and)((0,n.isNotNull)(s.endedAt),(0,n.lt)(s.openedAt,e-604800)))).run()}async function w(n){let t=[];for(let r=1;r<=e.maxPasses+1;r++){let s,l;try{s=await e.scan()}catch(e){s={kind:"failed",reason:g(e)}}if("ok"!==s.kind){let e="unsupported"===s.kind?"this platform cannot read process environments":s.reason;return y(!1),{clean:!1,ended:t,reason:`scan failed: ${e}`}}y(!0);let o=function(e,n){let t=new Map(e.map(e=>[e.pid,e])),r=new Set;for(let e of n){let n=e;for(;void 0!==n&&n>0&&!r.has(n);)r.add(n),n=t.get(n)?.ppid}return r}(s.procs,[e.self.pid,e.self.ppid]),{victims:i}=function(e){let{procs:n,tokens:t,protect:r}=e,s=new Map;for(let e of n){let n=s.get(e.ppid);n?n.push(e):s.set(e.ppid,[e])}let l=new Map,o=[],i=new Set,a=new Set,d=(e,n)=>{if(!l.has(e.pid)&&!(e.pid<=4)){if(r.has(e.pid))return void a.add(e.pid);if(null==e.started||!Number.isFinite(e.started))return void i.add(e.pid);l.set(e.pid,{pid:e.pid,started:e.started,token:e.token,viaParent:n}),o.push(e)}};for(let e of n)e.token&&t.has(e.token)&&d(e,!1);for(;o.length>0;){let e=o.shift();for(let n of s.get(e.pid)??[])n.ppid===e.pid&&null!=e.started&&null!=n.started&&e.started<=n.started&&(null==n.token||t.has(n.token))&&d(n,!0)}return{victims:[...l.values()],skippedNoStart:i.size,skippedProtected:a.size}}({procs:s.procs,tokens:n,protect:o}),a=i.filter(n=>n.pid!==e.self.pid).map(({pid:e,started:n})=>({pid:e,started:n}));if(0===a.length)return{clean:!0,ended:t};if(r>e.maxPasses)return{clean:!1,ended:t,reason:`${a.length} process(es) still running after ${e.maxPasses} rounds`};try{l=await e.kill(a)}catch(e){l={kind:"failed",reason:g(e)}}if("ok"!==l.kind)return{clean:!1,ended:t,reason:`kill failed: ${l.reason}`};if(t.push(...l.killed),0===l.killed.length&&0===l.gone.length&&0===l.changed.length)return{clean:!1,ended:t,reason:`${l.denied.length} process(es) could not be ended (access denied)`}}return{clean:!1,ended:t,reason:"gave up"}}function y(n){if(n){c=0;return}++c>=e.scanBreaker.failures&&(f=e.nowMs()+e.scanBreaker.pauseMs,c=0)}function T(e){a||(a=setTimeout(()=>{a=null,A()},e),a.unref?.())}async function P(){let n=k().filter(n=>(p.get(n.token)??0)<e.maxAttempts);if(0===n.length)return void b();if(e.nowMs()<f)return void T(f-e.nowMs());let t=await w(new Set(n.map(e=>e.token))),r=v(n);if(t.clean){for(let e of(m(n.map(e=>e.token)),n))p.delete(e.token);t.ended.length>0&&e.log(`[procs] ended ${t.ended.length} process(es) left by ${r}: ${t.ended.join(",")}`)}else{let s=Math.max(...n.map(e=>(p.get(e.token)??0)+1));for(let e of n)p.set(e.token,(p.get(e.token)??0)+1);let l=e.retryMs[Math.min(s-1,e.retryMs.length-1)]??6e4,o=t.ended.length>0?`ended ${t.ended.length} process(es) (${t.ended.join(",")}), but `:"";e.log(`[procs] ${o}did not finish ending the processes of ${r} — ${t.reason}; retrying in ${Math.round(l/1e3)}s`),s<e.maxAttempts&&T(l)}b()}function v(e){let n=[...new Set(e.map(e=>e.taskId).filter(e=>null!=e))],t=1===e.length?`run ${e[0].token.slice(0,8)}`:`${e.length} runs`;return n.length>0?`${t} (task ${n.join(",")})`:t}function A(){return $?(u=!0,$):$=(async()=>{try{do{u=!1;try{await P()}catch(n){e.log(`[procs] drain failed: ${g(n)}`)}}while(u)}finally{$=null}})()}return{openRunLease(n){if(!e.enabled())return null;try{let r=(0,i.randomBytes)(16).toString("hex");return t.db.insert(s).values({token:r,taskId:n.taskId,engine:n.engine,ownerPid:e.self.pid,ownerStarted:Math.round(e.self.started),openedAt:o()}).run(),{token:r,env:{[d]:r}}}catch(n){return e.log(`[procs] could not open a run lease: ${g(n)}`),null}},endRunLease(r){try{t.db.update(s).set({endedAt:o()}).where((0,n.and)((0,n.eq)(s.token,r),(0,n.isNull)(s.endedAt))).run(),T(e.debounceMs)}catch(n){e.log(`[procs] could not close a run lease: ${g(n)}`)}},async endTaskRunProcesses(n,t={}){try{let e,r=k(n);if(0===r.length)return!0;for(let e of r)p.delete(e.token);return await Promise.race([A(),new Promise(n=>{e=setTimeout(n,t.deadlineMs??3e4)})]),e&&clearTimeout(e),0===k(n).length}catch(n){return e.log(`[procs] ending a task's processes failed: ${g(n)}`),!1}},async sweepRunLeases(){let r=t.db.select().from(s).where((0,n.isNull)(s.reapedAt)).all().map(h),i=e.enabled(),a=e.ownsInstallTree(),d=null;if(i&&a&&r.length>0)try{d=await e.table()}catch(n){e.log(`[procs] boot sweep: could not read the process table (${g(n)}); leaving ${r.length} lease(s) for later`)}let $=function(e){if(!e.enabled)return{kind:"skip",reason:"disabled"};if(!e.ownsInstallTree)return{kind:"skip",reason:"not-install-owner"};let n=e.leases.filter(e=>null==e.reapedAt);if(0===n.length)return{kind:"skip",reason:"nothing-open"};if(null==e.table)return{kind:"skip",reason:"table-unknown"};let t=[],r=[];for(let s of n)("dead"===function(e,n,t=3e3){let r=n.get(e.ownerPid);return r&&(null==e.ownerStarted||null==r.started||(0,l.sameStart)(e.ownerStarted,r.started,t))?"alive":"dead"}(s,e.table)?t:r).push(s);return{kind:"sweep",dead:t,alive:r}}({leases:r,table:d,ownsInstallTree:a,enabled:i});if("skip"===$.kind)return{plan:"skip",skipped:$.reason,leases:r.length,ended:0,clean:!1};let u=$.dead.map(e=>e.token);if(0===u.length)return b(),{plan:"sweep",leases:r.length,ended:0,clean:!0};t.db.update(s).set({endedAt:o()}).where((0,n.and)((0,n.inArray)(s.token,u),(0,n.isNull)(s.endedAt))).run();let p=await w(new Set(u)),c=v($.dead);return p.clean?(m(u),p.ended.length>0&&e.log(`[procs] ended ${p.ended.length} process(es) left by ${c} before the restart: ${p.ended.join(",")}`)):e.log(`[procs] boot sweep did not finish ${c} — ${p.reason}`),b(),{plan:"sweep",leases:r.length,ended:p.ended.length,clean:p.clean}},drain:A}}({scan:c,kill:f,table:()=>(0,l.processTable)({timeoutMs:2e4}),nowMs:()=>Date.now(),self:{pid:process.pid,ppid:process.ppid,started:Date.now()-1e3*process.uptime()},ownsInstallTree:s.ownsInstallTree,enabled:()=>"1"!==process.env.HYPERTEAMS_KEEP_RUN_PROCESSES,log:e=>console.log(e),debounceMs:1500,retryMs:[3e4,12e4,6e5],maxPasses:3,maxAttempts:4,scanBreaker:{failures:3,pauseMs:6e5}})});let m=k.__runLedger.ledger,b=m.openRunLease,w=m.endRunLease,y=m.endTaskRunProcesses,T=m.sweepRunLeases;e.s(["endRunLease",0,w,"endTaskRunProcesses",0,y,"openRunLease",0,b,"sweepRunLeases",0,T],689235)}];