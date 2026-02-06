#!/bin/bash
# ============================================
# Ver estado actual del SQUAD
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "📊 Estado del SQUAD"
echo "═══════════════════════════════════════"
echo ""

# Verificar watcher
PID_FILE="$SCRIPT_DIR/watcher.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🟢 Watcher: Corriendo (PID: $PID)"
    else
        echo "🔴 Watcher: No corriendo (PID file obsoleto)"
    fi
else
    echo "🔴 Watcher: No corriendo"
fi

echo ""

# Mostrar STATUS.md
echo "📋 Estado de Agentes:"
echo "───────────────────────────────────────"
if [ -f "$PROJECT_DIR/STATUS.md" ]; then
    grep "^|" "$PROJECT_DIR/STATUS.md" | head -8
else
    echo "   (STATUS.md no existe)"
fi

echo ""

# Mostrar WORKFLOW.md resumido
echo "🔄 Workflow Actual:"
echo "───────────────────────────────────────"
if [ -f "$PROJECT_DIR/WORKFLOW.md" ]; then
    # Mostrar título del workflow
    head -5 "$PROJECT_DIR/WORKFLOW.md"
    echo ""
    # Mostrar pipeline si existe
    if grep -q "| Step |" "$PROJECT_DIR/WORKFLOW.md"; then
        grep "^|" "$PROJECT_DIR/WORKFLOW.md" | head -10
    fi
else
    echo "   (WORKFLOW.md no existe)"
fi

echo ""

# Últimas líneas del log
echo "📜 Últimas acciones del Watcher:"
echo "───────────────────────────────────────"
if [ -f "$SCRIPT_DIR/watcher.log" ]; then
    tail -5 "$SCRIPT_DIR/watcher.log"
else
    echo "   (No hay log)"
fi

echo ""
