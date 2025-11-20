"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function CartPage() {
    const { userId } = useAuth(); // <-- THIS WAS MISSING

    console.log("SUPABASE URL =", process.env.NEXT_PUBLIC_SUPABASE_URL);

    const [cart, setCart] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem("dpino-cart");
        if (saved) setCart(JSON.parse(saved));
    }, []);

    const updateCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem("dpino-cart", JSON.stringify(newCart));
    };

    const increaseQty = (id) => {
        updateCart(cart.map(item =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item
        ));
    };

    const decreaseQty = (id) => {
        updateCart(cart.map(item =>
            item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item
        ));
    };

    const removeItem = (id) => {
        updateCart(cart.filter(item => item.id !== id));
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tickets = Math.floor(total / 100);

    const handleCheckout = async () => {
        if (!userId) {
            alert("You must be signed in to checkout.");
            return;
        }

        const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart, userId }), // now userId is REAL
        });

        const data = await res.json();

        if (data.url) window.location.href = data.url;
        else alert("Checkout failed");
    };

    return (
        <div className="cart-container">
            <h1 className="title">Your Cart</h1>

            {cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    {cart.map((item) => (
                        <div key={item.id} className="cart-item">
                            <img src={item.image} alt={item.name} />

                            <div className="cart-details">
                                <div>
                                    <div className="cart-name">{item.name}</div>
                                    <div className="cart-price">
                                        ${item.price} × {item.qty}
                                    </div>
                                </div>

                                <div className="cart-qty">
                                    <button onClick={() => decreaseQty(item.id)}>-</button>
                                    <span>{item.qty}</span>
                                    <button onClick={() => increaseQty(item.id)}>+</button>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="cart-summary">
                        <h2>Total: ${total}</h2>
                        <h3>Tickets Earned: 🎟 {tickets}</h3>

                        <button className="checkout-btn" onClick={handleCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
