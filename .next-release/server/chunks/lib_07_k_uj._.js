module.exports=[750087,e=>{"use strict";e.s(["LINK_LIMITS",0,{rows:{reject:2e4},eventText:{reject:2e3},turnText:{reject:1e5},text:{reject:1e5},gitBranches:{reject:500,store:50},skills:{reject:200,store:40,name:64,description:200},promoteSchedules:{reject:200,store:20},schedules:{reject:500,store:50,title:200,prompt:4e3,error:200},folders:{reject:5e3},tasks:{reject:5e3},approvals:{reject:10},artifacts:{reject:500},changes:{reject:500},accounts:{reject:64},senders:{tasks:5e3,events:1e4,turns:2e4},drainBatch:20}])},842511,e=>{"use strict";e.s(["inheritModel",0,function(e){let t=e.asked.model?.trim()||null,n=e.asked.effort?.trim()||null,r=!!e.from.engine&&e.from.engine===e.engine;return{model:t??(r&&e.from.model?.trim()||null),effort:n??(r&&!t&&e.from.effort?.trim()||null)}}])},352985,e=>{"use strict";e.s(["MAX_FAILURE_RECOVERIES",()=>i,"MAX_MEMBERS",()=>a,"MESSAGE_KINDS",()=>p,"MESSAGE_MAX_CHARS",()=>d,"SENDS_PER_MINUTE",()=>l,"TEAM_BRIEF_ORIGIN",()=>T,"TEAM_ENGINES",()=>f,"TEAM_TOOL_TIMEOUT_SEC",()=>h,"WAIT_DEFAULT_SECONDS",()=>u,"WAIT_MAX_SECONDS",()=>m,"cleanBody",()=>g,"directorOf",()=>M,"engineHasTeamTools",()=>c,"finishReport",()=>x,"formatEnvelope",()=>$,"isMessageKind",()=>w,"isTeamOrigin",()=>I,"isTeammate",()=>S,"mateLabel",()=>O,"mateModel",()=>C,"maxWakes",()=>o,"recoveryNudge",()=>s,"reportTarget",()=>A,"resolveMate",()=>y,"spawnPrompt",()=>N,"teamAppend",()=>v,"teamInstruction",()=>R,"teamOriginId",()=>_,"teamOriginUser",()=>E,"teamSenderId",()=>L]);var t=e.i(750087),n=e.i(842511),r=e.i(950696);let a=16;function o(e){return Math.max(16,8*Math.max(1,e))}let i=2;function s(e){let t=e.error.trim(),n=e.attempt>=e.cap;return[`Teammate "${e.label}" is still in error: its last turn ended with an error and nothing has fixed it, so the team's work is not finished.`,`Find out why with team_read "${e.label}". Then either send it the fix with team_send (that restarts it), or take the part over yourself and say so with team_send. Finish the work either way — do not leave it for a person to merge around a failed teammate.`,n?`This is the last time you are asked (${e.attempt} of ${e.cap}); after it the team goes to the person.`:`This is reminder ${e.attempt} of ${e.cap}; after the last one the team goes to the person.`,t?`Its last error:
${t}`:""].filter(Boolean).join("\n\n")}let l=6,d=t.LINK_LIMITS.turnText.reject,m=900,u=300,h=960,f=["claude-code","codex","agy","pi"],c=e=>f.includes(e??"claude-code"),p=["guide","question","answer","report","alert"],w=e=>"string"==typeof e&&p.includes(e);function g(e){let t=String(e??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u009B]/g,"").trim();return t.length<=d?{body:t,clipped:!1}:{body:t.slice(0,d),clipped:!0}}function y(e,t,n){let r=String(t??"").trim();if(!r)return{ok:!1,error:"Say who the message is for (`to`): a teammate's name or task number."};let a=/^#?(\d+)$/.exec(r),o=r.toLowerCase(),i=a?e.find(e=>e.id===Number(a[1])):"lead"===o?e.find(e=>"lead"===e.role):e.find(e=>e.label.toLowerCase()===o);if(!i){let t=e.filter(e=>e.id!==n).map(e=>`"${e.label}" (#${e.id})`);return{ok:!1,error:`No teammate called "${r}". Teammates: ${t.length?t.join(", "):"none yet"}.`}}return i.id===n?{ok:!1,error:"That is you. Send to a teammate instead."}:{ok:!0,mate:i}}let b="[HyperTeams team message";function $(e){let t=`${b} #${e.messageId} \xb7 ${e.kind} \xb7 from "${e.from.label}" (${e.from.engine}, task #${e.from.id})]`,n="question"===e.kind?`[Answer with team_send to "${e.from.label}" (kind "answer"). team_read "${e.from.label}" shows what it has been doing.]`:`[Reply with team_send to "${e.from.label}" if needed. team_read "${e.from.label}" shows what it has been doing.]`;return`${t}
${e.body}${e.clipped?"\n…(clipped)":""}
${n}`}let k="team:",_=e=>`${k}${e}`,I=e=>!!e&&e.startsWith(k),T="team:brief",E=e=>`task:${e}`;function L(e){let t=/^task:(\d+)$/.exec(e??"");return t?Number(t[1]):null}let M=e=>"member"===e.crewRole&&null!=e.crewId?e.crewId:null;function S(e){return"member"===e.crewRole&&null!=e.crewId&&e.crewId!==e.id}function x(e){let t=e.answer.trim();return"error"===e.status?{kind:"alert",body:`My turn ended with an error.${t?`

${t}`:""}

Send guidance with team_send and I will continue from it.`}:"done"===e.status?{kind:"report",body:`My turn is finished.${t?`

${t}`:""}`}:null}function N(e){let t=`[HyperTeams team \xb7 you are "${e.label}", working for "${e.lead.label}" (${e.lead.engine}, task #${e.lead.id})]`,n=e.leadFolder?`
[Separate folder \xb7 the lead works in ${e.leadFolder}; you work in your own repository; do not rely on reading or editing the lead's files — pass what it needs with team_send]`:"";return`${t}${n}
${e.brief.trim()}${e.clipped?"\n…(clipped)":""}`}function v(e){if("lead"===e.role){var t;let n,o=(0,r.enabledRoster)(e.roster??[]),i=[e.leadEngine,e.leadModel&&`model ${e.leadModel}`,e.leadEffort&&`effort ${e.leadEffort}`].filter(Boolean).join(", ");return`

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
brief to a teammate with team_spawn${i?` (omitted settings inherit your lead settings: ${i})`:""} — say which files to touch and how you will judge the result. Teammates can
also message each other directly; a teammate's answer goes back to whoever asked. Name in each brief the teammates whose parts touch it, so they can settle details directly. While they work
you may keep working or call team_wait. A teammate's finish or error arrives as a
team message; review it with team_read and the diff, then send guidance with
team_send or accept it. Answer teammates' questions promptly — they may be
waiting. Do not redo a teammate's work yourself unless it is stuck. Named roster
settings override inherited lead settings; explicit team_spawn arguments override
both. Models inherit only within the same engine, and effort inherits only when
the model is inherited too. Your final report must name who implemented the change
and who verified it: a teammate's name, or yourself together with the reason no
teammate did it.${o.length?`
The person planned these teammates — start each with team_spawn using exactly that name, so its settings apply. Delegating is required: the implementation goes to the planned implementer, and the independent check goes to a planned teammate on another engine when the roster has one; you do not do that work yourself. The one exception is a change too small to hand off (for example a one-line fix) — then say so in your final report:
${o.map(e=>`- "${e.name}": ${(0,r.rosterLine)(e,e.folder)}${(0,r.rosterNote)(e)}`).join("\n")}`:(n=(t=e.choices??[]).length?t.map(e=>`- ${e.engine} (${e.name})${e.efforts.length?` \xb7 effort: ${e.efforts.join(", ")}`:""}`).join("\n"):"- (none detected — team_spawn will report what is missing)",`
The person left the team's makeup to you. First judge whether this work needs
teammates at all: a small or tightly coupled change is faster done alone — then
just do it and spawn no one. Form a team only when the work splits into parts
that can proceed independently, or when an independent check is worth its cost.
Then pick as few roles as the work allows (at most ${a}): e.g. one
implementer per independent area, plus a reviewer for risky changes. Give each a
short role name and choose its engine and effort for the role — an engine from
another vendor than yours makes a good independent reviewer; a lighter effort
suits mechanical work. Engines you can spawn here:
${n}
Leave model out unless you know a valid model id for that engine. Before the
first team_spawn, say in one line which team you formed and why.`)}`}let n=e.peers??[],o=n.length?`Your teammates when this run started: ${n.map(e=>`"${e.label}" (${e.engine}, task #${e.id})${e.folder?`, works in another folder: ${e.folder}`:""}`).join("; ")}. team_status shows the current team, including anyone added later.`:"No other teammates had started when this run began; team_status shows anyone added later.";return`

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
report of what changed and how you verified it.`}let j=/^\[HyperTeams team · you are "(.*)", working for "(.*)" \(([^,]+), task #(\d+)\)\](?:\n\[Separate folder · [^\n]*\])?\n?/;function R(e){let t=function(e){if(!e.startsWith(b))return null;let t=e.indexOf("\n"),n=t<0?e:e.slice(0,t),r=/^\[HyperTeams team message #(\d+) · (\w+) · from "(.*)" \(([^,]+), task #(\d+)\)\]$/.exec(n);if(!r)return null;let a=t<0?"":e.slice(t+1),o=a.lastIndexOf("\n");return o>=0&&/^\[(Answer|Reply) with team_send/.test(a.slice(o+1))&&(a=a.slice(0,o)),{messageId:Number(r[1]),kind:r[2],fromLabel:r[3],fromEngine:r[4],fromTaskId:Number(r[5]),body:a}}(e);if(t)return{fromLabel:t.fromLabel,kind:t.kind,body:t.body};let n=j.exec(e);return n?{fromLabel:n[2],kind:"brief",body:e.slice(n[0].length)}:null}function A(e){let t=e.starter;return t&&t.fromIsMember&&("question"===t.kind||"guide"===t.kind)?t.from:e.leadId}function C(e){let t=e.planned?.engine===e.engine?e.planned:{},r=(0,n.inheritModel)({engine:e.engine,asked:t,from:e.lead});return(0,n.inheritModel)({engine:e.engine,asked:{model:e.askedModel,effort:e.askedEffort},from:{engine:e.engine,...r}})}function O(e){return e.crewLabel?.trim()||`#${e.id}`}},950696,e=>{"use strict";e.s(["allRosterOff",()=>o,"cleanTeamName",()=>i,"defaultLeadName",()=>d,"enabledRoster",()=>a,"isRosterEnabled",()=>r,"nextRosterEntry",()=>u,"otherFolder",()=>c,"parseRoster",()=>s,"rosterEntry",()=>m,"rosterLine",()=>h,"rosterNote",()=>f]);var t=e.i(8671),n=e.i(352985);function r(e){return e?.enabled!==!1}function a(e){return e.filter(r)}function o(e){return e.length>0&&!e.some(r)}function i(e){if("string"!=typeof e)return"";let n=e.replace(/[\p{Cc}"]/gu," ").replace(/\s+/g," ").trim();return(0,t.clipUtf16)(n,24).trim()}function s(e,r=[]){let a=e;if("string"==typeof a)try{a=JSON.parse(a)}catch{return[]}if(!Array.isArray(a))return[];let o=[],d=new Set(r.map(e=>e.toLowerCase()).filter(Boolean));for(let e of a){if(!e||"object"!=typeof e)continue;let r="string"==typeof e.engine?e.engine.trim():"";if(!r)continue;let a=l(i(e.name)||r,d);d.add(a.toLowerCase());let s=e=>"string"==typeof e&&e.trim()?e.trim():null,m={name:a,engine:r,model:s(e.model),effort:s(e.effort)},u=Number(e.workspaceId);null!=e.workspaceId&&Number.isInteger(u)&&u>0&&(m.workspaceId=u);let h=Number(e.accountId);null!=e.accountId&&Number.isInteger(h)&&h>0&&(m.accountId=h);let f=s(e.accountRef);f&&null==m.accountId&&(m.accountRef=f.slice(0,200));let c=s(e.folderRef);c&&null==m.workspaceId&&(m.folderRef=c.slice(0,1e3));let p=function(e){if("string"!=typeof e)return"";let n=e.replace(/\p{Cc}/gu," ").replace(/\s+/g," ").trim();return(0,t.clipUtf16)(n,200).trim()}(e.description);if(p&&(m.description=p),!1===e.enabled&&(m.enabled=!1),o.push(m),o.length>=n.MAX_MEMBERS)break}return o}function l(e,n){let r=e;for(let a=2;n.has(r.toLowerCase());a++)r=`${(0,t.clipUtf16)(e,24-String(a).length-1)}-${a}`;return r}function d(e,t=[]){return l(i(e.accountLabel)||i(e.engineLabel)||"lead",new Set(t.map(e=>e.toLowerCase())))}function m(e,t){let n=(t??"").trim().toLowerCase();return n?e.find(e=>e.name.toLowerCase()===n)??null:null}function u(e,t){let n=new Set(t.map(e=>e.toLowerCase()));return e.find(e=>r(e)&&!n.has(e.name.toLowerCase()))??null}function h(e,t){return[e.engine,e.model??"engine default model",e.effort?`effort ${e.effort}`:null,t?`works in another folder: ${t}`:null].filter(Boolean).join(" · ")}function f(e){return e.description?` — the person's note: ${e.description}`:""}function c(e,t){let n=e?.workspaceId??null;return null!=n&&n!==t?n:null}}];