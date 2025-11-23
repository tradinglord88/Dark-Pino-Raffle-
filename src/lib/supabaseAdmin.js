import { createClient } from "@supabase/supabase-js";

// Use the CORRECT environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Add validation to catch issues early
if (!supabaseUrl) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL");
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceKey) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY");
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

console.log("✅ Supabase Admin Client Initialized");

export const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: { persistSession: false }
    }
);