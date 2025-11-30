import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const body = await req.json();
        const { cart, userId, calculatedTotal, calculatedTickets } = body;

        // Validation
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "User authentication required" }, { status: 401 });
        }

        if (!calculatedTotal || calculatedTotal <= 0) {
            return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
        }

        const origin = req.headers.get("origin") || "http://localhost:3000";

        // Format line items properly
        const line_items = cart.map(item => {
            const imageUrl = item.image.startsWith("http")
                ? item.image
                : `${origin}${item.image}`;

            // Validate required fields
            if (!item.name || !item.price) {
                throw new Error(`Invalid item: missing name or price for item ${item.id}`);
            }

            if (item.price <= 0) {
                throw new Error(`Invalid price for item: ${item.name}`);
            }

            const quantity = item.paidQuantity || item.qty || 1;

            if (quantity <= 0) {
                throw new Error(`Invalid quantity for item: ${item.name}`);
            }

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                        images: [imageUrl],
                        metadata: {
                            product_id: item.id.toString(),
                            tickets: (item.totalTickets || 0).toString()
                        }
                    },
                    unit_amount: Math.round(item.price * 100), // Ensure integer
                },
                quantity: quantity,
            };
        });

        // Create optimized metadata
        // In your checkout API, make sure metadata includes:
        const metadata = {
            clerk_id: userId,
            total_tickets: calculatedTickets?.toString() || "0",
            total_amount: calculatedTotal.toString(),
            item_count: cart.length.toString(),
            item_ids: cart.map(item => item.id).join(","),
            // Add item details for verification
            items: cart.map(item => `${item.id}:${item.paidQuantity || item.qty}`).join(";")
        };

        // Verify metadata size
        const metadataSize = JSON.stringify(metadata).length;
        if (metadataSize > 500) {
            console.warn("Metadata size approaching limit:", metadataSize);
            // Further optimize if needed
            metadata.item_ids = cart.map(item => item.id).slice(0, 10).join(","); // Limit items
        }

        console.log("Creating Stripe checkout session for user:", userId);
        console.log("Cart items:", cart.length, "Total:", calculatedTotal);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items,
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cart`,
            metadata: metadata,
            customer_email: userId.includes("@") ? userId : undefined, // Add email if available
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
        });

        console.log("Stripe session created:", session.id);

        return NextResponse.json({ url: session.url });

    } catch (err) {
        console.error("STRIPE CHECKOUT ERROR:", err);

        // More specific error responses
        if (err.type === 'StripeInvalidRequestError') {
            return NextResponse.json(
                { error: "Invalid request to payment processor" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}