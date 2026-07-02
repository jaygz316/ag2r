#!/bin/bash
# ag-watchdog.sh — Ensures the Antigravity desktop app is running with CDP enabled.
#
# Logic:
#   1. AG not running              → start with --remote-debugging-port=9000
#   2. AG running w/o debug port   → kill and restart with --remote-debugging-port=9000
#   3. AG running w/ debug port    → do nothing
#
# Cron: */5 * * * * ~/Workspace/ag2r/scripts/ag-watchdog.sh >> /tmp/ag2r-ag-watchdog.log 2>&1

set -euo pipefail

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

OS=$(uname)
if [ "$OS" = "Darwin" ]; then
  AG_BINARY="Antigravity.app/Contents/MacOS/Antigravity"
else
  AG_BINARY="/opt/antigravity/antigravity"
fi

# pgrep doesn't work for Electron on macOS — must use ps aux (see GEMINI.md gotcha)
AG_LINE=$(ps aux | grep "$AG_BINARY" | grep -v grep || true)

if [ -z "$AG_LINE" ]; then
  log "Antigravity not running — starting with CDP on port 9000..."
  if [ "$OS" = "Darwin" ]; then
    open -a Antigravity --args --remote-debugging-port=9000
  else
    /home/jay/.local/opt/antigravity/antigravity --no-sandbox --remote-debugging-port=9000 > /dev/null 2>&1 &
  fi
  log "Launch command sent"
  exit 0
fi

if echo "$AG_LINE" | grep -q -- "--remote-debugging-port"; then
  exit 0
fi

# Running without CDP — kill and restart
AG_PID=$(echo "$AG_LINE" | grep -v -- "--type=" | awk '{print $2}' | head -n 1)
if [ -z "$AG_PID" ]; then
  AG_PID=$(echo "$AG_LINE" | awk '{print $2}' | head -n 1)
fi

log "Antigravity running without CDP (PID $AG_PID) — restarting..."

kill "$AG_PID" 2>/dev/null || true
for i in 1 2 3 4 5 6 7 8 9 10; do
  if ! ps -p "$AG_PID" > /dev/null 2>&1; then break; fi
  sleep 1
done

if [ "$OS" = "Darwin" ]; then
  open -a Antigravity --args --remote-debugging-port=9000
else
  /home/jay/.local/opt/antigravity/antigravity --no-sandbox --remote-debugging-port=9000 > /dev/null 2>&1 &
fi
log "Restarted with CDP on port 9000"
