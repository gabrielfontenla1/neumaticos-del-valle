#!/bin/bash
# ============================================
# Simple Multi-Agent System
# 4 terminales genéricas + 1 backend + 1 database
# Layout: 3 filas x 2 columnas
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

osascript << EOF
tell application "iTerm2"
    activate

    -- Crear nueva ventana
    set newWindow to (create window with default profile)

    tell newWindow
        -- ========== FILA 1 ==========

        -- Terminal 1 (Genérica) - Izquierda
        set t1 to current session
        tell t1
            set name to "🔷 T1"
            write text "cd '$PROJECT_DIR' && claude --dangerously-skip-permissions"
        end tell

        -- Terminal 2 (Genérica) - Derecha
        tell t1
            set t2 to (split vertically with default profile)
        end tell
        tell t2
            set name to "🔷 T2"
            write text "cd '$PROJECT_DIR' && claude --dangerously-skip-permissions"
        end tell

        -- ========== FILA 2 ==========

        -- Terminal 3 (Genérica) - Izquierda
        tell t1
            set t3 to (split horizontally with default profile)
        end tell
        tell t3
            set name to "🔷 T3"
            write text "cd '$PROJECT_DIR' && claude --dangerously-skip-permissions"
        end tell

        -- Terminal 4 (Genérica) - Derecha
        tell t2
            set t4 to (split horizontally with default profile)
        end tell
        tell t4
            set name to "🔷 T4"
            write text "cd '$PROJECT_DIR' && claude --dangerously-skip-permissions"
        end tell

        -- ========== FILA 3 ==========

        -- BACKEND - Izquierda
        tell t3
            set tBackend to (split horizontally with default profile)
        end tell
        tell tBackend
            set name to "📡 BACKEND"
            write text "cd '$PROJECT_DIR' && claude --dangerously-skip-permissions"
        end tell

        -- DATABASE - Derecha
        tell t4
            set tDatabase to (split horizontally with default profile)
        end tell
        tell tDatabase
            set name to "🗄️ DATABASE"
            write text "cd '$PROJECT_DIR' && claude --dangerously-skip-permissions"
        end tell

    end tell
end tell
EOF

echo ""
echo "✅ 6 terminales iniciadas con Claude (bypass permissions)"
echo ""
echo "┌─────────────┬─────────────┐"
echo "│ 🔷 T1       │ 🔷 T2       │"
echo "├─────────────┼─────────────┤"
echo "│ 🔷 T3       │ 🔷 T4       │"
echo "├─────────────┼─────────────┤"
echo "│ 📡 BACKEND  │ 🗄️ DATABASE │"
echo "└─────────────┴─────────────┘"
echo ""
echo "Coordinación:"
echo "  • BACKEND_QUEUE.md  → Tareas para backend"
echo "  • DATABASE_QUEUE.md → Tareas para database"
echo ""
