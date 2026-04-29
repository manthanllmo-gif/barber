import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvptpwmiajdnfpjvekbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHRwd21pYWpkbmZwanZla2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODMwMjAsImV4cCI6MjA5Mjg1OTAyMH0.udS6fWPUoekrkF5MkTOuf9FWdcm_AyKUyKejT5uYFTI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersColumns() {
    console.log('Checking columns for orders table...');
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    
    if (error) {
        console.error('Error fetching orders:', error.message);
        return;
    }
    
    if (data.length > 0) {
        console.log('Columns found in orders table:', Object.keys(data[0]));
    } else {
        console.log('No rows in orders table.');
    }
}

checkOrdersColumns();
