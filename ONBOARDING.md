# ONBOARDING.md — Agent Technical Reference

> This file is the technical reference for AI coding agents. For project overview, see [README.md](./README.md). For behavioral rules, see [GEMINI.md](./GEMINI.md).

---

## 📋 File Boundary Framework

| Question | Answer → File |
|----------|---------------|
| "Would a human contributor or visitor need this?" | **README.md** |
| "Is this telling the agent *what exists and how things work*?" | **ONBOARDING.md** (this file) |
| "Is this telling the agent *how to behave*?" | **GEMINI.md** |

**ONBOARDING.md is the manual. GEMINI.md is the manager.**

---

## 🗺 Context Map (Pointers Only)

> **Rule:** This section contains ONE-LINE POINTERS to entry-point files. Never describe behavior here — the agent reads the code for truth. See GEMINI.md § Documentation Philosophy for the full rationale.

<!-- Update this section as files are added. One line per file. -->

| Concern | Entry Point |
|---------|-------------|
| Server (CDP, WebSocket, Express, auth) | `server.js` |
| Click proxying (`POST /click`) + sidebar capture | `server.js` — search `CAPTURE_SCRIPT` and `/click` |
| Sidebar DOM discovery (temporary diagnostic) | `server.js` — search `DISCOVER_SCRIPT` and `/discover` |
| Client rendering, WebSocket, stop/send | `public/js/app.js` |
| Right sidebar on-demand fetch + click proxy handlers | `public/js/app.js` — search `fetchRightSidebar` and `openRightSidebar` |
| Right sidebar on-demand capture (CDP script + endpoint) | `server.js` — search `RIGHT_SIDEBAR_SCRIPT` and `GET /right-sidebar` |
| Image proxy for sidebar (canvas-based, cached client-side) | `server.js` — search `GET /proxy-image`; `public/js/app.js` — search `proxySidebarImages` |
| Permission banner capture + click proxy (`perm:` prefix) | `server.js` — search `permissionHtml` and `'perm'` |
| Environment/worktree + branch capture + click proxy (`env:` prefix) | `server.js` — search `environmentName` and `'env'` |
| Model selection capture + click proxy (`model:` prefix) | `server.js` — search `modelName` and `'model'` |
| Project dropdown click proxy (`project:` prefix) | `server.js` — search `'project'` in click handler |
| Model chip + attach button in input bar | `public/index.html` — search `model-chip` and `attach-btn` |
| Commenting on artifacts + code diffs | `public/js/app.js` — search `activeArtifactUri` and `activeFileUri` |
| Mobile UI structure | `public/index.html` |
| Login page | `public/login.html` |
| Mobile-first styles (minimal CDP overrides) | `public/css/style.css` |
| Desktop width alignment (input bar, Continue, scroll FAB) | `public/css/style.css` — search `@media (min-width: 768px)` |
| Settings modal rendering (click proxying, nav sidebar) | `server.js` — search `settings` and `dismiss-settings` |
| Quick actions (Continue button) visibility | `public/js/app.js` — search `quickActions` |
| Agent running state + action button toggle | `public/js/app.js` — search `agentRunning` and `updateActionButton` |
| Environment config template (SSoT for config) | `.env.example` |
| Photo upload (POST /upload + CDP drop injection) | `server.js` — search `Upload Image` and `POST /upload` |
| Running tasks capture + click proxy (`task:` prefix) | `server.js` — search `runningTasksHtml` and `'task'` |
| Project dependencies (SSoT for versions) | `package.json` |
| Self-signed SSL certs (auto-generated, gitignored) | `certs/` |
| PWA manifest (home screen icon + app metadata) | `public/manifest.json` |
| Multi-worktree hub (dev-only proxy) | `hub.js` |
| Hub: Antigravity restart + status detection | `hub.js` — search `handleRestartAntigravity` and `antigravityRunning` |
| Main server watchdog + auto-updater (cron scripts) | `scripts/watchdog.sh`, `scripts/updater.sh`, `scripts/hub-watchdog.sh`, `scripts/tunnel-watchdog.sh` |
| Voice input (shared factory for main + new session mic) | `public/js/app.js` — search `createVoiceInput` |
| README screenshots (product showcase) | `docs/` |

---

## ⚠️ Gotchas & Landmines

> Things you would NOT discover by reading the code alone. Keep this section compact.

