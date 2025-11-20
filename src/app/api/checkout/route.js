import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // needed for raw body in webhook

export async function POST(req) {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const body = await req.json();
        const { cart, userId } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: "Cart empty" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const origin = req.headers.get("origin");

        // Format line items properly
        const line_items = cart.map(item => {
            const imageUrl = item.image.startsWith("http")
                ? item.image
                : `${origin}${item.image}`;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                        images: [imageUrl],
                    },
                    unit_amount: item.price * 100,
                },
                quantity: item.qty,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items,
            success_url: `${origin}/success`,
            cancel_url: `${origin}/cart`,
            metadata: {
                clerk_id: userId,
                cart: JSON.stringify(cart),
            },

        });

        return NextResponse.json({ url: session.url });

    } catch (err) {
        console.error("STRIPE CHECKOUT ERROR:", err);
        return NextResponse.json({ error: "Stripe error" }, { status: 500 });
    }
}
