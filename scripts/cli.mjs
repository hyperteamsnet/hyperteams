#!/usr/bin/env node
import a from"node:fs";import ae from"node:net";import et from"node:os";import i from"node:path";import{fileURLToPath as ce}from"node:url";import{createHash as le}from"node:crypto";import{createRequire as mt}from"node:module";import{spawnSync as S,spawn as pt}from"node:child_process";import{createInterface as ue}from"node:readline/promises";var c=i.resolve(i.dirname(ce(import.meta.url)),".."),g=process.platform==="win32",w=et.homedir(),I=i.join(w,".hyperteams"),Ot=i.join(I,"run"),gt=i.join(I,"shim.json"),de=(()=>{let t=i.join(c,"scripts","ptyd.mjs"),e=t;try{e=a.realpathSync(t)}catch{}return le("sha256").update(e).digest("hex").slice(0,8)})(),z="# >>> hyperteams >>>",Dt="# <<< hyperteams <<<",r=t=>process.stderr.write(`\x1B[36m[hyperteams]\x1B[0m ${t}
`),d=t=>process.stderr.write(`\x1B[92m\u2713\x1B[0m ${t}
`),h=t=>process.stderr.write(`\x1B[93m\u26A0\x1B[0m ${t}
`),f=t=>{process.stderr.write(`\x1B[91m\u2717 ${t}\x1B[0m
`),process.exit(1)},U=process.argv.slice(2),b=new Set(U.filter(t=>t.startsWith("--"))),O=U.filter(t=>!t.startsWith("--")),Ct=O[0]&&!O[0].startsWith("-")?O.shift():"start";function Ut(t,e){let n=U.indexOf(`--${t}`);return n>=0&&U[n+1]&&!U[n+1].startsWith("--")?U[n+1]:e}var m=Ut("command-name","hyperteams"),pe=b.has("--yes")||b.has("-y"),Nt=b.has("--foreground")||b.has("--fg");function ft(t,e,n={}){let s=process.listeners("SIGINT");process.on("SIGINT",()=>{});try{let o=S(t,e,{stdio:"inherit",...n});return o.error&&f(`Failed to run ${t}: ${o.error.message}`),o.status??1}finally{process.removeAllListeners("SIGINT");for(let o of s)process.on("SIGINT",o)}}function _t(){a.existsSync(i.join(c,"server.js"))||f("server.js is missing \u2014 the release package is corrupted."),a.existsSync(i.join(c,".env.local"))||f(`.env.local is missing. Configure it with:
    ${m} setup`)}function fe(){r("Checking the setup..."),_t(),d("Setup looks good"),process.stderr.write(`
`),r("Starting HyperTeams..."),r("The dashboard address is printed in the [supervise] lines below."),r("Stop: Ctrl-C"),process.stderr.write(`
`)}function Ht(t){if(!Nt)return rt();if(g){let n=i.join(c,"scripts","supervise.mjs");return a.existsSync(n)||f(`Start script not found: ${n}`),fe(),ft(process.execPath,[n,...t])}let e=i.join(c,"scripts","start.sh");return a.existsSync(e)||f(`Start script not found: ${e}`),ft("bash",[e,...t])}var T=i.join(c,"logs","server.log");function nt(){let t=Number(process.env.PORT);if(t)return t;try{let e=a.readFileSync(i.join(c,".env.local"),"utf8").match(/^\s*PORT\s*=\s*["']?(\d+)/m);if(e)return Number(e[1])}catch{}return 27777}function D(t){return new Promise(e=>{let n=ae.connect({host:"127.0.0.1",port:t}),s=o=>{n.destroy(),e(o)};n.setTimeout(500),n.on("connect",()=>s(!0)),n.on("timeout",()=>s(!1)),n.on("error",()=>s(!1))})}function M(t){try{return a.readFileSync(T,"utf8").trimEnd().split(`
`).slice(-t)}catch{return[]}}async function rt(){r("Checking the setup..."),_t();let t=nt();!b.has("--force")&&await D(t)&&f(`Something is already listening on port ${t} \u2014 it is probably already running.
  Stop it first:   ${m} stop
  Start anyway:    ${m} start --force`),d("Setup looks good"),a.mkdirSync(i.dirname(T),{recursive:!0});try{a.renameSync(T,`${T}.prev`)}catch{}let e=a.openSync(T,"a");process.stderr.write(`
`),r("Starting in the background...");let n={...process.env,HYPERTEAMS_BACKGROUND:"1"},s=g?pt(process.execPath,[i.join(c,"scripts","supervise.mjs")],{cwd:c,env:n,detached:!0,windowsHide:!0,stdio:["ignore",e,e]}):pt("bash",[i.join(c,"scripts","start.sh")],{cwd:c,env:n,detached:!0,stdio:["ignore",e,e]});s.unref(),a.closeSync(e);let o=null;s.on("exit",(l,p)=>o=l??p),s.on("error",l=>f(`Could not start: ${l.message}`));let u=null;for(let l=0;l<100&&u===null&&o===null;l++){await A(300);let p=M(200).join(`
`).match(/Dashboard:\s*(\S+)/);p&&(u=p[1])}if(o!==null){process.stderr.write(`
`);for(let l of M(15))process.stderr.write(`  ${l}
`);f(`It stopped right after starting (exit ${o}).
  The full log is at: ${T}`)}if(process.stderr.write(`
`),d(`Running in the background (pid ${s.pid})`),u)r(`Dashboard:  ${u}`);else{h("It has not printed an address yet \u2014 the last log lines are:");for(let l of M(10))process.stderr.write(`  ${l}
`)}return r(`Log:        ${T}`),r(`Stop:       ${G()?.commandName??m} stop`),0}function he(t){let e=i.join(c,"scripts","setup.mjs");return a.existsSync(e)||f(`Setup script not found: ${e}`),ft(process.execPath,[e,...t])}var R="net.hyperteams.app",v="hyperteams.service";function me(){let t=process.env.APPDATA||i.join(w,"AppData","Roaming");return i.join(t,"Microsoft","Windows","Start Menu","Programs","Startup")}function _(){return process.platform==="darwin"?{kind:"launchd",file:i.join(w,"Library","LaunchAgents",`${R}.plist`)}:g?{kind:"startup",file:i.join(me(),"HyperTeams.lnk"),helper:i.join(c,"bin","autostart.vbs")}:{kind:"systemd",file:i.join(w,".config","systemd","user",v)}}function Lt(){try{return a.existsSync(_().file)}catch{return!1}}function Ft(){let t=[i.dirname(process.execPath),...(process.env.PATH??"").split(i.delimiter)];g||t.push("/opt/homebrew/bin","/usr/local/bin","/usr/bin","/bin","/usr/sbin","/sbin");let e=new Set;return t.filter(n=>n&&!e.has(n)&&e.add(n)).join(i.delimiter)}function yt(){let t=a.existsSync(i.join(c,"server.js")),e=i.join(c,"scripts",t?"start.sh":"start-all.sh");return a.existsSync(e)||f(`Start script not found: ${e}`),a.existsSync(i.join(c,".env.local"))||f(`.env.local is missing. Configure it with:
    ${m} setup`),e}function ge(){if(process.platform!=="darwin")return null;for(let t of["Documents","Desktop","Downloads"]){let e=i.join(w,t);if(c===e||c.startsWith(e+i.sep))return e}return null}function x(t){let e=S("launchctl",t,{encoding:"utf8"});return{status:e.error?1:e.status??1,out:`${e.stdout??""}${e.stderr??""}`.trim()}}function C(){return`gui/${process.getuid?.()??0}`}function Mt(){return Bt()!==null}function Bt(){let t=x(["print",`${C()}/${R}`]);if(t.status!==0||!t.out.includes(c))return null;let e=t.out.match(/^\s*pid\s*=\s*(\d+)/m);return e?Number(e[1]):null}function Wt(){if(P(["is-active",v]).out.trim()!=="active")return!1;let t=P(["show","-p","FragmentPath",v]).out.match(/FragmentPath=(.*)/)?.[1];try{return a.readFileSync(t??_().file,"utf8").includes(c)}catch{return!1}}function ye(){let e=P(["show","-p","MainPID",v]).out.match(/MainPID=(\d+)/),n=e?Number(e[1]):0;return n>0?n:null}function P(t){let e=S("systemctl",["--user",...t],{encoding:"utf8"});return{status:e.error?1:e.status??1,out:`${e.stdout??""}${e.stderr??""}`.trim()}}function F(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function $e(){return`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${R}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${F(yt())}</string>
  </array>
  <key>WorkingDirectory</key><string>${F(c)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${F(Ft())}</string>
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
`}function be(){return`[Unit]
Description=HyperTeams
StartLimitIntervalSec=0

[Service]
Type=simple
WorkingDirectory=${c}
Environment="HYPERTEAMS_BACKGROUND=1"
Environment="PATH=${Ft()}"
ExecStart=/bin/bash "${yt()}"
# Restarted only when it fails: '${m} stop' stops this unit first, and a
# clean shutdown exits 0, so neither path resurrects it.
Restart=on-failure
RestartSec=30

[Install]
WantedBy=default.target
`}function we(){return["' hyperteams-autostart - generated by 'hyperteams autostart'. Do not edit.","' ASCII only: wscript reads a BOM-less .vbs in the ANSI code page.",'Set fso = CreateObject("Scripting.FileSystemObject")',"root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))",'CreateObject("WScript.Shell").Run "node """ & root & "\\scripts\\cli.mjs"" start", 0, False',""].join(`\r
`)}async function Se(t,e=60){for(let n=0;n<e*2;n++)if(await A(500),await D(t))return!0;return!1}async function ke(t=20){for(let e=0;e<t*4;e++){if(x(["print",`${C()}/${R}`]).status!==0)return!0;await A(250)}return!1}async function ve(t,e=15){for(let n=0;n<e*2;n++){if(!await D(t))return!0;await A(500)}return!1}function Et(){let t=(O[0]??"").toLowerCase();return b.has("--status")||t==="status"?Pe():b.has("--off")||t==="off"?Vt():(t&&t!=="on"&&f(`Unknown option: ${t}
  Usage: ${m} autostart [on|off|status]`),Te())}async function Te(){r(`Install directory: ${c}`),r("Checking the setup...");let t=yt();d(g?`Setup looks good (it will run: ${m} start)`:`Setup looks good (it will run: bash ${t})`);let e=ge();e&&(r(""),h(`This installation lives in a folder macOS protects: ${e}`),r("  Unless Full Disk Access is granted, a login item cannot read files there \u2014"),r('  every login would fail with "Operation not permitted", even though starting'),r("  it by hand works. Two ways out:"),r(`    \xB7 Move the installation out of ${i.basename(e)}/ (e.g. to ~/hyperteams), or`),r("    \xB7 System Settings \u25B8 Privacy & Security \u25B8 Full Disk Access \u25B8 add /bin/bash"),r(""));let n=_(),s=nt(),o=await D(s),u=n.kind==="launchd"?Mt():n.kind==="systemd"?Wt():!1;try{let l=n.kind==="startup"?c:a.readFileSync(n.file,"utf8");if(!l.includes(c)){h("Replacing a login item that pointed at another installation:");for(let p of l.match(/[^\s<>"]*(?:start-all\.sh|start\.sh|cli\.mjs)/g)??[])r(`    ${p}`);r("  Only one installation can start automatically \u2014 they would fight over the port.")}}catch{}if(a.mkdirSync(i.dirname(n.file),{recursive:!0}),a.mkdirSync(i.dirname(T),{recursive:!0}),n.kind==="launchd"){if(a.writeFileSync(n.file,$e()),d(`Login item written: ${n.file}`),!o||u){u&&r("It is running as the login item \u2014 reloading it with the new definition."),x(["bootout",`${C()}/${R}`]),await ke();let l=x(["bootstrap",C(),n.file]),p=l.status===0?null:x(["load","-w",n.file]);if(l.status!==0&&p.status!==0){h("It is registered, but launchd would not start it right now:");for(let $ of(l.out||p.out).split(`
`))r(`    ${$}`);r("  It will still start at the next login.")}}}else if(n.kind==="systemd"){S("systemctl",["--version"],{stdio:"ignore"}).error&&f(`systemd was not found, so there is nothing to register with.
  On a machine without it, add this line with 'crontab -e' instead:
    @reboot ${process.execPath} ${i.join(c,"scripts","cli.mjs")} start`),a.writeFileSync(n.file,be()),d(`Login item written: ${n.file}`),P(["daemon-reload"]);let l=P(["enable",v]);if(l.status!==0&&f(`Could not enable ${v}: ${l.out}`),!o||u){u&&r("It is running as the login item \u2014 reloading it with the new unit.");let y=P([u?"restart":"start",v]);y.status!==0&&(h(`It is registered, but it would not start right now: ${y.out}`),r("  It will still start at the next login."))}let p=et.userInfo().username,$=S("loginctl",["enable-linger",p],{encoding:"utf8"});($.error||($.status??1)!==0)&&(h("It starts when you log in, but not on boot alone. To change that:"),r(`    sudo loginctl enable-linger ${p}`))}else a.mkdirSync(i.dirname(n.helper),{recursive:!0}),a.writeFileSync(n.helper,we()),st(`
$ErrorActionPreference = 'Stop'
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($env:HT_LNK)
$lnk.TargetPath = Join-Path $env:SystemRoot 'System32\\wscript.exe'
$lnk.Arguments = '"' + $env:HT_VBS + '"'
$lnk.WorkingDirectory = $env:HT_ROOT
$lnk.Description = 'HyperTeams'
$lnk.Save()
`,{HT_LNK:n.file,HT_VBS:n.helper,HT_ROOT:c})!==0&&f(`Could not create the startup shortcut: ${n.file}`),d(`Login item written: ${n.file}`);if(r(""),o&&!u)d("Autostart is on. It is already running, so nothing was started."),r("  That server was started by hand \u2014 the login item takes over at the next login.");else if(n.kind==="startup")await rt(),r(""),d("Autostart is on.");else if(r("Starting it now, the same way the next login will..."),u&&await ve(s,15),await Se(s)){let l=M(200).join(`
`).match(/Dashboard:\s*(\S+)/);d("Autostart is on, and it is running now."),l&&r(`Dashboard:  ${l[1]}`)}else{h("Autostart is on, but it has not come up yet.");for(let l of M(15))process.stderr.write(`  ${l}
`);n.kind!=="systemd"&&r(`  The full log is at: ${T}`)}return r(""),n.kind==="launchd"?(r("macOS lists it in System Settings \u25B8 General \u25B8 Login Items (Allow in the Background)."),r("It starts when you log in \u2014 turn on automatic login if this machine must come up on its own.")):n.kind==="systemd"?r(`Log:        journalctl --user -u ${v} -f`):r("It starts when you sign in to Windows."),r(`Turn it off: ${m} autostart off`),0}function Vt(t={}){let e=t.quiet===!0,n=_(),s=a.existsSync(n.file);n.kind==="launchd"?Mt()||x(["bootout",`${C()}/${R}`]):n.kind==="systemd"&&s&&P(["disable",v]);try{a.rmSync(n.file,{force:!0}),n.helper&&a.rmSync(n.helper,{force:!0})}catch(o){return e||f(`Could not remove ${n.file}: ${o.message}`),0}return n.kind==="systemd"&&s&&P(["daemon-reload"]),e?(s&&d(`Removed the login item: ${n.file}`),0):s?(d(`Autostart is off: ${n.file} was removed.`),r("Anything running right now keeps running \u2014 stop it with:"),r(`    ${m} stop`),0):(d("Autostart was not on \u2014 nothing to remove."),0)}async function Pe(){let t=_(),e=a.existsSync(t.file);if(r(`Install directory: ${c}`),r(""),e?d(`Autostart is on: ${t.file}`):h(`Autostart is off (no ${t.file})`),t.kind==="launchd"){let n=x(["print",`${C()}/${R}`]),s=e?"not loaded yet (it loads at login)":"not loaded";r(`  launchd:      ${n.status===0?"loaded":s}`)}else if(t.kind==="systemd"){let n=P(["is-enabled",v]);r(`  systemd:      ${n.out||"unknown"}`)}return r(`  Running now:  ${await D(nt())?"yes":"no"}`),r(""),r(e?`Turn it off:  ${m} autostart off`:`Turn it on:   ${m} autostart`),0}function qt(t){return g?{binDir:i.join(c,"bin"),file:i.join(c,"bin",`${t}.cmd`)}:{binDir:i.join(w,".local","bin"),file:i.join(w,".local","bin",t)}}var ht="hyperteams-shim",Ae=i.join(i.dirname(c),"runtime","node");function It(t){return g?["@echo off",`REM ${ht} \u2014 generated by the installer. Do not edit.`,"REM ASCII only: cmd tracks its read position by byte offset (see scripts/start.bat).",'set "HT_NODE=%~dp0..\\..\\runtime\\node"','if exist "%HT_NODE%\\node.exe" set "PATH=%HT_NODE%;%PATH%"',"where node >nul 2>nul","if errorlevel 1 (","    echo [hyperteams] Node.js is required: https://nodejs.org/ 1>&2","    exit /b 1",")",'node "%~dp0..\\scripts\\cli.mjs" %*',""].join(`\r
`):["#!/usr/bin/env bash",`# ${ht} \u2014 generated by the installer. Do not edit.`,`HT_NODE=${JSON.stringify(i.join(Ae,"bin"))}`,'[ -x "$HT_NODE/node" ] && PATH="$HT_NODE:$PATH"','command -v node >/dev/null 2>&1 || { echo "[hyperteams] Node.js is required: https://nodejs.org/" >&2; exit 1; }',`exec node ${JSON.stringify(i.join(c,"scripts","cli.mjs"))} "$@"`,""].join(`
`)}function G(){try{return JSON.parse(a.readFileSync(gt,"utf8"))}catch{return null}}function Ee(t){a.mkdirSync(I,{recursive:!0,mode:448}),a.writeFileSync(gt,JSON.stringify(t,null,2))}function Gt(t={}){let e=t.quiet===!0,n=t.name??m,{binDir:s,file:o}=qt(n);if(a.existsSync(o)){let p=a.readFileSync(o,"utf8"),$=p.includes(ht);if(!$&&!b.has("--force")){if(e)return h(`Left the existing '${n}' alone \u2014 it is not ours: ${o}`),0;f(`A different '${n}' already exists: ${o}
  Use --force to overwrite, or --command-name <name> to use another name`)}if(e&&$&&p===It(n))return 0}else{let p=Ie(n);p&&!b.has("--force")&&(h(`'${n}' already exists on PATH: ${p}`),h("  That one may take precedence. Use --command-name <name> for another name"))}a.mkdirSync(s,{recursive:!0}),a.writeFileSync(o,It(n)),g||a.chmodSync(o,493),d(e?`Command refreshed: ${o}`:`Command installed: ${o}`);let u=G(),l=u&&u.binDir&&u.binDir!==s?[u.binDir]:[];return(!e||!u?.binDir||u.binDir!==s)&&(g?Yt(s,l):je(s)),Ee({binDir:s,file:o,root:c,commandName:n}),e||process.stdout.write(s+`
`),0}function Ie(t){let e=g?";":":",n=g?(process.env.PATHEXT||".COM;.EXE;.BAT;.CMD").split(";"):[""];for(let s of(process.env.PATH??"").split(e))if(s)for(let o of n){let u=i.join(s,t+o);try{if(a.statSync(u).isFile())return u}catch{}}return null}function xe(){let t=i.basename(process.env.SHELL||"");return t==="fish"?{file:i.join(w,".config","fish","config.fish"),fish:!0}:t==="zsh"?{file:i.join(w,".zshrc"),fish:!1}:t==="bash"?{file:i.join(w,process.platform==="darwin"?".bash_profile":".bashrc"),fish:!1}:{file:i.join(w,".profile"),fish:!1}}function Re(){return[i.join(w,".zshrc"),i.join(w,".bashrc"),i.join(w,".bash_profile"),i.join(w,".profile"),i.join(w,".config","fish","config.fish")]}function je(t){let{file:e,fish:n}=xe(),s="";try{s=a.readFileSync(e,"utf8")}catch{}let o=s.includes(z);if(o&&s.includes(t)){d(`PATH entry is already in ${e}`);return}if(!o&&(process.env.PATH??"").split(":").includes(t)){d(`${t} is already on PATH`);return}o&&Jt();let u=n?`fish_add_path -g ${JSON.stringify(t)}`:`export PATH=${JSON.stringify(t)}:"$PATH"`,l=`
${z}
${u}
${Dt}
`;a.mkdirSync(i.dirname(e),{recursive:!0}),a.appendFileSync(e,l),d(`Added the PATH entry: ${e}`)}function Jt(){for(let t of Re()){let e;try{e=a.readFileSync(t,"utf8")}catch{continue}if(!e.includes(z))continue;let n=[],s=!1;for(let o of e.split(`
`)){let u=o.trim();if(u===z){s=!0;continue}if(u===Dt){s=!1;continue}s||n.push(o)}a.writeFileSync(t,n.join(`
`)),d(`Removed the PATH entry: ${t}`)}}function Yt(t,e){st(`
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
`,{HYPERTEAMS_BIN_ADD:t,HYPERTEAMS_BIN_REMOVE:e.join(";")})===0?d("Registered in the user PATH"):h("Could not update PATH \u2014 add it manually: "+t)}function Oe(t){Yt("",t?[t]:[])}function st(t,e){let n=i.join(et.tmpdir(),`hyperteams-${process.pid}-${Math.random().toString(36).slice(2)}.ps1`);a.writeFileSync(n,"\uFEFF"+t,"utf8");try{let s=S("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",n],{stdio:["ignore","inherit","inherit"],env:{...process.env,...e}});return s.error?1:s.status??1}finally{try{a.unlinkSync(n)}catch{}}}async function N(t){if(pe)return!0;process.stdin.isTTY||f("Confirmation is required, but this is not a terminal. Pass --yes to proceed non-interactively.");let e=ue({input:process.stdin,output:process.stderr}),n="";try{n=await e.question(`\x1B[36m\u2753 ${t} (y/N): \x1B[0m`)}catch{return!1}finally{e.close()}return/^y(es)?$/i.test(n.trim())}function ot(){g?st(`
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
`,{HYPERTEAMS_ROOT:c+i.sep,HYPERTEAMS_SELF_PID:String(process.pid)}):zt("SIGKILL"),d("Stopped everything from this installation")}function Kt(){let t=S("ps",["axww","-o","pid=,args="],{encoding:"utf8",maxBuffer:16777216}),e=[];for(let n of(t.stdout??"").split(`
`)){let s=n.match(/^\s*(\d+)\s+(\S.*)$/);s&&e.push({pid:Number(s[1]),args:s[2]})}return e.some(n=>n.pid===process.pid)?e:null}function Xt(t){return t.replace(/[.[\]{}()*+?^$|\\]/g,"\\$&")}function Z(t=new Set($t())){let e=c.replace(/\/+$/,"")+"/",n=Kt();return n?n.filter(o=>!t.has(o.pid)&&o.args.includes(e)).map(o=>o.pid):(S("pgrep",["-f",Xt(e)],{encoding:"utf8"}).stdout??"").split(`
`).map(o=>Number(o.trim())).filter(o=>o&&!t.has(o))}function zt(t,e){let n=0;for(let s of Z(e))try{process.kill(s,t),n++}catch{}return n}function $t(){let t=[process.pid],e=process.pid;for(let n=0;n<20;n++){let s=S("ps",["-o","ppid=","-p",String(e)],{encoding:"utf8"}),o=Number((s.stdout??"").trim());if(!o||o<=1||t.includes(o))break;t.push(o),e=o}return t}function it(t={}){let e=i.join(c,"scripts","ptyd.mjs");if(g)st(`
$ErrorActionPreference = 'SilentlyContinue'
# -like \uAC00 \uC544\uB2C8\uB77C IndexOf \uC785\uB2C8\uB2E4. -like \uC758 \uC624\uB978\uCABD\uC740 \uC640\uC77C\uB4DC\uCE74\uB4DC \uD328\uD134\uC774\uB77C \uACBD\uB85C\uC5D0
# '[' \uB098 ']' \uAC00 \uC788\uC73C\uBA74 \uBB38\uC790 \uD074\uB798\uC2A4\uB85C \uD574\uC11D\uB418\uC5B4 \uC870\uC6A9\uD788 \uBE57\uB098\uAC11\uB2C8\uB2E4 \u2014 unix \uCABD\uC5D0\uC11C
# pgrep \uC815\uADDC\uC2DD\uC774 \uC77C\uC73C\uD0A4\uB358 \uAC83\uACFC \uAC19\uC740 \uD568\uC815\uC785\uB2C8\uB2E4(processList \uC8FC\uC11D).
$pat = $env:HYPERTEAMS_PTYD
$cmp = [System.StringComparison]::OrdinalIgnoreCase
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($pat, $cmp) -ge 0 } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
`,{HYPERTEAMS_PTYD:e});else{let s=Kt();if(s){for(let o of s)if(o.args.includes(e))try{process.kill(o.pid,"SIGTERM")}catch{}}else S("pkill",["-f",Xt(e)],{stdio:"ignore"})}let n=new RegExp(`^ptyd-\\d+-${de}\\.(sock|token)$`);for(let s of[Ot,I])try{for(let o of a.readdirSync(s))n.test(o)&&a.rmSync(i.join(s,o),{force:!0})}catch{}t.quiet!==!0&&d("Cleaned up the running terminal daemon")}function at(t=new Set($t())){let e=_();if(e.kind==="launchd"){let n=Bt();return n===null?!1:t.has(n)?(h("This command is running inside the login item \u2014 leaving the service registered."),!1):(x(["bootout",`${C()}/${R}`]),d(Lt()?"Took the login item down (it comes back at the next login).":"Took the login item down."),!0)}if(e.kind==="systemd"){if(!Wt())return!1;let n=ye();return n!==null&&t.has(n)?(h("This command is running inside the login item \u2014 leaving the service registered."),!1):(P(["stop",v]),d(`Stopped ${v} (it stays enabled for the next login).`),!0)}return!1}async function Zt(t={}){r(`Install directory: ${c}`);let e=new Set($t()),n=at(e),s=te();if(s===0)return d(n?"Stopped.":t.thenStart?"Nothing was running.":"Nothing is running from this installation."),0;s!==null&&r(`${s} process${s===1?" is":"es are"} running.`);let o=ee();if(o&&(h(`${o} job${o===1?" is":"s are"} running right now \u2014 stopping interrupts ${o===1?"it":"them"}.`),!await N("Stop anyway?")))return r("Cancelled \u2014 nothing was stopped."),1;let u=g||b.has("--force");if(!u){r("Stopping..."),zt("SIGTERM",e);for(let p=0;p<32&&Z(e).length>0;p++)await A(250)}let l=g?null:Z(e).length;if(l!==0&&(u||h(`${l} process${l===1?"":"es"} did not stop in time \u2014 forcing.`),ot()),it({quiet:!0}),r(""),d("Stopped."),!t.thenStart){let p=G()?.commandName??m;r(`Start it again:  ${p}`),Lt()&&r(`Autostart is on, so it also comes back at the next login (${p} autostart off).`)}return 0}async function De(t){let e=await Zt({thenStart:!0});if(e!==0)return e;let n=nt();for(let s=0;s<20&&await D(n);s++)await A(250);return await D(n)&&f(`Port ${n} is still in use, so it was not started again.
  Something outside this installation may be holding it.
  Start it anyway with:  ${m} start --force`),process.stderr.write(`
`),Nt?Ht(t):rt()}async function Ce(){r(`Install directory: ${c}`),r(""),at(),ot(),it();let t=G(),e=t?.commandName??m,{binDir:n,file:s}=t?.file?{binDir:t.binDir,file:t.file}:qt(e);if(Vt({quiet:!0}),g?Oe(n):Jt(),g)ct(s),d(`The command will be removed after this window closes: ${s}`);else try{a.rmSync(s,{force:!0}),d(`Removed the command: ${s}`)}catch{}try{a.rmSync(gt,{force:!0})}catch{}r(""),h("Deleting the install directory also deletes the following \u2014 this cannot be undone:"),r("    data.db (all working directories, tasks and messages)"),r("    .env.local (password hash and domain settings)"),r("    cloudflared/ (tunnel credentials)"),await N(`Delete ${c}?`)?_e():r("Left the install directory in place.");let o=Ue();if(o.length){r(""),h("The app left some state in your home directory:");for(let{path:l,note:p}of o)r(`    ${l}${p?`  \u2014 ${p}`:""}`);if(await N("Delete these too?")){for(let{path:l}of o)xt(l);d("Deleted the state")}else r("Left the state in place.")}let u=Ne();if(u.length){r(""),h("Backups from earlier installations remain (they include the DB and password hash):");for(let l of u)r(`    ${l}`);if(await N("Delete these backups too?")){for(let l of u)xt(l);d("Deleted the backups")}else r("Left the backups in place.")}return r(""),d("Uninstall finished."),r(""),r("Not removed / cannot be removed from here:"),r("  \xB7 ~/.claude, ~/.claude.json \u2014 Claude Code's own settings and auth (separate from this app)."),r("  \xB7 Your working directories \u2014 they live outside the app and are untouched."),r("  \xB7 Cloudflare tunnels and hostnames \u2014 delete those records in the Cloudflare dashboard."),r("  \xB7 System-installed node, git, caddy and cloudflared."),a.existsSync(I)&&r(`  \xB7 ${I} \u2014 kept on purpose (see above); delete it by hand if you want it gone.`),Q.length&&(r(""),r("Deletion finishes a few seconds after this window closes."),r("If anything survives, the reason is logged to %TEMP%\\hyperteams-uninstall.log")),g||r(""),g||r(`Open a new terminal, or run 'exec ${i.basename(process.env.SHELL||"bash")} -l' to refresh PATH.`),Qt(),0}function Ue(){return[{path:Ot,note:"sockets and pids (safe to discard)"},{path:i.join(I,"logs"),note:"daemon logs"},{path:i.join(I,"models"),note:"dictation models \u2014 574MB to download again"},{path:i.join(I,"runtime"),note:"the Node the installer downloaded for HyperTeams only"}].filter(e=>a.existsSync(e.path))}function Ne(){let t=i.dirname(c),e=i.basename(c)+".backup-",n=[];for(let s of new Set([t,w]))try{for(let o of a.readdirSync(s))(o.startsWith(e)||o.startsWith(".hyperteams.backup-"))&&n.push(i.join(s,o))}catch{}return[...new Set(n)]}var Q=[];function ct(t){Q.push(t)}function xt(t){try{a.rmSync(t,{recursive:!0,force:!0})}catch{g?ct(t):h(`Could not delete: ${t}`)}}function _e(){if(g){ct(c),d(`The install directory will be deleted after this window closes: ${c}`);return}try{process.chdir(w)}catch{}a.rmSync(c,{recursive:!0,force:!0}),d(`Deleted the install directory: ${c}`)}function Qt(){if(!g||Q.length===0)return;try{process.chdir(w)}catch{}let e=`\uFEFF
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
`,n=i.join(et.tmpdir(),`hyperteams-rm-${process.pid}.ps1`);a.writeFileSync(n,e,"utf8"),pt("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-WindowStyle","Hidden","-File",n],{detached:!0,stdio:"ignore"}).unref()}var dt=process.env.DIST_REPO_URL||"https://github.com/hyperteamsnet/hyperteams.git",B="origin",He=["data.db","data.db-wal","data.db-shm",".env.local","previews.map","dashboards.map","cloudflared"],Rt=[".env.local","previews.map","dashboards.map","cloudflared"],A=t=>new Promise(e=>setTimeout(e,t));function bt(){let t=a.existsSync(i.join(c,"server.js")),e=a.existsSync(i.join(c,".git"));return t?e?"artifact":"artifact-detached":e?"source":"unknown"}var wt={...process.env,GIT_TERMINAL_PROMPT:"0"};function k(t){let e=S("git",["-C",c,...t],{encoding:"utf8",env:wt});return{status:e.error?1:e.status??1,out:(e.stdout??"").trim(),err:(e.stderr??"").trim()}}function Le(t){let e=S("git",["-C",c,...t],{stdio:["ignore","inherit","inherit"],env:wt});return e.error?1:e.status??1}function Fe(){let t=Ut("branch",null);if(t)return t;let e=k(["symbolic-ref","--quiet","--short","HEAD"]);return e.status===0&&e.out?e.out:`dist-${process.platform}-${process.arch}`}function Me(){let t=k(["remote","get-url",B]);if(t.status===0&&t.out)return t.out;let e=k(["remote","add",B,dt]);return e.status!==0&&f(`Could not set the download source: ${e.err}`),h(`The download source was missing \u2014 restored it: ${dt}`),dt}function te(){return g?null:Z().length}function ee(){let t=process.env.DB_PATH||i.join(c,"data.db");if(!a.existsSync(t))return null;let e;try{e=mt(import.meta.url).resolve("better-sqlite3")}catch{return null}let n=`
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
`,o=(S(process.execPath,["-e",n,e,t],{encoding:"utf8",timeout:15e3,stdio:["ignore","pipe","ignore"]}).stdout??"").trim(),u=Number(o);return o!==""&&Number.isFinite(u)?u:null}function Be(t){let e=k(["show",`${t}:.node-requirement.json`]);if(e.status!==0)return null;let n;try{n=JSON.parse(e.out)}catch{return null}let s=Array.isArray(n.sqliteAbis)?n.sqliteAbis:[];if(s.length===0)return null;let o=String(process.versions.modules);return s.some(u=>String(u.abi)===o)?null:`The new version does not support this Node.
  It needs Node ${s.map(u=>u.major).join(" or ")}; this is ${process.version} (ABI ${o}).
  Install a supported version first (https://nodejs.org/ \u2014 nvm/fnm makes switching easy).`}function We(){let t=new Date().toISOString().replace(/[-:]/g,"").replace("T","-").slice(0,15),e=`${c}.backup-upgrade-${t}`,n=b.has("--backup-db")?[...Rt,"data.db","data.db-wal","data.db-shm"]:Rt,s=0;try{a.mkdirSync(e,{recursive:!0});for(let o of n){let u=i.join(c,o);a.existsSync(u)&&(a.cpSync(u,i.join(e,o),{recursive:!0}),s++)}}catch(o){return h(`Could not write the backup (continuing): ${o.message}`),null}return s===0?(a.rmSync(e,{recursive:!0,force:!0}),null):(Ve(),e)}function Ve(){let t=i.dirname(c),e=i.basename(c)+".backup-upgrade-",n=[];try{n=a.readdirSync(t).filter(s=>s.startsWith(e)).sort()}catch{return}for(let s of n.slice(0,Math.max(0,n.length-3)))try{a.rmSync(i.join(t,s),{recursive:!0,force:!0})}catch{}}function tt(t){let e=S("git",["-C",c,"reset","--hard",t],{encoding:"utf8",env:wt}),n=`${e.stdout??""}${e.stderr??""}`,s=[],o=/(?:unable to unlink(?: old)?|cannot unlink(?: stray)?) '([^']+)'/g;for(let u of n.matchAll(o))s.push(u[1]);return{status:e.error?1:e.status??1,text:n,locked:s}}var qe=0;function ne(t){let e=i.join(c,t);try{if(!a.existsSync(e))return!1;let n=`${e}.stale-${process.pid}-${qe++}`;return a.renameSync(e,n),ct(n),!0}catch{return!1}}async function jt(){let t=b.has("--prepare"),e=bt();if(e==="source"||e==="unknown")return r("This is not a packaged installation, so there is nothing to download."),r(""),r("From a source checkout, upgrade with your own toolchain:"),r("    git pull --ff-only && pnpm install && pnpm build"),r(""),r("`pnpm start` also follows the repository's release tags on its own."),1;e==="artifact-detached"&&f(`This installation has no download source (.git is missing), so it cannot upgrade itself.
  Run the install command again \u2014 it backs up and restores your data.`);let n=S("git",["--version"],{stdio:"ignore"});(n.error||n.status!==0)&&f(`git is required to upgrade \u2014 it is what downloads the new version.
  It was required to install too, so it may have been removed since: https://git-scm.com/downloads`);let s=Fe(),o=Me(),u=q();r(`Install directory: ${c}`),r(`Current version:   v${u}`),r(`Channel:           ${s}`),r("Checking for a new version...");let l=k(["rev-parse","HEAD"]).out,p=k(["ls-remote",B,`refs/heads/${s}`]);p.status!==0&&f(`Could not reach the release repository \u2014 check your internet connection.
  Source: ${o}
  ${p.err.split(`
`).slice(-1)[0]??""}`);let $=p.out.split(/\s+/)[0]??"";$||f(`There is no build for this system in the release repository (branch '${s}').
  It may not have been published for this OS/architecture yet.`);let y=$===l;if(b.has("--check"))return process.stdout.write((y?"up-to-date":"update-available")+`
`),y?d(`This is the latest version (v${u}).`):(r(`An update is available: ${l.slice(0,7)} \u2192 ${$.slice(0,7)}`),r(`Apply it with:  ${m} upgrade`)),0;if(y&&!b.has("--force"))return t&&process.stdout.write(`up-to-date
`),d(`This is the latest version (v${u}) \u2014 nothing to do.`),t||r("Re-download it anyway with --force."),0;let j=t?0:te(),Y=t?0:ee();if(!t&&(r(""),r(y?"Re-downloading the current version:":`Update found: ${$.slice(0,7)}`),r("  \xB7 downloads the latest build for this system"),r("  \xB7 replaces the program files only \u2014 your DB, settings and tunnel credentials stay"),j===null?r("  \xB7 stops the app if it is running (it must be restarted afterwards)"):j>0&&r(`  \xB7 stops the app (${j} process${j===1?"":"es"} running now)`),Y&&(r(""),h(`${Y} job${Y===1?" is":"s are"} running right now \u2014 restarting interrupts ${Y===1?"it":"them"}.`)),r(""),!await N("Upgrade now?")))return r("Cancelled \u2014 nothing was changed."),1;!t&&j!==0&&(r("Stopping the app..."),at(),ot(),it(),await A(g?2e3:300),r("")),r("Downloading the new version...");let H=`refs/remotes/${B}/${s}`;Le(["fetch","--depth","1",B,`+refs/heads/${s}:${H}`])!==0&&f(`Download failed \u2014 nothing was changed.
  Check your internet connection and run '${m} upgrade' again.${t?"":`
  The app was stopped, so start it with '${m}' if you want to keep using this version.`}`),d("Download complete");let vt=k(["ls-tree","-r","--name-only",H,"--",...He]).out;vt&&f(`The new build would overwrite your data \u2014 stopping. Nothing was changed.
  Offending paths: ${vt.split(`
`).join(", ")}
  Please report this; do not upgrade until it is fixed.`);let K=Be(H);if(K&&!b.has("--force")&&f(`${K}
  Nothing was changed \u2014 the current version is still installed.`),t)return process.stdout.write(`prepared
`),d(`Downloaded and verified: ${$.slice(0,7)} \u2014 not applied yet.`),r(`Apply it with:  ${m} upgrade`),0;let Tt=We();r("Applying..."),k(["symbolic-ref","HEAD",`refs/heads/${s}`]);let E=tt(H);for(let L=1;g&&L<=3&&E.status!==0;L++){let ut=E.locked.filter(ne);if(ut.length){let At=ut.length;r(`${At} file${At===1?" was":"s were"} locked \u2014 set aside, retrying...`)}else r("Some files were in use \u2014 waiting and retrying...");await A(1e3*L),E=tt(H)}if(E.status!==0){process.stderr.write(E.text.trimEnd()+`
`);let L=E.locked.length?`
  Still in use: ${E.locked.join(", ")}`:"";f(`Could not replace the program files.${L}
  Something may still have them open \u2014 close it and run '${m} upgrade' again.${g?`
  A virus scan, an open Explorer window on the install folder, or a leftover node.exe is the usual cause.`:""}`)}E.text.trim()&&process.stderr.write(E.text.trimEnd()+`
`),a.existsSync(i.join(c,"server.js"))||f(`The downloaded build looks incomplete (server.js is missing).
  Run the install command again to reinstall.`),d("Applied"),b.has("--no-gc")||(r("Cleaning up the old version..."),k(["reflog","expire","--expire=now","--all"]),k(["gc","--prune=now","--quiet"]));let Pt=G()?.commandName??m;g||Gt({name:Pt,quiet:!0}),Qt();let lt=q();return r(""),d(u===lt?`Up to date (v${lt})`:`Upgraded: v${u} \u2192 v${lt}`),Tt&&r(`  Settings backup: ${Tt}`),K&&(r(""),h(K)),r(""),r("Start it again:"),r(`  ${Pt}`),0}var re=["autoUpdate:enabled","autoUpdate:scope","autoUpdate:intervalHours","autoUpdate:checkOnBoot","autoUpdate:rollbackWaitMinutes","autoUpdate:lastCheckAt","autoUpdate:detectedVersion","autoUpdate:lastResult","autoUpdate:attempt","autoUpdate:rollbackPending","autoUpdate:rollbackPendingAt","autoUpdate:halted","autoUpdate:skipVersion"];function J(){return process.env.DB_PATH||i.join(c,"data.db")}function St(t){let e=J();if(!a.existsSync(e))return null;let n;try{n=mt(import.meta.url).resolve("better-sqlite3")}catch{return null}let s=`
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
`,o=S(process.execPath,["-e",s,n,e,JSON.stringify(t)],{encoding:"utf8",timeout:15e3,stdio:["ignore","pipe","ignore"]});if(o.status!==0||!(o.stdout??"").trim())return null;try{return JSON.parse(o.stdout)}catch{return null}}function W(t,e){let n=J();if(!a.existsSync(n))return!1;let s;try{s=mt(import.meta.url).resolve("better-sqlite3")}catch{return!1}let o=`
const Database = require(process.argv[1]);
const db = new Database(process.argv[2], { fileMustExist: true });
try {
  db.pragma("busy_timeout = 10000");
  db.prepare(
    "INSERT INTO app_settings (key,value,updated_at) VALUES (?,?,unixepoch())" +
    " ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=unixepoch()"
  ).run(process.argv[3], process.argv[4]);
} finally { db.close(); }
`,u=S(process.execPath,["-e",o,s,n,t,e],{encoding:"utf8",timeout:2e4,stdio:["ignore","ignore","pipe"]});return u.status!==0?(h((u.stderr??"").trim().split(`
`).slice(-1)[0]||"could not write to the database"),!1):!0}function V(t,e){if(!t)return e;try{return JSON.parse(t)??e}catch{return e}}var Ge="hyperteams-rollback-",Je=".backup-autoupdate-";function se(){let t=k(["tag","--list",`${Ge}*`]);return t.status===0&&t.out?t.out.split(`
`).map(e=>e.trim()).filter(Boolean).sort():[]}function oe(){let t=i.dirname(c),e=i.basename(c)+Je;try{return a.readdirSync(t).filter(n=>n.startsWith(e)).map(n=>i.join(t,n,"data.db")).filter(n=>a.existsSync(n)).sort()}catch{return[]}}function X(t){let e=Number(t);return Number.isFinite(e)&&e>0?new Date(e*1e3).toISOString():"\u2014"}function Ye(t){let e=V(t?.["autoUpdate:rollbackPending"],null)??V(t?.["autoUpdate:attempt"],null);if(e?.rollbackRef||e?.fromSha)return{ref:e.rollbackRef??null,fallbackRef:e.fromSha??null,dbBackup:e.dbBackup??null,fromVersion:e.fromVersion??null,toVersion:e.toVersion??null,guessed:!1};let n=se(),s=oe();return!n.length&&!s.length?null:{ref:n.length?n[n.length-1]:null,fallbackRef:null,dbBackup:s.length?s[s.length-1]:null,fromVersion:null,toVersion:null,guessed:!0}}function Ke(...t){for(let e of t)if(e&&k(["rev-parse","--verify","--quiet",`${e}^{commit}`]).status===0)return e;return null}function Xe(){let t=St(re);if(r(`Install directory: ${c}`),r(`Current version:   v${q()}`),r(`Installation kind: ${bt()}`),r(""),!t)h(`Could not read ${J()} \u2014 showing only what is on disk.`);else{let s=y=>t[y]===void 0?!0:t[y]==="1",o=s("autoUpdate:enabled");r("Automatic updates"),r(`  Checking:        ${o?"on":"off"}`),r(`  Interval:        every ${t["autoUpdate:intervalHours"]??"6"}h`),r(`  Apply up to:     ${t["autoUpdate:scope"]??"patch"}`);let u=s("autoUpdate:checkOnBoot");r(`  Check on start:  ${u?"yes":"no"}`),r(`  Rollback waits:  ${t["autoUpdate:rollbackWaitMinutes"]??"30"}m for running work`),r(`  Last checked:    ${X(t["autoUpdate:lastCheckAt"])}`),r(`  Latest seen:     v${t["autoUpdate:detectedVersion"]||"?"}`),t["autoUpdate:skipVersion"]&&r(`  Skipping:        v${t["autoUpdate:skipVersion"]} (it was rolled back)`),r("");let l=V(t["autoUpdate:lastResult"],null);l&&(r("Last attempt"),r(`  Outcome:         ${l.outcome}`),r(`  When:            ${X(l.at)}`),r(`  Versions:        v${l.fromVersion} \u2192 v${l.toVersion??"?"}`),l.detail&&r(`  Detail:          ${l.detail}`),r(""));let p=V(t["autoUpdate:attempt"],null);p&&(h("An update is in flight (the app left a record and has not reported back yet)."),r(`  Started:         ${X(p.startedAt)}`),r(""));let $=V(t["autoUpdate:rollbackPending"],null);$&&(h("A rollback is queued \u2014 it is waiting for running work to finish."),r(`  Waiting since:   ${X(t["autoUpdate:rollbackPendingAt"])}`),r(`  Would restore:   ${$.rollbackRef} and ${$.dbBackup}`),r("")),t["autoUpdate:halted"]&&(h(`Automatic updates are halted: ${t["autoUpdate:halted"]}`),r(`  Clear it with:   ${m} auto-update --resume`),r(""))}let e=se(),n=oe();return r("Recovery material on disk"),r(`  Rollback tags:   ${e.length?e.join(", "):"(none)"}`),r(`  DB snapshots:    ${n.length?n.join(`
                   `):"(none)"}`),r(""),(e.length||n.length)&&r(`Roll back with:  ${m} rollback`),0}function ze(){if(!b.has("--resume"))return r(`Usage: ${m} auto-update --resume`),r(""),r(`Shows the current state with:  ${m} upgrade-status`),r("Everything else is configured from the dashboard (Settings \u2192 Update)."),1;let t=St(["autoUpdate:halted","autoUpdate:rollbackPending"]);return t==null&&f(`Could not open ${J()} \u2014 is this the installation directory?`),t["autoUpdate:halted"]?(r(`Halted because: ${t["autoUpdate:halted"]}`),W("autoUpdate:halted","")||f("Could not clear it. If the app is running, use Settings \u2192 Update \u2192 Resume instead."),t["autoUpdate:rollbackPending"]&&W("autoUpdate:rollbackPendingAt",String(Math.floor(Date.now()/1e3))),d("Cleared. Automatic updates will try again at the next check."),0):(d("Automatic updates are not halted \u2014 nothing to do."),0)}async function Ze(){let t=bt();(t==="source"||t==="unknown")&&f(`This is not a packaged installation, so there is nothing to roll back.
  From a source checkout, use git directly.`);let e=S("git",["--version"],{stdio:"ignore"});(e.error||e.status!==0)&&f("git is required to roll back \u2014 it is what restores the program files.");let n=St(re),s=Ye(n);s||f(`Nothing to roll back to \u2014 this installation has no rollback tag and no database snapshot.
  Those are made by an automatic update just before it applies one (Settings \u2192 Update).
  To reinstall the previous version, run the install command again.`);let o=Ke(s.ref,s.fallbackRef);o||f(`The rollback point is gone from this repository${s.ref?` (${s.ref})`:""}.
  Nothing was changed. Run the install command again to reinstall.`),(!s.dbBackup||!a.existsSync(s.dbBackup))&&f(`The database snapshot is missing${s.dbBackup?`: ${s.dbBackup}`:""}.
  Nothing was changed \u2014 rolling the program files back without it would leave a new
  database under old code, and this command will not do that unattended.
  If you want the program files only, run: git -C "${c}" reset --hard ${o}`);let u=q();if(r(`Install directory: ${c}`),r(`Current version:   v${u}`),r(""),r("This will:"),r("  \xB7 stop the app and the terminal daemon"),r(`  \xB7 restore the program files to ${o}${s.fromVersion?` (v${s.fromVersion})`:""}`),r(`  \xB7 replace data.db with ${s.dbBackup}`),r("  \xB7 start the app again"),s.guessed&&(r(""),h("The app did not record a rollback, so this is the newest tag and snapshot on disk."),h("They are probably from the same update, but nothing guarantees it.")),r(""),h("Anything written to the database since that snapshot will be lost."),r(""),!await N("Roll back now?"))return r("Cancelled \u2014 nothing was changed."),1;r("Stopping the app..."),at(),ot(),it(),await A(g?2e3:500);let l=J();if(a.existsSync(l)){let y=`${l}.before-rollback-${Date.now()}`;try{a.copyFileSync(l,y),r(`Kept the current database at: ${y}`)}catch(j){f(`Could not set the current database aside (${j.message}) \u2014 stopping before anything changed.`)}}r("Restoring the program files...");let p=tt(o);for(let y=1;g&&y<=3&&p.status!==0;y++)p.locked.filter(ne),await A(1e3*y),p=tt(o);p.status!==0&&(process.stderr.write(p.text.trimEnd()+`
`),f("Could not restore the program files. The database was not touched.")),a.existsSync(i.join(c,"server.js"))||f(`The restored tree has no server.js \u2014 this is not a usable version.
  The database was not touched. Run the install command again.`),d(`Program files restored to ${o}`),r("Restoring the database...");try{a.copyFileSync(s.dbBackup,l);for(let y of["-wal","-shm"])a.rmSync(`${l}${y}`,{force:!0})}catch(y){f(`The program files are back at ${o}, but the database could not be restored: ${y.message}
  Copy it by hand:  cp "${s.dbBackup}" "${l}"`)}d("Database restored");for(let y of["autoUpdate:lock","autoUpdate:attempt","autoUpdate:rollbackPending","autoUpdate:rollbackPendingAt","autoUpdate:halted","autoUpdate:nextCheckAt"])W(y,"");let $=s.toVersion??u;$&&W("autoUpdate:skipVersion",$),W("autoUpdate:lastResult",JSON.stringify({at:Math.floor(Date.now()/1e3),outcome:"rolled-back",fromVersion:s.fromVersion??"?",toVersion:$,detail:`rolled back by hand with \`${m} rollback\` \u2014 restored ${o} and ${s.dbBackup}`}));try{a.rmSync(i.join(c,".auto-update-rollback.json"),{force:!0})}catch{}return b.has("--no-start")?(r(""),r("Start it again:"),r(`  ${m}`),0):(r(""),r("Starting the app again..."),await rt())}function q(){try{return JSON.parse(a.readFileSync(i.join(c,"package.json"),"utf8")).version??"unknown"}catch{return"unknown"}}function kt(){let t=m;return process.stderr.write(`
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

Options for start / restart
  --foreground, --fg      hold this terminal (Ctrl-C stops it) instead of going to
                          the background, where output goes to logs/server.log
  --background, --bg      accepted and ignored \u2014 this is the default now

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
`),0}var Qe={start:()=>Ht(O),stop:()=>Zt(),restart:()=>De(O),setup:()=>he(O),upgrade:()=>jt(),"upgrade-status":()=>Xe(),rollback:()=>Ze(),"auto-update":()=>ze(),update:()=>jt(),autostart:()=>Et(),"auto-start":()=>Et(),"install-shim":()=>Gt(),uninstall:()=>Ce(),help:()=>kt()};b.has("--version")&&(process.stdout.write(q()+`
`),process.exit(0));(b.has("--help")||b.has("-h"))&&process.exit(kt());var ie=Qe[Ct];ie||(process.stderr.write(`\x1B[91m\u2717 Unknown command: ${Ct}\x1B[0m
`),process.exit(kt()||1));process.exit(await ie()??0);
