import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lazy initialize Stripe to avoid build errors when env vars are missing
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    const stripe = getStripe();
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

        // IDEMPOTENCY CHECK: Prevent duplicate processing
        const { data: existingPurchase } = await supabaseAdmin
            .from("purchases")
            .select("id")
            .eq("stripe_session_id", session.id)
            .eq("metadata->>status", "completed")
            .single();

        if (existingPurchase) {
            console.log(`⚠️ Session ${session.id} already processed, skipping`);
            return new Response("Already processed", { status: 200 });
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
                // FIXED: Return 404 so Stripe will retry the webhook
                // This ensures payments aren't lost if user sync hasn't happened yet
                return new Response("User not found - will retry", { status: 404 });
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

            // ✅ Store purchase history OR update existing pending record
            // First try to update existing pending purchase
            const { data: existingPending } = await supabaseAdmin
                .from("purchases")
                .select("id")
                .eq("stripe_session_id", session.id)
                .eq("metadata->>status", "pending")
                .single();

            let purchaseError;

            if (existingPending) {
                // Update existing pending record
                const { error } = await supabaseAdmin
                    .from("purchases")
                    .update({
                        tickets_earned: ticketsToAdd,
                        metadata: {
                            session_id: session.id,
                            status: "completed",
                            total_tickets: session.metadata?.total_tickets || "0",
                            total_amount: session.metadata?.total_amount || "0",
                            item_count: session.metadata?.item_count || "1",
                            item_ids: session.metadata?.item_ids || "",
                            items: session.metadata?.items || ""
                        },
                        purchased_at: new Date().toISOString()
                    })
                    .eq("id", existingPending.id);
                purchaseError = error;
            } else {
                // Create new purchase record
                const { error } = await supabaseAdmin
                    .from("purchases")
                    .insert({
                        clerk_id: clerkId,
                        amount_total: amountTotal,
                        tickets_earned: ticketsToAdd,
                        payment_method: "stripe",
                        stripe_session_id: session.id,
                        etransfer_order_id: null,
                        metadata: {
                            session_id: session.id,
                            status: "completed",
                            total_tickets: session.metadata?.total_tickets || "0",
                            total_amount: session.metadata?.total_amount || "0",
                            item_count: session.metadata?.item_count || "1",
                            item_ids: session.metadata?.item_ids || "",
                            items: session.metadata?.items || ""
                        },
                        purchased_at: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    });
                purchaseError = error;
            }

            if (purchaseError) {
                console.error("❌ Failed to save purchase history:", purchaseError);
                // FIXED: Return error so Stripe retries - purchase history is important
                return new Response("Failed to save purchase - will retry", { status: 500 });
            }

            console.log(`✅ Updated tickets for ${clerkId}: ${user.tickets} → ${newTickets} (added ${ticketsToAdd})`);

        } catch (dbError) {
            console.error("❌ Database operation failed:", dbError);
            return new Response("Database error", { status: 500 });
        }
    }

    return new Response("OK", { status: 200 });
}