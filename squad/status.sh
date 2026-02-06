#!/bin/bash
# ============================================
# Ver estado de la sesión SQUAD
# ============================================

SESSION="neumaticos-squad"

echo ""
echo "📊 Estado de SQUAD"
echo "═══════════════════════════════════════"
echo ""

if tmux has-session -t $SESSION 2>/dev/null; then
  echo "✅ Sesión activa: $SESSION"
  echo ""
  echo "Panes:"
  tmux list-panes -t $SESSION -F "  #{pane_index}: #{pane_title} (#{pane_width}x#{pane_height})"
  echo ""
  echo "Para conectar: tmux attach -t $SESSION"
  echo "Para ver logs: ./squad/history.sh"
else
  echo "❌ Sesión no activa"
  echo ""
  echo "Para iniciar: ./squad/start-squad.sh"
fi

echo ""
