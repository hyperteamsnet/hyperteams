#!/usr/bin/env node
import a from"node:fs";import ee from"node:net";import tt from"node:os";import i from"node:path";import{fileURLToPath as ne}from"node:url";import{createHash as re}from"node:crypto";import{createRequire as ht}from"node:module";import{spawnSync as S,spawn as dt}from"node:child_process";import{createInterface as se}from"node:readline/promises";var l=i.resolve(i.dirname(ne(import.meta.url)),".."),g=process.platform==="win32",w=tt.homedir(),P=i.join(w,".hyperteams"),xt=i.join(P,"run"),mt=i.join(P,"shim.json"),oe=(()=>{let t=i.join(l,"scripts","ptyd.mjs"),e=t;try{e=a.realpathSync(t)}catch{}return re("sha256").update(e).digest("hex").slice(0,8)})(),J="# >>> hyperteams >>>",Rt="# <<< hyperteams <<<",n=t=>process.stderr.write(`\x1B[36m[hyperteams]\x1B[0m ${t}
`),d=t=>process.stderr.write(`\x1B[92m\u2713\x1B[0m ${t}
`),h=t=>process.stderr.write(`\x1B[93m\u26A0\x1B[0m ${t}
`),p=t=>{process.stderr.write(`\x1B[91m\u2717 ${t}\x1B[0m
`),process.exit(1)},x=process.argv.slice(2),y=new Set(x.filter(t=>t.startsWith("--"))),j=x.filter(t=>!t.startsWith("--")),Ct=j[0]&&!j[0].startsWith("-")?j.shift():"start";function Ot(t,e){let r=x.indexOf(`--${t}`);return r>=0&&x[r+1]&&!x[r+1].startsWith("--")?x[r+1]:e}var m=Ot("command-name","hyperteams"),ie=y.has("--yes")||y.has("-y");function pt(t,e,r={}){let s=process.listeners("SIGINT");process.on("SIGINT",()=>{});try{let o=S(t,e,{stdio:"inherit",...r});return o.error&&p(`Failed to run ${t}: ${o.error.message}`),o.status??1}finally{process.removeAllListeners("SIGINT");for(let o of s)process.on("SIGINT",o)}}function Dt(){a.existsSync(i.join(l,"server.js"))||p("server.js is missing \u2014 the release package is corrupted."),a.existsSync(i.join(l,".env.local"))||p(`.env.local is missing. Configure it with:
    ${m} setup`)}function ae(){n("Checking the setup..."),Dt(),d("Setup looks good"),process.stderr.write(`
`),n("Starting HyperTeams..."),n("The dashboard address is printed in the [supervise] lines below."),n("Stop: Ctrl-C"),process.stderr.write(`
`)}function Ut(t){if(y.has("--background")||y.has("--bg"))return nt();if(g){let r=i.join(l,"scripts","supervise.mjs");return a.existsSync(r)||p(`Start script not found: ${r}`),ae(),pt(process.execPath,[r,...t])}let e=i.join(l,"scripts","start.sh");return a.existsSync(e)||p(`Start script not found: ${e}`),pt("bash",[e,...t])}var v=i.join(l,"logs","server.log");function et(){let t=Number(process.env.PORT);if(t)return t;try{let e=a.readFileSync(i.join(l,".env.local"),"utf8").match(/^\s*PORT\s*=\s*["']?(\d+)/m);if(e)return Number(e[1])}catch{}return 27777}function O(t){return new Promise(e=>{let r=ee.connect({host:"127.0.0.1",port:t}),s=o=>{r.destroy(),e(o)};r.setTimeout(500),r.on("connect",()=>s(!0)),r.on("timeout",()=>s(!1)),r.on("error",()=>s(!1))})}function K(t){try{return a.readFileSync(v,"utf8").trimEnd().split(`
`).slice(-t)}catch{return[]}}async function nt(){n("Checking the setup..."),Dt();let t=et();!y.has("--force")&&await O(t)&&p(`Something is already listening on port ${t} \u2014 it is probably already running.
  Stop it first:   ${m} stop
  Start anyway:    ${m} start --background --force`),d("Setup looks good"),a.mkdirSync(i.dirname(v),{recursive:!0});try{a.renameSync(v,`${v}.prev`)}catch{}let e=a.openSync(v,"a");process.stderr.write(`
`),n("Starting in the background...");let r={...process.env,HYPERTEAMS_BACKGROUND:"1"},s=g?dt(process.execPath,[i.join(l,"scripts","supervise.mjs")],{cwd:l,env:r,detached:!0,windowsHide:!0,stdio:["ignore",e,e]}):dt("bash",[i.join(l,"scripts","start.sh")],{cwd:l,env:r,detached:!0,stdio:["ignore",e,e]});s.unref(),a.closeSync(e);let o=null;s.on("exit",(u,f)=>o=u??f),s.on("error",u=>p(`Could not start: ${u.message}`));let c=null;for(let u=0;u<100&&c===null&&o===null;u++){await A(300);let f=K(200).join(`
`).match(/Dashboard:\s*(\S+)/);f&&(c=f[1])}if(o!==null){process.stderr.write(`
`);for(let u of K(15))process.stderr.write(`  ${u}
`);p(`It stopped right after starting (exit ${o}).
  The full log is at: ${v}`)}return process.stderr.write(`
`),d(`Running in the background (pid ${s.pid})`),c?n(`Dashboard:  ${c}`):h("It is still starting \u2014 the address will appear in the log."),n(`Log:        ${v}`),n(`Stop:       ${W()?.commandName??m} stop`),0}function ce(t){let e=i.join(l,"scripts","setup.mjs");return a.existsSync(e)||p(`Setup script not found: ${e}`),pt(process.execPath,[e,...t])}var B="net.hyperteams.app",I="hyperteams.service";function le(){let t=process.env.APPDATA||i.join(w,"AppData","Roaming");return i.join(t,"Microsoft","Windows","Start Menu","Programs","Startup")}function rt(){return process.platform==="darwin"?{kind:"launchd",file:i.join(w,"Library","LaunchAgents",`${B}.plist`)}:g?{kind:"startup",file:i.join(le(),"HyperTeams.lnk"),helper:i.join(l,"bin","autostart.vbs")}:{kind:"systemd",file:i.join(w,".config","systemd","user",I)}}function ue(){try{return a.existsSync(rt().file)}catch{return!1}}function Nt(){let t=[i.dirname(process.execPath),...(process.env.PATH??"").split(i.delimiter)];g||t.push("/opt/homebrew/bin","/usr/local/bin","/usr/bin","/bin","/usr/sbin","/sbin");let e=new Set;return t.filter(r=>r&&!e.has(r)&&e.add(r)).join(i.delimiter)}function gt(){let t=a.existsSync(i.join(l,"server.js")),e=i.join(l,"scripts",t?"start.sh":"start-all.sh");return a.existsSync(e)||p(`Start script not found: ${e}`),a.existsSync(i.join(l,".env.local"))||p(`.env.local is missing. Configure it with:
    ${m} setup`),e}function de(){if(process.platform!=="darwin")return null;for(let t of["Documents","Desktop","Downloads"]){let e=i.join(w,t);if(l===e||l.startsWith(e+i.sep))return e}return null}function _(t){let e=S("launchctl",t,{encoding:"utf8"});return{status:e.error?1:e.status??1,out:`${e.stdout??""}${e.stderr??""}`.trim()}}function X(){return`gui/${process.getuid?.()??0}`}function R(t){let e=S("systemctl",["--user",...t],{encoding:"utf8"});return{status:e.error?1:e.status??1,out:`${e.stdout??""}${e.stderr??""}`.trim()}}function N(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function pe(){return`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${B}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${N(gt())}</string>
  </array>
  <key>WorkingDirectory</key><string>${N(l)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${N(Nt())}</string>
    <key>HYPERTEAMS_BACKGROUND</key><string>1</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>${N(v)}</string>
  <key>StandardErrorPath</key><string>${N(v)}</string>
</dict>
</plist>
`}function fe(){return`[Unit]
Description=HyperTeams

[Service]
Type=simple
WorkingDirectory=${l}
Environment="HYPERTEAMS_BACKGROUND=1"
Environment="PATH=${Nt()}"
ExecStart=/bin/bash "${gt()}"
# Deliberately not restarted automatically: that would defeat '${m} stop'.
Restart=no

[Install]
WantedBy=default.target
`}function he(){return["' hyperteams-autostart - generated by 'hyperteams autostart'. Do not edit.","' ASCII only: wscript reads a BOM-less .vbs in the ANSI code page.",'Set fso = CreateObject("Scripting.FileSystemObject")',"root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))",'CreateObject("WScript.Shell").Run "node """ & root & "\\scripts\\cli.mjs"" start --background", 0, False',""].join(`\r
`)}async function me(t,e=60){for(let r=0;r<e*2;r++)if(await A(500),await O(t))return!0;return!1}function Pt(){let t=(j[0]??"").toLowerCase();return y.has("--status")||t==="status"?ye():y.has("--off")||t==="off"?_t():(t&&t!=="on"&&p(`Unknown option: ${t}
  Usage: ${m} autostart [on|off|status]`),ge())}async function ge(){n(`Install directory: ${l}`),n("Checking the setup...");let t=gt();d(g?`Setup looks good (it will run: ${m} start --background)`:`Setup looks good (it will run: bash ${t})`);let e=de();e&&(n(""),h(`This installation lives in a folder macOS protects: ${e}`),n("  Unless Full Disk Access is granted, a login item cannot read files there \u2014"),n('  every login would fail with "Operation not permitted", even though starting'),n("  it by hand works. Two ways out:"),n(`    \xB7 Move the installation out of ${i.basename(e)}/ (e.g. to ~/hyperteams), or`),n("    \xB7 System Settings \u25B8 Privacy & Security \u25B8 Full Disk Access \u25B8 add /bin/bash"),n(""));let r=rt(),s=et(),o=await O(s);try{let c=r.kind==="startup"?l:a.readFileSync(r.file,"utf8");if(!c.includes(l)){h("Replacing a login item that pointed at another installation:");for(let u of c.match(/[^\s<>"]*(?:start-all\.sh|start\.sh|cli\.mjs)/g)??[])n(`    ${u}`);n("  Only one installation can start automatically \u2014 they would fight over the port.")}}catch{}if(a.mkdirSync(i.dirname(r.file),{recursive:!0}),a.mkdirSync(i.dirname(v),{recursive:!0}),r.kind==="launchd"){if(a.writeFileSync(r.file,pe()),d(`Login item written: ${r.file}`),_(["bootout",`${X()}/${B}`]),!o){let c=_(["bootstrap",X(),r.file]),u=c.status===0?null:_(["load","-w",r.file]);if(c.status!==0&&u.status!==0){h("It is registered, but launchd would not start it right now:");for(let f of(c.out||u.out).split(`
`))n(`    ${f}`);n("  It will still start at the next login.")}}}else if(r.kind==="systemd"){S("systemctl",["--version"],{stdio:"ignore"}).error&&p(`systemd was not found, so there is nothing to register with.
  On a machine without it, add this line with 'crontab -e' instead:
    @reboot ${process.execPath} ${i.join(l,"scripts","cli.mjs")} start --background`),a.writeFileSync(r.file,fe()),d(`Login item written: ${r.file}`),R(["daemon-reload"]);let c=R(["enable",I]);if(c.status!==0&&p(`Could not enable ${I}: ${c.out}`),!o){let b=R(["start",I]);b.status!==0&&(h(`It is registered, but it would not start right now: ${b.out}`),n("  It will still start at the next login."))}let u=tt.userInfo().username,f=S("loginctl",["enable-linger",u],{encoding:"utf8"});(f.error||(f.status??1)!==0)&&(h("It starts when you log in, but not on boot alone. To change that:"),n(`    sudo loginctl enable-linger ${u}`))}else a.mkdirSync(i.dirname(r.helper),{recursive:!0}),a.writeFileSync(r.helper,he()),st(`
$ErrorActionPreference = 'Stop'
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($env:HT_LNK)
$lnk.TargetPath = Join-Path $env:SystemRoot 'System32\\wscript.exe'
$lnk.Arguments = '"' + $env:HT_VBS + '"'
$lnk.WorkingDirectory = $env:HT_ROOT
$lnk.Description = 'HyperTeams'
$lnk.Save()
`,{HT_LNK:r.file,HT_VBS:r.helper,HT_ROOT:l})!==0&&p(`Could not create the startup shortcut: ${r.file}`),d(`Login item written: ${r.file}`);if(n(""),o)d("Autostart is on. It is already running, so nothing was started.");else if(r.kind==="startup")await nt(),n(""),d("Autostart is on.");else if(n("Starting it now, the same way the next login will..."),await me(s)){let c=K(200).join(`
`).match(/Dashboard:\s*(\S+)/);d("Autostart is on, and it is running now."),c&&n(`Dashboard:  ${c[1]}`)}else{h("Autostart is on, but it has not come up yet.");for(let c of K(15))process.stderr.write(`  ${c}
`);r.kind!=="systemd"&&n(`  The full log is at: ${v}`)}return n(""),r.kind==="launchd"?(n("macOS lists it in System Settings \u25B8 General \u25B8 Login Items (Allow in the Background)."),n("It starts when you log in \u2014 turn on automatic login if this machine must come up on its own.")):r.kind==="systemd"?n(`Log:        journalctl --user -u ${I} -f`):n("It starts when you sign in to Windows."),n(`Turn it off: ${m} autostart off`),0}function _t(t={}){let e=t.quiet===!0,r=rt(),s=a.existsSync(r.file);r.kind==="launchd"?_(["bootout",`${X()}/${B}`]):r.kind==="systemd"&&s&&R(["disable",I]);try{a.rmSync(r.file,{force:!0}),r.helper&&a.rmSync(r.helper,{force:!0})}catch(o){return e||p(`Could not remove ${r.file}: ${o.message}`),0}return r.kind==="systemd"&&s&&R(["daemon-reload"]),e?(s&&d(`Removed the login item: ${r.file}`),0):s?(d(`Autostart is off: ${r.file} was removed.`),n("Anything running right now keeps running \u2014 stop it with:"),n(`    ${m} stop`),0):(d("Autostart was not on \u2014 nothing to remove."),0)}async function ye(){let t=rt(),e=a.existsSync(t.file);if(n(`Install directory: ${l}`),n(""),e?d(`Autostart is on: ${t.file}`):h(`Autostart is off (no ${t.file})`),t.kind==="launchd"){let r=_(["print",`${X()}/${B}`]),s=e?"not loaded yet (it loads at login)":"not loaded";n(`  launchd:      ${r.status===0?"loaded":s}`)}else if(t.kind==="systemd"){let r=R(["is-enabled",I]);n(`  systemd:      ${r.out||"unknown"}`)}return n(`  Running now:  ${await O(et())?"yes":"no"}`),n(""),n(e?`Turn it off:  ${m} autostart off`:`Turn it on:   ${m} autostart`),0}function Lt(t){return g?{binDir:i.join(l,"bin"),file:i.join(l,"bin",`${t}.cmd`)}:{binDir:i.join(w,".local","bin"),file:i.join(w,".local","bin",t)}}var ft="hyperteams-shim";function At(t){return g?["@echo off",`REM ${ft} \u2014 generated by the installer. Do not edit.`,"REM ASCII only: cmd tracks its read position by byte offset (see scripts/start.bat).","where node >nul 2>nul","if errorlevel 1 (","    echo [hyperteams] Node.js is required: https://nodejs.org/ 1>&2","    exit /b 1",")",'node "%~dp0..\\scripts\\cli.mjs" %*',""].join(`\r
`):["#!/usr/bin/env bash",`# ${ft} \u2014 generated by the installer. Do not edit.`,'command -v node >/dev/null 2>&1 || { echo "[hyperteams] Node.js is required: https://nodejs.org/" >&2; exit 1; }',`exec node ${JSON.stringify(i.join(l,"scripts","cli.mjs"))} "$@"`,""].join(`
`)}function W(){try{return JSON.parse(a.readFileSync(mt,"utf8"))}catch{return null}}function $e(t){a.mkdirSync(P,{recursive:!0,mode:448}),a.writeFileSync(mt,JSON.stringify(t,null,2))}function Ft(t={}){let e=t.quiet===!0,r=t.name??m,{binDir:s,file:o}=Lt(r);if(a.existsSync(o)){let f=a.readFileSync(o,"utf8"),b=f.includes(ft);if(!b&&!y.has("--force")){if(e)return h(`Left the existing '${r}' alone \u2014 it is not ours: ${o}`),0;p(`A different '${r}' already exists: ${o}
  Use --force to overwrite, or --command-name <name> to use another name`)}if(e&&b&&f===At(r))return 0}else{let f=be(r);f&&!y.has("--force")&&(h(`'${r}' already exists on PATH: ${f}`),h("  That one may take precedence. Use --command-name <name> for another name"))}a.mkdirSync(s,{recursive:!0}),a.writeFileSync(o,At(r)),g||a.chmodSync(o,493),d(e?`Command refreshed: ${o}`:`Command installed: ${o}`);let c=W(),u=c&&c.binDir&&c.binDir!==s?[c.binDir]:[];return(!e||!c?.binDir||c.binDir!==s)&&(g?Mt(s,u):ke(s)),$e({binDir:s,file:o,root:l,commandName:r}),e||process.stdout.write(s+`
`),0}function be(t){let e=g?";":":",r=g?(process.env.PATHEXT||".COM;.EXE;.BAT;.CMD").split(";"):[""];for(let s of(process.env.PATH??"").split(e))if(s)for(let o of r){let c=i.join(s,t+o);try{if(a.statSync(c).isFile())return c}catch{}}return null}function we(){let t=i.basename(process.env.SHELL||"");return t==="fish"?{file:i.join(w,".config","fish","config.fish"),fish:!0}:t==="zsh"?{file:i.join(w,".zshrc"),fish:!1}:t==="bash"?{file:i.join(w,process.platform==="darwin"?".bash_profile":".bashrc"),fish:!1}:{file:i.join(w,".profile"),fish:!1}}function Se(){return[i.join(w,".zshrc"),i.join(w,".bashrc"),i.join(w,".bash_profile"),i.join(w,".profile"),i.join(w,".config","fish","config.fish")]}function ke(t){let{file:e,fish:r}=we(),s="";try{s=a.readFileSync(e,"utf8")}catch{}let o=s.includes(J);if(o&&s.includes(t)){d(`PATH entry is already in ${e}`);return}if(!o&&(process.env.PATH??"").split(":").includes(t)){d(`${t} is already on PATH`);return}o&&Ht();let c=r?`fish_add_path -g ${JSON.stringify(t)}`:`export PATH=${JSON.stringify(t)}:"$PATH"`,u=`
${J}
${c}
${Rt}
`;a.mkdirSync(i.dirname(e),{recursive:!0}),a.appendFileSync(e,u),d(`Added the PATH entry: ${e}`)}function Ht(){for(let t of Se()){let e;try{e=a.readFileSync(t,"utf8")}catch{continue}if(!e.includes(J))continue;let r=[],s=!1;for(let o of e.split(`
`)){let c=o.trim();if(c===J){s=!0;continue}if(c===Rt){s=!1;continue}s||r.push(o)}a.writeFileSync(t,r.join(`
`)),d(`Removed the PATH entry: ${t}`)}}function Mt(t,e){st(`
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
`,{HYPERTEAMS_BIN_ADD:t,HYPERTEAMS_BIN_REMOVE:e.join(";")})===0?d("Registered in the user PATH"):h("Could not update PATH \u2014 add it manually: "+t)}function ve(t){Mt("",t?[t]:[])}function st(t,e){let r=i.join(tt.tmpdir(),`hyperteams-${process.pid}-${Math.random().toString(36).slice(2)}.ps1`);a.writeFileSync(r,"\uFEFF"+t,"utf8");try{let s=S("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r],{stdio:["ignore","inherit","inherit"],env:{...process.env,...e}});return s.error?1:s.status??1}finally{try{a.unlinkSync(r)}catch{}}}async function C(t){if(ie)return!0;process.stdin.isTTY||p("Confirmation is required, but this is not a terminal. Pass --yes to proceed non-interactively.");let e=se({input:process.stdin,output:process.stderr}),r="";try{r=await e.question(`\x1B[36m\u2753 ${t} (y/N): \x1B[0m`)}catch{return!1}finally{e.close()}return/^y(es)?$/i.test(r.trim())}function ot(){g?st(`
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
`,{HYPERTEAMS_ROOT:l+i.sep,HYPERTEAMS_SELF_PID:String(process.pid)}):Vt("SIGKILL"),d("Stopped everything from this installation")}function Bt(){let t=S("ps",["axww","-o","pid=,args="],{encoding:"utf8",maxBuffer:16777216}),e=[];for(let r of(t.stdout??"").split(`
`)){let s=r.match(/^\s*(\d+)\s+(\S.*)$/);s&&e.push({pid:Number(s[1]),args:s[2]})}return e.some(r=>r.pid===process.pid)?e:null}function Wt(t){return t.replace(/[.[\]{}()*+?^$|\\]/g,"\\$&")}function z(t=new Set(qt())){let e=l.replace(/\/+$/,"")+"/",r=Bt();return r?r.filter(o=>!t.has(o.pid)&&o.args.includes(e)).map(o=>o.pid):(S("pgrep",["-f",Wt(e)],{encoding:"utf8"}).stdout??"").split(`
`).map(o=>Number(o.trim())).filter(o=>o&&!t.has(o))}function Vt(t,e){let r=0;for(let s of z(e))try{process.kill(s,t),r++}catch{}return r}function qt(){let t=[process.pid],e=process.pid;for(let r=0;r<20;r++){let s=S("ps",["-o","ppid=","-p",String(e)],{encoding:"utf8"}),o=Number((s.stdout??"").trim());if(!o||o<=1||t.includes(o))break;t.push(o),e=o}return t}function it(t={}){let e=i.join(l,"scripts","ptyd.mjs");if(g)st(`
$ErrorActionPreference = 'SilentlyContinue'
# -like \uAC00 \uC544\uB2C8\uB77C IndexOf \uC785\uB2C8\uB2E4. -like \uC758 \uC624\uB978\uCABD\uC740 \uC640\uC77C\uB4DC\uCE74\uB4DC \uD328\uD134\uC774\uB77C \uACBD\uB85C\uC5D0
# '[' \uB098 ']' \uAC00 \uC788\uC73C\uBA74 \uBB38\uC790 \uD074\uB798\uC2A4\uB85C \uD574\uC11D\uB418\uC5B4 \uC870\uC6A9\uD788 \uBE57\uB098\uAC11\uB2C8\uB2E4 \u2014 unix \uCABD\uC5D0\uC11C
# pgrep \uC815\uADDC\uC2DD\uC774 \uC77C\uC73C\uD0A4\uB358 \uAC83\uACFC \uAC19\uC740 \uD568\uC815\uC785\uB2C8\uB2E4(processList \uC8FC\uC11D).
$pat = $env:HYPERTEAMS_PTYD
$cmp = [System.StringComparison]::OrdinalIgnoreCase
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($pat, $cmp) -ge 0 } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
`,{HYPERTEAMS_PTYD:e});else{let s=Bt();if(s){for(let o of s)if(o.args.includes(e))try{process.kill(o.pid,"SIGTERM")}catch{}}else S("pkill",["-f",Wt(e)],{stdio:"ignore"})}let r=new RegExp(`^ptyd-\\d+-${oe}\\.(sock|token)$`);for(let s of[xt,P])try{for(let o of a.readdirSync(s))r.test(o)&&a.rmSync(i.join(s,o),{force:!0})}catch{}t.quiet!==!0&&d("Cleaned up the running terminal daemon")}async function Gt(t={}){n(`Install directory: ${l}`);let e=new Set(qt()),r=Jt();if(r===0)return d(t.thenStart?"Nothing was running.":"Nothing is running from this installation."),0;r!==null&&n(`${r} process${r===1?" is":"es are"} running.`);let s=Kt();if(s&&(h(`${s} job${s===1?" is":"s are"} running right now \u2014 stopping interrupts ${s===1?"it":"them"}.`),!await C("Stop anyway?")))return n("Cancelled \u2014 nothing was stopped."),1;let o=g||y.has("--force");if(!o){n("Stopping..."),Vt("SIGTERM",e);for(let u=0;u<32&&z(e).length>0;u++)await A(250)}let c=g?null:z(e).length;if(c!==0&&(o||h(`${c} process${c===1?"":"es"} did not stop in time \u2014 forcing.`),ot()),it({quiet:!0}),n(""),d("Stopped."),!t.thenStart){let u=W()?.commandName??m;n(`Start it again:  ${u}`),ue()&&n(`Autostart is on, so it also comes back at the next login (${u} autostart off).`)}return 0}async function Te(t){let e=await Gt({thenStart:!0});if(e!==0)return e;let r=et();for(let s=0;s<20&&await O(r);s++)await A(250);return await O(r)&&p(`Port ${r} is still in use, so it was not started again.
  Something outside this installation may be holding it.
  Start it anyway with:  ${m} start --background --force`),process.stderr.write(`
`),y.has("--foreground")?Ut(t):nt()}async function Pe(){n(`Install directory: ${l}`),n(""),ot(),it();let t=W(),e=t?.commandName??m,{binDir:r,file:s}=t?.file?{binDir:t.binDir,file:t.file}:Lt(e);if(_t({quiet:!0}),g?ve(r):Ht(),g)at(s),d(`The command will be removed after this window closes: ${s}`);else try{a.rmSync(s,{force:!0}),d(`Removed the command: ${s}`)}catch{}try{a.rmSync(mt,{force:!0})}catch{}n(""),h("Deleting the install directory also deletes the following \u2014 this cannot be undone:"),n("    data.db (all working directories, tasks and messages)"),n("    .env.local (password hash and domain settings)"),n("    cloudflared/ (tunnel credentials)"),await C(`Delete ${l}?`)?Ie():n("Left the install directory in place.");let o=Ae();if(o.length){n(""),h("The app left some state in your home directory:");for(let{path:u,note:f}of o)n(`    ${u}${f?`  \u2014 ${f}`:""}`);if(await C("Delete these too?")){for(let{path:u}of o)Et(u);d("Deleted the state")}else n("Left the state in place.")}let c=Ee();if(c.length){n(""),h("Backups from earlier installations remain (they include the DB and password hash):");for(let u of c)n(`    ${u}`);if(await C("Delete these backups too?")){for(let u of c)Et(u);d("Deleted the backups")}else n("Left the backups in place.")}return n(""),d("Uninstall finished."),n(""),n("Not removed / cannot be removed from here:"),n("  \xB7 ~/.claude, ~/.claude.json \u2014 Claude Code's own settings and auth (separate from this app)."),n("  \xB7 Your working directories \u2014 they live outside the app and are untouched."),n("  \xB7 Cloudflare tunnels and hostnames \u2014 delete those records in the Cloudflare dashboard."),n("  \xB7 System-installed node, git, caddy and cloudflared."),a.existsSync(P)&&n(`  \xB7 ${P} \u2014 kept on purpose (see above); delete it by hand if you want it gone.`),Z.length&&(n(""),n("Deletion finishes a few seconds after this window closes."),n("If anything survives, the reason is logged to %TEMP%\\hyperteams-uninstall.log")),g||n(""),g||n(`Open a new terminal, or run 'exec ${i.basename(process.env.SHELL||"bash")} -l' to refresh PATH.`),Yt(),0}function Ae(){return[{path:xt,note:"sockets and pids (safe to discard)"},{path:i.join(P,"logs"),note:"daemon logs"},{path:i.join(P,"models"),note:"dictation models \u2014 574MB to download again"}].filter(e=>a.existsSync(e.path))}function Ee(){let t=i.dirname(l),e=i.basename(l)+".backup-",r=[];for(let s of new Set([t,w]))try{for(let o of a.readdirSync(s))(o.startsWith(e)||o.startsWith(".hyperteams.backup-"))&&r.push(i.join(s,o))}catch{}return[...new Set(r)]}var Z=[];function at(t){Z.push(t)}function Et(t){try{a.rmSync(t,{recursive:!0,force:!0})}catch{g?at(t):h(`Could not delete: ${t}`)}}function Ie(){if(g){at(l),d(`The install directory will be deleted after this window closes: ${l}`);return}try{process.chdir(w)}catch{}a.rmSync(l,{recursive:!0,force:!0}),d(`Deleted the install directory: ${l}`)}function Yt(){if(!g||Z.length===0)return;try{process.chdir(w)}catch{}let e=`\uFEFF
$ErrorActionPreference = 'SilentlyContinue'
$log = Join-Path $env:TEMP 'hyperteams-uninstall.log'
Start-Sleep -Seconds 3

foreach ($p in @(
${Z.map(o=>`  '${o.replace(/'/g,"''")}'`).join(`,
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
`,r=i.join(tt.tmpdir(),`hyperteams-rm-${process.pid}.ps1`);a.writeFileSync(r,e,"utf8"),dt("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-WindowStyle","Hidden","-File",r],{detached:!0,stdio:"ignore"}).unref()}var ut=process.env.DIST_REPO_URL||"https://github.com/hyperteamsnet/hyperteams.git",L="origin",je=["data.db","data.db-wal","data.db-shm",".env.local","previews.map","dashboards.map","cloudflared"],It=[".env.local","previews.map","dashboards.map","cloudflared"],A=t=>new Promise(e=>setTimeout(e,t));function yt(){let t=a.existsSync(i.join(l,"server.js")),e=a.existsSync(i.join(l,".git"));return t?e?"artifact":"artifact-detached":e?"source":"unknown"}var $t={...process.env,GIT_TERMINAL_PROMPT:"0"};function k(t){let e=S("git",["-C",l,...t],{encoding:"utf8",env:$t});return{status:e.error?1:e.status??1,out:(e.stdout??"").trim(),err:(e.stderr??"").trim()}}function xe(t){let e=S("git",["-C",l,...t],{stdio:["ignore","inherit","inherit"],env:$t});return e.error?1:e.status??1}function Re(){let t=Ot("branch",null);if(t)return t;let e=k(["symbolic-ref","--quiet","--short","HEAD"]);return e.status===0&&e.out?e.out:`dist-${process.platform}-${process.arch}`}function Ce(){let t=k(["remote","get-url",L]);if(t.status===0&&t.out)return t.out;let e=k(["remote","add",L,ut]);return e.status!==0&&p(`Could not set the download source: ${e.err}`),h(`The download source was missing \u2014 restored it: ${ut}`),ut}function Jt(){return g?null:z().length}function Kt(){let t=process.env.DB_PATH||i.join(l,"data.db");if(!a.existsSync(t))return null;let e;try{e=ht(import.meta.url).resolve("better-sqlite3")}catch{return null}let r=`
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
`,o=(S(process.execPath,["-e",r,e,t],{encoding:"utf8",timeout:15e3,stdio:["ignore","pipe","ignore"]}).stdout??"").trim(),c=Number(o);return o!==""&&Number.isFinite(c)?c:null}function Oe(t){let e=k(["show",`${t}:.node-requirement.json`]);if(e.status!==0)return null;let r;try{r=JSON.parse(e.out)}catch{return null}let s=Array.isArray(r.sqliteAbis)?r.sqliteAbis:[];if(s.length===0)return null;let o=String(process.versions.modules);return s.some(c=>String(c.abi)===o)?null:`The new version does not support this Node.
  It needs Node ${s.map(c=>c.major).join(" or ")}; this is ${process.version} (ABI ${o}).
  Install a supported version first (https://nodejs.org/ \u2014 nvm/fnm makes switching easy).`}function De(){let t=new Date().toISOString().replace(/[-:]/g,"").replace("T","-").slice(0,15),e=`${l}.backup-upgrade-${t}`,r=y.has("--backup-db")?[...It,"data.db","data.db-wal","data.db-shm"]:It,s=0;try{a.mkdirSync(e,{recursive:!0});for(let o of r){let c=i.join(l,o);a.existsSync(c)&&(a.cpSync(c,i.join(e,o),{recursive:!0}),s++)}}catch(o){return h(`Could not write the backup (continuing): ${o.message}`),null}return s===0?(a.rmSync(e,{recursive:!0,force:!0}),null):(Ue(),e)}function Ue(){let t=i.dirname(l),e=i.basename(l)+".backup-upgrade-",r=[];try{r=a.readdirSync(t).filter(s=>s.startsWith(e)).sort()}catch{return}for(let s of r.slice(0,Math.max(0,r.length-3)))try{a.rmSync(i.join(t,s),{recursive:!0,force:!0})}catch{}}function Q(t){let e=S("git",["-C",l,"reset","--hard",t],{encoding:"utf8",env:$t}),r=`${e.stdout??""}${e.stderr??""}`,s=[],o=/(?:unable to unlink(?: old)?|cannot unlink(?: stray)?) '([^']+)'/g;for(let c of r.matchAll(o))s.push(c[1]);return{status:e.error?1:e.status??1,text:r,locked:s}}var Ne=0;function Xt(t){let e=i.join(l,t);try{if(!a.existsSync(e))return!1;let r=`${e}.stale-${process.pid}-${Ne++}`;return a.renameSync(e,r),at(r),!0}catch{return!1}}async function jt(){let t=y.has("--prepare"),e=yt();if(e==="source"||e==="unknown")return n("This is not a packaged installation, so there is nothing to download."),n(""),n("From a source checkout, upgrade with your own toolchain:"),n("    git pull --ff-only && pnpm install && pnpm build"),n(""),n("`pnpm start` also follows the repository's release tags on its own."),1;e==="artifact-detached"&&p(`This installation has no download source (.git is missing), so it cannot upgrade itself.
  Run the install command again \u2014 it backs up and restores your data.`);let r=S("git",["--version"],{stdio:"ignore"});(r.error||r.status!==0)&&p(`git is required to upgrade \u2014 it is what downloads the new version.
  It was required to install too, so it may have been removed since: https://git-scm.com/downloads`);let s=Re(),o=Ce(),c=M();n(`Install directory: ${l}`),n(`Current version:   v${c}`),n(`Channel:           ${s}`),n("Checking for a new version...");let u=k(["rev-parse","HEAD"]).out,f=k(["ls-remote",L,`refs/heads/${s}`]);f.status!==0&&p(`Could not reach the release repository \u2014 check your internet connection.
  Source: ${o}
  ${f.err.split(`
`).slice(-1)[0]??""}`);let b=f.out.split(/\s+/)[0]??"";b||p(`There is no build for this system in the release repository (branch '${s}').
  It may not have been published for this OS/architecture yet.`);let $=b===u;if(y.has("--check"))return process.stdout.write(($?"up-to-date":"update-available")+`
`),$?d(`This is the latest version (v${c}).`):(n(`An update is available: ${u.slice(0,7)} \u2192 ${b.slice(0,7)}`),n(`Apply it with:  ${m} upgrade`)),0;if($&&!y.has("--force"))return t&&process.stdout.write(`up-to-date
`),d(`This is the latest version (v${c}) \u2014 nothing to do.`),t||n("Re-download it anyway with --force."),0;let E=t?0:Jt(),q=t?0:Kt();if(!t&&(n(""),n($?"Re-downloading the current version:":`Update found: ${b.slice(0,7)}`),n("  \xB7 downloads the latest build for this system"),n("  \xB7 replaces the program files only \u2014 your DB, settings and tunnel credentials stay"),E===null?n("  \xB7 stops the app if it is running (it must be restarted afterwards)"):E>0&&n(`  \xB7 stops the app (${E} process${E===1?"":"es"} running now)`),q&&(n(""),h(`${q} job${q===1?" is":"s are"} running right now \u2014 restarting interrupts ${q===1?"it":"them"}.`)),n(""),!await C("Upgrade now?")))return n("Cancelled \u2014 nothing was changed."),1;!t&&E!==0&&(n("Stopping the app..."),ot(),it(),await A(g?2e3:300),n("")),n("Downloading the new version...");let D=`refs/remotes/${L}/${s}`;xe(["fetch","--depth","1",L,`+refs/heads/${s}:${D}`])!==0&&p(`Download failed \u2014 nothing was changed.
  Check your internet connection and run '${m} upgrade' again.${t?"":`
  The app was stopped, so start it with '${m}' if you want to keep using this version.`}`),d("Download complete");let St=k(["ls-tree","-r","--name-only",D,"--",...je]).out;St&&p(`The new build would overwrite your data \u2014 stopping. Nothing was changed.
  Offending paths: ${St.split(`
`).join(", ")}
  Please report this; do not upgrade until it is fixed.`);let G=Oe(D);if(G&&!y.has("--force")&&p(`${G}
  Nothing was changed \u2014 the current version is still installed.`),t)return process.stdout.write(`prepared
`),d(`Downloaded and verified: ${b.slice(0,7)} \u2014 not applied yet.`),n(`Apply it with:  ${m} upgrade`),0;let kt=De();n("Applying..."),k(["symbolic-ref","HEAD",`refs/heads/${s}`]);let T=Q(D);for(let U=1;g&&U<=3&&T.status!==0;U++){let lt=T.locked.filter(Xt);if(lt.length){let Tt=lt.length;n(`${Tt} file${Tt===1?" was":"s were"} locked \u2014 set aside, retrying...`)}else n("Some files were in use \u2014 waiting and retrying...");await A(1e3*U),T=Q(D)}if(T.status!==0){process.stderr.write(T.text.trimEnd()+`
`);let U=T.locked.length?`
  Still in use: ${T.locked.join(", ")}`:"";p(`Could not replace the program files.${U}
  Something may still have them open \u2014 close it and run '${m} upgrade' again.${g?`
  A virus scan, an open Explorer window on the install folder, or a leftover node.exe is the usual cause.`:""}`)}T.text.trim()&&process.stderr.write(T.text.trimEnd()+`
`),a.existsSync(i.join(l,"server.js"))||p(`The downloaded build looks incomplete (server.js is missing).
  Run the install command again to reinstall.`),d("Applied"),y.has("--no-gc")||(n("Cleaning up the old version..."),k(["reflog","expire","--expire=now","--all"]),k(["gc","--prune=now","--quiet"]));let vt=W()?.commandName??m;g||Ft({name:vt,quiet:!0}),Yt();let ct=M();return n(""),d(c===ct?`Up to date (v${ct})`:`Upgraded: v${c} \u2192 v${ct}`),kt&&n(`  Settings backup: ${kt}`),G&&(n(""),h(G)),n(""),n("Start it again:"),n(`  ${vt}`),0}var zt=["autoUpdate:enabled","autoUpdate:scope","autoUpdate:intervalHours","autoUpdate:checkOnBoot","autoUpdate:rollbackWaitMinutes","autoUpdate:lastCheckAt","autoUpdate:detectedVersion","autoUpdate:lastResult","autoUpdate:attempt","autoUpdate:rollbackPending","autoUpdate:rollbackPendingAt","autoUpdate:halted","autoUpdate:skipVersion"];function V(){return process.env.DB_PATH||i.join(l,"data.db")}function bt(t){let e=V();if(!a.existsSync(e))return null;let r;try{r=ht(import.meta.url).resolve("better-sqlite3")}catch{return null}let s=`
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
`,o=S(process.execPath,["-e",s,r,e,JSON.stringify(t)],{encoding:"utf8",timeout:15e3,stdio:["ignore","pipe","ignore"]});if(o.status!==0||!(o.stdout??"").trim())return null;try{return JSON.parse(o.stdout)}catch{return null}}function F(t,e){let r=V();if(!a.existsSync(r))return!1;let s;try{s=ht(import.meta.url).resolve("better-sqlite3")}catch{return!1}let o=`
const Database = require(process.argv[1]);
const db = new Database(process.argv[2], { fileMustExist: true });
try {
  db.pragma("busy_timeout = 10000");
  db.prepare(
    "INSERT INTO app_settings (key,value,updated_at) VALUES (?,?,unixepoch())" +
    " ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=unixepoch()"
  ).run(process.argv[3], process.argv[4]);
} finally { db.close(); }
`,c=S(process.execPath,["-e",o,s,r,t,e],{encoding:"utf8",timeout:2e4,stdio:["ignore","ignore","pipe"]});return c.status!==0?(h((c.stderr??"").trim().split(`
`).slice(-1)[0]||"could not write to the database"),!1):!0}function H(t,e){if(!t)return e;try{return JSON.parse(t)??e}catch{return e}}var _e="hyperteams-rollback-",Le=".backup-autoupdate-";function Zt(){let t=k(["tag","--list",`${_e}*`]);return t.status===0&&t.out?t.out.split(`
`).map(e=>e.trim()).filter(Boolean).sort():[]}function Qt(){let t=i.dirname(l),e=i.basename(l)+Le;try{return a.readdirSync(t).filter(r=>r.startsWith(e)).map(r=>i.join(t,r,"data.db")).filter(r=>a.existsSync(r)).sort()}catch{return[]}}function Y(t){let e=Number(t);return Number.isFinite(e)&&e>0?new Date(e*1e3).toISOString():"\u2014"}function Fe(t){let e=H(t?.["autoUpdate:rollbackPending"],null)??H(t?.["autoUpdate:attempt"],null);if(e?.rollbackRef||e?.fromSha)return{ref:e.rollbackRef??null,fallbackRef:e.fromSha??null,dbBackup:e.dbBackup??null,fromVersion:e.fromVersion??null,toVersion:e.toVersion??null,guessed:!1};let r=Zt(),s=Qt();return!r.length&&!s.length?null:{ref:r.length?r[r.length-1]:null,fallbackRef:null,dbBackup:s.length?s[s.length-1]:null,fromVersion:null,toVersion:null,guessed:!0}}function He(...t){for(let e of t)if(e&&k(["rev-parse","--verify","--quiet",`${e}^{commit}`]).status===0)return e;return null}function Me(){let t=bt(zt);if(n(`Install directory: ${l}`),n(`Current version:   v${M()}`),n(`Installation kind: ${yt()}`),n(""),!t)h(`Could not read ${V()} \u2014 showing only what is on disk.`);else{let s=$=>t[$]===void 0?!0:t[$]==="1",o=s("autoUpdate:enabled");n("Automatic updates"),n(`  Checking:        ${o?"on":"off"}`),n(`  Interval:        every ${t["autoUpdate:intervalHours"]??"6"}h`),n(`  Apply up to:     ${t["autoUpdate:scope"]??"patch"}`);let c=s("autoUpdate:checkOnBoot");n(`  Check on start:  ${c?"yes":"no"}`),n(`  Rollback waits:  ${t["autoUpdate:rollbackWaitMinutes"]??"30"}m for running work`),n(`  Last checked:    ${Y(t["autoUpdate:lastCheckAt"])}`),n(`  Latest seen:     v${t["autoUpdate:detectedVersion"]||"?"}`),t["autoUpdate:skipVersion"]&&n(`  Skipping:        v${t["autoUpdate:skipVersion"]} (it was rolled back)`),n("");let u=H(t["autoUpdate:lastResult"],null);u&&(n("Last attempt"),n(`  Outcome:         ${u.outcome}`),n(`  When:            ${Y(u.at)}`),n(`  Versions:        v${u.fromVersion} \u2192 v${u.toVersion??"?"}`),u.detail&&n(`  Detail:          ${u.detail}`),n(""));let f=H(t["autoUpdate:attempt"],null);f&&(h("An update is in flight (the app left a record and has not reported back yet)."),n(`  Started:         ${Y(f.startedAt)}`),n(""));let b=H(t["autoUpdate:rollbackPending"],null);b&&(h("A rollback is queued \u2014 it is waiting for running work to finish."),n(`  Waiting since:   ${Y(t["autoUpdate:rollbackPendingAt"])}`),n(`  Would restore:   ${b.rollbackRef} and ${b.dbBackup}`),n("")),t["autoUpdate:halted"]&&(h(`Automatic updates are halted: ${t["autoUpdate:halted"]}`),n(`  Clear it with:   ${m} auto-update --resume`),n(""))}let e=Zt(),r=Qt();return n("Recovery material on disk"),n(`  Rollback tags:   ${e.length?e.join(", "):"(none)"}`),n(`  DB snapshots:    ${r.length?r.join(`
                   `):"(none)"}`),n(""),(e.length||r.length)&&n(`Roll back with:  ${m} rollback`),0}function Be(){if(!y.has("--resume"))return n(`Usage: ${m} auto-update --resume`),n(""),n(`Shows the current state with:  ${m} upgrade-status`),n("Everything else is configured from the dashboard (Settings \u2192 Update)."),1;let t=bt(["autoUpdate:halted","autoUpdate:rollbackPending"]);return t==null&&p(`Could not open ${V()} \u2014 is this the installation directory?`),t["autoUpdate:halted"]?(n(`Halted because: ${t["autoUpdate:halted"]}`),F("autoUpdate:halted","")||p("Could not clear it. If the app is running, use Settings \u2192 Update \u2192 Resume instead."),t["autoUpdate:rollbackPending"]&&F("autoUpdate:rollbackPendingAt",String(Math.floor(Date.now()/1e3))),d("Cleared. Automatic updates will try again at the next check."),0):(d("Automatic updates are not halted \u2014 nothing to do."),0)}async function We(){let t=yt();(t==="source"||t==="unknown")&&p(`This is not a packaged installation, so there is nothing to roll back.
  From a source checkout, use git directly.`);let e=S("git",["--version"],{stdio:"ignore"});(e.error||e.status!==0)&&p("git is required to roll back \u2014 it is what restores the program files.");let r=bt(zt),s=Fe(r);s||p(`Nothing to roll back to \u2014 this installation has no rollback tag and no database snapshot.
  Those are made by an automatic update just before it applies one (Settings \u2192 Update).
  To reinstall the previous version, run the install command again.`);let o=He(s.ref,s.fallbackRef);o||p(`The rollback point is gone from this repository${s.ref?` (${s.ref})`:""}.
  Nothing was changed. Run the install command again to reinstall.`),(!s.dbBackup||!a.existsSync(s.dbBackup))&&p(`The database snapshot is missing${s.dbBackup?`: ${s.dbBackup}`:""}.
  Nothing was changed \u2014 rolling the program files back without it would leave a new
  database under old code, and this command will not do that unattended.
  If you want the program files only, run: git -C "${l}" reset --hard ${o}`);let c=M();if(n(`Install directory: ${l}`),n(`Current version:   v${c}`),n(""),n("This will:"),n("  \xB7 stop the app and the terminal daemon"),n(`  \xB7 restore the program files to ${o}${s.fromVersion?` (v${s.fromVersion})`:""}`),n(`  \xB7 replace data.db with ${s.dbBackup}`),n("  \xB7 start the app again"),s.guessed&&(n(""),h("The app did not record a rollback, so this is the newest tag and snapshot on disk."),h("They are probably from the same update, but nothing guarantees it.")),n(""),h("Anything written to the database since that snapshot will be lost."),n(""),!await C("Roll back now?"))return n("Cancelled \u2014 nothing was changed."),1;n("Stopping the app..."),ot(),it(),await A(g?2e3:500);let u=V();if(a.existsSync(u)){let $=`${u}.before-rollback-${Date.now()}`;try{a.copyFileSync(u,$),n(`Kept the current database at: ${$}`)}catch(E){p(`Could not set the current database aside (${E.message}) \u2014 stopping before anything changed.`)}}n("Restoring the program files...");let f=Q(o);for(let $=1;g&&$<=3&&f.status!==0;$++)f.locked.filter(Xt),await A(1e3*$),f=Q(o);f.status!==0&&(process.stderr.write(f.text.trimEnd()+`
`),p("Could not restore the program files. The database was not touched.")),a.existsSync(i.join(l,"server.js"))||p(`The restored tree has no server.js \u2014 this is not a usable version.
  The database was not touched. Run the install command again.`),d(`Program files restored to ${o}`),n("Restoring the database...");try{a.copyFileSync(s.dbBackup,u);for(let $ of["-wal","-shm"])a.rmSync(`${u}${$}`,{force:!0})}catch($){p(`The program files are back at ${o}, but the database could not be restored: ${$.message}
  Copy it by hand:  cp "${s.dbBackup}" "${u}"`)}d("Database restored");for(let $ of["autoUpdate:lock","autoUpdate:attempt","autoUpdate:rollbackPending","autoUpdate:rollbackPendingAt","autoUpdate:halted","autoUpdate:nextCheckAt"])F($,"");let b=s.toVersion??c;b&&F("autoUpdate:skipVersion",b),F("autoUpdate:lastResult",JSON.stringify({at:Math.floor(Date.now()/1e3),outcome:"rolled-back",fromVersion:s.fromVersion??"?",toVersion:b,detail:`rolled back by hand with \`${m} rollback\` \u2014 restored ${o} and ${s.dbBackup}`}));try{a.rmSync(i.join(l,".auto-update-rollback.json"),{force:!0})}catch{}return y.has("--no-start")?(n(""),n("Start it again:"),n(`  ${m}`),0):(n(""),n("Starting the app again..."),await nt())}function M(){try{return JSON.parse(a.readFileSync(i.join(l,"package.json"),"utf8")).version??"unknown"}catch{return"unknown"}}function wt(){let t=m;return process.stderr.write(`
HyperTeams

  ${t}                 start the server (Ctrl-C stops it)
  ${t} start --background
                             start it without holding the terminal
  ${t} stop            stop it from anywhere (same as Ctrl-C in its terminal)
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
  --background, --bg      do not hold the terminal; output goes to logs/server.log
  --foreground            (restart) hold this terminal instead of going to the background

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

Install directory: ${l}
`),0}var Ve={start:()=>Ut(j),stop:()=>Gt(),restart:()=>Te(j),setup:()=>ce(j),upgrade:()=>jt(),"upgrade-status":()=>Me(),rollback:()=>We(),"auto-update":()=>Be(),update:()=>jt(),autostart:()=>Pt(),"auto-start":()=>Pt(),"install-shim":()=>Ft(),uninstall:()=>Pe(),help:()=>wt()};y.has("--version")&&(process.stdout.write(M()+`
`),process.exit(0));(y.has("--help")||y.has("-h"))&&process.exit(wt());var te=Ve[Ct];te||(process.stderr.write(`\x1B[91m\u2717 Unknown command: ${Ct}\x1B[0m
`),process.exit(wt()||1));process.exit(await te()??0);
