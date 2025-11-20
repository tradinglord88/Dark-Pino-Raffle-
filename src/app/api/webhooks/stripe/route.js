import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";


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

    // 🎯 ONLY process successful checkouts
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const clerkId = session.metadata.clerk_id;
        const amountTotal = session.amount_total / 100; // Convert to USD

        // 🎟️ CALCULATE TICKETS
        const ticketsToAdd = Math.floor(amountTotal / 100);

        console.log("Awarding tickets:", ticketsToAdd);

        // 🟩 UPDATE SUPABASE
        const { data: user } = await supabase
            .from("users")
            .select("tickets")
            .eq("clerk_id", clerkId)
            .single();

        if (!user) {
            console.error("User not found for clerk_id:", clerkId);
            return new Response("User not found", { status: 404 });
        }

        const newTicketCount = user.tickets + ticketsToAdd;

        await supabase
            .from("users")
            .update({ tickets: newTicketCount })
            .eq("clerk_id", clerkId);

        console.log("User updated:", clerkId, "tickets:", newTicketCount);
    }

    return new Response("Success", { status: 200 });
}
