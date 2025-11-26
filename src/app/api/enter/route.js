// app/api/enter/route.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { readFile } from 'fs/promises';
import path from 'path';

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

        // ✅ FIXED: Read prizes.json directly from filesystem instead of HTTP fetch
        let prizes = [];
        try {
            const prizesPath = path.join(process.cwd(), 'public', 'prizes.json');
            const prizesData = await readFile(prizesPath, 'utf8');
            prizes = JSON.parse(prizesData);
            console.log("📊 Loaded prizes.json successfully, total prizes:", prizes.length);
        } catch (fileError) {
            console.error("❌ Failed to read prizes.json:", fileError);
            return Response.json({ success: false, error: "Failed to load prize data" }, { status: 500 });
        }

        const prize = prizes.find(p => p.id === parseInt(prizeId));

        if (!prize) {
            console.log("❌ Prize not found for ID:", prizeId);
            return Response.json({ success: false, error: "Prize not found" }, { status: 404 });
        }

        console.log("✅ Prize found:", { id: prize.id, name: prize.name });

        // ✅ Check if raffle is still active
        const drawTime = new Date(prize.drawTime);
        const now = new Date();
        console.log("⏰ Draw time check:", {
            drawTime: drawTime.toISOString(),
            now: now.toISOString(),
            hasPassed: drawTime <= now
        });

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
            console.error("❌ User not found:", userErr);
            return Response.json({ success: false, error: "User not found" }, { status: 404 });
        }

        console.log("🎟 User ticket balance:", userData.tickets);

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

        console.log("✅ Entry created successfully:", {
            entryId: entry.id,
            newBalance: newCount,
            prizeName: prize.name
        });

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