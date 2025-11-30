"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { calculateSpecialOfferPricing } from "@/utils/specialOffers";

export default function CartPage() {
    const { userId } = useAuth();
    const [cart, setCart] = useState([]);
    const [calculatedCart, setCalculatedCart] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("dpino-cart");
        if (saved) {
            try {
                const cartData = JSON.parse(saved);
                setCart(cartData);

                // Apply special offer pricing
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

            // Recalculate special offers
            const calculated = calculateSpecialOfferPricing(newCart);
            setCalculatedCart(calculated);
            setError(""); // Clear any previous errors
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
        if (!userId) {
            alert("You must be signed in to checkout.");
            return;
        }

        if (!calculatedCart || calculatedCart.cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Use the calculated cart for checkout (with proper pricing)
            const checkoutCart = calculatedCart.cart;

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart: checkoutCart,
                    userId,
                    calculatedTotal: calculatedCart.total,
                    calculatedTickets: calculatedCart.totalTickets
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Checkout failed");
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (err) {
            console.error("Checkout error:", err);
            setError(err.message || "Checkout failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
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

                                    {/* Show special offer details */}
                                    {item.specialOffer && item.freeQuantity > 0 && (
                                        <div className="special-offer-info">
                                            <div className="offer-breakdown">
                                                📦 Special Offer: {item.paidQuantity} paid + {item.freeQuantity} FREE
                                            </div>
                                            <div className="offer-savings">
                                                💰 You save: ${(item.price * item.freeQuantity).toLocaleString()}
                                            </div>
                                        </div>
                                    )}

                                    <div className="cart-price">
                                        ${item.price} × {item.specialOffer ? item.paidQuantity : item.qty} {item.specialOffer ? 'paid items' : 'items'}
                                    </div>

                                    {/* Show tickets for this item */}
                                    <div className="item-tickets">
                                        🎟 Tickets: {item.totalTickets}
                                    </div>
                                </div>

                                <div className="cart-qty">
                                    <button
                                        onClick={() => decreaseQty(item.id)}
                                        disabled={isLoading}
                                    >
                                        -
                                    </button>
                                    <span>{item.originalQuantity}</span>
                                    <button
                                        onClick={() => increaseQty(item.id)}
                                        disabled={isLoading}
                                    >
                                        +
                                    </button>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeItem(item.id)}
                                        disabled={isLoading}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="cart-summary">
                        <h2>Total: ${calculatedCart.total.toLocaleString()}</h2>
                        <h3>Tickets Earned: 🎟 {calculatedCart.totalTickets}</h3>

                        <button
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={isLoading || calculatedCart.cart.length === 0}
                        >
                            {isLoading ? "Processing..." : "Proceed to Checkout"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}