- **AG2.0 has no stable DOM IDs.** Unlike Windsurf (`#conversation`, `#chat`, `#cascade`), AG2.0 uses Tailwind classes. Chat container is found via `.scrollbar-hide[class*="overflow-y-auto"]` or `[data-testid="conversation-view"]`. Any selector-based approach is fragile.
- **Two execution contexts.** AG2.0 Electron exposes default + isolated contexts that produce slightly different CSS. `server.js` locks to a `preferredContextId` to prevent hash oscillation. If you see alternating snapshots, this lock is failing.
- **`[object Object]` class names during streaming.** AG2.0 wraps streaming words in `<span class="[object Object]">`. The capture script strips these via regex on the HTML string AFTER extraction (not DOM query — bracket chars break CSS selectors).
- **Sticky user prompts.** User's last prompt has `position: sticky` in AG2.0's CSS. The capture script marks these with `data-ag-sticky` and forces `backgroundColor: #101010` on the clone. AG2R does NOT override sticky — AG2.0's own CSS handles it.
- **`div` inside `span`/`p`.** AG2.0 nests block elements inside inline elements for file-type icons. Browsers auto-close the inline parent, causing line breaks. Capture script converts nested `<div>` to `<span style="display: inline-flex">`.
- **CDP overrides are minimal.** We stripped all CSS overrides (colors, spacing, code blocks, etc.) to let AG2.0's own injected CSS handle styling. Only scrollbar hiding and broken image suppression remain in our CSS.
- **Never wipe cached content.** If snapshot capture returns null (no chat container found), the server keeps the last valid snapshot. The client never clears `chatContent.innerHTML` based on a failed selector check.
- **Auth is env-var driven, not IP-based.** `AUTH_ENABLED=false` (default in `.env`) disables auth entirely — no login screen. The `ag2r()` shell function passes `AUTH_ENABLED=true` for production/tunnel use. Feature branch testing never needs auth.
- **Right sidebar is on-demand, not polled.** The right sidebar HTML is NOT included in continuous snapshot polling (too heavy — can be 100KB+). Instead, `CAPTURE_SCRIPT` extracts a lightweight `sidebarSignature` (tab IDs + active tab, ~50 bytes). The full sidebar HTML is fetched via `GET /right-sidebar` when the user opens the panel. The client auto-refreshes when the signature changes while the sidebar is open.
- **Right sidebar selector is fragile.** The AG right panel is found via `data-tab-id` buttons and `close-aux-pane` testid in `RIGHT_SIDEBAR_SCRIPT`. There are no stable container IDs. If AG's layout changes, the sidebar capture may fail silently (returns null). Use `GET /discover` to debug.
- **Left sidebar selector matches window top bar.** The Electron app window's top menu bar (containing Antigravity, File, View, Window) has class `bg-sidebar` and is horizontal. To select the actual vertical navigation sidebar, we must query `div[class*="bg-sidebar"][class*="flex-col"]` to avoid matching the top menu bar.
- **Electron process detection on macOS.** `pgrep -x Antigravity` does NOT work — macOS Electron apps report the full binary path. Use `ps aux | grep "[A]ntigravity.app/Contents/MacOS/Antigravity"` instead. The `[A]` trick excludes the grep process itself.
- **Click proxy indices are ephemeral.** `data-ag-click-id` is assigned per snapshot by iterating visible `button/a/[role=button]` elements in DOM order. If the DOM changes between snapshot capture and click proxy execution (e.g., streaming content), the index can point to the wrong element. The label validation in `POST /click` catches most mismatches.
- **AG artifact/file cards are DIVs, not buttons.** AG renders artifact banners and file-changed cards as `<div class="cursor-pointer" onclick="...">`, not `<button>`. The `maxTextLength` filter for cursor-pointer elements would skip them (text often >80 chars). The filter exempts elements with a direct `onclick` handler — if this breaks, check `tagInteractives` in `server.js`.
- **Focus emulation (fragile).** `Emulation.setFocusEmulationEnabled({enabled: true})` is called on CDP connect to force AG's page to render while in the background. Without this, collapsible sections ("Worked for", "Thought for") expand structurally but React defers rendering their content, producing empty space. This is a CDP-level hack — if Electron or Chrome changes this API's behavior, it could cause side effects (e.g., cursor blinks, focus stealing). If strange behavior appears, disabling this is the first thing to try.
- **Theme CSS variables extracted from DOM, not stylesheets.** AG defines `--foreground`, `--background`, `--sidebar`, etc. on DOM elements (theme provider), not in stylesheets. The capture script enumerates ALL `--*` custom properties via `Array.from(getComputedStyle(...))` and injects them as a `:root{}` rule. If AG changes how/where it sets theme vars, captured content text could become invisible.
- **Sidebar elements hidden for mobile.** The top 2 actions (New Conversation, History), the add-project button, and back/forward nav are hidden via CSS attribute selectors in `style.css` (search "Hidden Sidebar Elements") + DOM removal in `app.js` `renderSidebar()`. Scheduled Tasks is visible — it opens a full-screen overlay. Per-session action buttons (three-dots, pin, archive) are all visible. To re-enable hidden elements, remove/comment those CSS rules and JS cleanup code.
- **Scheduled Tasks page lives in the isolated execution context.** When user clicks "Scheduled Tasks" in sidebar, AG navigates to `/sidecars` — a page with NO chat container. This means `CAPTURE_SCRIPT` returns null. `captureSnapshot()` creates a minimal fallback result so cross-context captures still run. The `SCHEDULED_TASKS_SCRIPT` uses `evaluateAcrossContexts` to find the `[aria-label="Add scheduled task"]` button. Click proxy uses `sched:` prefix, also via `evaluateAcrossContexts`.
- **Permission banner lives OUTSIDE the scroll container.** AG renders the permission/approval radiogroup in a `flex-shrink-0` section below the scrollable chat area. Both capture and click proxy must search `document`-wide, not inside `container`. The `input[checked]` HTML attribute is the initial default, not current state — use `bg-secondary` class to detect the selected option.
- **Android selection coexistence.** Android's native text selection toolbar cannot be disabled independently of text selection itself. The comment FAB uses `selectionchange` (not `touchend`) to detect selections on mobile — `touchend` fires before Android finalizes the selection. The FAB dismiss handler is scoped to `pointerdown` on the right sidebar only (not global `mousedown`/`touchstart`) so Android's native toolbar interactions don't accidentally dismiss it.
- **Quick actions (Continue) visibility — single source of truth.** `quickActions.classList.toggle('hidden', ...)` must ONLY be called from WS message handlers (snapshot/status), never from `updateActionButton()` or `loadSnapshot()`. `loadSnapshot` previously had a `classList.toggle('hidden', hideBottomBar)` that force-showed Continue on every render cycle (since `isNewSessionPage` was usually `false`), causing flickering. The fix: `loadSnapshot` can only `add('hidden')`, never remove it.
- **`agentRunning` is set from WS handlers only.** `loadSnapshot`'s HTTP fetch can return a stale value that races with the WS push. All `agentRunning` assignments and `updateActionButton()` calls must originate from the WS `snapshot`/`status` handlers.
- **`loadSnapshot` HTML dedup.** `loadSnapshot` stores `_lastHtml` and skips `innerHTML` re-renders when the HTML hasn't changed. Without this, every identical snapshot resets scroll position.
- **Desktop width alignment uses AG's inline `max-width`.** The chat container has `style="max-width: max(30vw, 40rem)"` set by AG. The desktop `@media` block in `style.css` applies the same value to `.input-wrapper`, `.quick-actions`, `.running-tasks`, and `.scroll-fab`. If AG changes this value, update the media query to match.
- **Running tasks live inside the input box container.** `#antigravity.agentSidePanelInputBox` has a `.rounded-t-2xl` child (sibling of `.bg-card`) that contains the task list. This element is completely absent from the DOM when no tasks are running — it's not hidden, it doesn't exist. The capture must null-check both the input box and the task section child.
- **Settings dismiss uses backdrop click.** `dismiss-settings` in `server.js` clicks the settings modal's backdrop overlay (`.bg-black\/80`) instead of a Go Back button, ensuring settings close in one action regardless of which tab was visited.
- **Mobile SpeechRecognition produces cumulative results.** Desktop browsers produce one result per utterance (incremental). Mobile Safari/Chrome produce one result per word, and each result's `transcript` contains the FULL text from session start (cumulative). The `createVoiceInput` factory in `app.js` handles this by using ONLY the last result's transcript — never concatenating all results. Creating a new `SpeechRecognition` instance on restart (instead of reusing) causes a system ding on mobile. Calling `recognition.stop()` is async — null out `onresult`/`onend` before stopping to prevent post-stop events from refilling a cleared input.

