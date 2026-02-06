#!/bin/bash
# ============================================
# Resetear el estado del SQUAD
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔄 Reseteando SQUAD..."

# Resetear STATUS.md
cat > "$PROJECT_DIR/STATUS.md" << 'EOF'
# Agent Status

| Agent | Status | Current Task | Last Update |
|-------|--------|--------------|-------------|
| ORCHESTRATOR | 🟢 Ready | - | - |
| DATA | 🟡 Idle | - | - |
| BACKEND | 🟡 Idle | - | - |
| FRONTEND | 🟡 Idle | - | - |
| ADMIN | 🟡 Idle | - | - |
| QA | 🟡 Idle | - | - |

## Status Legend
- 🟢 Ready: Listo para recibir trabajo
- 🟡 Idle: Esperando
- 🔵 Working: Trabajando
- ✅ Done: Completado
- ❌ Error: Falló
EOF

echo "✅ STATUS.md reseteado"

# Limpiar WORKFLOW.md
cat > "$PROJECT_DIR/WORKFLOW.md" << 'EOF'
# Workflow

No hay workflow activo. El ORCHESTRATOR creará uno cuando reciba una tarea.
EOF

echo "✅ WORKFLOW.md limpiado"

# Limpiar log del watcher
> "$PROJECT_DIR/squad/watcher.log"
echo "✅ watcher.log limpiado"

echo ""
echo "🎉 SQUAD reseteado. Listo para nueva feature."
