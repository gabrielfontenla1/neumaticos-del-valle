#!/bin/bash
# ============================================
# Asignar tarea a un agente específico
# ============================================
# Uso: ./squad/assign.sh FRONTEND "crear componente X"
#      ./squad/assign.sh BACKEND "crear endpoint Y"
#      ./squad/assign.sh DATA "crear tabla Z"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

AGENT=$1
shift
TASK="$*"

if [ -z "$AGENT" ] || [ -z "$TASK" ]; then
    echo "Uso: ./squad/assign.sh [AGENT] \"tarea\""
    echo ""
    echo "Agentes disponibles:"
    echo "  DATA      - Migraciones, schemas, validaciones"
    echo "  BACKEND   - API endpoints, integraciones"
    echo "  FRONTEND  - Componentes UI, páginas públicas"
    echo "  ADMIN     - Dashboard admin, páginas admin"
    echo "  QA        - Tests, verificaciones"
    echo ""
    echo "Ejemplo:"
    echo "  ./squad/assign.sh FRONTEND \"Crear componente FavoriteButton\""
    echo "  ./squad/assign.sh DATA \"Crear tabla favorites\""
    exit 1
fi

# Normalizar nombre del agente
AGENT_UPPER=$(echo "$AGENT" | tr '[:lower:]' '[:upper:]')

# Mapeo de agente a número de sesión en iTerm (basado en orden de creación)
# Sesiones: 1=ORCHESTRATOR, 2=WATCHER(bash), 3=DATA, 4=BACKEND, 5=FRONTEND, 6=ADMIN, 7=QA
case $AGENT_UPPER in
    DATA)      SESSION_NUM=3; EMOJI="🗄️" ;;
    BACKEND)   SESSION_NUM=4; EMOJI="⚙️" ;;
    FRONTEND)  SESSION_NUM=5; EMOJI="🎨" ;;
    ADMIN)     SESSION_NUM=6; EMOJI="🛠️" ;;
    QA)        SESSION_NUM=7; EMOJI="🧪" ;;
    *)
        echo "❌ Agente inválido: $AGENT"
        echo "   Usá: DATA, BACKEND, FRONTEND, ADMIN, QA"
        exit 1
        ;;
esac

# Enviar tarea al pane correcto via AppleScript
# Usamos "window 1" en lugar de "current window" para asegurar que sea la ventana del SQUAD
osascript << EOF
tell application "iTerm"
    tell window 1
        set allSessions to sessions of current tab
        if (count of allSessions) >= $SESSION_NUM then
            tell item $SESSION_NUM of allSessions
                select
                delay 0.3
            end tell
            tell application "System Events"
                keystroke "$TASK"
                delay 0.1
                key code 36
            end tell
        else
            display dialog "No se encontró la sesión del agente $AGENT_UPPER" buttons {"OK"} default button "OK"
        end if
    end tell
end tell
EOF

# Guardar en historial
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
mkdir -p "$SCRIPT_DIR/tasks"
echo "[$TIMESTAMP] $AGENT_UPPER: $TASK" >> "$SCRIPT_DIR/tasks/history.log"

echo ""
echo "✅ Tarea enviada a $EMOJI $AGENT_UPPER"
echo "📝 $TASK"
echo ""
