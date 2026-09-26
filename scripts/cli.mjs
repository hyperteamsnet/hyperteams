#!/usr/bin/env node
import a from"node:fs";import le from"node:net";import et from"node:os";import i from"node:path";import{fileURLToPath as ue}from"node:url";import{createHash as de}from"node:crypto";import{createRequire as yt}from"node:module";import{spawnSync as S,spawn as ft}from"node:child_process";import{createInterface as pe}from"node:readline/promises";var c=i.resolve(i.dirname(ue(import.meta.url)),".."),g=process.platform==="win32",w=et.homedir(),I=i.join(w,".hyperteams"),Ut=i.join(I,"run"),$t=i.join(I,"shim.json"),fe=(()=>{let t=i.join(c,"scripts","ptyd.mjs"),e=t;try{e=a.realpathSync(t)}catch{}return de("sha256").update(e).digest("hex").slice(0,8)})(),z="# >>> hyperteams >>>",Ct="# <<< hyperteams <<<",n=t=>process.stderr.write(`\x1B[36m[hyperteams]\x1B[0m ${t}
`),d=t=>process.stderr.write(`\x1B[92m\u2713\x1B[0m ${t}
`),h=t=>process.stderr.write(`\x1B[93m\u26A0\x1B[0m ${t}
`),f=t=>{process.stderr.write(`\x1B[91m\u2717 ${t}\x1B[0m
`),process.exit(1)},C=process.argv.slice(2),$=new Set(C.filter(t=>t.startsWith("--"))),D=C.filter(t=>!t.startsWith("--")),Nt=D[0]&&!D[0].startsWith("-")?D.shift():"start";function _t(t,e){let r=C.indexOf(`--${t}`);return r>=0&&C[r+1]&&!C[r+1].startsWith("--")?C[r+1]:e}var m=_t("command-name","hyperteams"),he=$.has("--yes")||$.has("-y"),Ht=$.has("--foreground")||$.has("--fg");function ht(t,e,r={}){let s=process.listeners("SIGINT");process.on("SIGINT",()=>{});try{let o=S(t,e,{stdio:"inherit",...r});return o.error&&f(`Failed to run ${t}: ${o.error.message}`),o.status??1}finally{process.removeAllListeners("SIGINT");for(let o of s)process.on("SIGINT",o)}}function Lt(){a.existsSync(i.join(c,"server.js"))||f("server.js is missing \u2014 the release package is corrupted."),a.existsSync(i.join(c,".env.local"))||f(`.env.local is missing. Configure it with:
    ${m} setup`)}function me(){n("Checking the setup..."),Lt(),d("Setup looks good"),process.stderr.write(`
`),n("Starting HyperTeams..."),n("The dashboard address is printed in the [supervise] lines below."),n("Stop: Ctrl-C"),process.stderr.write(`
`)}function Ft(t){if(!Ht)return rt();if(g){let r=i.join(c,"scripts","supervise.mjs");return a.existsSync(r)||f(`Start script not found: ${r}`),me(),ht(process.execPath,[r,...t])}let e=i.join(c,"scripts","start.sh");return a.existsSync(e)||f(`Start script not found: ${e}`),ht("bash",[e,...t])}var T=i.join(c,"logs","server.log");function nt(){let t=Number(process.env.PORT);if(t)return t;try{let e=a.readFileSync(i.join(c,".env.local"),"utf8").match(/^\s*PORT\s*=\s*["']?(\d+)/m);if(e)return Number(e[1])}catch{}return 27777}function O(t){return new Promise(e=>{let r=le.connect({host:"127.0.0.1",port:t}),s=o=>{r.destroy(),e(o)};r.setTimeout(500),r.on("connect",()=>s(!0)),r.on("timeout",()=>s(!1)),r.on("error",()=>s(!1))})}function M(t){try{return a.readFileSync(T,"utf8").trimEnd().split(`
`).slice(-t)}catch{return[]}}function dt(t){let e=[...M(200).join(`
`).matchAll(/Dashboard:\s*(\S+)/g)];return e.length?e[e.length-1][1]:`http://localhost:${t}`}function mt(t){t&&$.has("--print-url")&&process.stdout.write(`${t}
`)}async function rt(){n("Checking the setup..."),Lt();let t=nt();!$.has("--force")&&await O(t)&&f(`Something is already listening on port ${t} \u2014 it is probably already running.
  Stop it first:   ${m} stop
  Start anyway:    ${m} start --force`),d("Setup looks good"),a.mkdirSync(i.dirname(T),{recursive:!0});try{a.renameSync(T,`${T}.prev`)}catch{}let e=a.openSync(T,"a");process.stderr.write(`
`),n("Starting in the background...");let r={...process.env,HYPERTEAMS_BACKGROUND:"1"},s=g?ft(process.execPath,[i.join(c,"scripts","supervise.mjs")],{cwd:c,env:r,detached:!0,windowsHide:!0,stdio:["ignore",e,e]}):ft("bash",[i.join(c,"scripts","start.sh")],{cwd:c,env:r,detached:!0,stdio:["ignore",e,e]});s.unref(),a.closeSync(e);let o=null;s.on("exit",(u,p)=>o=u??p),s.on("error",u=>f(`Could not start: ${u.message}`));let l=null;for(let u=0;u<100&&l===null&&o===null;u++){await A(300);let p=M(200).join(`
`).match(/Dashboard:\s*(\S+)/);p&&(l=p[1])}if(o!==null){process.stderr.write(`
`);for(let u of M(15))process.stderr.write(`  ${u}
`);f(`It stopped right after starting (exit ${o}).
  The full log is at: ${T}`)}if(process.stderr.write(`
`),d(`Running in the background (pid ${s.pid})`),l)n(`Dashboard:  ${l}`),mt(l);else{h("It has not printed an address yet \u2014 the last log lines are:");for(let u of M(10))process.stderr.write(`  ${u}
`)}return n(`Log:        ${T}`),n(`Stop:       ${G()?.commandName??m} stop`),0}function ge(t){let e=i.join(c,"scripts","setup.mjs");return a.existsSync(e)||f(`Setup script not found: ${e}`),ht(process.execPath,[e,...t])}var R="net.hyperteams.app",v="hyperteams.service";function ye(){let t=process.env.APPDATA||i.join(w,"AppData","Roaming");return i.join(t,"Microsoft","Windows","Start Menu","Programs","Startup")}function _(){return process.platform==="darwin"?{kind:"launchd",file:i.join(w,"Library","LaunchAgents",`${R}.plist`)}:g?{kind:"startup",file:i.join(ye(),"HyperTeams.lnk"),helper:i.join(c,"bin","autostart.vbs")}:{kind:"systemd",file:i.join(w,".config","systemd","user",v)}}function Mt(){try{return a.existsSync(_().file)}catch{return!1}}function Bt(){let t=[i.dirname(process.execPath),...(process.env.PATH??"").split(i.delimiter)];g||t.push("/opt/homebrew/bin","/usr/local/bin","/usr/bin","/bin","/usr/sbin","/sbin");let e=new Set;return t.filter(r=>r&&!e.has(r)&&e.add(r)).join(i.delimiter)}function bt(){let t=a.existsSync(i.join(c,"server.js")),e=i.join(c,"scripts",t?"start.sh":"start-all.sh");return a.existsSync(e)||f(`Start script not found: ${e}`),a.existsSync(i.join(c,".env.local"))||f(`.env.local is missing. Configure it with:
    ${m} setup`),e}function $e(){if(process.platform!=="darwin")return null;for(let t of["Documents","Desktop","Downloads"]){let e=i.join(w,t);if(c===e||c.startsWith(e+i.sep))return e}return null}function x(t){let e=S("launchctl",t,{encoding:"utf8"});return{status:e.error?1:e.status??1,out:`${e.stdout??""}${e.stderr??""}`.trim()}}function U(){return`gui/${process.getuid?.()??0}`}function Wt(){return Vt()!==null}function Vt(){let t=x(["print",`${U()}/${R}`]);if(t.status!==0||!t.out.includes(c))return null;let e=t.out.match(/^\s*pid\s*=\s*(\d+)/m);return e?Number(e[1]):null}function qt(){if(P(["is-active",v]).out.trim()!=="active")return!1;let t=P(["show","-p","FragmentPath",v]).out.match(/FragmentPath=(.*)/)?.[1];try{return a.readFileSync(t??_().file,"utf8").includes(c)}catch{return!1}}function be(){let e=P(["show","-p","MainPID",v]).out.match(/MainPID=(\d+)/),r=e?Number(e[1]):0;return r>0?r:null}function P(t){let e=S("systemctl",["--user",...t],{encoding:"utf8"});return{status:e.error?1:e.status??1,out:`${e.stdout??""}${e.stderr??""}`.trim()}}function F(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function we(){return`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${R}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${F(bt())}</string>
  </array>
  <key>WorkingDirectory</key><string>${F(c)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${F(Bt())}</string>
    <key>HYPERTEAMS_BACKGROUND</key><string>1</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key>
  <dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>${F(T)}</string>
  <key>StandardErrorPath</key><string>${F(T)}</string>
</dict>
</plist>
`}function Se(){return`[Unit]
Description=HyperTeams
StartLimitIntervalSec=0

[Service]
Type=simple
WorkingDirectory=${c}
Environment="HYPERTEAMS_BACKGROUND=1"
Environment="PATH=${Bt()}"
ExecStart=/bin/bash "${bt()}"
# Restarted only when it fails: '${m} stop' stops this unit first, and a
# clean shutdown exits 0, so neither path resurrects it.
Restart=on-failure
RestartSec=30

[Install]
WantedBy=default.target
`}function ke(){return["' hyperteams-autostart - generated by 'hyperteams autostart'. Do not edit.","' ASCII only: wscript reads a BOM-less .vbs in the ANSI code page.",'Set fso = CreateObject("Scripting.FileSystemObject")',"root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))",'CreateObject("WScript.Shell").Run "node """ & root & "\\scripts\\cli.mjs"" start", 0, False',""].join(`\r
`)}async function ve(t,e=60){for(let r=0;r<e*2;r++)if(await A(500),await O(t))return!0;return!1}async function Te(t=20){for(let e=0;e<t*4;e++){if(x(["print",`${U()}/${R}`]).status!==0)return!0;await A(250)}return!1}async function Pe(t,e=15){for(let r=0;r<e*2;r++){if(!await O(t))return!0;await A(500)}return!1}function xt(){let t=(D[0]??"").toLowerCase();return $.has("--status")||t==="status"?Ee():$.has("--off")||t==="off"?Gt():(t&&t!=="on"&&f(`Unknown option: ${t}
  Usage: ${m} autostart [on|off|status]`),Ae())}async function Ae(){n(`Install directory: ${c}`),n("Checking the setup...");let t=bt();d(g?`Setup looks good (it will run: ${m} start)`:`Setup looks good (it will run: bash ${t})`);let e=$e();e&&(n(""),h(`This installation lives in a folder macOS protects: ${e}`),n("  Unless Full Disk Access is granted, a login item cannot read files there \u2014"),n('  every login would fail with "Operation not permitted", even though starting'),n("  it by hand works. Two ways out:"),n(`    \xB7 Move the installation out of ${i.basename(e)}/ (e.g. to ~/hyperteams), or`),n("    \xB7 System Settings \u25B8 Privacy & Security \u25B8 Full Disk Access \u25B8 add /bin/bash"),n(""));let r=_(),s=nt(),o=await O(s),l=r.kind==="launchd"?Wt():r.kind==="systemd"?qt():!1;try{let u=r.kind==="startup"?c:a.readFileSync(r.file,"utf8");if(!u.includes(c)){h("Replacing a login item that pointed at another installation:");for(let p of u.match(/[^\s<>"]*(?:start-all\.sh|start\.sh|cli\.mjs)/g)??[])n(`    ${p}`);n("  Only one installation can start automatically \u2014 they would fight over the port.")}}catch{}if(a.mkdirSync(i.dirname(r.file),{recursive:!0}),a.mkdirSync(i.dirname(T),{recursive:!0}),r.kind==="launchd"){if(a.writeFileSync(r.file,we()),d(`Login item written: ${r.file}`),!o||l){l&&n("It is running as the login item \u2014 reloading it with the new definition."),x(["bootout",`${U()}/${R}`]),await Te();let u=x(["bootstrap",U(),r.file]),p=u.status===0?null:x(["load","-w",r.file]);if(u.status!==0&&p.status!==0){h("It is registered, but launchd would not start it right now:");for(let b of(u.out||p.out).split(`
`))n(`    ${b}`);n("  It will still start at the next login.")}}}else if(r.kind==="systemd"){S("systemctl",["--version"],{stdio:"ignore"}).error&&f(`systemd was not found, so there is nothing to register with.
  On a machine without it, add this line with 'crontab -e' instead:
    @reboot ${process.execPath} ${i.join(c,"scripts","cli.mjs")} start`),a.writeFileSync(r.file,Se()),d(`Login item written: ${r.file}`),P(["daemon-reload"]);let u=P(["enable",v]);if(u.status!==0&&f(`Could not enable ${v}: ${u.out}`),!o||l){l&&n("It is running as the login item \u2014 reloading it with the new unit.");let y=P([l?"restart":"start",v]);y.status!==0&&(h(`It is registered, but it would not start right now: ${y.out}`),n("  It will still start at the next login."))}let p=et.userInfo().username,b=S("loginctl",["enable-linger",p],{encoding:"utf8"});(b.error||(b.status??1)!==0)&&(h("It starts when you log in, but not on boot alone. To change that:"),n(`    sudo loginctl enable-linger ${p}`))}else a.mkdirSync(i.dirname(r.helper),{recursive:!0}),a.writeFileSync(r.helper,ke()),st(`
$ErrorActionPreference = 'Stop'
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($env:HT_LNK)
$lnk.TargetPath = Join-Path $env:SystemRoot 'System32\\wscript.exe'
$lnk.Arguments = '"' + $env:HT_VBS + '"'
$lnk.WorkingDirectory = $env:HT_ROOT
$lnk.Description = 'HyperTeams'
$lnk.Save()
`,{HT_LNK:r.file,HT_VBS:r.helper,HT_ROOT:c})!==0&&f(`Could not create the startup shortcut: ${r.file}`),d(`Login item written: ${r.file}`);if(n(""),o&&!l)d("Autostart is on. It is already running, so nothing was started."),n("  That server was started by hand \u2014 the login item takes over at the next login."),n(`Dashboard:  ${dt(s)}`),mt(dt(s));else if(r.kind==="startup")await rt(),n(""),d("Autostart is on.");else if(n("Starting it now, the same way the next login will..."),l&&await Pe(s,15),await ve(s)){let u=dt(s);d("Autostart is on, and it is running now."),n(`Dashboard:  ${u}`),mt(u)}else{h("Autostart is on, but it has not come up yet.");for(let u of M(15))process.stderr.write(`  ${u}
`);r.kind!=="systemd"&&n(`  The full log is at: ${T}`)}return n(""),r.kind==="launchd"?(n("macOS lists it in System Settings \u25B8 General \u25B8 Login Items (Allow in the Background)."),n("It starts when you log in \u2014 turn on automatic login if this machine must come up on its own.")):r.kind==="systemd"?n(`Log:        journalctl --user -u ${v} -f`):n("It starts when you sign in to Windows."),n(`Turn it off: ${m} autostart off`),0}function Gt(t={}){let e=t.quiet===!0,r=_(),s=a.existsSync(r.file);r.kind==="launchd"?Wt()||x(["bootout",`${U()}/${R}`]):r.kind==="systemd"&&s&&P(["disable",v]);try{a.rmSync(r.file,{force:!0}),r.helper&&a.rmSync(r.helper,{force:!0})}catch(o){return e||f(`Could not remove ${r.file}: ${o.message}`),0}return r.kind==="systemd"&&s&&P(["daemon-reload"]),e?(s&&d(`Removed the login item: ${r.file}`),0):s?(d(`Autostart is off: ${r.file} was removed.`),n("Anything running right now keeps running \u2014 stop it with:"),n(`    ${m} stop`),0):(d("Autostart was not on \u2014 nothing to remove."),0)}async function Ee(){let t=_(),e=a.existsSync(t.file);if(n(`Install directory: ${c}`),n(""),e?d(`Autostart is on: ${t.file}`):h(`Autostart is off (no ${t.file})`),t.kind==="launchd"){let r=x(["print",`${U()}/${R}`]),s=e?"not loaded yet (it loads at login)":"not loaded";n(`  launchd:      ${r.status===0?"loaded":s}`)}else if(t.kind==="systemd"){let r=P(["is-enabled",v]);n(`  systemd:      ${r.out||"unknown"}`)}return n(`  Running now:  ${await O(nt())?"yes":"no"}`),n(""),n(e?`Turn it off:  ${m} autostart off`:`Turn it on:   ${m} autostart`),0}function Jt(t){return g?{binDir:i.join(c,"bin"),file:i.join(c,"bin",`${t}.cmd`)}:{binDir:i.join(w,".local","bin"),file:i.join(w,".local","bin",t)}}var gt="hyperteams-shim",Ie=i.join(i.dirname(c),"runtime","node");function Rt(t){return g?["@echo off",`REM ${gt} \u2014 generated by the installer. Do not edit.`,"REM ASCII only: cmd tracks its read position by byte offset (see scripts/start.bat).",'set "HT_NODE=%~dp0..\\..\\runtime\\node"','if exist "%HT_NODE%\\node.exe" set "PATH=%HT_NODE%;%PATH%"',"where node >nul 2>nul","if errorlevel 1 (","    echo [hyperteams] Node.js is required: https://nodejs.org/ 1>&2","    exit /b 1",")",'node "%~dp0..\\scripts\\cli.mjs" %*',""].join(`\r
`):["#!/usr/bin/env bash",`# ${gt} \u2014 generated by the installer. Do not edit.`,`HT_NODE=${JSON.stringify(i.join(Ie,"bin"))}`,'[ -x "$HT_NODE/node" ] && PATH="$HT_NODE:$PATH"','command -v node >/dev/null 2>&1 || { echo "[hyperteams] Node.js is required: https://nodejs.org/" >&2; exit 1; }',`exec node ${JSON.stringify(i.join(c,"scripts","cli.mjs"))} "$@"`,""].join(`
`)}function G(){try{return JSON.parse(a.readFileSync($t,"utf8"))}catch{return null}}function xe(t){a.mkdirSync(I,{recursive:!0,mode:448}),a.writeFileSync($t,JSON.stringify(t,null,2))}function Yt(t={}){let e=t.quiet===!0,r=t.name??m,{binDir:s,file:o}=Jt(r);if(a.existsSync(o)){let p=a.readFileSync(o,"utf8"),b=p.includes(gt);if(!b&&!$.has("--force")){if(e)return h(`Left the existing '${r}' alone \u2014 it is not ours: ${o}`),0;f(`A different '${r}' already exists: ${o}
  Use --force to overwrite, or --command-name <name> to use another name`)}if(e&&b&&p===Rt(r))return 0}else{let p=Re(r);p&&!$.has("--force")&&(h(`'${r}' already exists on PATH: ${p}`),h("  That one may take precedence. Use --command-name <name> for another name"))}a.mkdirSync(s,{recursive:!0}),a.writeFileSync(o,Rt(r)),g||a.chmodSync(o,493),d(e?`Command refreshed: ${o}`:`Command installed: ${o}`);let l=G(),u=l&&l.binDir&&l.binDir!==s?[l.binDir]:[];return(!e||!l?.binDir||l.binDir!==s)&&(g?Xt(s,u):Oe(s)),xe({binDir:s,file:o,root:c,commandName:r}),e||process.stdout.write(s+`
`),0}function Re(t){let e=g?";":":",r=g?(process.env.PATHEXT||".COM;.EXE;.BAT;.CMD").split(";"):[""];for(let s of(process.env.PATH??"").split(e))if(s)for(let o of r){let l=i.join(s,t+o);try{if(a.statSync(l).isFile())return l}catch{}}return null}function je(){let t=i.basename(process.env.SHELL||"");return t==="fish"?{file:i.join(w,".config","fish","config.fish"),fish:!0}:t==="zsh"?{file:i.join(w,".zshrc"),fish:!1}:t==="bash"?{file:i.join(w,process.platform==="darwin"?".bash_profile":".bashrc"),fish:!1}:{file:i.join(w,".profile"),fish:!1}}function De(){return[i.join(w,".zshrc"),i.join(w,".bashrc"),i.join(w,".bash_profile"),i.join(w,".profile"),i.join(w,".config","fish","config.fish")]}function Oe(t){let{file:e,fish:r}=je(),s="";try{s=a.readFileSync(e,"utf8")}catch{}let o=s.includes(z);if(o&&s.includes(t)){d(`PATH entry is already in ${e}`);return}if(!o&&(process.env.PATH??"").split(":").includes(t)){d(`${t} is already on PATH`);return}o&&Kt();let l=r?`fish_add_path -g ${JSON.stringify(t)}`:`export PATH=${JSON.stringify(t)}:"$PATH"`,u=`
${z}
${l}
${Ct}
`;a.mkdirSync(i.dirname(e),{recursive:!0}),a.appendFileSync(e,u),d(`Added the PATH entry: ${e}`)}function Kt(){for(let t of De()){let e;try{e=a.readFileSync(t,"utf8")}catch{continue}if(!e.includes(z))continue;let r=[],s=!1;for(let o of e.split(`
`)){let l=o.trim();if(l===z){s=!0;continue}if(l===Ct){s=!1;continue}s||r.push(o)}a.writeFileSync(t,r.join(`
`)),d(`Removed the PATH entry: ${t}`)}}function Xt(t,e){st(`
$ErrorActionPreference = 'Stop'
$add    = $env:HYPERTEAMS_BIN_ADD
$remove = @($env:HYPERTEAMS_BIN_REMOVE -split ';' | Where-Object { $_ -ne '' })

$key  = 'HKCU:\\Environment'
$item = Get-Item -Path $key
# \uAC12\uC774 \uC544\uC608 \uC5C6\uC73C\uBA74 GetValueKind \uAC00 \uB358\uC9D1\uB2C8\uB2E4 \u2014 \uADF8\uB54C\uB294 \uC0C8\uB85C \uB9CC\uB4E4 \uAC12\uC774\uBBC0\uB85C ExpandString.
$kind = 'ExpandString'
try { $kind = $item.GetValueKind('Path') } catch { }

# **\uC77D\uAE30 \uC2E4\uD328\uB97C \uBE48 \uAC12\uC73C\uB85C \uC0BC\uD0A4\uBA74 \uC548 \uB429\uB2C8\uB2E4.** \uADF8\uB300\uB85C \uC9C4\uD589\uD558\uBA74 \uC0AC\uC6A9\uC790 PATH \uB97C \uC6B0\uB9AC
# \uD56D\uBAA9 \uD558\uB098\uB85C \uB36E\uC5B4\uC368 \uBC84\uB9BD\uB2C8\uB2E4. \uAC12\uC774 \uC5C6\uB294 \uC815\uC0C1 \uCF00\uC774\uC2A4($null)\uB9CC \uBE48 \uBB38\uC790\uC5F4\uB85C \uBCF4\uACE0,
# \uADF8 \uBC16\uC758 \uC608\uC678\uB294 ErrorActionPreference='Stop' \uC73C\uB85C \uD130\uB728\uB824 \uD638\uCD9C\uC790\uAC00 \uACBD\uACE0\uD558\uAC8C \uD569\uB2C8\uB2E4.
$cur = $item.GetValue('Path', $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
if ($null -eq $cur) { $cur = '' }

$parts = @($cur -split ';' | Where-Object { $_ -ne '' })
$drop  = @($remove) + @($add) | Where-Object { $_ -ne '' }
$parts = @($parts | Where-Object { $drop -notcontains $_ })
if ($add -ne '' -and $add -ne $null) { $parts += $add }

$new = ($parts -join ';')
if ($new -ne $cur) {
  Set-ItemProperty -Path $key -Name 'Path' -Value $new -Type $kind
  Write-Host "[hyperteams] user PATH updated"
}

# \uC0C8\uB85C \uC5F4\uB9AC\uB294 \uC178\xB7\uD0D0\uC0C9\uAE30\uAC00 \uBC14\uB85C \uC54C\uC544\uCC44\uB3C4\uB85D \uC54C\uB9BD\uB2C8\uB2E4. \uC5C6\uC5B4\uB3C4 \uC0C8 \uD130\uBBF8\uB110\uC774\uBA74 \uACB0\uAD6D
# \uBC18\uC601\uB418\uC9C0\uB9CC, \uC788\uC73C\uBA74 \uD6E8\uC52C \uB35C \uD5F7\uAC08\uB9BD\uB2C8\uB2E4.
$sig = @'
using System;
using System.Runtime.InteropServices;
public static class HyperTeamsEnv {
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
  public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam,
    string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
}
'@
try {
  Add-Type -TypeDefinition $sig -ErrorAction Stop
  $r = [UIntPtr]::Zero
  [void][HyperTeamsEnv]::SendMessageTimeout([IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$r)
} catch { }
`,{HYPERTEAMS_BIN_ADD:t,HYPERTEAMS_BIN_REMOVE:e.join(";")})===0?d("Registered in the user PATH"):h("Could not update PATH \u2014 add it manually: "+t)}function Ue(t){Xt("",t?[t]:[])}function st(t,e){let r=i.join(et.tmpdir(),`hyperteams-${process.pid}-${Math.random().toString(36).slice(2)}.ps1`);a.writeFileSync(r,"\uFEFF"+t,"utf8");try{let s=S("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r],{stdio:["ignore","inherit","inherit"],env:{...process.env,...e}});return s.error?1:s.status??1}finally{try{a.unlinkSync(r)}catch{}}}async function N(t){if(he)return!0;process.stdin.isTTY||f("Confirmation is required, but this is not a terminal. Pass --yes to proceed non-interactively.");let e=pe({input:process.stdin,output:process.stderr}),r="";try{r=await e.question(`\x1B[36m\u2753 ${t} (y/N): \x1B[0m`)}catch{return!1}finally{e.close()}return/^y(es)?$/i.test(r.trim())}function ot(){g?st(`
$ErrorActionPreference = 'SilentlyContinue'
# \uAD6C\uBD84\uC790\uAE4C\uC9C0 \uD3EC\uD568\uD574 \uB118\uACA8\uBC1B\uC2B5\uB2C8\uB2E4(\uC544\uB798 HYPERTEAMS_ROOT \uCC38\uACE0) \u2014 \uC548 \uBD99\uC774\uBA74 \uC606\uC758 app2 \uAC19\uC740
# \uC774\uC6C3 \uD3F4\uB354\uAC00 \uC811\uB450\uC0AC\uB85C \uAC78\uB9BD\uB2C8\uB2E4.
$root = $env:HYPERTEAMS_ROOT
$cmp  = [System.StringComparison]::OrdinalIgnoreCase

# \uB098 \uC790\uC2E0 + \uC870\uC0C1 \uC0AC\uC2AC. \uC5EC\uAE30 \uC788\uB294 PID \uB294 \uC808\uB300 \uAC74\uB4DC\uB9AC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.
$keep = @{}
$keep[$PID] = $true
$p = [int]$env:HYPERTEAMS_SELF_PID
while ($p -gt 0 -and -not $keep.ContainsKey($p)) {
  $keep[$p] = $true
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$p"
  if (-not $proc) { break }
  $p = [int]$proc.ParentProcessId
}

Get-CimInstance Win32_Process | Where-Object {
  -not $keep.ContainsKey([int]$_.ProcessId) -and (
    ($_.ExecutablePath -and $_.ExecutablePath.StartsWith($root, $cmp)) -or
    ($_.CommandLine    -and $_.CommandLine.IndexOf($root, $cmp) -ge 0)
  )
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
`,{HYPERTEAMS_ROOT:c+i.sep,HYPERTEAMS_SELF_PID:String(process.pid)}):Qt("SIGKILL"),d("Stopped everything from this installation")}function zt(){let t=S("ps",["axww","-o","pid=,args="],{encoding:"utf8",maxBuffer:16777216}),e=[];for(let r of(t.stdout??"").split(`
`)){let s=r.match(/^\s*(\d+)\s+(\S.*)$/);s&&e.push({pid:Number(s[1]),args:s[2]})}return e.some(r=>r.pid===process.pid)?e:null}function Zt(t){return t.replace(/[.[\]{}()*+?^$|\\]/g,"\\$&")}function Z(t=new Set(wt())){let e=c.replace(/\/+$/,"")+"/",r=zt();return r?r.filter(o=>!t.has(o.pid)&&o.args.includes(e)).map(o=>o.pid):(S("pgrep",["-f",Zt(e)],{encoding:"utf8"}).stdout??"").split(`
`).map(o=>Number(o.trim())).filter(o=>o&&!t.has(o))}function Qt(t,e){let r=0;for(let s of Z(e))try{process.kill(s,t),r++}catch{}return r}function wt(){let t=[process.pid],e=process.pid;for(let r=0;r<20;r++){let s=S("ps",["-o","ppid=","-p",String(e)],{encoding:"utf8"}),o=Number((s.stdout??"").trim());if(!o||o<=1||t.includes(o))break;t.push(o),e=o}return t}function it(t={}){let e=i.join(c,"scripts","ptyd.mjs");if(g)st(`
$ErrorActionPreference = 'SilentlyContinue'
# -like \uAC00 \uC544\uB2C8\uB77C IndexOf \uC785\uB2C8\uB2E4. -like \uC758 \uC624\uB978\uCABD\uC740 \uC640\uC77C\uB4DC\uCE74\uB4DC \uD328\uD134\uC774\uB77C \uACBD\uB85C\uC5D0
# '[' \uB098 ']' \uAC00 \uC788\uC73C\uBA74 \uBB38\uC790 \uD074\uB798\uC2A4\uB85C \uD574\uC11D\uB418\uC5B4 \uC870\uC6A9\uD788 \uBE57\uB098\uAC11\uB2C8\uB2E4 \u2014 unix \uCABD\uC5D0\uC11C
# pgrep \uC815\uADDC\uC2DD\uC774 \uC77C\uC73C\uD0A4\uB358 \uAC83\uACFC \uAC19\uC740 \uD568\uC815\uC785\uB2C8\uB2E4(processList \uC8FC\uC11D).
$pat = $env:HYPERTEAMS_PTYD
$cmp = [System.StringComparison]::OrdinalIgnoreCase
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($pat, $cmp) -ge 0 } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
`,{HYPERTEAMS_PTYD:e});else{let s=zt();if(s){for(let o of s)if(o.args.includes(e))try{process.kill(o.pid,"SIGTERM")}catch{}}else S("pkill",["-f",Zt(e)],{stdio:"ignore"})}let r=new RegExp(`^ptyd-\\d+-${fe}\\.(sock|token)$`);for(let s of[Ut,I])try{for(let o of a.readdirSync(s))r.test(o)&&a.rmSync(i.join(s,o),{force:!0})}catch{}t.quiet!==!0&&d("Cleaned up the running terminal daemon")}function at(t=new Set(wt())){let e=_();if(e.kind==="launchd"){let r=Vt();return r===null?!1:t.has(r)?(h("This command is running inside the login item \u2014 leaving the service registered."),!1):(x(["bootout",`${U()}/${R}`]),d(Mt()?"Took the login item down (it comes back at the next login).":"Took the login item down."),!0)}if(e.kind==="systemd"){if(!qt())return!1;let r=be();return r!==null&&t.has(r)?(h("This command is running inside the login item \u2014 leaving the service registered."),!1):(P(["stop",v]),d(`Stopped ${v} (it stays enabled for the next login).`),!0)}return!1}async function te(t={}){n(`Install directory: ${c}`);let e=new Set(wt()),r=at(e),s=ne();if(s===0)return d(r?"Stopped.":t.thenStart?"Nothing was running.":"Nothing is running from this installation."),0;s!==null&&n(`${s} process${s===1?" is":"es are"} running.`);let o=re();if(o&&(h(`${o} job${o===1?" is":"s are"} running right now \u2014 stopping interrupts ${o===1?"it":"them"}.`),!await N("Stop anyway?")))return n("Cancelled \u2014 nothing was stopped."),1;let l=g||$.has("--force");if(!l){n("Stopping..."),Qt("SIGTERM",e);for(let p=0;p<32&&Z(e).length>0;p++)await A(250)}let u=g?null:Z(e).length;if(u!==0&&(l||h(`${u} process${u===1?"":"es"} did not stop in time \u2014 forcing.`),ot()),it({quiet:!0}),n(""),d("Stopped."),!t.thenStart){let p=G()?.commandName??m;n(`Start it again:  ${p}`),Mt()&&n(`Autostart is on, so it also comes back at the next login (${p} autostart off).`)}return 0}async function Ce(t){let e=await te({thenStart:!0});if(e!==0)return e;let r=nt();for(let s=0;s<20&&await O(r);s++)await A(250);return await O(r)&&f(`Port ${r} is still in use, so it was not started again.
  Something outside this installation may be holding it.
  Start it anyway with:  ${m} start --force`),process.stderr.write(`
`),Ht?Ft(t):rt()}async function Ne(){n(`Install directory: ${c}`),n(""),at(),ot(),it();let t=G(),e=t?.commandName??m,{binDir:r,file:s}=t?.file?{binDir:t.binDir,file:t.file}:Jt(e);if(Gt({quiet:!0}),g?Ue(r):Kt(),g)ct(s),d(`The command will be removed after this window closes: ${s}`);else try{a.rmSync(s,{force:!0}),d(`Removed the command: ${s}`)}catch{}try{a.rmSync($t,{force:!0})}catch{}n(""),h("Deleting the install directory also deletes the following \u2014 this cannot be undone:"),n("    data.db (all working directories, tasks and messages)"),n("    .env.local (password hash and domain settings)"),n("    cloudflared/ (tunnel credentials)"),await N(`Delete ${c}?`)?Le():n("Left the install directory in place.");let o=_e();if(o.length){n(""),h("The app left some state in your home directory:");for(let{path:u,note:p}of o)n(`    ${u}${p?`  \u2014 ${p}`:""}`);if(await N("Delete these too?")){for(let{path:u}of o)jt(u);d("Deleted the state")}else n("Left the state in place.")}let l=He();if(l.length){n(""),h("Backups from earlier installations remain (they include the DB and password hash):");for(let u of l)n(`    ${u}`);if(await N("Delete these backups too?")){for(let u of l)jt(u);d("Deleted the backups")}else n("Left the backups in place.")}return n(""),d("Uninstall finished."),n(""),n("Not removed / cannot be removed from here:"),n("  \xB7 ~/.claude, ~/.claude.json \u2014 Claude Code's own settings and auth (separate from this app)."),n("  \xB7 Your working directories \u2014 they live outside the app and are untouched."),n("  \xB7 Cloudflare tunnels and hostnames \u2014 delete those records in the Cloudflare dashboard."),n("  \xB7 System-installed node, git, caddy and cloudflared."),a.existsSync(I)&&n(`  \xB7 ${I} \u2014 kept on purpose (see above); delete it by hand if you want it gone.`),Q.length&&(n(""),n("Deletion finishes a few seconds after this window closes."),n("If anything survives, the reason is logged to %TEMP%\\hyperteams-uninstall.log")),g||n(""),g||n(`Open a new terminal, or run 'exec ${i.basename(process.env.SHELL||"bash")} -l' to refresh PATH.`),ee(),0}function _e(){return[{path:Ut,note:"sockets and pids (safe to discard)"},{path:i.join(I,"logs"),note:"daemon logs"},{path:i.join(I,"models"),note:"dictation models \u2014 574MB to download again"},{path:i.join(I,"runtime"),note:"the Node the installer downloaded for HyperTeams only"}].filter(e=>a.existsSync(e.path))}function He(){let t=i.dirname(c),e=i.basename(c)+".backup-",r=[];for(let s of new Set([t,w]))try{for(let o of a.readdirSync(s))(o.startsWith(e)||o.startsWith(".hyperteams.backup-"))&&r.push(i.join(s,o))}catch{}return[...new Set(r)]}var Q=[];function ct(t){Q.push(t)}function jt(t){try{a.rmSync(t,{recursive:!0,force:!0})}catch{g?ct(t):h(`Could not delete: ${t}`)}}function Le(){if(g){ct(c),d(`The install directory will be deleted after this window closes: ${c}`);return}try{process.chdir(w)}catch{}a.rmSync(c,{recursive:!0,force:!0}),d(`Deleted the install directory: ${c}`)}function ee(){if(!g||Q.length===0)return;try{process.chdir(w)}catch{}let e=`\uFEFF
$ErrorActionPreference = 'SilentlyContinue'
$log = Join-Path $env:TEMP 'hyperteams-uninstall.log'
Start-Sleep -Seconds 3

foreach ($p in @(
${Q.map(o=>`  '${o.replace(/'/g,"''")}'`).join(`,
`)}
)) {
  # \uD55C \uBC88 \uB358\uC9C0\uACE0 \uB9C8\uB294 \uBC29\uC2DD\uC73C\uB85C\uB294 \uBD80\uC871\uD569\uB2C8\uB2E4. \uC7A0\uAE08\uC740 \uB2A6\uAC8C \uD480\uB9AC\uACE0(\uBC29\uAE08 \uC8FD\uC778 \uD504\uB85C\uC138\uC2A4\uC758
  # \uD578\uB4E4\xB7\uBC31\uC2E0 \uAC80\uC0AC\xB7\uD0D0\uC0C9\uAE30), Remove-Item \uC740 260\uC790\uB97C \uB118\uB294 \uACBD\uB85C\uC5D0\uC11C \uADF8\uB0E5 \uC2E4\uD328\uD569\uB2C8\uB2E4.
  # \uADF8\uB798\uC11C \uD655\uC778\uD558\uBA70 \uBC18\uBCF5\uD558\uACE0, \uAE34 \uACBD\uB85C\uB294 robocopy \uB85C \uBE44\uC6C1\uB2C8\uB2E4 \u2014 robocopy \uB294 \uAE34 \uACBD\uB85C\uB97C
  # \uB124\uC774\uD2F0\uBE0C\uB85C \uB2E4\uB8E8\uB294, \uC5B4\uB514\uC5D0\uB098 \uC788\uB294 \uC720\uC77C\uD55C \uC218\uB2E8\uC785\uB2C8\uB2E4.
  for ($i = 0; $i -lt 15; $i++) {
    if (-not (Test-Path -LiteralPath $p)) { break }
    Remove-Item -LiteralPath $p -Recurse -Force
    if (-not (Test-Path -LiteralPath $p)) { break }
    if (Test-Path -LiteralPath $p -PathType Container) {
      $empty = Join-Path $env:TEMP ('hyperteams-empty-' + $PID)
      New-Item -ItemType Directory -Path $empty -Force | Out-Null
      robocopy $empty $p /MIR /NJH /NJS /NP /NFL /NDL | Out-Null
      Remove-Item -LiteralPath $empty -Recurse -Force
      Remove-Item -LiteralPath $p -Recurse -Force
    }
    Start-Sleep -Seconds 1
  }
  # \uADF8\uB798\uB3C4 \uB0A8\uC558\uB2E4\uBA74 \uC870\uC6A9\uD788 \uB118\uAE30\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4 \u2014 \uC9C0\uC6B4 \uC904 \uC54C\uC558\uB294\uB370 \uB0A8\uC544 \uC788\uB294 \uAC83\uC774
  # \uC0AC\uC6A9\uC790\uAC00 \uACAA\uB294 \uC99D\uC0C1\uC774\uC5C8\uC2B5\uB2C8\uB2E4. \uCF58\uC194\uC740 \uC774\uBBF8 \uB2EB\uD614\uC73C\uBBC0\uB85C \uB85C\uADF8\uB85C \uB0A8\uAE41\uB2C8\uB2E4.
  if (Test-Path -LiteralPath $p) {
    Add-Content -LiteralPath $log -Value ((Get-Date -Format s) + "  could not delete: " + $p)
  }
}

Remove-Item -LiteralPath $MyInvocation.MyCommand.Path -Force
`,r=i.join(et.tmpdir(),`hyperteams-rm-${process.pid}.ps1`);a.writeFileSync(r,e,"utf8"),ft("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-WindowStyle","Hidden","-File",r],{detached:!0,stdio:"ignore"}).unref()}var pt=process.env.DIST_REPO_URL||"https://github.com/hyperteamsnet/hyperteams.git",B="origin",Fe=["data.db","data.db-wal","data.db-shm",".env.local","previews.map","dashboards.map","cloudflared"],Dt=[".env.local","previews.map","dashboards.map","cloudflared"],A=t=>new Promise(e=>setTimeout(e,t));function St(){let t=a.existsSync(i.join(c,"server.js")),e=a.existsSync(i.join(c,".git"));return t?e?"artifact":"artifact-detached":e?"source":"unknown"}var kt={...process.env,GIT_TERMINAL_PROMPT:"0"};function k(t){let e=S("git",["-C",c,...t],{encoding:"utf8",env:kt});return{status:e.error?1:e.status??1,out:(e.stdout??"").trim(),err:(e.stderr??"").trim()}}function Me(t){let e=S("git",["-C",c,...t],{stdio:["ignore","inherit","inherit"],env:kt});return e.error?1:e.status??1}function Be(){let t=_t("branch",null);if(t)return t;let e=k(["symbolic-ref","--quiet","--short","HEAD"]);return e.status===0&&e.out?e.out:`dist-${process.platform}-${process.arch}`}function We(){let t=k(["remote","get-url",B]);if(t.status===0&&t.out)return t.out;let e=k(["remote","add",B,pt]);return e.status!==0&&f(`Could not set the download source: ${e.err}`),h(`The download source was missing \u2014 restored it: ${pt}`),pt}function ne(){return g?null:Z().length}function re(){let t=process.env.DB_PATH||i.join(c,"data.db");if(!a.existsSync(t))return null;let e;try{e=yt(import.meta.url).resolve("better-sqlite3")}catch{return null}let r=`
const Database = require(process.argv[1]);
const db = new Database(process.argv[2], { readonly: true, fileMustExist: true });
try {
  const row = db.prepare(
    "SELECT (SELECT COUNT(*) FROM tasks WHERE status='running')" +
    " + (SELECT COUNT(*) FROM terminal_runs WHERE status='running') AS n",
  ).get();
  process.stdout.write(String(row && row.n != null ? row.n : ""));
} finally {
  db.close();
}
`,o=(S(process.execPath,["-e",r,e,t],{encoding:"utf8",timeout:15e3,stdio:["ignore","pipe","ignore"]}).stdout??"").trim(),l=Number(o);return o!==""&&Number.isFinite(l)?l:null}function Ve(t){let e=k(["show",`${t}:.node-requirement.json`]);if(e.status!==0)return null;let r;try{r=JSON.parse(e.out)}catch{return null}let s=Array.isArray(r.sqliteAbis)?r.sqliteAbis:[];if(s.length===0)return null;let o=String(process.versions.modules);return s.some(l=>String(l.abi)===o)?null:`The new version does not support this Node.
  It needs Node ${s.map(l=>l.major).join(" or ")}; this is ${process.version} (ABI ${o}).
  Install a supported version first (https://nodejs.org/ \u2014 nvm/fnm makes switching easy).`}function qe(){let t=new Date().toISOString().replace(/[-:]/g,"").replace("T","-").slice(0,15),e=`${c}.backup-upgrade-${t}`,r=$.has("--backup-db")?[...Dt,"data.db","data.db-wal","data.db-shm"]:Dt,s=0;try{a.mkdirSync(e,{recursive:!0});for(let o of r){let l=i.join(c,o);a.existsSync(l)&&(a.cpSync(l,i.join(e,o),{recursive:!0}),s++)}}catch(o){return h(`Could not write the backup (continuing): ${o.message}`),null}return s===0?(a.rmSync(e,{recursive:!0,force:!0}),null):(Ge(),e)}function Ge(){let t=i.dirname(c),e=i.basename(c)+".backup-upgrade-",r=[];try{r=a.readdirSync(t).filter(s=>s.startsWith(e)).sort()}catch{return}for(let s of r.slice(0,Math.max(0,r.length-3)))try{a.rmSync(i.join(t,s),{recursive:!0,force:!0})}catch{}}function tt(t){let e=S("git",["-C",c,"reset","--hard",t],{encoding:"utf8",env:kt}),r=`${e.stdout??""}${e.stderr??""}`,s=[],o=/(?:unable to unlink(?: old)?|cannot unlink(?: stray)?) '([^']+)'/g;for(let l of r.matchAll(o))s.push(l[1]);return{status:e.error?1:e.status??1,text:r,locked:s}}var Je=0;function se(t){let e=i.join(c,t);try{if(!a.existsSync(e))return!1;let r=`${e}.stale-${process.pid}-${Je++}`;return a.renameSync(e,r),ct(r),!0}catch{return!1}}async function Ot(){let t=$.has("--prepare"),e=St();if(e==="source"||e==="unknown")return n("This is not a packaged installation, so there is nothing to download."),n(""),n("From a source checkout, upgrade with your own toolchain:"),n("    git pull --ff-only && pnpm install && pnpm build"),n(""),n("`pnpm start` also follows the repository's release tags on its own."),1;e==="artifact-detached"&&f(`This installation has no download source (.git is missing), so it cannot upgrade itself.
  Run the install command again \u2014 it backs up and restores your data.`);let r=S("git",["--version"],{stdio:"ignore"});(r.error||r.status!==0)&&f(`git is required to upgrade \u2014 it is what downloads the new version.
  It was required to install too, so it may have been removed since: https://git-scm.com/downloads`);let s=Be(),o=We(),l=q();n(`Install directory: ${c}`),n(`Current version:   v${l}`),n(`Channel:           ${s}`),n("Checking for a new version...");let u=k(["rev-parse","HEAD"]).out,p=k(["ls-remote",B,`refs/heads/${s}`]);p.status!==0&&f(`Could not reach the release repository \u2014 check your internet connection.
  Source: ${o}
  ${p.err.split(`
`).slice(-1)[0]??""}`);let b=p.out.split(/\s+/)[0]??"";b||f(`There is no build for this system in the release repository (branch '${s}').
  It may not have been published for this OS/architecture yet.`);let y=b===u;if($.has("--check"))return process.stdout.write((y?"up-to-date":"update-available")+`
`),y?d(`This is the latest version (v${l}).`):(n(`An update is available: ${u.slice(0,7)} \u2192 ${b.slice(0,7)}`),n(`Apply it with:  ${m} upgrade`)),0;if(y&&!$.has("--force"))return t&&process.stdout.write(`up-to-date
`),d(`This is the latest version (v${l}) \u2014 nothing to do.`),t||n("Re-download it anyway with --force."),0;let j=t?0:ne(),Y=t?0:re();if(!t&&(n(""),n(y?"Re-downloading the current version:":`Update found: ${b.slice(0,7)}`),n("  \xB7 downloads the latest build for this system"),n("  \xB7 replaces the program files only \u2014 your DB, settings and tunnel credentials stay"),j===null?n("  \xB7 stops the app if it is running (it must be restarted afterwards)"):j>0&&n(`  \xB7 stops the app (${j} process${j===1?"":"es"} running now)`),Y&&(n(""),h(`${Y} job${Y===1?" is":"s are"} running right now \u2014 restarting interrupts ${Y===1?"it":"them"}.`)),n(""),!await N("Upgrade now?")))return n("Cancelled \u2014 nothing was changed."),1;!t&&j!==0&&(n("Stopping the app..."),at(),ot(),it(),await A(g?2e3:300),n("")),n("Downloading the new version...");let H=`refs/remotes/${B}/${s}`;Me(["fetch","--depth","1",B,`+refs/heads/${s}:${H}`])!==0&&f(`Download failed \u2014 nothing was changed.
  Check your internet connection and run '${m} upgrade' again.${t?"":`
  The app was stopped, so start it with '${m}' if you want to keep using this version.`}`),d("Download complete");let Pt=k(["ls-tree","-r","--name-only",H,"--",...Fe]).out;Pt&&f(`The new build would overwrite your data \u2014 stopping. Nothing was changed.
  Offending paths: ${Pt.split(`
`).join(", ")}
  Please report this; do not upgrade until it is fixed.`);let K=Ve(H);if(K&&!$.has("--force")&&f(`${K}
  Nothing was changed \u2014 the current version is still installed.`),t)return process.stdout.write(`prepared
`),d(`Downloaded and verified: ${b.slice(0,7)} \u2014 not applied yet.`),n(`Apply it with:  ${m} upgrade`),0;let At=qe();n("Applying..."),k(["symbolic-ref","HEAD",`refs/heads/${s}`]);let E=tt(H);for(let L=1;g&&L<=3&&E.status!==0;L++){let ut=E.locked.filter(se);if(ut.length){let It=ut.length;n(`${It} file${It===1?" was":"s were"} locked \u2014 set aside, retrying...`)}else n("Some files were in use \u2014 waiting and retrying...");await A(1e3*L),E=tt(H)}if(E.status!==0){process.stderr.write(E.text.trimEnd()+`
`);let L=E.locked.length?`
  Still in use: ${E.locked.join(", ")}`:"";f(`Could not replace the program files.${L}
  Something may still have them open \u2014 close it and run '${m} upgrade' again.${g?`
  A virus scan, an open Explorer window on the install folder, or a leftover node.exe is the usual cause.`:""}`)}E.text.trim()&&process.stderr.write(E.text.trimEnd()+`
`),a.existsSync(i.join(c,"server.js"))||f(`The downloaded build looks incomplete (server.js is missing).
  Run the install command again to reinstall.`),d("Applied"),$.has("--no-gc")||(n("Cleaning up the old version..."),k(["reflog","expire","--expire=now","--all"]),k(["gc","--prune=now","--quiet"]));let Et=G()?.commandName??m;g||Yt({name:Et,quiet:!0}),ee();let lt=q();return n(""),d(l===lt?`Up to date (v${lt})`:`Upgraded: v${l} \u2192 v${lt}`),At&&n(`  Settings backup: ${At}`),K&&(n(""),h(K)),n(""),n("Start it again:"),n(`  ${Et}`),0}var oe=["autoUpdate:enabled","autoUpdate:scope","autoUpdate:intervalHours","autoUpdate:checkOnBoot","autoUpdate:rollbackWaitMinutes","autoUpdate:lastCheckAt","autoUpdate:detectedVersion","autoUpdate:lastResult","autoUpdate:attempt","autoUpdate:rollbackPending","autoUpdate:rollbackPendingAt","autoUpdate:halted","autoUpdate:skipVersion"];function J(){return process.env.DB_PATH||i.join(c,"data.db")}function vt(t){let e=J();if(!a.existsSync(e))return null;let r;try{r=yt(import.meta.url).resolve("better-sqlite3")}catch{return null}let s=`
const Database = require(process.argv[1]);
const db = new Database(process.argv[2], { readonly: true, fileMustExist: true });
try {
  db.pragma("busy_timeout = 5000");
  const keys = JSON.parse(process.argv[3]);
  const out = {};
  const stmt = db.prepare("SELECT value FROM app_settings WHERE key = ?");
  for (const k of keys) { const r = stmt.get(k); if (r) out[k] = r.value; }
  process.stdout.write(JSON.stringify(out));
} finally { db.close(); }
`,o=S(process.execPath,["-e",s,r,e,JSON.stringify(t)],{encoding:"utf8",timeout:15e3,stdio:["ignore","pipe","ignore"]});if(o.status!==0||!(o.stdout??"").trim())return null;try{return JSON.parse(o.stdout)}catch{return null}}function W(t,e){let r=J();if(!a.existsSync(r))return!1;let s;try{s=yt(import.meta.url).resolve("better-sqlite3")}catch{return!1}let o=`
const Database = require(process.argv[1]);
const db = new Database(process.argv[2], { fileMustExist: true });
try {
  db.pragma("busy_timeout = 10000");
  db.prepare(
    "INSERT INTO app_settings (key,value,updated_at) VALUES (?,?,unixepoch())" +
    " ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=unixepoch()"
  ).run(process.argv[3], process.argv[4]);
} finally { db.close(); }
`,l=S(process.execPath,["-e",o,s,r,t,e],{encoding:"utf8",timeout:2e4,stdio:["ignore","ignore","pipe"]});return l.status!==0?(h((l.stderr??"").trim().split(`
`).slice(-1)[0]||"could not write to the database"),!1):!0}function V(t,e){if(!t)return e;try{return JSON.parse(t)??e}catch{return e}}var Ye="hyperteams-rollback-",Ke=".backup-autoupdate-";function ie(){let t=k(["tag","--list",`${Ye}*`]);return t.status===0&&t.out?t.out.split(`
`).map(e=>e.trim()).filter(Boolean).sort():[]}function ae(){let t=i.dirname(c),e=i.basename(c)+Ke;try{return a.readdirSync(t).filter(r=>r.startsWith(e)).map(r=>i.join(t,r,"data.db")).filter(r=>a.existsSync(r)).sort()}catch{return[]}}function X(t){let e=Number(t);return Number.isFinite(e)&&e>0?new Date(e*1e3).toISOString():"\u2014"}function Xe(t){let e=V(t?.["autoUpdate:rollbackPending"],null)??V(t?.["autoUpdate:attempt"],null);if(e?.rollbackRef||e?.fromSha)return{ref:e.rollbackRef??null,fallbackRef:e.fromSha??null,dbBackup:e.dbBackup??null,fromVersion:e.fromVersion??null,toVersion:e.toVersion??null,guessed:!1};let r=ie(),s=ae();return!r.length&&!s.length?null:{ref:r.length?r[r.length-1]:null,fallbackRef:null,dbBackup:s.length?s[s.length-1]:null,fromVersion:null,toVersion:null,guessed:!0}}function ze(...t){for(let e of t)if(e&&k(["rev-parse","--verify","--quiet",`${e}^{commit}`]).status===0)return e;return null}function Ze(){let t=vt(oe);if(n(`Install directory: ${c}`),n(`Current version:   v${q()}`),n(`Installation kind: ${St()}`),n(""),!t)h(`Could not read ${J()} \u2014 showing only what is on disk.`);else{let s=y=>t[y]===void 0?!0:t[y]==="1",o=s("autoUpdate:enabled");n("Automatic updates"),n(`  Checking:        ${o?"on":"off"}`),n(`  Interval:        every ${t["autoUpdate:intervalHours"]??"6"}h`),n(`  Apply up to:     ${t["autoUpdate:scope"]??"patch"}`);let l=s("autoUpdate:checkOnBoot");n(`  Check on start:  ${l?"yes":"no"}`),n(`  Rollback waits:  ${t["autoUpdate:rollbackWaitMinutes"]??"30"}m for running work`),n(`  Last checked:    ${X(t["autoUpdate:lastCheckAt"])}`),n(`  Latest seen:     v${t["autoUpdate:detectedVersion"]||"?"}`),t["autoUpdate:skipVersion"]&&n(`  Skipping:        v${t["autoUpdate:skipVersion"]} (it was rolled back)`),n("");let u=V(t["autoUpdate:lastResult"],null);u&&(n("Last attempt"),n(`  Outcome:         ${u.outcome}`),n(`  When:            ${X(u.at)}`),n(`  Versions:        v${u.fromVersion} \u2192 v${u.toVersion??"?"}`),u.detail&&n(`  Detail:          ${u.detail}`),n(""));let p=V(t["autoUpdate:attempt"],null);p&&(h("An update is in flight (the app left a record and has not reported back yet)."),n(`  Started:         ${X(p.startedAt)}`),n(""));let b=V(t["autoUpdate:rollbackPending"],null);b&&(h("A rollback is queued \u2014 it is waiting for running work to finish."),n(`  Waiting since:   ${X(t["autoUpdate:rollbackPendingAt"])}`),n(`  Would restore:   ${b.rollbackRef} and ${b.dbBackup}`),n("")),t["autoUpdate:halted"]&&(h(`Automatic updates are halted: ${t["autoUpdate:halted"]}`),n(`  Clear it with:   ${m} auto-update --resume`),n(""))}let e=ie(),r=ae();return n("Recovery material on disk"),n(`  Rollback tags:   ${e.length?e.join(", "):"(none)"}`),n(`  DB snapshots:    ${r.length?r.join(`
                   `):"(none)"}`),n(""),(e.length||r.length)&&n(`Roll back with:  ${m} rollback`),0}function Qe(){if(!$.has("--resume"))return n(`Usage: ${m} auto-update --resume`),n(""),n(`Shows the current state with:  ${m} upgrade-status`),n("Everything else is configured from the dashboard (Settings \u2192 Update)."),1;let t=vt(["autoUpdate:halted","autoUpdate:rollbackPending"]);return t==null&&f(`Could not open ${J()} \u2014 is this the installation directory?`),t["autoUpdate:halted"]?(n(`Halted because: ${t["autoUpdate:halted"]}`),W("autoUpdate:halted","")||f("Could not clear it. If the app is running, use Settings \u2192 Update \u2192 Resume instead."),t["autoUpdate:rollbackPending"]&&W("autoUpdate:rollbackPendingAt",String(Math.floor(Date.now()/1e3))),d("Cleared. Automatic updates will try again at the next check."),0):(d("Automatic updates are not halted \u2014 nothing to do."),0)}async function tn(){let t=St();(t==="source"||t==="unknown")&&f(`This is not a packaged installation, so there is nothing to roll back.
  From a source checkout, use git directly.`);let e=S("git",["--version"],{stdio:"ignore"});(e.error||e.status!==0)&&f("git is required to roll back \u2014 it is what restores the program files.");let r=vt(oe),s=Xe(r);s||f(`Nothing to roll back to \u2014 this installation has no rollback tag and no database snapshot.
  Those are made by an automatic update just before it applies one (Settings \u2192 Update).
  To reinstall the previous version, run the install command again.`);let o=ze(s.ref,s.fallbackRef);o||f(`The rollback point is gone from this repository${s.ref?` (${s.ref})`:""}.
  Nothing was changed. Run the install command again to reinstall.`),(!s.dbBackup||!a.existsSync(s.dbBackup))&&f(`The database snapshot is missing${s.dbBackup?`: ${s.dbBackup}`:""}.
  Nothing was changed \u2014 rolling the program files back without it would leave a new
  database under old code, and this command will not do that unattended.
  If you want the program files only, run: git -C "${c}" reset --hard ${o}`);let l=q();if(n(`Install directory: ${c}`),n(`Current version:   v${l}`),n(""),n("This will:"),n("  \xB7 stop the app and the terminal daemon"),n(`  \xB7 restore the program files to ${o}${s.fromVersion?` (v${s.fromVersion})`:""}`),n(`  \xB7 replace data.db with ${s.dbBackup}`),n("  \xB7 start the app again"),s.guessed&&(n(""),h("The app did not record a rollback, so this is the newest tag and snapshot on disk."),h("They are probably from the same update, but nothing guarantees it.")),n(""),h("Anything written to the database since that snapshot will be lost."),n(""),!await N("Roll back now?"))return n("Cancelled \u2014 nothing was changed."),1;n("Stopping the app..."),at(),ot(),it(),await A(g?2e3:500);let u=J();if(a.existsSync(u)){let y=`${u}.before-rollback-${Date.now()}`;try{a.copyFileSync(u,y),n(`Kept the current database at: ${y}`)}catch(j){f(`Could not set the current database aside (${j.message}) \u2014 stopping before anything changed.`)}}n("Restoring the program files...");let p=tt(o);for(let y=1;g&&y<=3&&p.status!==0;y++)p.locked.filter(se),await A(1e3*y),p=tt(o);p.status!==0&&(process.stderr.write(p.text.trimEnd()+`
`),f("Could not restore the program files. The database was not touched.")),a.existsSync(i.join(c,"server.js"))||f(`The restored tree has no server.js \u2014 this is not a usable version.
  The database was not touched. Run the install command again.`),d(`Program files restored to ${o}`),n("Restoring the database...");try{a.copyFileSync(s.dbBackup,u);for(let y of["-wal","-shm"])a.rmSync(`${u}${y}`,{force:!0})}catch(y){f(`The program files are back at ${o}, but the database could not be restored: ${y.message}
  Copy it by hand:  cp "${s.dbBackup}" "${u}"`)}d("Database restored");for(let y of["autoUpdate:lock","autoUpdate:attempt","autoUpdate:rollbackPending","autoUpdate:rollbackPendingAt","autoUpdate:halted","autoUpdate:nextCheckAt"])W(y,"");let b=s.toVersion??l;b&&W("autoUpdate:skipVersion",b),W("autoUpdate:lastResult",JSON.stringify({at:Math.floor(Date.now()/1e3),outcome:"rolled-back",fromVersion:s.fromVersion??"?",toVersion:b,detail:`rolled back by hand with \`${m} rollback\` \u2014 restored ${o} and ${s.dbBackup}`}));try{a.rmSync(i.join(c,".auto-update-rollback.json"),{force:!0})}catch{}return $.has("--no-start")?(n(""),n("Start it again:"),n(`  ${m}`),0):(n(""),n("Starting the app again..."),await rt())}function q(){try{return JSON.parse(a.readFileSync(i.join(c,"package.json"),"utf8")).version??"unknown"}catch{return"unknown"}}function Tt(){let t=m;return process.stderr.write(`
HyperTeams

  ${t}                 start the server in the background (${t} stop ends it)
  ${t} start --foreground
                             hold this terminal instead (Ctrl-C stops it)
  ${t} stop            stop it from anywhere \u2014 foreground, background or login item
  ${t} restart         stop it and start it again in the background
  ${t} autostart       start it automatically when this computer starts
  ${t} autostart off   stop doing that
  ${t} setup           reconfigure (.env.local)
  ${t} upgrade         update to the latest version (keeps your data)
  ${t} upgrade-status  what the last (automatic) update did, and what can be undone
  ${t} rollback        undo the last automatic update: previous files + previous database
  ${t} auto-update --resume
                             clear a halted automatic updater
  ${t} install-shim    register this command on PATH
  ${t} uninstall       undo the installation

Options
  --command-name <name>   name to register the command under (default: hyperteams)
  --force                 overwrite even if the name is taken; upgrade even if unchanged;
                          stop without waiting for a clean shutdown; start even if the
                          port looks busy
  --yes, -y               skip confirmations (stop, upgrade, uninstall)
  --version               print the version

Options for autostart
  on | off | status       turn it on (default), turn it off, or show what is set
  --print-url             also print the dashboard address on stdout (for scripts)

Options for start / restart
  --foreground, --fg      hold this terminal (Ctrl-C stops it) instead of going to
                          the background, where output goes to logs/server.log
  --background, --bg      accepted and ignored \u2014 this is the default now
  --print-url             also print the dashboard address on stdout (for scripts)

Options for rollback
  --yes, -y               do not ask for confirmation
  --no-start              restore, but do not start the app again

Options for upgrade
  --check                 only report whether a new version is available
  --prepare               download the new version but do not apply it
                          (the dashboard's update button uses this \u2014 it downloads
                           while the app is still running, then hands the apply
                           step to the supervisor)
  --backup-db             copy data.db into the backup too (settings are always copied)
  --branch <name>         download a specific release branch
  --no-gc                 skip reclaiming the space the old version used

Install directory: ${c}
`),0}var en={start:()=>Ft(D),stop:()=>te(),restart:()=>Ce(D),setup:()=>ge(D),upgrade:()=>Ot(),"upgrade-status":()=>Ze(),rollback:()=>tn(),"auto-update":()=>Qe(),update:()=>Ot(),autostart:()=>xt(),"auto-start":()=>xt(),"install-shim":()=>Yt(),uninstall:()=>Ne(),help:()=>Tt()};$.has("--version")&&(process.stdout.write(q()+`
`),process.exit(0));($.has("--help")||$.has("-h"))&&process.exit(Tt());var ce=en[Nt];ce||(process.stderr.write(`\x1B[91m\u2717 Unknown command: ${Nt}\x1B[0m
`),process.exit(Tt()||1));process.exit(await ce()??0);
