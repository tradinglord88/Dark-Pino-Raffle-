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
        // RATE LIMITING: 5 checkout attempts per minute per client
        const clientId = getClientId(req);
        const rateLimitResult = rateLimit(`payment-intent:${clientId}`, 5, 60000);

        if (!rateLimitResult.success) {
            console.warn(`Rate limit exceeded for payment-intent: ${clientId}`);
            return NextResponse.json(
                { error: "Too many payment attempts. Please wait a minute." },
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
            priceMap[p.id] = { price: p.price, name: p.name, specialOffer: p.specialOffer };
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
                price: serverPrice,
                name: serverProduct.name
            });
        }

        console.log(`Server-side validation: Total=$${serverTotal}, Tickets=${serverTickets}`);

        if (serverTotal <= 0) {
            return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
        }

        // Convert to cents for Stripe
        const amountInCents = Math.round(serverTotal * 100);

        // Create metadata for tracking
        const metadata = {
            clerk_id: userId,
            total_tickets: serverTickets.toString(),
            total_amount: serverTotal.toString(),
            item_count: validatedCart.length.toString(),
            item_ids: validatedCart.map(item => item.id).join(","),
            items: validatedCart.map(item => `${item.id}:${item.paidQuantity || item.qty}:${item.freeQuantity || 0}:${item.totalTickets || 0}`).join(";"),
            payment_method: "stripe_elements"
        };

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: metadata,
            receipt_email: userEmail || undefined,
            description: `Dark Pino Prizes - ${validatedCart.length} item(s)`,
        });

        console.log("PaymentIntent created:", paymentIntent.id, "Amount:", amountInCents);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            amount: serverTotal,
            tickets: serverTickets
        });

    } catch (err) {
        console.error("PAYMENT INTENT ERROR:", err);

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
