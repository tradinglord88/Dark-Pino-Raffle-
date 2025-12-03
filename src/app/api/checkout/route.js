import Stripe from "stripe";
import { NextResponse } from "next/server";
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

// Calculate tickets based on server-side prices
function calculateTickets(price) {
    return Math.floor((Number(price) || 0) / 100);
}

export async function POST(req) {
    try {
        // Rate limiting: 5 checkout attempts per minute
        const clientId = getClientId(req);
        const rateLimitResult = rateLimit(`checkout:${clientId}`, 5, 60000);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Too many checkout attempts. Please wait a minute." },
                { status: 429 }
            );
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const body = await req.json();
        const { cart, userId, userEmail } = body;

        // Validation
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "User authentication required" }, { status: 401 });
        }

        // Load server-side product prices for validation
        const serverProducts = getServerProducts();
        if (!serverProducts) {
            return NextResponse.json({ error: "Unable to validate prices" }, { status: 500 });
        }

        // Create a price lookup map
        const priceMap = {};
        serverProducts.forEach(p => {
            priceMap[p.id] = { price: p.price, name: p.name };
        });

        // Validate and recalculate cart with server-side prices
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

            const serverPrice = serverProduct.price;
            const quantity = item.paidQuantity || item.qty || 1;

            if (quantity <= 0 || quantity > 100) {
                return NextResponse.json({
                    error: `Invalid quantity for ${serverProduct.name}`
                }, { status: 400 });
            }

            const itemTotal = serverPrice * quantity;
            serverTotal += itemTotal;
            serverTickets += calculateTickets(itemTotal);

            validatedCart.push({
                ...item,
                price: serverPrice,
                name: serverProduct.name
            });
        }

        if (serverTotal <= 0) {
            return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
        }

        const origin = req.headers.get("origin") || "http://localhost:3000";

        // Create Stripe Checkout Session
        const line_items = validatedCart.map(item => {
            const imageUrl = item.image?.startsWith("http")
                ? item.image
                : `${origin}${item.image}`;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                        images: item.image ? [imageUrl] : [],
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.paidQuantity || item.qty || 1,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items,
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cart`,
            metadata: {
                clerk_id: userId,
                total_tickets: serverTickets.toString(),
                total_amount: serverTotal.toString(),
            },
            customer_email: userEmail || undefined,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
        });

        console.log("Stripe checkout session created:", session.id, "Total:", serverTotal, "Tickets:", serverTickets);

        return NextResponse.json({ url: session.url });

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
