
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvptpwmiajdnfpjvekbd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHRwd21pYWpkbmZwanZla2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODMwMjAsImV4cCI6MjA5Mjg1OTAyMH0.udS6fWPUoekrkF5MkTOuf9FWdcm_AyKUyKejT5uYFTI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error fetching tokens:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('Columns in tokens table:', Object.keys(data[0]));
    } else {
        console.log('Tokens table is empty, cannot determine columns this way.');
        // Try to fetch from information_schema if possible, but anon key might not have permission.
        // Let's just try to insert a dummy row with status 'skipped' and 'skipped_at' to see if it works.
        console.log('Testing column existence by trial update...');
        const { error: updateError } = await supabase
            .from('tokens')
            .update({ skipped_at: new Date() })
            .eq('id', 'non-existent-id');
        
        if (updateError && updateError.message.includes('skipped_at')) {
            console.log('COLUMN_MISSING: skipped_at does not exist.');
        } else {
            console.log('COLUMN_EXISTS: skipped_at exists or update failed for other reason.');
            console.log('Error was:', updateError);
        }
    }
}

checkColumns();
