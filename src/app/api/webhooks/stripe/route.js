import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    const sig = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("❌ Invalid webhook signature:", err.message);
        return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const clerkId = session?.metadata?.clerk_id;

        if (!clerkId) {
            console.error("❌ Missing clerk_id in metadata");
            return new Response("Missing metadata", { status: 400 });
        }

        const amountTotal = session.amount_total / 100;
        const ticketsToAdd = Math.floor(amountTotal / 100);
        console.log("🎟 Tickets to add:", ticketsToAdd);

        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("tickets")
            .eq("clerk_id", clerkId)
            .single();

        if (!user) {
            console.error("❌ Supabase user missing:", clerkId);
            return new Response("User not found", { status: 200 });
        }

        const newTickets = user.tickets + ticketsToAdd;

        await supabaseAdmin
            .from("users")
            .update({ tickets: newTickets })
            .eq("clerk_id", clerkId);

        console.log(`✅ Updated tickets for ${clerkId}: ${newTickets}`);
    }

    return new Response("OK", { status: 200 });
}
