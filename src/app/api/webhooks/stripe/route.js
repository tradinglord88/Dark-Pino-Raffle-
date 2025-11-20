import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs"; // ensures raw body support in Next.js 16

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    const sig = req.headers.get("stripe-signature");
    const body = await req.text();

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("❌ Webhook signature error:", err.message);
        return new Response("Webhook Error", { status: 400 });
    }

    // 🎯 Process successful checkouts only
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const clerkId = session?.metadata?.clerk_id;
        const amountTotal = session.amount_total / 100; // Convert cents → USD

        if (!clerkId) {
            console.error("❌ Missing clerk_id in metadata");
            return new Response("Missing clerk_id", { status: 400 });
        }

        // 🎟️ CALCULATE AWARD TICKETS
        // Example: $100 = 1 ticket
        const ticketsToAdd = Math.floor(amountTotal / 100);

        console.log("Awarding tickets:", ticketsToAdd, "to", clerkId);

        // 🟩 FETCH USER FROM SUPABASE
        const { data: user, error: userErr } = await supabaseAdmin
            .from("users")
            .select("tickets")
            .eq("clerk_id", clerkId)
            .single();

        if (userErr || !user) {
            console.error("❌ User not found in Supabase:", clerkId);
            return new Response("User not found", { status: 404 });
        }

        const newTicketCount = user.tickets + ticketsToAdd;

        // 🟦 UPDATE USER TICKET COUNT
        const { error: updateErr } = await supabaseAdmin
            .from("users")
            .update({ tickets: newTicketCount })
            .eq("clerk_id", clerkId);

        if (updateErr) {
            console.error("❌ Failed to update tickets:", updateErr);
            return new Response("Ticket update failed", { status: 500 });
        }

        console.log("✅ User updated successfully:", clerkId, "new tickets:", newTicketCount);
    }

    return new Response("Success", { status: 200 });
}
