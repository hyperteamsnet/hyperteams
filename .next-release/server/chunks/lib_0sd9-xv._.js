module.exports=[8671,e=>{"use strict";e.s(["clipUtf16",0,function(e,t){let n=e.slice(0,t);return/[\uD800-\uDBFF]$/.test(n)?n.slice(0,-1):n},"excerptOneLine",0,function(e,t=140){if(!e)return"";let n=/!\[([^\]]*)\]\(([^)]*)\)/g,a=(e,t)=>{let n=e.trim();if(n)return n;let a=t.trim().replace(/^<|>$/g,"").split(/[?#]/)[0];return/^data:/i.test(a)?"":a.split("/").pop()??""},r=e=>{let t=e.replace(/^>\s?/,"").replace(/^[-*+]\s+/,"").replace(/^\d+[.)]\s+/,"").trim();return!t||/^[-*_|:\s]+$/.test(t)?"":t.replace(n," ").replace(/\[([^\]]+)\]\([^)]*\)/g,"$1").replace(/`([^`]+)`/g,"$1").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1").replace(/\s+/g," ").trim()},o=!1,i="",s=[],l=[],d=[];for(let m of e.split(/\r?\n/)){let e=m.trim();if(/^(```|~~~)/.test(e)){o=!o;continue}if(o||!e)continue;if(/^\|.*\|/.test(e)){if(/^[|\-:\s]+$/.test(e))continue;let t=e.replace(/^\|/,"").replace(/\|$/,"").split("|").map(e=>r(e)).filter(Boolean);t.length&&l.push(t.join(" · "));continue}let u=/^#{1,6}\s+/.test(e),f=r(u?e.replace(/^#{1,6}\s+/,""):e);if(!f){for(let[,t,r]of e.matchAll(n)){let e=a(t,r);e&&d.push(e)}continue}if(u){i||(i=f);continue}if(s.push(f),s.join(" ").length>t)break}let m=s.length?s:i?[i]:l.length?l:d;if(!m.length)return"";if(m[0].length>t)return`${m[0].slice(0,t-1).trimEnd()}…`;let u=m[0],f=1;for(;f<m.length;f++){let e=/[.!?…:;)\]"'`」』]$/.test(u)?" ":" · ",n=`${u}${e}${m[f]}`;if(n.length>t)break;u=n}return f<m.length?`${u}…`:u},"oneLine",0,function(e){return e.replace(/\s+/g," ").trim()}])},842511,e=>{"use strict";e.s(["inheritModel",0,function(e){let t=e.asked.model?.trim()||null,n=e.asked.effort?.trim()||null,a=!!e.from.engine&&e.from.engine===e.engine;return{model:t??(a&&e.from.model?.trim()||null),effort:n??(a&&!t&&e.from.effort?.trim()||null)}}])},352985,e=>{"use strict";e.s(["MAX_MEMBERS",()=>a,"MESSAGE_KINDS",()=>f,"MESSAGE_MAX_CHARS",()=>i,"SENDS_PER_MINUTE",()=>o,"TEAM_BRIEF_ORIGIN",()=>k,"TEAM_ENGINES",()=>m,"TEAM_TOOL_TIMEOUT_SEC",()=>d,"WAIT_DEFAULT_SECONDS",()=>l,"WAIT_MAX_SECONDS",()=>s,"cleanBody",()=>c,"directorOf",()=>I,"engineHasTeamTools",()=>u,"finishReport",()=>T,"formatEnvelope",()=>w,"isMessageKind",()=>h,"isTeamOrigin",()=>b,"isTeammate",()=>L,"mateLabel",()=>R,"mateModel",()=>A,"maxWakes",()=>r,"reportTarget",()=>v,"resolveMate",()=>p,"spawnPrompt",()=>M,"teamAppend",()=>S,"teamInstruction",()=>N,"teamOriginId",()=>$,"teamOriginUser",()=>_,"teamSenderId",()=>E]);var t=e.i(842511),n=e.i(950696);let a=16;function r(e){return Math.max(16,8*Math.max(1,e))}let o=6,i=8e3,s=900,l=300,d=960,m=["claude-code","codex","agy","pi"],u=e=>m.includes(e??"claude-code"),f=["guide","question","answer","report","alert"],h=e=>"string"==typeof e&&f.includes(e);function c(e){let t=String(e??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u009B]/g,"").trim();return t.length<=i?{body:t,clipped:!1}:{body:t.slice(0,i),clipped:!0}}function p(e,t,n){let a=String(t??"").trim();if(!a)return{ok:!1,error:"Say who the message is for (`to`): a teammate's name or task number."};let r=/^#?(\d+)$/.exec(a),o=a.toLowerCase(),i=r?e.find(e=>e.id===Number(r[1])):"lead"===o?e.find(e=>"lead"===e.role):e.find(e=>e.label.toLowerCase()===o);if(!i){let t=e.filter(e=>e.id!==n).map(e=>`"${e.label}" (#${e.id})`);return{ok:!1,error:`No teammate called "${a}". Teammates: ${t.length?t.join(", "):"none yet"}.`}}return i.id===n?{ok:!1,error:"That is you. Send to a teammate instead."}:{ok:!0,mate:i}}let g="[HyperTeams team message";function w(e){let t=`${g} #${e.messageId} \xb7 ${e.kind} \xb7 from "${e.from.label}" (${e.from.engine}, task #${e.from.id})]`,n="question"===e.kind?`[Answer with team_send to "${e.from.label}" (kind "answer"). team_read "${e.from.label}" shows what it has been doing.]`:`[Reply with team_send to "${e.from.label}" if needed. team_read "${e.from.label}" shows what it has been doing.]`;return`${t}
${e.body}${e.clipped?"\n…(clipped)":""}
${n}`}let y="team:",$=e=>`${y}${e}`,b=e=>!!e&&e.startsWith(y),k="team:brief",_=e=>`task:${e}`;function E(e){let t=/^task:(\d+)$/.exec(e??"");return t?Number(t[1]):null}let I=e=>"member"===e.crewRole&&null!=e.crewId?e.crewId:null;function L(e){return"member"===e.crewRole&&null!=e.crewId&&e.crewId!==e.id}function T(e){let t=e.answer.trim();return"error"===e.status?{kind:"alert",body:`My turn ended with an error.${t?`

${t}`:""}

Send guidance with team_send and I will continue from it.`}:"done"===e.status?{kind:"report",body:`My turn is finished.${t?`

${t}`:""}`}:null}function M(e){let t=`[HyperTeams team \xb7 you are "${e.label}", working for "${e.lead.label}" (${e.lead.engine}, task #${e.lead.id})]`,n=e.leadFolder?`
[Separate folder \xb7 the lead works in ${e.leadFolder}; you work in your own repository; do not rely on reading or editing the lead's files — pass what it needs with team_send]`:"";return`${t}${n}
${e.brief.trim()}${e.clipped?"\n…(clipped)":""}`}function S(e){if("lead"===e.role){var t;let r,o=[e.leadEngine,e.leadModel&&`model ${e.leadModel}`,e.leadEffort&&`effort ${e.leadEffort}`].filter(Boolean).join(", ");return`

## Your team

You lead a HyperTeams agent team as "${e.label}". Teammates are other coding
agents (possibly other vendors) working in the same checkout — or, when the
person set one on the roster, in another folder (a separate repository outside your
checkout, possibly walled off from it — do not rely on reading or editing each
other's files; pass what it needs in messages and leave changes there to that
teammate) — and you coordinate
them with the team tools (mcp__hyperteams-team__*), which may be deferred: if
mcp__hyperteams-team__team_spawn is not in your tool list, load team_spawn, team_wait and
team_read with ToolSearch (query "select:mcp__hyperteams-team__team_spawn,mcp__hyperteams-team__team_wait,mcp__hyperteams-team__team_read")
before you start a teammate. Normally you design first, then hand a self-contained
brief to a teammate with team_spawn${o?` (omitted settings inherit your lead settings: ${o})`:""} — say which files to touch and how you will judge the result. Teammates can
also message each other directly; a teammate's answer goes back to whoever asked. Name in each brief the teammates whose parts touch it, so they can settle details directly. While they work
you may keep working or call team_wait. A teammate's finish or error arrives as a
team message; review it with team_read and the diff, then send guidance with
team_send or accept it. Answer teammates' questions promptly — they may be
waiting. Do not redo a teammate's work yourself unless it is stuck. Named roster
settings override inherited lead settings; explicit team_spawn arguments override
both. Models inherit only within the same engine, and effort inherits only when
the model is inherited too. Your final report must name who implemented the change
and who verified it: a teammate's name, or yourself together with the reason no
teammate did it.${e.roster?.length?`
The person planned these teammates — start each with team_spawn using exactly that name, so its settings apply. Delegating is required: the implementation goes to the planned implementer, and the independent check goes to a planned teammate on another engine when the roster has one; you do not do that work yourself. The one exception is a change too small to hand off (for example a one-line fix) — then say so in your final report:
${e.roster.map(e=>`- "${e.name}": ${(0,n.rosterLine)(e,e.folder)}`).join("\n")}`:(r=(t=e.choices??[]).length?t.map(e=>`- ${e.engine} (${e.name})${e.efforts.length?` \xb7 effort: ${e.efforts.join(", ")}`:""}`).join("\n"):"- (none detected — team_spawn will report what is missing)",`
The person left the team's makeup to you. First judge whether this work needs
teammates at all: a small or tightly coupled change is faster done alone — then
just do it and spawn no one. Form a team only when the work splits into parts
that can proceed independently, or when an independent check is worth its cost.
Then pick as few roles as the work allows (at most ${a}): e.g. one
implementer per independent area, plus a reviewer for risky changes. Give each a
short role name and choose its engine and effort for the role — an engine from
another vendor than yours makes a good independent reviewer; a lighter effort
suits mechanical work. Engines you can spawn here:
${r}
Leave model out unless you know a valid model id for that engine. Before the
first team_spawn, say in one line which team you formed and why.`)}`}let r=e.peers??[],o=r.length?`Your teammates when this run started: ${r.map(e=>`"${e.label}" (${e.engine}, task #${e.id})${e.folder?`, works in another folder: ${e.folder}`:""}`).join("; ")}. team_status shows the current team, including anyone added later.`:"No other teammates had started when this run began; team_status shows anyone added later.";return`

## Your team

You are "${e.label}" on a HyperTeams agent team led by "${e.leadLabel}".
${e.leadFolder?`You work in your own folder, a separate repository from the one "${e.leadLabel}"
works in (${e.leadFolder}). Do not rely on reading or editing each other's files —
they may be walled off — put paths, diffs and results in your messages. Use the team tools`:"Other agents work in the same checkout; use the team tools"}
(mcp__hyperteams-team__*). Guidance from "${e.leadLabel}" arrives as team messages.
${o}
When a question is about a teammate's part — an interface it is building, a file it
changed, a result it found — or your change affects its part, team_send that
teammate directly; you need not copy "${e.leadLabel}", which can read the exchange
with team_read. For a decision about scope or direction, when no teammate owns the
question, or when you are blocked, ask "${e.leadLabel}" with team_send (kind
"question"). Either way, team_wait for the answer instead of guessing. Put everything
one point needs in one message: the team shares a message budget. When your turn
ends, your final answer is reported automatically — to the teammate whose question
or guidance woke you, otherwise to "${e.leadLabel}". Make that answer a short
report of what changed and how you verified it.`}let x=/^\[HyperTeams team · you are "(.*)", working for "(.*)" \(([^,]+), task #(\d+)\)\](?:\n\[Separate folder · [^\n]*\])?\n?/;function N(e){let t=function(e){if(!e.startsWith(g))return null;let t=e.indexOf("\n"),n=t<0?e:e.slice(0,t),a=/^\[HyperTeams team message #(\d+) · (\w+) · from "(.*)" \(([^,]+), task #(\d+)\)\]$/.exec(n);if(!a)return null;let r=t<0?"":e.slice(t+1),o=r.lastIndexOf("\n");return o>=0&&/^\[(Answer|Reply) with team_send/.test(r.slice(o+1))&&(r=r.slice(0,o)),{messageId:Number(a[1]),kind:a[2],fromLabel:a[3],fromEngine:a[4],fromTaskId:Number(a[5]),body:r}}(e);if(t)return{fromLabel:t.fromLabel,kind:t.kind,body:t.body};let n=x.exec(e);return n?{fromLabel:n[2],kind:"brief",body:e.slice(n[0].length)}:null}function v(e){let t=e.starter;return t&&t.fromIsMember&&("question"===t.kind||"guide"===t.kind)?t.from:e.leadId}function A(e){let n=e.planned?.engine===e.engine?e.planned:{},a=(0,t.inheritModel)({engine:e.engine,asked:n,from:e.lead});return(0,t.inheritModel)({engine:e.engine,asked:{model:e.askedModel,effort:e.askedEffort},from:{engine:e.engine,...a}})}function R(e){return e.crewLabel?.trim()||`#${e.id}`}},950696,e=>{"use strict";e.s(["cleanTeamName",()=>a,"defaultLeadName",()=>i,"nextRosterEntry",()=>l,"otherFolder",()=>m,"parseRoster",()=>r,"rosterEntry",()=>s,"rosterLine",()=>d]);var t=e.i(8671),n=e.i(352985);function a(e){if("string"!=typeof e)return"";let n=e.replace(/[\p{Cc}"]/gu," ").replace(/\s+/g," ").trim();return(0,t.clipUtf16)(n,24).trim()}function r(e,t=[]){let i=e;if("string"==typeof i)try{i=JSON.parse(i)}catch{return[]}if(!Array.isArray(i))return[];let s=[],l=new Set(t.map(e=>e.toLowerCase()).filter(Boolean));for(let e of i){if(!e||"object"!=typeof e)continue;let t="string"==typeof e.engine?e.engine.trim():"";if(!t)continue;let r=o(a(e.name)||t,l);l.add(r.toLowerCase());let i=e=>"string"==typeof e&&e.trim()?e.trim():null,d={name:r,engine:t,model:i(e.model),effort:i(e.effort)},m=Number(e.workspaceId);null!=e.workspaceId&&Number.isInteger(m)&&m>0&&(d.workspaceId=m);let u=Number(e.accountId);null!=e.accountId&&Number.isInteger(u)&&u>0&&(d.accountId=u);let f=i(e.accountRef);f&&null==d.accountId&&(d.accountRef=f.slice(0,200));let h=i(e.folderRef);if(h&&null==d.workspaceId&&(d.folderRef=h.slice(0,1e3)),s.push(d),s.length>=n.MAX_MEMBERS)break}return s}function o(e,n){let a=e;for(let r=2;n.has(a.toLowerCase());r++)a=`${(0,t.clipUtf16)(e,24-String(r).length-1)}-${r}`;return a}function i(e,t=[]){return o(a(e.accountLabel)||a(e.engineLabel)||"lead",new Set(t.map(e=>e.toLowerCase())))}function s(e,t){let n=(t??"").trim().toLowerCase();return n?e.find(e=>e.name.toLowerCase()===n)??null:null}function l(e,t){let n=new Set(t.map(e=>e.toLowerCase()));return e.find(e=>!n.has(e.name.toLowerCase()))??null}function d(e,t){return[e.engine,e.model??"engine default model",e.effort?`effort ${e.effort}`:null,t?`works in another folder: ${t}`:null].filter(Boolean).join(" · ")}function m(e,t){let n=e?.workspaceId??null;return null!=n&&n!==t?n:null}}];