import { createClient } from "@supabase/supabase-js";

// Use the CORRECT environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a lazy-initialized client that doesn't throw during build
let _supabaseAdmin = null;

export const getSupabaseAdmin = () => {
    if (_supabaseAdmin) return _supabaseAdmin;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ Missing Supabase environment variables");
        return null;
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    });

    console.log("✅ Supabase Admin Client Initialized");
    return _supabaseAdmin;
};

// For backward compatibility - will be null if env vars missing
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null;
