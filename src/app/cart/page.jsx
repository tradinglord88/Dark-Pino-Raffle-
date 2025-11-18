"use client";

import { useEffect, useState } from "react";

export default function CartPage() {
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
        const updated = cart.map(item =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
        updateCart(updated);
    };

    const decreaseQty = (id) => {
        const updated = cart.map(item =>
            item.id === id
                ? { ...item, qty: Math.max(1, item.qty - 1) }
                : item
        );
        updateCart(updated);
    };

    const removeItem = (id) => {
        const updated = cart.filter(item => item.id !== id);
        updateCart(updated);
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tickets = Math.floor(total / 100);

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

                        <button className="checkout-btn">
                            Proceed to Checkout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
