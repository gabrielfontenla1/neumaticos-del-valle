#!/bin/bash
# ============================================
# Detener el watcher
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/watcher.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        rm "$PID_FILE"
        echo "✅ Watcher detenido (PID: $PID)"
    else
        rm "$PID_FILE"
        echo "⚠️ Watcher no estaba corriendo (PID file limpiado)"
    fi
else
    echo "⚠️ Watcher no está corriendo (no hay PID file)"
fi
