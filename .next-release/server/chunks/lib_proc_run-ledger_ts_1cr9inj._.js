module.exports=[689235,e=>{"use strict";var n=e.i(793473),t=e.i(947788),r=e.i(462573),s=e.i(119688),i=e.i(984649),l=e.i(874533),a=e.i(666680);e.i(912714);let o=(0,e.i(812057).promisify)(l.execFile),d="HYPERTEAMS_RUN";async function p(e){let n;try{n=await (0,i.processTable)({timeoutMs:e})}catch(e){return{kind:"failed",reason:`ps failed: ${e.message.split("\n")[0]}`}}let t=new Map;try{let n,{stdout:r}=await o("ps",["-Eww","-axo","pid=,command="],{maxBuffer:0x4000000,timeout:e,windowsHide:!0,env:{...(n={...process.env},delete n[d],n),LC_ALL:"C"}});for(let[e,n]of function(e,n=d){let t=new Map,r=RegExp(`(?:^|\\s)${n}=([0-9a-f]{32})(?=\\s|$)`);for(let n of e.split("\n")){let e=n.match(/^\s*(\d+)\s+(.*)$/);if(!e)continue;let s=e[2].match(r);s&&t.set(Number(e[1]),s[1])}return t}(r))t.set(e,n)}catch(e){return{kind:"failed",reason:`ps -E failed: ${e.message.split("\n")[0]}`}}return{kind:"ok",unreadable:0,procs:[...n.values()].map(e=>({pid:e.pid,ppid:e.ppid,started:e.started,token:t.get(e.pid)??null}))}}String.raw`
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
`;let $=e=>new Promise(n=>setTimeout(n,e));function u(e){try{return process.kill(e,0),!0}catch(e){return"EPERM"===e.code}}async function c(e){let n=new Map;if(0===e.length)return n;try{let{stdout:t}=await o("ps",["-o","pid=,lstart=","-p",e.join(",")],{timeout:1e4,windowsHide:!0,env:{...process.env,LC_ALL:"C"}});for(let e of t.split("\n")){let t=e.match(/^\s*(\d+)\s+(.*)$/);t&&n.set(Number(t[1]),(0,i.parseLstart)(t[2]))}}catch{}return n}async function f(e){let n={killed:[],gone:[],changed:[],denied:[]},t=async(e,t)=>{let r=await c(t.map(e=>e.pid)),s=[];for(let l of t){if(!r.has(l.pid)){n.gone.includes(l.pid)||n.gone.push(l.pid);continue}if(!(0,i.sameStart)(l.started,r.get(l.pid))){n.changed.push(l.pid);continue}try{process.kill(l.pid,e),s.push(l.pid)}catch(e){"ESRCH"===e.code?n.gone.push(l.pid):n.denied.push(l.pid)}}return s},r=await t("SIGTERM",e),s=Date.now()+1500;for(;Date.now()<s&&r.some(u);)await $(100);let l=e.filter(e=>r.includes(e.pid)&&u(e.pid)),a=await t("SIGKILL",l);for(let t of e)r.includes(t.pid)&&(a.includes(t.pid)||!u(t.pid)?n.killed.push(t.pid):n.denied.push(t.pid));return{kind:"ok",...n}}async function h(){return p(15e3)}async function g(e){if(0===e.length)return{kind:"ok",killed:[],gone:[],changed:[],denied:[]};let n=e.filter(e=>Number.isInteger(e.pid)&&e.pid>4&&Number.isFinite(e.started));try{return await f(n)}catch(e){return{kind:"failed",reason:e.message}}}let k=e=>({token:e.token,taskId:e.taskId,engine:e.engine,ownerPid:e.ownerPid,ownerStarted:e.ownerStarted,openedAt:e.openedAt,endedAt:e.endedAt,reapedAt:e.reapedAt}),m=e=>(e instanceof Error?e.message:String(e)).split("\n")[0].slice(0,200),w=globalThis;w.__runLedger?.version!==1&&(w.__runLedger={version:1,ledger:function(e){let s=r.schema.runLeases,l=()=>Math.floor(e.nowMs()/1e3),o=null,p=null,$=!1,u=new Map,c=0,f=0;function h(r){return t.db.select().from(s).where((0,n.and)((0,n.isNotNull)(s.endedAt),(0,n.isNull)(s.reapedAt),(0,n.eq)(s.ownerPid,e.self.pid),void 0===r?void 0:(0,n.eq)(s.taskId,r))).all().map(k).filter(n=>null==n.ownerStarted||(0,i.sameStart)(n.ownerStarted,e.self.started,3e3))}function g(e){0!==e.length&&t.db.update(s).set({reapedAt:l()}).where((0,n.inArray)(s.token,e)).run()}function w(){let e=l();t.db.delete(s).where((0,n.or)((0,n.and)((0,n.isNotNull)(s.reapedAt),(0,n.lt)(s.reapedAt,e-86400)),(0,n.and)((0,n.isNotNull)(s.endedAt),(0,n.lt)(s.openedAt,e-604800)))).run()}async function b(n){let t=[];for(let r=1;r<=e.maxPasses+1;r++){let s,i;try{s=await e.scan()}catch(e){s={kind:"failed",reason:m(e)}}if("ok"!==s.kind){let e="unsupported"===s.kind?"this platform cannot read process environments":s.reason;return y(!1),{clean:!1,ended:t,reason:`scan failed: ${e}`}}y(!0);let l=function(e,n){let t=new Map(e.map(e=>[e.pid,e])),r=new Set;for(let e of n){let n=e;for(;void 0!==n&&n>0&&!r.has(n);)r.add(n),n=t.get(n)?.ppid}return r}(s.procs,[e.self.pid,e.self.ppid]),{victims:a}=function(e){let{procs:n,tokens:t,protect:r}=e,s=new Map;for(let e of n){let n=s.get(e.ppid);n?n.push(e):s.set(e.ppid,[e])}let i=new Map,l=[],a=new Set,o=new Set,d=(e,n)=>{if(!i.has(e.pid)&&!(e.pid<=4)){if(r.has(e.pid))return void o.add(e.pid);if(null==e.started||!Number.isFinite(e.started))return void a.add(e.pid);i.set(e.pid,{pid:e.pid,started:e.started,token:e.token,viaParent:n}),l.push(e)}};for(let e of n)e.token&&t.has(e.token)&&d(e,!1);for(;l.length>0;){let e=l.shift();for(let n of s.get(e.pid)??[])n.ppid===e.pid&&null!=e.started&&null!=n.started&&e.started<=n.started&&(null==n.token||t.has(n.token))&&d(n,!0)}return{victims:[...i.values()],skippedNoStart:a.size,skippedProtected:o.size}}({procs:s.procs,tokens:n,protect:l}),o=a.filter(n=>n.pid!==e.self.pid).map(({pid:e,started:n})=>({pid:e,started:n}));if(0===o.length)return{clean:!0,ended:t};if(r>e.maxPasses)return{clean:!1,ended:t,reason:`${o.length} process(es) still running after ${e.maxPasses} rounds`};try{i=await e.kill(o)}catch(e){i={kind:"failed",reason:m(e)}}if("ok"!==i.kind)return{clean:!1,ended:t,reason:`kill failed: ${i.reason}`};if(t.push(...i.killed),0===i.killed.length&&0===i.gone.length&&0===i.changed.length)return{clean:!1,ended:t,reason:`${i.denied.length} process(es) could not be ended (access denied)`}}return{clean:!1,ended:t,reason:"gave up"}}function y(n){if(n){c=0;return}++c>=e.scanBreaker.failures&&(f=e.nowMs()+e.scanBreaker.pauseMs,c=0)}function T(e){o||(o=setTimeout(()=>{o=null,A()},e),o.unref?.())}async function P(){let n=h().filter(n=>(u.get(n.token)??0)<e.maxAttempts);if(0===n.length)return void w();if(e.nowMs()<f)return void T(f-e.nowMs());let t=await b(new Set(n.map(e=>e.token))),r=v(n);if(t.clean){for(let e of(g(n.map(e=>e.token)),n))u.delete(e.token);t.ended.length>0&&e.log(`[procs] ended ${t.ended.length} process(es) left by ${r}: ${t.ended.join(",")}`)}else{let s=Math.max(...n.map(e=>(u.get(e.token)??0)+1));for(let e of n)u.set(e.token,(u.get(e.token)??0)+1);let i=e.retryMs[Math.min(s-1,e.retryMs.length-1)]??6e4,l=t.ended.length>0?`ended ${t.ended.length} process(es) (${t.ended.join(",")}), but `:"";e.log(`[procs] ${l}did not finish ending the processes of ${r} — ${t.reason}; retrying in ${Math.round(i/1e3)}s`),s<e.maxAttempts&&T(i)}w()}function v(e){let n=[...new Set(e.map(e=>e.taskId).filter(e=>null!=e))],t=1===e.length?`run ${e[0].token.slice(0,8)}`:`${e.length} runs`;return n.length>0?`${t} (task ${n.join(",")})`:t}function A(){return p?($=!0,p):p=(async()=>{try{do{$=!1;try{await P()}catch(n){e.log(`[procs] drain failed: ${m(n)}`)}}while($)}finally{p=null}})()}return{openRunLease(n){if(!e.enabled())return null;try{let r=(0,a.randomBytes)(16).toString("hex");return t.db.insert(s).values({token:r,taskId:n.taskId,engine:n.engine,ownerPid:e.self.pid,ownerStarted:Math.round(e.self.started),openedAt:l()}).run(),{token:r,env:{[d]:r}}}catch(n){return e.log(`[procs] could not open a run lease: ${m(n)}`),null}},endRunLease(r){try{t.db.update(s).set({endedAt:l()}).where((0,n.and)((0,n.eq)(s.token,r),(0,n.isNull)(s.endedAt))).run(),T(e.debounceMs)}catch(n){e.log(`[procs] could not close a run lease: ${m(n)}`)}},async endTaskRunProcesses(n,t={}){try{let e,r=h(n);if(0===r.length)return!0;for(let e of r)u.delete(e.token);return await Promise.race([A(),new Promise(n=>{e=setTimeout(n,t.deadlineMs??3e4)})]),e&&clearTimeout(e),0===h(n).length}catch(n){return e.log(`[procs] ending a task's processes failed: ${m(n)}`),!1}},async sweepRunLeases(){let r=t.db.select().from(s).where((0,n.isNull)(s.reapedAt)).all().map(k),a=e.enabled(),o=e.ownsInstallTree(),d=null;if(a&&o&&r.length>0)try{d=await e.table()}catch(n){e.log(`[procs] boot sweep: could not read the process table (${m(n)}); leaving ${r.length} lease(s) for later`)}let p=function(e){if(!e.enabled)return{kind:"skip",reason:"disabled"};if(!e.ownsInstallTree)return{kind:"skip",reason:"not-install-owner"};let n=e.leases.filter(e=>null==e.reapedAt);if(0===n.length)return{kind:"skip",reason:"nothing-open"};if(null==e.table)return{kind:"skip",reason:"table-unknown"};let t=[],r=[];for(let s of n)("dead"===function(e,n,t=3e3){let r=n.get(e.ownerPid);return r&&(null==e.ownerStarted||null==r.started||(0,i.sameStart)(e.ownerStarted,r.started,t))?"alive":"dead"}(s,e.table)?t:r).push(s);return{kind:"sweep",dead:t,alive:r}}({leases:r,table:d,ownsInstallTree:o,enabled:a});if("skip"===p.kind)return{plan:"skip",skipped:p.reason,leases:r.length,ended:0,clean:!1};let $=p.dead.map(e=>e.token);if(0===$.length)return w(),{plan:"sweep",leases:r.length,ended:0,clean:!0};t.db.update(s).set({endedAt:l()}).where((0,n.and)((0,n.inArray)(s.token,$),(0,n.isNull)(s.endedAt))).run();let u=await b(new Set($)),c=v(p.dead);return u.clean?(g($),u.ended.length>0&&e.log(`[procs] ended ${u.ended.length} process(es) left by ${c} before the restart: ${u.ended.join(",")}`)):e.log(`[procs] boot sweep did not finish ${c} — ${u.reason}`),w(),{plan:"sweep",leases:r.length,ended:u.ended.length,clean:u.clean}},drain:A}}({scan:h,kill:g,table:()=>(0,i.processTable)({timeoutMs:2e4}),nowMs:()=>Date.now(),self:{pid:process.pid,ppid:process.ppid,started:Date.now()-1e3*process.uptime()},ownsInstallTree:s.ownsInstallTree,enabled:()=>"1"!==process.env.HYPERTEAMS_KEEP_RUN_PROCESSES,log:e=>console.log(e),debounceMs:1500,retryMs:[3e4,12e4,6e5],maxPasses:3,maxAttempts:4,scanBreaker:{failures:3,pauseMs:6e5}})});let b=w.__runLedger.ledger,y=b.openRunLease,T=b.endRunLease,P=b.endTaskRunProcesses,v=b.sweepRunLeases;e.s(["endRunLease",0,T,"endTaskRunProcesses",0,P,"openRunLease",0,y,"sweepRunLeases",0,v],689235)}];