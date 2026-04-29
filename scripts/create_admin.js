import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    line = line.replace('\r', '').trim();
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL is missing or not parsed correctly: " + JSON.stringify(envVars));

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
    console.log("Signing up the user...");
    const email = '8982350257@admin.com';
    const password = 'qazawsxs';

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error("Auth Error:", authError.message);
        return;
    }

    if (authData.user) {
        console.log("Auth User created:", authData.user.id);

        console.log("Inserting into users table with role 'super_admin'...");
        const { error: dbError } = await supabase.from('users').insert([{
            id: authData.user.id,
            email: email,
            role: 'super_admin',
            shop_id: null
        }]);

        if (dbError) {
            console.error("Database Insert Error:", dbError.message);
        } else {
            console.log("Super Admin successfully created and mapped to the users table!");
        }
    } else {
        console.log("No user returned, maybe user already exists?");
    }
}

createSuperAdmin();
