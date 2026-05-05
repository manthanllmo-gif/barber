import { supabase } from './src/lib/supabase.js';

async function checkSchema() {
    const { data, error } = await supabase.from('service_types').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns:', Object.keys(data[0] || {}));
    }
}

checkSchema();
