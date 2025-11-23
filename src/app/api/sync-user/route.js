// app/api/sync-user/route.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
    try {
        console.log("🔄 SYNC-USER API CALLED");

        const { userId, email } = await req.json();

        console.log("📋 Syncing user:", { userId, email });

        if (!userId || !email) {
            console.log("❌ Missing userId or email");
            return Response.json({
                success: false,
                error: "Missing userId or email"
            }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('clerk_id')
            .eq('clerk_id', userId)
            .single();

        // If no user found, that's fine - we'll create one
        if (checkError && checkError.code !== 'PGRST116') {
            console.error("❌ Database check error:", checkError);
            return Response.json({
                success: false,
                error: "Database error checking user: " + checkError.message
            }, { status: 500 });
        }

        if (existingUser) {
            console.log("✅ User already exists");
            return Response.json({
                success: true,
                action: "user_exists"
            });
        }

        // Create new user with ZERO tickets
        const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert([
                {
                    clerk_id: userId,
                    email: email,
                    tickets: 0 // ← CHANGED TO 0 - no free tickets
                }
            ])
            .select()
            .single();

        if (createError) {
            console.error("❌ User creation error:", createError);
            return Response.json({
                success: false,
                error: "Failed to create user: " + createError.message
            }, { status: 500 });
        }

        console.log("✅ User created with 0 tickets");
        return Response.json({
            success: true,
            action: "user_created",
            user: newUser
        });

    } catch (error) {
        console.error("💥 Sync-user error:", error);
        return Response.json({
            success: false,
            error: "Internal server error: " + error.message
        }, { status: 500 });
    }
}