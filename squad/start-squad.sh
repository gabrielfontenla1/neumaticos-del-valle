#!/bin/bash
# ============================================
# SQUAD - Sistema Multi-Agente 100% Autónomo
# ============================================
# Layout (2 filas):
# ┌─────────────────────────────────────┬────────────────┐
# │  🎯 ORCHESTRATOR (75%)              │ 👁️ WATCHER (25%)│
# ├─────────┬─────────┬────────┬────────┼────────────────┤
# │ 🗄️ DATA │⚙️BACKEND│🎨FRONT │🛠️ADMIN │    🧪 QA       │
# └─────────┴─────────┴────────┴────────┴────────────────┘

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Iniciando SQUAD Multi-Agent System (100% Autónomo)..."
echo "   Proyecto: $PROJECT_DIR"
echo ""

# Detener watcher anterior si existe
"$SCRIPT_DIR/stop.sh" 2>/dev/null
pkill -f "watcher.sh" 2>/dev/null

echo "🖥️ Abriendo iTerm con 6 agentes + watcher..."
echo ""

# Layout: 2 filas - arriba ORCHESTRATOR(75%)+WATCHER(25%), abajo 5 agentes
osascript << EOF
tell application "iTerm"
    activate
    create window with default profile

    tell current window
        -- Empezar con ORCHESTRATOR
        tell current session
            set name to "🎯 ORCHESTRATOR"
            write text "cd '$PROJECT_DIR' && clear && claude --dangerously-skip-permissions"

            -- Primero split horizontal para crear fila de abajo (30% abajo)
            set bottomRow to (split horizontally with default profile)
        end tell

        -- Ahora split vertical en ORCHESTRATOR para crear WATCHER (25% derecha)
        tell current session
            set watcherPane to (split vertically with default profile)
        end tell

        -- WATCHER (arriba derecha)
        tell watcherPane
            set name to "👁️ WATCHER"
            write text "cd '$PROJECT_DIR' && clear && echo '👁️ WATCHER - Monitoreando WORKFLOW.md y STATUS.md' && echo '' && ./squad/watcher.sh"
        end tell

        -- Fila de abajo: empezar con DATA
        tell bottomRow
            set name to "🗄️ DATA"
            write text "cd '$PROJECT_DIR' && clear && claude --dangerously-skip-permissions"

            set backendPane to (split vertically with default profile)
        end tell

        -- BACKEND
        tell backendPane
            set name to "⚙️ BACKEND"
            write text "cd '$PROJECT_DIR' && clear && claude --dangerously-skip-permissions"

            set frontendPane to (split vertically with default profile)
        end tell

        -- FRONTEND
        tell frontendPane
            set name to "🎨 FRONTEND"
            write text "cd '$PROJECT_DIR' && clear && claude --dangerously-skip-permissions"

            set adminPane to (split vertically with default profile)
        end tell

        -- ADMIN
        tell adminPane
            set name to "🛠️ ADMIN"
            write text "cd '$PROJECT_DIR' && clear && claude --dangerously-skip-permissions"

            set qaPane to (split vertically with default profile)
        end tell

        -- QA
        tell qaPane
            set name to "🧪 QA"
            write text "cd '$PROJECT_DIR' && clear && claude --dangerously-skip-permissions"
        end tell
    end tell
end tell
EOF

echo "⏳ Esperando que carguen los Claude (15 segundos)..."
sleep 15

echo "📝 Enviando roles a cada agente..."

# Enviar roles a cada agente
# Orden de sesiones: 1=ORCHESTRATOR, 2=WATCHER, 3=DATA, 4=BACKEND, 5=FRONTEND, 6=ADMIN, 7=QA
osascript << 'ROLES_EOF'
tell application "iTerm"
    tell current window
        set allSessions to sessions of current tab

        -- Session 1: ORCHESTRATOR
        tell item 1 of allSessions
            select
            delay 0.3
        end tell
        tell application "System Events"
            keystroke "Lee squad/prompts/orchestrator.md AHORA. Sos ORCHESTRATOR con RESTRICCIONES: NO escribís código, NO tocás src/, SOLO escribís SPECS.md y WORKFLOW.md. Cuando te pidan algo, proponé el plan y ESPERÁ aprobación antes de escribir. Decí ENTENDIDO si leíste el archivo."
            delay 0.1
            key code 36
        end tell
        delay 0.5

        -- Session 3: DATA (session 2 es watcher)
        tell item 3 of allSessions
            select
            delay 0.3
        end tell
        tell application "System Events"
            keystroke "Lee squad/prompts/data.md. Sos DATA. ESPERÁ que te asignen tarea (viene automático). Cuando trabajes: 1) STATUS.md a Working 2) Hacé la tarea 3) Documentá en SCHEMAS.md 4) STATUS.md a Done. Decí LISTO."
            delay 0.1
            key code 36
        end tell
        delay 0.5

        -- Session 4: BACKEND
        tell item 4 of allSessions
            select
            delay 0.3
        end tell
        tell application "System Events"
            keystroke "Lee squad/prompts/backend.md. Sos BACKEND. ESPERÁ que te asignen tarea (viene automático). Cuando trabajes: 1) STATUS.md a Working 2) Hacé la tarea 3) Documentá en INTERFACES.md 4) STATUS.md a Done. Decí LISTO."
            delay 0.1
            key code 36
        end tell
        delay 0.5

        -- Session 5: FRONTEND
        tell item 5 of allSessions
            select
            delay 0.3
        end tell
        tell application "System Events"
            keystroke "Lee squad/prompts/frontend.md. Sos FRONTEND. ESPERÁ que te asignen tarea (viene automático). Cuando trabajes: 1) STATUS.md a Working 2) Hacé la tarea 3) STATUS.md a Done. Decí LISTO."
            delay 0.1
            key code 36
        end tell
        delay 0.5

        -- Session 6: ADMIN
        tell item 6 of allSessions
            select
            delay 0.3
        end tell
        tell application "System Events"
            keystroke "Lee squad/prompts/admin.md. Sos ADMIN. ESPERÁ que te asignen tarea (viene automático). Cuando trabajes: 1) STATUS.md a Working 2) Hacé la tarea 3) STATUS.md a Done. Decí LISTO."
            delay 0.1
            key code 36
        end tell
        delay 0.5

        -- Session 7: QA
        tell item 7 of allSessions
            select
            delay 0.3
        end tell
        tell application "System Events"
            keystroke "Lee squad/prompts/qa.md. Sos QA (último paso). ESPERÁ que te asignen tarea. Cuando trabajes: 1) STATUS.md a Working 2) npm run type-check && build 3) STATUS.md a Done. Decí LISTO."
            delay 0.1
            key code 36
        end tell

        -- Volver a ORCHESTRATOR
        delay 0.5
        tell item 1 of allSessions
            select
        end tell
    end tell
end tell
ROLES_EOF

echo ""
echo "✅ SQUAD iniciado con 6 agentes + watcher"
echo ""
echo "Layout (2 filas):"
echo "┌─────────────────────────────────────┬────────────────┐"
echo "│  🎯 ORCHESTRATOR (75%)              │ 👁️ WATCHER     │"
echo "├─────────┬─────────┬────────┬────────┼────────────────┤"
echo "│ 🗄️ DATA │⚙️BACKEND│🎨FRONT │🛠️ADMIN │    🧪 QA       │"
echo "└─────────┴─────────┴────────┴────────┴────────────────┘"
echo ""
echo "✅ Roles enviados automáticamente"
echo ""
