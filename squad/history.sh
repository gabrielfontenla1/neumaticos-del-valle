#!/bin/bash
# ============================================
# Ver historial de tareas asignadas
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HISTORY_FILE="$SCRIPT_DIR/tasks/history.log"

echo ""
echo "📜 Historial de tareas"
echo "═══════════════════════════════════════"
echo ""

if [ -f "$HISTORY_FILE" ] && [ -s "$HISTORY_FILE" ]; then
  cat "$HISTORY_FILE"
else
  echo "No hay tareas registradas aún."
fi

echo ""
