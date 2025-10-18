'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SetupPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClientComponentClient()

  const createStoresTable = async () => {
    setLoading(true)
    setMessage('Creating stores table...')

    try {
      // First, let's check if we can create the table via RPC
      const sqlScript = `
        -- Create stores table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.stores (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          phone VARCHAR(50),
          whatsapp VARCHAR(50),
          email VARCHAR(255),
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          opening_hours JSONB DEFAULT '{}',
          is_main BOOLEAN DEFAULT false,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert sample stores if table is empty
        INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
        SELECT * FROM (VALUES
          (
            'Sucursal Central',
            'Av. San Martín 1234',
            'Buenos Aires',
            '011-4444-5555',
            '5491144445555',
            'central@neumaticosdelv alle.com',
            '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
            true,
            true
          ),
          (
            'Sucursal Norte',
            'Av. Maipú 567',
            'Vicente López',
            '011-4444-6666',
            '5491144446666',
            'norte@neumaticosdelv alle.com',
            '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
            false,
            true
          ),
          (
            'Sucursal Sur',
            'Av. Mitre 890',
            'Avellaneda',
            '011-4444-7777',
            '5491144447777',
            'sur@neumaticosdelv alle.com',
            '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
            false,
            true
          )
        ) AS v(name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
        WHERE NOT EXISTS (SELECT 1 FROM public.stores LIMIT 1);
      `;

      setMessage(`
        ⚠️ Manual Setup Required!

        The stores table needs to be created manually in Supabase.

        Please follow these steps:

        1. Go to your Supabase Dashboard:
           https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor

        2. Click on "SQL Editor" in the left sidebar

        3. Copy the SQL script from:
           supabase/migrations/create_stores_table.sql

        4. Paste it in the SQL Editor and click "Run"

        5. After creating the tables, come back here and click "Test Connection"

        This is required because Supabase doesn't allow creating tables via the client API.
      `)

    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setMessage('Testing connection to stores table...')

    try {
      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .limit(1)

      if (error) {
        throw error
      }

      if (stores && stores.length > 0) {
        setMessage(`✅ Success! Found ${stores.length} store(s) in the database. The appointments system is ready to use!`)
        setSuccess(true)
      } else {
        setMessage('⚠️ The stores table exists but is empty. Click "Populate Sample Data" to add sample stores.')
        setSuccess(false)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease create the stores table first using the SQL script.`)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const populateSampleData = async () => {
    setLoading(true)
    setMessage('Adding sample stores...')

    try {
      const sampleStores = [
        {
          name: 'Sucursal Central',
          address: 'Av. San Martín 1234',
          city: 'Buenos Aires',
          phone: '011-4444-5555',
          whatsapp: '5491144445555',
          email: 'central@neumaticosdelv alle.com',
          opening_hours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '13:00' },
            sunday: { closed: true }
          },
          is_main: true,
          active: true
        },
        {
          name: 'Sucursal Norte',
          address: 'Av. Maipú 567',
          city: 'Vicente López',
          phone: '011-4444-6666',
          whatsapp: '5491144446666',
          email: 'norte@neumaticosdelv alle.com',
          opening_hours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '13:00' },
            sunday: { closed: true }
          },
          is_main: false,
          active: true
        },
        {
          name: 'Sucursal Sur',
          address: 'Av. Mitre 890',
          city: 'Avellaneda',
          phone: '011-4444-7777',
          whatsapp: '5491144447777',
          email: 'sur@neumaticosdelv alle.com',
          opening_hours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '13:00' },
            sunday: { closed: true }
          },
          is_main: false,
          active: true
        }
      ]

      const { data, error } = await supabase
        .from('stores')
        .insert(sampleStores)
        .select()

      if (error) {
        throw error
      }

      setMessage(`✅ Success! Added ${data.length} sample stores. The appointments system is ready to use!`)
      setSuccess(true)
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Setup</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>

          <div className="space-y-4">
            <button
              onClick={createStoresTable}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              1. Show Setup Instructions
            </button>

            <button
              onClick={testConnection}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
            >
              2. Test Connection
            </button>

            <button
              onClick={populateSampleData}
              disabled={loading || success}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 ml-4"
            >
              3. Populate Sample Data
            </button>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-lg ${success ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              <pre className="whitespace-pre-wrap font-mono text-sm">{message}</pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Quick Links:</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  → Supabase SQL Editor
                </a>
              </li>
              <li>
                <a
                  href="/turnos"
                  className="text-blue-600 hover:underline"
                >
                  → Test Appointments Page
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}