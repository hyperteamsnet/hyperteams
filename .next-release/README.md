# HyperTeams

**Run a whole team of Claude Code sessions from one screen.**

HyperTeams is the control room for the **Claude Code** already installed on your
computer. Register the folders you want worked on, hand out several jobs at
once, and follow the progress and results in one place — from your desk or from
your phone.

🌐 **[hyperteams.net](https://hyperteams.net)** · 한국어 문서는
[README.ko.md](README.ko.md)를 보세요.

---

## Why HyperTeams

- **Many jobs at once, on one screen.** No more juggling windows. Every job gets
  its own card, and the whole picture is visible at a glance.
- **Your computer, your files.** The work happens in your real project folders,
  in the setup you already use.
- **Nothing new to sign up for.** It uses the Claude Code login you already
  have. No extra account, no key to request.
- **Ready in a minute.** One line to install, one line to start.
- **Your phone becomes the control room.** Start something while you are out,
  check in on it on the move, and keep the work going while you are away.

---

## What you can do

| Feature | How it helps |
|---|---|
| **Several jobs at the same time** | Register your folders and give each one a different job. They all run together in one dashboard. |
| **Watch it happen live** | What is being done, and which files were touched, appears on screen as it happens. Nothing to refresh. |
| **See what it costs** | Usage and cost are recorded per job, so you can always tell what a piece of work spent. |
| **Work windows that stay open** | The command window keeps running even if you close the page or reload. Whatever it serves up can be opened from a single address, which is handy for showing a teammate or checking on your phone. |
| **Run things on a schedule** | Nightly clean-ups, morning summaries, any recurring chore — set the time and leave it. |
| **Read, edit, and save files** | Browse a folder, edit files right on screen, and review and record the changes, all in one place. |
| **Designed for the phone first** | Built for the small screen, so using it on a phone is the real experience, not an afterthought. |
| **Everything is kept** | Conversations and usage are stored on your own computer, so it all carries over after a restart. |

### A few terms

| Term | Meaning |
|---|---|
| **Working directory** | A folder to have work done in. Just register the path; it is created if it does not exist. |
| **Task** | One instruction given to a working directory. |
| **Terminal** | A command window that stays open in a working directory. |
| **Schedule** | A set time to start a task or run a command. |

---

## Getting started

### 1. What you need

**The installer does all of this for you.** If you use the one-line install in
step 2, it checks for git, Node.js and Claude Code, asks before it fills in
whatever is missing, and picks a Node version this build actually supports.
Node goes into `~/.hyperteams/runtime/node` and is used by HyperTeams alone —
the Node already on your machine is left exactly as it is. The one thing it
cannot do for you is **sign in to Claude Code**: run `claude` once and log in.

Read on if you would rather install these by hand, or you are building from
source. To install nothing automatically, set `HYPERTEAMS_AUTO_DEPS=0`.

- **Claude Code** — this is what HyperTeams puts to work. Install it with the
  line below, then run `claude` once in a terminal to log in.

  ```bash
  # macOS / Linux
  curl -fsSL https://claude.ai/install.sh | bash
  ```
  ```powershell
  # Windows PowerShell
  irm https://claude.ai/install.ps1 | iex
  ```

  When `claude --version` prints a version, you are set. HyperTeams reuses that
  login, so there is no key to enter anywhere.

**Other models are optional and need nothing installed by hand.** Tasks can run
on GPT, Gemini, Grok, DeepSeek, Kimi or your own local server instead of Claude
Code. Open **Global settings → Other models**, press Install, and paste an API
key for the provider you want; HyperTeams downloads the runtime into
`~/.hyperteams/pi/` and keeps the keys on this machine. A second engine then
appears when you create a task.

That engine is a smaller harness than Claude Code — no sub-agents, no MCP, no
permission modes, no background shells — so HyperTeams hides those controls for
tasks that run on it. A task's engine is fixed once it starts: a follow-up
resumes the same session, and sessions belong to the engine that made them.

- **Node.js** — Node is what runs the app. Install the LTS version from
  [nodejs.org](https://nodejs.org/) and check it with `node --version`. With a
  package manager it looks like this.

  ```powershell
  # Windows — winget already ships with Windows, nothing to set up first
  winget install OpenJS.NodeJS.LTS
  ```
  ```bash
  # macOS — Homebrew
  brew install node
  ```
  ```bash
  # Linux — the distro package is often several versions behind.
  # fnm (github.com/Schniz/fnm) or nvm (github.com/nvm-sh/nvm) is the easier road
  fnm install --lts && fnm use --lts
  ```

  Chocolatey on Windows differs in two ways — it needs an **administrator
  PowerShell**, and the line that installs Chocolatey itself contains
  `Set-ExecutionPolicy Bypass -Scope Process -Force`. That scope is exactly what
  it says: it holds for that one window and is gone when you close it, so
  nothing about your system is permanently loosened.

  ```powershell
  choco install nodejs-lts -y
  ```

  On Windows, open a **new terminal window** afterwards or `node` will not be
  found yet. And if the version is too old — which happens with distro packages
  on Linux — the first run tells you which versions work and stops, and you can
  switch with one of the version managers above.

- **Git** — git is what fetches the program files. The first install, every
  later update, and rolling back all go through it, and the dashboard's commit
  and branch features sit on top of it too. Without it the install stops on its
  first step.

  macOS and Linux usually have it already — if `git --version` prints a version,
  leave it alone. If it does not, macOS has `xcode-select --install` and Linux
  has the distro package (`sudo apt install git`, `sudo dnf install git`). On Windows,
  take it from [git-scm.com](https://git-scm.com/downloads), or the same way as
  above:

  ```powershell
  winget install Git.Git
  ```

  With Chocolatey it is `choco install git -y`, under the same administrator
  condition as above.

### 2. Install

Paste one line into Terminal (macOS or Linux) or PowerShell (Windows).

macOS/Linux:
```bash
curl -fsSL https://hyperteams.net/install.sh | bash
```

Windows PowerShell:
```powershell
iex (irm https://hyperteams.net/install.ps1)
```

It arrives ready to run, so there is nothing to assemble. During the install you
are asked for an address and a password.

### 3. Start

One word, from any folder:

```bash
hyperteams
```

The address is printed on screen as it starts — usually
**`http://localhost:27777`**. Open it in your browser, enter your password, and
that is it. To stop, press Ctrl-C once in the window you started it from and
everything shuts down together.

---

## How you use it

### Reach it from anywhere

At first it opens on your own computer only. Connect a tunnel under
**Settings → Tunnel** in the dashboard and you get a fixed address that works
from anywhere — with no router settings to change. Since that opens it up, set a
password first, and restart once after connecting for it to take effect.

With that in place you can install it on your phone like an app and get a
notification there when a job finishes. Your own domain is connected from the
same screen.

### Staying up to date

When a new version is out, the dashboard says so next to the version number.
Applying it is one line, from any folder:

```bash
hyperteams upgrade
```

It replaces the program files only — your history, settings and the address you
connected all stay as they are. Reinstalling is not the way to update.

### Choose how much to hand over

Pick how much freedom each job gets when you hand it out.

| Choice | What it does |
|---|---|
| **Auto-approve file edits** (default) | Edits go ahead without asking; everything else checks with you when needed. |
| **Fully automatic** | Runs all the way through without stopping to ask. |
| **Plan only** | Shows you how it would do the work, without actually doing it. |
| **Standard** | Claude Code's normal behaviour. |

---

## Managing it

### Keep it running without a terminal

Started plainly, `hyperteams` holds the terminal it runs in — close the window
and it goes with it. To leave it running instead:

```bash
hyperteams start --background
```

It prints the address and hands the prompt back. Everything that would have
scrolled past goes to `logs/server.log` in the install folder, with the previous
run kept as `logs/server.log.prev`. Stop it with `hyperteams stop`.

### Start it with the computer

```bash
hyperteams autostart
```

This registers a login item — launchd on macOS, systemd on Linux, the Startup
folder on Windows. Turn it off with `hyperteams autostart off`, and see how it
stands with `hyperteams autostart status`.

Four things worth knowing.

- **It is not resurrected when it dies.** What you stopped with `hyperteams stop`
  stays stopped, and comes back at the next login. Automatic restart would make
  `stop` meaningless — the OS cannot tell "a person stopped it" from "it died".
- **It captures your PATH as it is when you register.** Login items do not read
  your shell configuration, so without this it would find none of `claude`,
  `caddy` or `cloudflared`. Reinstalled node or claude somewhere else? Run
  `hyperteams autostart` again — that re-run is the refresh.
- **It starts when you log in.** For a machine that must come up with nobody
  there, turn on automatic login (macOS) or lingering (Linux — the command tries
  `loginctl enable-linger` for you and prints what to run if it cannot).
- **Mind the protected folders on macOS.** If the installation lives inside
  `~/Documents`, `~/Desktop` or `~/Downloads`, a login item cannot read it —
  starting it by hand works fine and only the automatic start fails, silently.
  Move the installation out of there, or grant Full Disk Access. The command
  warns you first when this applies.

### Stop it

Normally you stop it with Ctrl-C in the terminal you started it in. When that
terminal is gone — you closed the window, or an SSH session dropped — stop it
from anywhere:

```bash
hyperteams stop
```

It stops everything this installation started: the app, the tunnel and your
terminals. If a job is running it says so and asks first, because a running job
does not survive a restart. Start it again with `hyperteams`.

### Restart it

To pick up a settings change:

```bash
hyperteams restart
```

It stops it and brings it back **in the background**, so this window stays
yours. If it was not running, it just starts it. Add `--foreground` to have it
run in this terminal instead.

### Change your settings

To change the address or the password:

```bash
hyperteams setup
```

### Update to the latest version

```bash
hyperteams upgrade
```

It downloads the newest build for your machine and swaps the program files in
place. Everything of yours is left alone — the database, `.env.local` and the
tunnel credentials are never part of a build. Anything running is stopped first,
so start it again afterwards with `hyperteams`.

To see whether there is anything new without changing a thing:

```bash
hyperteams upgrade --check
```

**Or press a button.** The same update lives in the dashboard — the gear icon →
*Update*. It downloads the new version while you keep working, restarts once to
apply it, and the page reloads by itself when the server is back, so you can
update from your phone without going near a terminal. (Open terminals do close:
the program files are replaced underneath them.)

### Open it on a different address

If something else is already using the default number, start it on another one:

```bash
PORT=9000 hyperteams
```

### Uninstall

```bash
hyperteams uninstall
```

This clears out the install folder and the `hyperteams` command together. Your
saved history goes with it, so it asks once more before removing anything.
Claude Code itself and your project folders stay where they are.

### If something is not right

- **`hyperteams` is not found** — a window that was already open when you
  installed has not picked it up yet. Open a new terminal and try again.
- **You forgot the password** — run `hyperteams setup` and set a new one.
- **Windows says a script "cannot be loaded because running scripts is
  disabled"** — that is PowerShell's execution policy. Neither the install line
  above nor the `hyperteams` command is affected by it (one is a string run from
  memory rather than a file, the other is a `.cmd`). What it does stop are
  commands that arrive as `.ps1`, such as `npm` and `pnpm`. One line clears it,
  no administrator needed:

  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```

  On a managed work machine `Get-ExecutionPolicy -List` may show `MachinePolicy`
  as `Restricted`, which overrides the setting above. Then run just that one
  command through `powershell -ExecutionPolicy Bypass -Command "..."`, or ask
  your IT team.

---

## More

- 🌐 Product site — **<https://hyperteams.net>**
- ✉ Questions and enquiries — **hyperteamsnet@gmail.com**
