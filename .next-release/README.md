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

- **Node.js** — install the LTS version from [nodejs.org](https://nodejs.org/).
  Check it with `node --version`.

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

---

## More

- 🌐 Product site — **<https://hyperteams.net>**
- ✉ Questions and enquiries — **hyperteamsnet@gmail.com**
