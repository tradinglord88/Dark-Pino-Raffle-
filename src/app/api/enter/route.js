import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
    const body = await req.json();
    const { clerkId, prizeId, tickets } = body;

    if (!clerkId || !prizeId || !tickets) {
        return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Fetch user ticket balance
    const { data: user, error: userErr } = await supabaseAdmin
        .from("users")
        .select("tickets")
        .eq("clerk_id", clerkId)
        .single();

    if (userErr || !user) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (user.tickets < tickets) {
        return Response.json({ error: "Not enough tickets" }, { status: 400 });
    }

    const newCount = user.tickets - tickets;

    // 2. Deduct tickets
    await supabaseAdmin
        .from("users")
        .update({ tickets: newCount })
        .eq("clerk_id", clerkId);

    // 3. Record contest entry
    await supabaseAdmin.from("entries").insert({
        clerk_id: clerkId,
        prize_id: prizeId,
        tickets_used: tickets,
    });

    return Response.json({ success: true, newBalance: newCount });
}
