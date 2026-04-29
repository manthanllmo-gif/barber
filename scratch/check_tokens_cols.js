import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvptpwmiajdnfpjvekbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHRwd21pYWpkbmZwanZla2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODMwMjAsImV4cCI6MjA5Mjg1OTAyMH0.udS6fWPUoekrkF5MkTOuf9FWdcm_AyKUyKejT5uYFTI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTokensColumns() {
    console.log('Checking columns for tokens table...');
    const { data, error } = await supabase.from('tokens').select('*').limit(1);
    
    if (error) {
        console.error('Error fetching tokens:', error.message);
        // Try to check specifically for user_id
        const { error: err2 } = await supabase.from('tokens').select('user_id').limit(1);
        if (err2 && err2.message.includes('column "user_id" does not exist')) {
            console.log('COLUMN user_id: MISSING');
        } else {
            console.log('COLUMN user_id: EXISTS OR OTHER ERROR:', err2?.message);
        }
        return;
    }
    
    if (data.length > 0) {
        console.log('Columns found in tokens table:', Object.keys(data[0]));
    } else {
        console.log('No rows in tokens table.');
        const { error: err } = await supabase.from('tokens').select('user_id').limit(1);
        if (err && err.message.includes('column "user_id" does not exist')) {
            console.log('COLUMN user_id: MISSING');
        } else {
            console.log('COLUMN user_id: EXISTS');
        }
    }
}

checkTokensColumns();
