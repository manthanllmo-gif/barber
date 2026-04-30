
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rvptpwmiajdnfpjvekbd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHRwd21pYWpkbmZwanZla2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODMwMjAsImV4cCI6MjA5Mjg1OTAyMH0.udS6fWPUoekrkF5MkTOuf9FWdcm_AyKUyKejT5uYFTI');

async function checkSchema() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('User columns:', data.length > 0 ? Object.keys(data[0]) : 'No data in table');
    }
}

checkSchema();