---

## 🔄 Development Lifecycle

Every workstream follows this exact lifecycle. No exceptions, no shortcuts.

### Phase 1: Branch & Environment Setup (BEFORE any code changes)

**Step 1 — Sync:**
```bash
git fetch origin main && git rebase origin/main
```

**Step 2 — Sanity check:**
- Branch name makes sense for the task → ✅ move on
- **Wrong setup?** → **STOP.** Report to user.

**Step 3 — Install dependencies:**
```bash
npm ci
```

**Step 4 — Copy environment config:**
`.env` is gitignored and does not carry over to new worktrees. Copy it from the main checkout:
```bash
cp /Users/omercan/Workspace/ag2r/.env .env 2>/dev/null || echo "No .env in main — copy .env.example and configure"
```

### Phase 2: Implement
1. Agree on the task with the USER.
2. Implement on the feature branch.
3. Verify the server starts cleanly.
4. USER manually tests. Agent does NOT open browsers.

### Phase 3: Commit & PR (when USER says "commit")
```bash
git add -A && git commit -m "feat: description"
git fetch origin main && git rebase origin/main
git push origin feat/<branch-name>

gh pr create --title "feat: description" --base main --head feat/<branch-name> --body "$(cat <<'PRBODY'
## Summary
<1-2 sentences>

## What Changed
- <mechanical change>
- <behavioral change>

## Manual Test Steps
- [ ] Start server with `node server.js`
- [ ] Connect from phone
- [ ] Verify ...
---
PRBODY
)"

gh pr checks <PR#> --watch
gh pr merge <PR#> --squash --admin
```

