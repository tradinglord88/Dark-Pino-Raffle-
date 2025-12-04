"use client";

import { useEffect, useState } from "react";
import { calculateSpecialOfferPricing } from "@/utils/specialOffers";

export default function CartPage() {
    const [cart, setCart] = useState([]);
    const [calculatedCart, setCalculatedCart] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("dpino-cart");
        if (saved) {
            try {
                const cartData = JSON.parse(saved);
                setCart(cartData);
                const calculated = calculateSpecialOfferPricing(cartData);
                setCalculatedCart(calculated);
            } catch (err) {
                console.error("Error loading cart:", err);
                setError("Failed to load cart data");
            }
        }
    }, []);

    const updateCart = (newCart) => {
        try {
            setCart(newCart);
            localStorage.setItem("dpino-cart", JSON.stringify(newCart));
            const calculated = calculateSpecialOfferPricing(newCart);
            setCalculatedCart(calculated);
            setError("");
        } catch (err) {
            console.error("Error updating cart:", err);
            setError("Failed to update cart");
        }
    };

    const increaseQty = (id) => {
        const newCart = cart.map(item =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
        updateCart(newCart);
    };

    const decreaseQty = (id) => {
        const newCart = cart.map(item =>
            item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item
        );
        updateCart(newCart);
    };

    const removeItem = (id) => {
        const newCart = cart.filter(item => item.id !== id);
        updateCart(newCart);
    };

    const handleCheckout = async () => {
        alert("Checkout is being set up. Please check back soon!");
    };

    if (!calculatedCart) {
        return (
            <div className="cart-container">
                <h1 className="title">Your Cart</h1>
                <p>Loading cart...</p>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1 className="title">Your Cart</h1>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {calculatedCart.cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    {calculatedCart.cart.map((item) => (
                        <div key={item.id} className="cart-item">
                            <img src={item.image} alt={item.name} />

                            <div className="cart-details">
                                <div>
                                    <div className="cart-name">{item.name}</div>

                                    {item.specialOffer && item.freeQuantity > 0 && (
                                        <div className="special-offer-info">
                                            <div className="offer-breakdown">
                                                Special Offer: {item.paidQuantity} paid + {item.freeQuantity} FREE
                                            </div>
                                            <div className="offer-savings">
                                                You save: ${(item.price * item.freeQuantity).toLocaleString()}
                                            </div>
                                        </div>
                                    )}

                                    <div className="cart-price">
                                        ${item.price} x {item.specialOffer ? item.paidQuantity : item.qty}
                                    </div>

                                    <div className="item-tickets">
                                        Tickets: {item.totalTickets}
                                    </div>
                                </div>

                                <div className="cart-qty">
                                    <button onClick={() => decreaseQty(item.id)}>-</button>
                                    <span>{item.originalQuantity}</span>
                                    <button onClick={() => increaseQty(item.id)}>+</button>
                                    <button className="remove-btn" onClick={() => removeItem(item.id)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="cart-summary">
                        <h2>Total: ${calculatedCart.total.toLocaleString()}</h2>
                        <h3>Tickets Earned: {calculatedCart.totalTickets}</h3>

                        <button
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={calculatedCart.cart.length === 0}
                        >
                            Checkout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
