import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvptpwmiajdnfpjvekbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHRwd21pYWpkbmZwanZla2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODMwMjAsImV4cCI6MjA5Mjg1OTAyMH0.udS6fWPUoekrkF5MkTOuf9FWdcm_AyKUyKejT5uYFTI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data: shops, error: shopsErr } = await supabase.from('shops').select('image_url').limit(1);
    const { data: products, error: productsErr } = await supabase.from('products').select('image_url').limit(1);

    if (shopsErr && shopsErr.message.includes('column "image_url" does not exist')) {
        console.log('shops.image_url MISSING');
    } else {
        console.log('shops.image_url EXISTS or other error:', shopsErr?.message);
    }

    if (productsErr && productsErr.message.includes('column "image_url" does not exist')) {
        console.log('products.image_url MISSING');
    } else {
        console.log('products.image_url EXISTS or other error:', productsErr?.message);
    }
}

checkColumns();
