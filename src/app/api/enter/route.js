// app/api/enter/route.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
    try {
        console.log("🎫 ENTER API CALLED - NEW LOGIC");

        // Parse request body
        let body = {};
        try {
            body = await req.json();
        } catch (parseError) {
            return Response.json({
                success: false,
                error: "Invalid JSON in request body"
            }, { status: 400 });
        }

        const { userId, clerkId, prizeId, tickets } = body;
        const userIdentifier = userId || clerkId;

        // Validate input
        if (!userIdentifier) {
            return Response.json({ success: false, error: "Missing userId" }, { status: 400 });
        }
        if (!prizeId) {
            return Response.json({ success: false, error: "Missing prizeId" }, { status: 400 });
        }
        if (!tickets || tickets < 1) {
            return Response.json({ success: false, error: "Invalid ticket amount" }, { status: 400 });
        }

        console.log("📦 Processing entry:", { userIdentifier, prizeId, tickets });

        // ✅ Check prize in prizes.json
        const prizesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/prizes.json`);
        const prizes = await prizesResponse.json();
        const prize = prizes.find(p => p.id === parseInt(prizeId));

        if (!prize) {
            return Response.json({ success: false, error: "Prize not found" }, { status: 404 });
        }

        // ✅ Check if raffle is still active
        const drawTime = new Date(prize.drawTime);
        const now = new Date();
        if (drawTime <= now) {
            return Response.json({ success: false, error: "This raffle has ended" }, { status: 400 });
        }

        // Check user ticket balance
        const { data: userData, error: userErr } = await supabaseAdmin
            .from("users")
            .select("tickets")
            .eq("clerk_id", userIdentifier)
            .single();

        if (userErr || !userData) {
            return Response.json({ success: false, error: "User not found" }, { status: 404 });
        }

        if (userData.tickets < tickets) {
            return Response.json({
                success: false,
                error: "Not enough tickets",
                currentBalance: userData.tickets,
                requested: tickets
            }, { status: 400 });
        }

        const newCount = userData.tickets - tickets;

        // Start transaction-like operations
        // 1. Deduct tickets from user
        const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({ tickets: newCount })
            .eq("clerk_id", userIdentifier);

        if (updateError) {
            console.error("❌ Failed to update tickets:", updateError);
            return Response.json({ success: false, error: "Failed to deduct tickets" }, { status: 500 });
        }

        // 2. Create entry record
        const { data: entry, error: entryError } = await supabaseAdmin
            .from("entries")
            .insert({
                clerk_id: userIdentifier,
                prize_id: prizeId,
                tickets_used: tickets,
            })
            .select()
            .single();

        if (entryError) {
            console.error("❌ Failed to create entry:", entryError);

            // Rollback ticket deduction
            await supabaseAdmin
                .from("users")
                .update({ tickets: userData.tickets })
                .eq("clerk_id", userIdentifier);

            return Response.json({ success: false, error: "Failed to create entry" }, { status: 500 });
        }

        console.log("✅ Entry created successfully");
        return Response.json({
            success: true,
            newBalance: newCount,
            entry: entry,
            prizeName: prize.name
        });

    } catch (error) {
        console.error("💥 Enter raffle error:", error);
        return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}