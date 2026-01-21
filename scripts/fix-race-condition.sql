-- ============================================================================
-- Fix: Race Condition en Sucursal Principal
-- Problema: Se permiten múltiples sucursales marcadas como principales
-- Solución: Trigger que asegura solo una sucursal principal
-- ============================================================================

-- Opción 1: Trigger (RECOMENDADO)
-- Este trigger desmarca automáticamente otras sucursales cuando se marca una como principal

CREATE OR REPLACE FUNCTION enforce_single_main_branch()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando una sucursal como principal
  IF NEW.is_main = true THEN
    -- Desmarcar todas las demás sucursales como principales
    UPDATE stores
    SET is_main = false, updated_at = NOW()
    WHERE is_main = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para INSERT y UPDATE
DROP TRIGGER IF EXISTS ensure_single_main_branch ON stores;

CREATE TRIGGER ensure_single_main_branch
BEFORE INSERT OR UPDATE ON stores
FOR EACH ROW
WHEN (NEW.is_main = true)
EXECUTE FUNCTION enforce_single_main_branch();

-- ============================================================================
-- Opción 2: Constraint Único (ALTERNATIVA)
-- Crea un índice único parcial que solo permite un is_main=true
-- Comentar si se usa Opción 1
-- ============================================================================

-- CREATE UNIQUE INDEX idx_only_one_main_branch
-- ON stores (is_main)
-- WHERE is_main = true;

-- ============================================================================
-- Test del Fix
-- ============================================================================

-- Limpiar estado actual: asegurar que solo hay una sucursal principal
UPDATE stores
SET is_main = false
WHERE id NOT IN (
  SELECT id FROM stores WHERE is_main = true ORDER BY created_at LIMIT 1
);

-- Verificar: debe retornar solo 1 fila
SELECT COUNT(*) as main_branches_count
FROM stores
WHERE is_main = true;

-- Test 1: Intentar marcar otra sucursal como principal
-- El trigger debería desmarcar automáticamente la anterior
-- UPDATE stores SET is_main = true WHERE id = 'algún-id';

-- Verificar nuevamente: debe seguir siendo 1
-- SELECT COUNT(*) FROM stores WHERE is_main = true;

-- ============================================================================
-- Rollback (si es necesario)
-- ============================================================================

-- DROP TRIGGER IF EXISTS ensure_single_main_branch ON stores;
-- DROP FUNCTION IF EXISTS enforce_single_main_branch();
-- DROP INDEX IF EXISTS idx_only_one_main_branch;
