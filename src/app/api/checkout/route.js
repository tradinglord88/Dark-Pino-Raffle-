import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const body = await req.json();
        const { cart } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: "Cart empty" }, { status: 400 });
        }

        // Convert cart items for Stripe Checkout
        const line_items = cart.map(item => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.name,
                    images: [item.image]
                },
                unit_amount: item.price * 100,
            },
            quantity: item.qty,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items,
            success_url: `${req.headers.get("origin")}/success`,
            cancel_url: `${req.headers.get("origin")}/cart`,
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error("STRIPE CHECKOUT ERROR:", error);
        return NextResponse.json({ error: "Stripe error" }, { status: 500 });
    }
}
