import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: shops, error: shopsErr } = await supabase.from('shops').select('*').limit(1);
    const { data: products, error: productsErr } = await supabase.from('products').select('*').limit(1);

    console.log('Shops columns:', shops ? Object.keys(shops[0] || {}) : 'No data');
    console.log('Products columns:', products ? Object.keys(products[0] || {}) : 'No data');
}

inspect();
