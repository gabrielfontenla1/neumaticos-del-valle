# Supabase Migrations - Documentación

## Estado Actual

**Última actualización**: 2026-02-06
**Total migraciones**: 35
**Tablas en producción**: 27
**Estado**: ✅ Todas las migraciones aplicadas

---

## Migraciones Recientes (2026-02-06)

| Migración | Estado | Datos |
|-----------|--------|-------|
| `20260206_create_embeddings_fixed.sql` | ✅ | product_embeddings, faq_items, match_embeddings() |
| `20240115_seed_faq_data.sql` | ✅ | 19 FAQs en 7 categorías |
| `20250128_create_vehicle_tables.sql` | ✅ | 7 marcas, 42 modelos |
| `20250128_create_quotation_services.sql` | ✅ | 3 servicios |
| `20260206_fix_review_images_rls.sql` | ✅ | RLS habilitado |

## Extensiones
- ✅ **pgvector v0.8.0** - Búsqueda semántica

---

## Estructura de Migraciones

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_rls_policies.sql
├── 002_add_role_to_profiles.sql
├── 003_functions.sql
├── 004_storage_buckets.sql
├── 005_make_contact_optional.sql
├── 006_fix_service_column.sql
├── 007_add_missing_appointment_columns.sql
├── 010_fix_rls_recursion_final.sql
├── 011_stock_import_schema.sql
├── 012_add_sku_column.sql
├── 013_create_service_vouchers.sql
├── 20240115_seed_faq_data.sql
├── 20241211_add_price_list.sql
├── 20250101_twilio_whatsapp_support.sql
├── 20250121_fix_appointment_services_schema.sql
├── 20250128_create_appointment_services.sql
├── 20250128_create_quotation_services.sql
├── 20250128_create_vehicle_tables.sql
├── 20251229_create_kommo_tables.sql
├── 20251230_whatsapp_appointment_integration.sql
├── 20260102_create_app_settings.sql
├── 20260107_create_whatsapp_tables.sql
├── 20260107_stock_location_flow.sql
├── 20260108_extend_whatsapp_tables.sql
├── 20260108_whatsapp_appointment_flow.sql
├── 20260121_add_branch_columns.sql
├── 20260121_ai_config_settings.sql
├── 20260121_branches_storage.sql
├── 20260121_migrate_to_enums.sql
├── 20260205_consolidate_pending_fixes.sql
├── 20260206_admin_notifications.sql
├── 20260206_create_embeddings_fixed.sql
├── 20260206_fix_review_images_rls.sql
└── 20260206_prerequisites_admin_notifications.sql
```

---

## Tablas en Producción (27)

| Tabla | Registros |
|-------|-----------|
| products | 741 |
| branch_stock | 4,446 |
| whatsapp_messages | 1,060 |
| whatsapp_conversations | 104 |
| vehicle_models | 42 |
| appointments | 39 |
| faq_items | 19 |
| kommo_messages | 20 |
| profiles | 11 |
| branches | 8 |
| vehicle_brands | 7 |
| kommo_conversations | 7 |
| appointment_services | 6 |
| app_settings | 5 |
| stores | 5 |
| quotation_services | 3 |
| admin_notifications | 0 |
| product_embeddings | 0 |
| quotes | 0 |
| reviews | 0 |
| review_images | 0 |
| orders | 0 |
| order_history | 0 |
| service_vouchers | 0 |
| vouchers | 0 |
| config_audit_log | 0 |
| config_backups | 0 |

---

## Funciones RPC

| Función | Uso |
|---------|-----|
| `get_admin_dashboard_counts()` | Contadores para admin dashboard |
| `match_embeddings(query, threshold, count)` | Búsqueda semántica AI |
| `get_branch_stock(product_id, branch_id)` | Stock por sucursal |
| `find_branches_with_stock(product_id)` | Buscar sucursales con stock |
| `is_admin()` | Verificar si usuario es admin |

---

## Notas

1. **Types**: Regenerar después de cambios de schema:
   ```bash
   # Editar manualmente src/types/database.ts
   # o usar script si Supabase CLI está linkado
   ```

2. **pgvector**: Habilitada en producción para búsqueda semántica.

3. **RLS**: Todas las tablas tienen Row Level Security habilitado.
