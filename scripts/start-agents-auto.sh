#!/bin/bash
# ============================================
# Multi-Agent System - Inicio Automático
# ============================================
# Inicia 6 agentes + watcher automático
#
# Uso:
#   ./scripts/start-agents-auto.sh
#
# El watcher:
#   - Observa STATUS.md
#   - Activa agentes automáticamente
#   - Muestra notificaciones
#   - Reproduce sonidos
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║     🚀 Multi-Agent System - Inicio Automático      ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Paso 1: Iniciar las 6 terminales
echo "📺 Iniciando 6 terminales de agentes..."
"$SCRIPT_DIR/start-agents.sh"

# Paso 2: Esperar a que las terminales estén listas
echo ""
echo "⏳ Esperando a que los agentes estén listos..."
sleep 8

# Paso 3: Iniciar el watcher
echo ""
echo "🤖 Iniciando watcher automático..."
echo ""

# Abrir nueva terminal para el watcher
osascript << EOF
tell application "iTerm2"
    tell current window
        create tab with default profile
        tell current session
            set name to "🤖 WATCHER"
            write text "cd '$PROJECT_DIR' && node scripts/agent-watcher.js"
        end tell
    end tell
end tell
EOF

echo "✅ Sistema iniciado correctamente"
echo ""
echo "┌─────────────────────────────────────────────────────┐"
echo "│                    LAYOUT                           │"
echo "├─────────────┬─────────────┬─────────────────────────┤"
echo "│ 🧠 ORCH     │ 🎨 UI       │ 📱 PAGES                │"
echo "├─────────────┼─────────────┼─────────────────────────┤"
echo "│ 🔧 ADMIN    │ ⚙️ API      │ 🔌 SERVICES             │"
echo "├─────────────┴─────────────┴─────────────────────────┤"
echo "│ 🤖 WATCHER (nueva pestaña)                          │"
echo "└─────────────────────────────────────────────────────┘"
echo ""
echo "📋 Instrucciones:"
echo "   1. Hablá con 🧠 ORCHESTRATOR para pedir una feature"
echo "   2. ORCHESTRATOR hace Discovery y te muestra el plan"
echo "   3. Aprobás → ORCHESTRATOR escribe SPECS.md y STATUS.md"
echo "   4. 🤖 WATCHER activa los agentes automáticamente"
echo "   5. Recibirás notificaciones de progreso"
echo ""
echo "🔔 Feedback:"
echo "   - Notificaciones de macOS cuando agentes se activan"
echo "   - Sonidos cuando completan tareas"
echo "   - Log completo en la pestaña 🤖 WATCHER"
echo ""
