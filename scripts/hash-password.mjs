#!/usr/bin/env node
import{randomBytes as l,scryptSync as u}from"node:crypto";import{createInterface as p}from"node:readline";var a=16384,i=8,c=1,h=32;function f(t){let n=l(16),o=u(t,n,h,{N:a,r:i,p:c});return["scrypt",a,i,c,n.toString("base64url"),o.toString("base64url")].join(".")}function d(t){return new Promise(n=>{let o=p({input:process.stdin,output:process.stdout,terminal:!0}),r=s=>{[`
`,"\r",""].includes(s.toString("utf8"))||process.stdout.write(`\r\x1B[2K${t}`)};process.stdin.on("data",r),o.question(t,s=>{process.stdin.off("data",r),o.close(),process.stdout.write(`
`),n(s)})})}var e=await d("New dashboard password: ");e||(console.error("An empty password cannot be used."),process.exit(1));e.length<8&&(console.error(`
\u26A0 That is ${e.length} characters. At least 8 are required \u2014 this dashboard can be
  exposed to the internet and can run commands on this machine, so 20+ is recommended. Run it again.`),process.exit(1));var g=await d("Enter it again: ");e!==g&&(console.error("The two entries do not match."),process.exit(1));console.log(`
Put the following line in .env.local (and remove any existing DASHBOARD_PASSWORD line):
`);console.log(`DASHBOARD_PASSWORD_HASH=${f(e)}
`);console.log("It takes effect after a server restart. Devices that are already signed in stay signed in \u2014");console.log("to sign them all out, use 'Sign out all devices' in the dashboard.");
