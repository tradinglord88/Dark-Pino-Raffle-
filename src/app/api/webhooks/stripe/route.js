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

        // Use the calculated tickets from your cart system (more accurate)
        const metadataTickets = parseInt(session.metadata.total_tickets) || 0;
        const amountTotal = session.amount_total / 100;

        // Fallback calculation if metadata is missing
        const fallbackTickets = Math.floor(amountTotal / 100);
        const ticketsToAdd = metadataTickets > 0 ? metadataTickets : fallbackTickets;

        console.log("🎟 Tickets calculation:", {
            fromMetadata: metadataTickets,
            fromAmount: fallbackTickets,
            finalTickets: ticketsToAdd,
            amountTotal: amountTotal
        });

        try {
            // Get current user data
            const { data: user, error: userError } = await supabaseAdmin
                .from("users")
                .select("tickets")
                .eq("clerk_id", clerkId)
                .single();

            if (userError || !user) {
                console.error("❌ Supabase user missing:", clerkId, userError);
                return new Response("User not found", { status: 200 });
            }

            const newTickets = user.tickets + ticketsToAdd;

            // Update user tickets
            const { error: updateError } = await supabaseAdmin
                .from("users")
                .update({ tickets: newTickets })
                .eq("clerk_id", clerkId);

            if (updateError) {
                console.error("❌ Failed to update tickets:", updateError);
                return new Response("Database error", { status: 500 });
            }

            // ✅ Store purchase history - MATCHING YOUR TABLE STRUCTURE
            const { error: purchaseError } = await supabaseAdmin
                .from("purchases")
                .insert({
                    clerk_id: clerkId,
                    amount_total: amountTotal,
                    tickets_earned: ticketsToAdd,
                    payment_method: "stripe",
                    stripe_session_id: session.id,
                    etransfer_order_id: null, // This is a Stripe payment
                    metadata: {
                        session_id: session.id,
                        total_tickets: session.metadata?.total_tickets || "0",
                        total_amount: session.metadata?.total_amount || "0",
                        item_count: session.metadata?.item_count || "1",
                        item_ids: session.metadata?.item_ids || "",
                        items: session.metadata?.items || ""
                    },
                    purchased_at: new Date().toISOString(),
                    created_at: new Date().toISOString() // ← ADD THIS!
                });

            if (purchaseError) {
                console.error("❌ Failed to save purchase history:", purchaseError);
                // Don't fail the whole webhook for this
            }

            console.log(`✅ Updated tickets for ${clerkId}: ${user.tickets} → ${newTickets} (added ${ticketsToAdd})`);

        } catch (dbError) {
            console.error("❌ Database operation failed:", dbError);
            return new Response("Database error", { status: 500 });
        }
    }

    return new Response("OK", { status: 200 });
}