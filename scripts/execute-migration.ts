/**
 * Script para ejecutar migración SQL directamente en PostgreSQL
 * Ejecutar con: npx tsx scripts/execute-migration.ts
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

// Usar la URL de conexión directa (no pooler para DDL)
const databaseUrl = process.env.DATABASE_URL?.replace('?pgbouncer=true', '') || ''

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL no configurada')
  process.exit(1)
}

async function runMigration() {
  console.log('🚀 Conectando a la base de datos...\n')

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Test connection
    const client = await pool.connect()
    console.log('✅ Conexión establecida\n')

    // Primero creamos la tabla appointment_services si no existe
    console.log('📋 Paso 1: Creando tabla appointment_services...\n')

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.appointment_services (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER DEFAULT 30,
        price NUMERIC(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    console.log('   ✅ Tabla appointment_services verificada\n')

    // Insertar servicios si no existen
    console.log('📋 Paso 2: Insertando servicios...\n')

    const services = [
      { name: 'Cambio de aceite', description: 'Cambio de aceite y filtro', duration: 30, price: 15000 },
      { name: 'Rotación de neumáticos', description: 'Rotación de las 4 cubiertas', duration: 30, price: 5000 },
      { name: 'Alineación y balanceo', description: 'Alineación y balanceo computarizado', duration: 45, price: 12000 },
      { name: 'Instalación de neumáticos', description: 'Montaje, balanceo e instalación', duration: 60, price: 8000 },
      { name: 'Revisión general', description: 'Chequeo completo del vehículo', duration: 60, price: 10000 },
      { name: 'Cambio de pastillas de freno', description: 'Reemplazo de pastillas delanteras o traseras', duration: 45, price: 18000 },
      { name: 'Service completo', description: 'Mantenimiento completo del vehículo', duration: 120, price: 35000 },
      { name: 'Diagnóstico por computadora', description: 'Escaneo y diagnóstico electrónico', duration: 30, price: 8000 }
    ]

    for (const service of services) {
      await client.query(`
        INSERT INTO public.appointment_services (name, description, duration, price)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM public.appointment_services WHERE name = $1)
      `, [service.name, service.description, service.duration, service.price])
    }
    console.log('   ✅ Servicios insertados\n')

    // Agregar columnas a appointments
    console.log('📋 Paso 3: Agregando columnas a appointments...\n')

    // Columna source
    try {
      await client.query(`
        ALTER TABLE public.appointments
        ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web'
        CHECK (source IN ('web', 'whatsapp', 'phone', 'admin'));
      `)
      console.log('   ✅ Columna source agregada')
    } catch (e: unknown) {
      const error = e as { message?: string }
      if (error.message?.includes('already exists')) {
        console.log('   ℹ️  Columna source ya existe')
      } else {
        throw e
      }
    }

    // Columna service_id
    try {
      await client.query(`
        ALTER TABLE public.appointments
        ADD COLUMN IF NOT EXISTS service_id TEXT REFERENCES appointment_services(id) ON DELETE SET NULL;
      `)
      console.log('   ✅ Columna service_id agregada')
    } catch (e: unknown) {
      const error = e as { message?: string }
      if (error.message?.includes('already exists')) {
        console.log('   ℹ️  Columna service_id ya existe')
      } else {
        throw e
      }
    }

    // Columna kommo_conversation_id
    try {
      await client.query(`
        ALTER TABLE public.appointments
        ADD COLUMN IF NOT EXISTS kommo_conversation_id UUID REFERENCES kommo_conversations(id) ON DELETE SET NULL;
      `)
      console.log('   ✅ Columna kommo_conversation_id agregada')
    } catch (e: unknown) {
      const error = e as { message?: string }
      if (error.message?.includes('already exists')) {
        console.log('   ℹ️  Columna kommo_conversation_id ya existe')
      } else {
        throw e
      }
    }

    console.log('')

    // Crear índices
    console.log('📋 Paso 4: Creando índices...\n')

    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_source ON public.appointments(source);`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_phone_date ON public.appointments(customer_phone, appointment_date);`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_kommo_conversation ON public.appointments(kommo_conversation_id);`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_slot_availability ON public.appointments(store_id, appointment_date, appointment_time, status);`)
    console.log('   ✅ Índices creados\n')

    // Crear funciones
    console.log('📋 Paso 5: Creando funciones...\n')

    await client.query(`
      CREATE OR REPLACE FUNCTION check_slot_availability(
        p_store_id UUID,
        p_date DATE,
        p_time TIME,
        p_max_per_slot INTEGER DEFAULT 2
      )
      RETURNS BOOLEAN AS $$
      DECLARE
        current_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO current_count
        FROM appointments
        WHERE store_id = p_store_id
          AND appointment_date = p_date
          AND appointment_time = p_time
          AND status NOT IN ('cancelled', 'no_show');

        RETURN current_count < p_max_per_slot;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('   ✅ Función check_slot_availability creada')

    await client.query(`
      CREATE OR REPLACE FUNCTION get_available_slots(
        p_store_id UUID,
        p_date DATE,
        p_slot_duration_minutes INTEGER DEFAULT 30,
        p_max_per_slot INTEGER DEFAULT 2
      )
      RETURNS TABLE(
        slot_time TIME,
        available BOOLEAN,
        current_bookings INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        WITH time_slots AS (
          SELECT generate_series(
            '09:00:00'::TIME,
            '17:30:00'::TIME,
            (p_slot_duration_minutes || ' minutes')::INTERVAL
          )::TIME AS slot_time
        ),
        booking_counts AS (
          SELECT
            a.appointment_time,
            COUNT(*) as booking_count
          FROM appointments a
          WHERE a.store_id = p_store_id
            AND a.appointment_date = p_date
            AND a.status NOT IN ('cancelled', 'no_show')
          GROUP BY a.appointment_time
        )
        SELECT
          ts.slot_time,
          COALESCE(bc.booking_count, 0) < p_max_per_slot AS available,
          COALESCE(bc.booking_count, 0)::INTEGER AS current_bookings
        FROM time_slots ts
        LEFT JOIN booking_counts bc ON ts.slot_time = bc.appointment_time
        ORDER BY ts.slot_time;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('   ✅ Función get_available_slots creada')

    // Crear trigger
    console.log('')
    console.log('📋 Paso 6: Creando trigger de validación...\n')

    await client.query(`
      CREATE OR REPLACE FUNCTION verify_appointment_availability()
      RETURNS TRIGGER AS $$
      DECLARE
        slot_count INTEGER;
        max_per_slot INTEGER := 2;
      BEGIN
        IF NEW.store_id IS NOT NULL AND NEW.appointment_date IS NOT NULL AND NEW.appointment_time IS NOT NULL THEN
          SELECT COUNT(*) INTO slot_count
          FROM appointments
          WHERE store_id = NEW.store_id
            AND appointment_date = NEW.appointment_date
            AND appointment_time = NEW.appointment_time
            AND status NOT IN ('cancelled', 'no_show')
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

          IF slot_count >= max_per_slot THEN
            RAISE EXCEPTION 'El horario seleccionado ya está completo (máximo % turnos por horario)', max_per_slot;
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    await client.query(`DROP TRIGGER IF EXISTS trigger_verify_appointment_availability ON public.appointments;`)
    await client.query(`
      CREATE TRIGGER trigger_verify_appointment_availability
        BEFORE INSERT OR UPDATE ON public.appointments
        FOR EACH ROW
        EXECUTE FUNCTION verify_appointment_availability();
    `)
    console.log('   ✅ Trigger verify_appointment_availability creado\n')

    // Crear vista
    console.log('📋 Paso 7: Creando vista whatsapp_appointments...\n')

    await client.query(`
      CREATE OR REPLACE VIEW whatsapp_appointments AS
      SELECT
        a.id,
        a.customer_name,
        a.customer_phone,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.notes,
        a.created_at,
        s.name AS store_name,
        srv.name AS service_name,
        srv.duration AS service_duration,
        c.contact_name AS whatsapp_contact,
        c.kommo_chat_id
      FROM appointments a
      LEFT JOIN stores s ON a.store_id = s.id
      LEFT JOIN appointment_services srv ON a.service_id = srv.id
      LEFT JOIN kommo_conversations c ON a.kommo_conversation_id = c.id
      WHERE a.source = 'whatsapp'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC;
    `)
    console.log('   ✅ Vista whatsapp_appointments creada\n')

    // Verificación final
    console.log('🔍 Verificación final...\n')

    const { rows: services_check } = await client.query('SELECT COUNT(*) as count FROM appointment_services')
    console.log(`   📋 Servicios en appointment_services: ${services_check[0].count}`)

    const { rows: cols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND column_name IN ('source', 'service_id', 'kommo_conversation_id')
    `)
    console.log(`   📋 Columnas nuevas en appointments: ${cols.map(c => c.column_name).join(', ')}`)

    client.release()
    await pool.end()

    console.log('\n✅ ¡Migración completada exitosamente!\n')

  } catch (err) {
    console.error('❌ Error ejecutando migración:', err)
    await pool.end()
    process.exit(1)
  }
}

runMigration()
