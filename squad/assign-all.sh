#!/bin/bash
# ============================================
# Asignar tareas a múltiples agentes
# ============================================
# Editá este archivo con las tareas que querés asignar
# y ejecutá: ./squad/assign-all.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Asignando tareas a múltiples agentes..."
echo ""

# ============================================
# EDITÁ ESTAS LÍNEAS CON TUS TAREAS
# ============================================

# Ejemplo: Feature de carrito
# "$SCRIPT_DIR/assign.sh" FRONTEND "Crear componente CartItem en src/features/cart/components/ con props: product, quantity, onRemove"
# "$SCRIPT_DIR/assign.sh" BACKEND "Crear endpoint DELETE /api/cart/:userId/:productId para eliminar items del carrito"
# "$SCRIPT_DIR/assign.sh" QA "Escribir tests para CartItem y el endpoint DELETE /api/cart"

# Ejemplo: Feature de productos
# "$SCRIPT_DIR/assign.sh" FRONTEND "Crear componente ProductFilters con filtros por marca, medida y precio"
# "$SCRIPT_DIR/assign.sh" BACKEND "Agregar query params a GET /api/products para filtrar por marca, medida, precio_min, precio_max"

# ============================================
# Descomentá las líneas de arriba o agregá las tuyas
# ============================================

echo ""
echo "💡 Tip: Editá este archivo con las tareas que necesités"
echo "   Luego ejecutá: ./squad/assign-all.sh"
echo ""