### Phase 4: Sync main
```bash
git checkout main && git pull --rebase origin main
```

**Session ends ONLY when:** PR is `MERGED` or user says stop.

### Session Handover Prompt

````markdown
# [Title]

Worktree: /path/to/worktree
Branch: feat/branch-name

## What's Done
Current state — what works.

## What's Next
- Task 1
- Task 2

## Context
Gotchas or decisions the next session should know.
````

---

## 🧪 Testing

> The hub (`hub.js`) runs on port 3100 and is always available via `ag2r.omercanyy.com`. It auto-detects any AG2R server on ports 3000–3099.

### Agent testing workflow

1. `PORT=<port> node server.js` — pick a port in **[3001, 3099]**, run as background task
2. Tell the user the port. The hub detects it within 5 seconds.
3. **Leave the server running.** Never stop it. Never ask the user to start it.

### Port reservations

| Port | Reserved for |
|------|-------------|
| 3000 | Main branch server (started via hub "Start Main" button) |
| 3001–3099 | Agent worktree servers |
| 3100 | Hub |

### How the hub works

- Scans ports 3000–3099 every 5s, identifies worktrees via process CWD
- Landing page at `/` lists active sessions — user clicks one to enter
- Cookie-based routing proxies all subsequent requests to the chosen session
- Cloudflare tunnel → port 3100 → user accesses all sessions remotely
- The app has zero awareness of the hub

---

## 🔄 Auto-Managed Hub & Main Server

> The hub landing page has a **Start Main** button that pulls latest and starts the main server on-demand. A cron job keeps the hub itself alive.

### Hub Watchdog (cron)

```bash
crontab -e

# Add these lines to keep hub and tunnel running:
*/5 * * * * ~/Workspace/ag2r/scripts/hub-watchdog.sh >> /tmp/ag2r-hub-watchdog.log 2>&1
*/5 * * * * ~/Workspace/ag2r/scripts/tunnel-watchdog.sh >> /tmp/ag2r-tunnel-watchdog.log 2>&1
```

The hub watchdog checks if the hub is responding every 5 minutes and restarts it if down. The tunnel watchdog checks if `cloudflared` is running and restarts it if not. Once both are up, use the **Start Main** button from the landing page to start the main server on-demand.

### Optional: Server Watchdog + Auto-Updater (cron)

```bash
# Keep main server always running (optional — Start Main button is usually enough):
*/5 * * * * ~/Workspace/ag2r/scripts/watchdog.sh >> /tmp/ag2r-watchdog.log 2>&1
*/10 * * * * ~/Workspace/ag2r/scripts/updater.sh >> /tmp/ag2r-updater.log 2>&1
```

### Configuration (environment variables)

| Variable | Default | Purpose |
|----------|---------|--------|
| `AG2R_MAIN_DIR` | `~/Workspace/ag2r` | Path to main repo |
| `AG2R_MAIN_PORT` | `3000` | Port for main server |
| `HUB_PORT` | `3100` | Port for the hub |
| `AG2R_LOG` | `/tmp/ag2r-main.log` | Server stdout/stderr log |


## 🚫 Git Safety

### Banned Operations
| Operation | Why banned |
|-----------|-----------|
| `git reset --hard` / `--soft` | Destroys commits |
| `git checkout -f` / `git checkout -- .` | Discards all changes |
| `git clean -fd` | Deletes untracked files |
| `git push --force` / `--force-with-lease` | Rewrites remote history |
| `git rebase -i` | Rewrites commits |
| `git commit --amend` (after push) | Rewrites pushed history |
| `cherry-pick` | Duplicate commits |

### Safe Alternatives
| Need | Do this |
|------|---------|
| Undo a file | `git checkout -- <file>` |
| Add missed changes | New commit on same branch |
| PR stale | `git fetch origin main && git merge origin/main` |
| Before first push | `git rebase origin/main` is fine |
| After pushing | Merge, never rebase |
| User instructs force-push | Fine — user-directed |

---

## 📝 GitHub Issues

```bash
gh issue create --title "Title" --label "bug,ai agent" --body "..."
gh issue close <number> --comment "Fixed in commit abc123."
gh issue list --label "bug" --state open
```

**Always include `ai agent` label.**
