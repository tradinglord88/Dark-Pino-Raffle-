import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const body = await req.json();
        const { cart, userId, calculatedTotal, calculatedTickets, paymentMethod, userEmail } = body;

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

        // Handle different payment methods
        if (paymentMethod === "etransfer") {
            // Handle E-Transfer payment
            if (!userEmail || !userEmail.includes("@")) {
                return NextResponse.json({ error: "Valid email required for E-Transfer" }, { status: 400 });
            }

            // Create pending order in database
            const orderData = {
                clerk_id: userId,
                user_email: userEmail,
                cart_items: cart,
                total_amount: calculatedTotal,
                total_tickets: calculatedTickets,
                payment_method: "etransfer",
                status: "pending",
                created_at: new Date().toISOString(),
                metadata: {
                    item_ids: cart.map(item => item.id).join(","),
                    items: cart.map(item => `${item.name}:${item.paidQuantity || item.qty}`).join(";"),
                    special_offers: cart.filter(item => item.specialOffer).map(item => ({
                        id: item.id,
                        name: item.name,
                        paid: item.paidQuantity,
                        free: item.freeQuantity
                    }))
                }
            };

            // Save to Supabase
            const { data, error } = await supabaseAdmin
                .from("pending_orders")
                .insert(orderData)
                .select()
                .single();

            if (error) {
                console.error("Supabase error:", error);
                return NextResponse.json({ error: "Failed to create E-Transfer order" }, { status: 500 });
            }

            console.log(`✅ E-Transfer order created: ${data.id} for user ${userId}`);

            // You could also send an email notification here
            // await sendEtransferEmail(userEmail, userId, calculatedTotal, data.id);

            return NextResponse.json({
                success: true,
                orderId: data.id,
                message: "E-Transfer request submitted successfully",
                instructions: {
                    amount: calculatedTotal,
                    email: "etransfer@darkpino.xyz",
                    userId: userId,
                    orderId: data.id
                }
            });

        } else {
            // Handle Stripe payment (original code)
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
                        unit_amount: Math.round(item.price * 100),
                    },
                    quantity: quantity,
                };
            });

            const metadata = {
                clerk_id: userId,
                total_tickets: calculatedTickets?.toString() || "0",
                total_amount: calculatedTotal.toString(),
                item_count: cart.length.toString(),
                item_ids: cart.map(item => item.id).join(","),
                items: cart.map(item => `${item.id}:${item.paidQuantity || item.qty}:${item.freeQuantity || 0}`).join(";"),
                payment_method: "stripe"
            };

            const metadataSize = JSON.stringify(metadata).length;
            if (metadataSize > 500) {
                console.warn("Metadata size approaching limit:", metadataSize);
                metadata.item_ids = cart.map(item => item.id).slice(0, 10).join(",");
            }

            console.log("Creating Stripe checkout session for user:", userId);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items,
                success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/cart`,
                metadata: metadata,
                customer_email: userEmail || (userId.includes("@") ? userId : undefined),
                expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
            });

            console.log("Stripe session created:", session.id);

            return NextResponse.json({ url: session.url });
        }

    } catch (err) {
        console.error("CHECKOUT ERROR:", err);

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