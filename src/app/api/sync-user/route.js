import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST() {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const userId = user.id;
    const email = user.emailAddresses?.[0]?.emailAddress || null;

    console.log("SYNC API userId:", userId);

    // Check if user exists
    const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", userId)
        .single();

    // Insert if missing
    if (!existing) {
        await supabase.from("users").insert({
            clerk_id: userId,
            email,
            tickets: 0,
        });
    }

    return NextResponse.json({ success: true });
}
