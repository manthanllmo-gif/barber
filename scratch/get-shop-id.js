import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function getShopId() {
  const { data, error } = await supabase.from('shops').select('id').limit(1)
  if (error) console.error(error)
  else console.log(data[0].id)
}

getShopId()
