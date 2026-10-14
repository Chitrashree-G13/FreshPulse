import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabase } from './supabase'

async function testConnection() {
  console.log('--- Testing Supabase Connection ---')

  const tables = ['stores', 'products', 'inventory', 'sales'] as const

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(5)

    if (error) {
      console.error(`[${table}] Error (${error.code}):`, error.message)
    } else {
      console.log(`[${table}] Count: ${count}, Sample items: ${data?.length || 0}`)
      if (data && data.length > 0) {
        console.log(`[${table}] Sample columns:`, Object.keys(data[0]))
        console.log(`[${table}] Sample row:`, JSON.stringify(data[0], null, 2))
      }
    }
  }
}

testConnection()