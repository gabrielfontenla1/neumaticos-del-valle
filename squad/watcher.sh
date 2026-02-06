#!/bin/bash
# ============================================
# WATCHER - Daemon que monitorea y dispara agentes
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOW_FILE="$PROJECT_DIR/WORKFLOW.md"
STATUS_FILE="$PROJECT_DIR/STATUS.md"
LOG_FILE="$PROJECT_DIR/squad/watcher.log"
PID_FILE="$PROJECT_DIR/squad/watcher.pid"

# Guardar PID para poder matar después
echo $$ > "$PID_FILE"

log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 Watcher iniciado (PID: $$)"

# Función para extraer estado de un agente del STATUS.md
get_agent_status() {
    local agent=$1
    grep "| $agent |" "$STATUS_FILE" 2>/dev/null | awk -F'|' '{print $3}' | xargs
}

# Función para buscar siguiente paso pendiente en WORKFLOW.md
get_next_pending_step() {
    grep -n "⏳ Pending" "$WORKFLOW_FILE" 2>/dev/null | head -1 | cut -d: -f1
}

# Función para obtener agente de un paso
get_step_agent() {
    local line=$1
    sed -n "${line}p" "$WORKFLOW_FILE" 2>/dev/null | awk -F'|' '{print $3}' | xargs
}

# Función para obtener tarea de un paso
get_step_task() {
    local line=$1
    sed -n "${line}p" "$WORKFLOW_FILE" 2>/dev/null | awk -F'|' '{print $4}' | xargs
}

# Función para marcar paso como Running
mark_step_running() {
    local line=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "${line}s/⏳ Pending/🔵 Running/" "$WORKFLOW_FILE"
    else
        sed -i "${line}s/⏳ Pending/🔵 Running/" "$WORKFLOW_FILE"
    fi
}

# Función para marcar paso como Done
mark_step_done() {
    local line=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "${line}s/🔵 Running/✅ Done/" "$WORKFLOW_FILE"
    else
        sed -i "${line}s/🔵 Running/✅ Done/" "$WORKFLOW_FILE"
    fi
}

# Función para verificar si el paso anterior está completo
is_previous_step_done() {
    local line=$1
    local prev_line=$((line - 1))

    # Si es el primer paso de datos (después del header), está OK
    if [ $line -le 6 ]; then
        return 0
    fi

    local prev_content=$(sed -n "${prev_line}p" "$WORKFLOW_FILE" 2>/dev/null)

    # Si la línea anterior es header o separador, está OK
    if [[ "$prev_content" == *"---"* ]] || [[ "$prev_content" == *"Step"* ]]; then
        return 0
    fi

    # Verificar si está Done
    if [[ "$prev_content" == *"✅ Done"* ]]; then
        return 0
    fi

    return 1
}

# Loop principal
last_status_hash=""
while true; do
    # Verificar si hay workflow activo
    if [ ! -f "$WORKFLOW_FILE" ]; then
        sleep 3
        continue
    fi

    # Verificar si el workflow tiene contenido real (no solo el template)
    if ! grep -q "⏳ Pending\|🔵 Running" "$WORKFLOW_FILE" 2>/dev/null; then
        sleep 3
        continue
    fi

    # Detectar cambios en STATUS.md
    if [ -f "$STATUS_FILE" ]; then
        current_hash=$(md5 -q "$STATUS_FILE" 2>/dev/null || md5sum "$STATUS_FILE" | cut -d' ' -f1)

        if [ "$current_hash" != "$last_status_hash" ]; then
            last_status_hash=$current_hash

            # Buscar agentes que completaron (✅ Done en STATUS.md)
            while IFS= read -r line; do
                if [[ "$line" == *"✅ Done"* ]]; then
                    # Extraer nombre del agente
                    agent=$(echo "$line" | awk -F'|' '{print $2}' | xargs)

                    if [ -n "$agent" ]; then
                        log "✅ $agent completó su tarea"

                        # Buscar y marcar el paso correspondiente como Done en WORKFLOW
                        running_line=$(grep -n "🔵 Running" "$WORKFLOW_FILE" | grep "$agent" | head -1 | cut -d: -f1)
                        if [ -n "$running_line" ]; then
                            mark_step_done "$running_line"
                            log "   → Marcado Step $running_line como Done"
                        fi
                    fi
                fi
            done < "$STATUS_FILE"
        fi
    fi

    # Buscar siguiente paso pendiente
    next_line=$(get_next_pending_step)

    if [ -n "$next_line" ]; then
        agent=$(get_step_agent "$next_line")
        task=$(get_step_task "$next_line")

        if [ -n "$agent" ] && [ -n "$task" ]; then
            # Verificar que el paso anterior esté completo
            if is_previous_step_done "$next_line"; then
                log "🚀 Disparando $agent: $task"
                mark_step_running "$next_line"

                # Asignar tarea al agente
                "$PROJECT_DIR/squad/assign.sh" "$agent" "$task"

                # Esperar un poco antes de la siguiente iteración
                sleep 2
            fi
        fi
    else
        # Verificar si todo está completo
        if grep -q "✅ Done" "$WORKFLOW_FILE" && ! grep -q "⏳ Pending\|🔵 Running" "$WORKFLOW_FILE"; then
            log "🎉 WORKFLOW COMPLETADO"

            # Notificación macOS
            osascript -e 'display notification "Squad completó todas las tareas" with title "🎉 Squad Finished"' 2>/dev/null

            # Esperar antes de volver a chequear (por si hay nuevo workflow)
            sleep 10
        fi
    fi

    sleep 3
done
