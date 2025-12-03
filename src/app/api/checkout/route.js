import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit, getClientId } from "@/lib/rateLimit";
import fs from 'fs';
import path from 'path';

export const runtime = "nodejs";

// Load products from JSON file for server-side price validation
function getServerProducts() {
    try {
        const productsPath = path.join(process.cwd(), 'public', 'products.json');
        const productsData = fs.readFileSync(productsPath, 'utf-8');
        return JSON.parse(productsData);
    } catch (error) {
        console.error("Error loading products:", error);
        return null;
    }
}

// SECURITY: Calculate tickets based on server-side prices
function calculateTickets(price) {
    return Math.floor((Number(price) || 0) / 100);
}

export async function POST(req) {
    try {
        // RATE LIMITING: 5 checkout attempts per minute per client
        const clientId = getClientId(req);
        const rateLimitResult = rateLimit(`checkout:${clientId}`, 5, 60000);

        if (!rateLimitResult.success) {
            console.warn(`⚠️ Rate limit exceeded for checkout: ${clientId}`);
            return NextResponse.json(
                { error: "Too many checkout attempts. Please wait a minute." },
                { status: 429 }
            );
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const body = await req.json();
        const { cart, userId, paymentMethod, userEmail } = body;

        // Validation
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "User authentication required" }, { status: 401 });
        }

        // SECURITY: Load server-side product prices for validation
        const serverProducts = getServerProducts();
        if (!serverProducts) {
            return NextResponse.json({ error: "Unable to validate prices" }, { status: 500 });
        }

        // SECURITY: Create a price lookup map
        const priceMap = {};
        serverProducts.forEach(p => {
            priceMap[p.id] = { price: p.price, name: p.name, specialOffer: p.specialOffer };
        });

        // SECURITY: Validate and recalculate cart with server-side prices
        let serverTotal = 0;
        let serverTickets = 0;
        const validatedCart = [];

        for (const item of cart) {
            const serverProduct = priceMap[item.id];
            if (!serverProduct) {
                return NextResponse.json({
                    error: `Invalid product ID: ${item.id}`
                }, { status: 400 });
            }

            // Use SERVER price, not client price
            const serverPrice = serverProduct.price;
            const quantity = item.paidQuantity || item.qty || 1;

            if (quantity <= 0 || quantity > 100) {
                return NextResponse.json({
                    error: `Invalid quantity for ${serverProduct.name}`
                }, { status: 400 });
            }

            // Calculate with server prices
            const itemTotal = serverPrice * quantity;
            serverTotal += itemTotal;
            serverTickets += calculateTickets(itemTotal);

            validatedCart.push({
                ...item,
                price: serverPrice, // Override with server price
                name: serverProduct.name
            });
        }

        console.log(`🔒 Server-side validation: Total=$${serverTotal}, Tickets=${serverTickets}`);

        if (serverTotal <= 0) {
            return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
        }

        // Use server-calculated values
        const calculatedTotal = serverTotal;
        const calculatedTickets = serverTickets;

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
                cart_items: validatedCart,
                total_amount: calculatedTotal,
                total_tickets: calculatedTickets,
                payment_method: "etransfer",
                status: "pending",
                created_at: new Date().toISOString(),
                metadata: {
                    item_ids: validatedCart.map(item => item.id).join(","),
                    items: validatedCart.map(item => `${item.name}:${item.paidQuantity || item.qty}`).join(";"),
                    special_offers: validatedCart.filter(item => item.specialOffer).map(item => ({
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
            // Handle Stripe payment - use validatedCart with server prices
            const line_items = validatedCart.map(item => {
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

            // IMPROVED METADATA - includes all necessary info for webhook
            const metadata = {
                clerk_id: userId,
                total_tickets: calculatedTickets?.toString() || "0",
                total_amount: calculatedTotal.toString(),
                item_count: validatedCart.length.toString(),
                item_ids: validatedCart.map(item => item.id).join(","),
                items: validatedCart.map(item => `${item.id}:${item.paidQuantity || item.qty}:${item.freeQuantity || 0}:${item.totalTickets || 0}`).join(";"),
                cart_items: JSON.stringify(validatedCart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.paidQuantity || item.qty,
                    tickets: item.totalTickets || 0
                }))),
                payment_method: "stripe"
            };

            // Check metadata size (Stripe limit is 500 chars for key-value pairs)
            const metadataSize = JSON.stringify(metadata).length;
            if (metadataSize > 2000) { // Actually check against ~2000 for safety
                console.warn("Metadata size large:", metadataSize);
                // Remove cart_items if too large
                delete metadata.cart_items;
                metadata.items = validatedCart.map(item => `${item.id}:${item.paidQuantity || item.qty}`).join(";");
            }

            console.log("Creating Stripe checkout session for user:", userId, "Total:", calculatedTotal);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items,
                success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/cart`,
                metadata: metadata,
                customer_email: userEmail || (userId.includes("@") ? userId : undefined),
                expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
            });

            console.log("Stripe session created:", session.id);

            // OPTIONAL: Create a pending purchase record immediately
            try {
                await supabaseAdmin
                    .from("purchases")
                    .insert({
                        clerk_id: userId,
                        amount_total: calculatedTotal,
                        tickets_earned: calculatedTickets,
                        payment_method: "stripe",
                        stripe_session_id: session.id,
                        etransfer_order_id: null,
                        metadata: {
                            session_id: session.id,
                            status: "pending",
                            cart_items: validatedCart
                        },
                        purchased_at: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    });
                console.log("📝 Pending purchase recorded for Stripe session:", session.id);
            } catch (purchaseError) {
                console.log("⚠️ Could not create pending purchase record:", purchaseError.message);
                // Non-critical error
            }

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