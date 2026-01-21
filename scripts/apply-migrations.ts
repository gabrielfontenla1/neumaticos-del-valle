/**
 * Apply Migrations Helper Script
 * Displays migrations and helps copy them to Supabase SQL Editor
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const migrations = [
  {
    name: 'Add branch columns to stores table',
    file: 'supabase/migrations/20260121_add_branch_columns.sql',
    description: 'Adds province and background_image_url columns'
  },
  {
    name: 'Create branches storage bucket',
    file: 'supabase/migrations/20260121_branches_storage.sql',
    description: 'Creates storage bucket with RLS policies for branch images'
  }
]

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await execAsync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`)
    return true
  } catch {
    return false
  }
}

async function displayMigration(migration: typeof migrations[0], index: number) {
  console.log('\n' + '='.repeat(70))
  console.log(`📝 Migration ${index + 1}: ${migration.name}`)
  console.log('─'.repeat(70))
  console.log(`📄 File: ${migration.file}`)
  console.log(`📋 Description: ${migration.description}`)
  console.log('='.repeat(70))

  const sqlPath = resolve(process.cwd(), migration.file)
  const sql = readFileSync(sqlPath, 'utf-8')

  console.log('\n🔷 SQL CODE:')
  console.log('─'.repeat(70))
  console.log(sql)
  console.log('─'.repeat(70))

  // Try to copy to clipboard
  const copied = await copyToClipboard(sql)
  if (copied) {
    console.log('\n✅ SQL copied to clipboard!')
  } else {
    console.log('\n⚠️  Could not copy to clipboard automatically')
  }

  console.log('\n📋 Next steps:')
  console.log('   1. Go to: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/sql/new')
  console.log('   2. Paste the SQL code above')
  console.log('   3. Click "Run" to execute')
  console.log('')
}

async function main() {
  console.log('🚀 Supabase Migrations Helper')
  console.log('=' .repeat(70))
  console.log('This script will help you apply database migrations to Supabase.')
  console.log('Each migration SQL will be displayed and copied to your clipboard.')
  console.log('=' .repeat(70))

  for (let i = 0; i < migrations.length; i++) {
    await displayMigration(migrations[i], i)

    if (i < migrations.length - 1) {
      console.log('\n' + '⏸️ '.repeat(35))
      console.log('Press Enter after running this migration to continue...')
      console.log('⏸️ '.repeat(35))

      // Wait for user input
      await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve())
      })
    }
  }

  console.log('\n\n' + '='.repeat(70))
  console.log('✅ All migrations displayed!')
  console.log('=' .repeat(70))
  console.log('\n📊 Summary:')
  console.log(`   Total migrations: ${migrations.length}`)
  console.log('   Status: Ready to apply')
  console.log('\n💡 After running all migrations, you can:')
  console.log('   1. Run the data migration: npx tsx scripts/migrate-hardcoded-branches.ts')
  console.log('   2. Test the admin panel: http://localhost:6001/admin/configuracion/sucursales')
  console.log('   3. Test the public page: http://localhost:6001/sucursales')
  console.log('=' .repeat(70))
}

// Enable stdin
process.stdin.setRawMode?.(true)
process.stdin.resume()
process.stdin.setEncoding('utf8')

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
