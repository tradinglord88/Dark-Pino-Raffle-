"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { calculateSpecialOfferPricing } from "@/utils/specialOffers";
import StripeProvider from "@/components/StripeProvider";
import CheckoutForm from "@/components/CheckoutForm";

export default function CartPage() {
    const { userId } = useAuth();
    const [cart, setCart] = useState([]);
    const [calculatedCart, setCalculatedCart] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("stripe"); // "stripe" or "etransfer"
    const [userEmail, setUserEmail] = useState("");

    // Stripe Elements state
    const [clientSecret, setClientSecret] = useState("");
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentTickets, setPaymentTickets] = useState(0);

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

        // Get user email from localStorage or Clerk if available
        const storedEmail = localStorage.getItem("dpino-user-email");
        if (storedEmail) {
            setUserEmail(storedEmail);
        }
    }, []);

    const updateCart = (newCart) => {
        try {
            setCart(newCart);
            localStorage.setItem("dpino-cart", JSON.stringify(newCart));

            // Recalculate special offers
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

    const handleStripeCheckout = async () => {
        if (!userId) {
            alert("You must be signed in to checkout.");
            return;
        }

        if (!calculatedCart || calculatedCart.cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        setCheckoutLoading(true);
        setError("");

        try {
            const checkoutCart = calculatedCart.cart;

            // Create PaymentIntent for Stripe Elements
            const res = await fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart: checkoutCart,
                    userId,
                    userEmail: userEmail || undefined
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to initialize payment");
            }

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setPaymentAmount(data.amount);
                setPaymentTickets(data.tickets);
                setShowPaymentForm(true);
            } else {
                throw new Error("Payment initialization failed");
            }
        } catch (err) {
            console.error("Checkout error:", err);
            setError(err.message || "Failed to start checkout. Please try again.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleCancelPayment = () => {
        setShowPaymentForm(false);
        setClientSecret("");
        setPaymentAmount(0);
        setPaymentTickets(0);
    };

    const handleEtransferSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            alert("You must be signed in to checkout.");
            return;
        }

        if (!calculatedCart || calculatedCart.cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        if (!userEmail || !userEmail.includes("@")) {
            alert("Please enter a valid email address for E-Transfer.");
            return;
        }

        setCheckoutLoading(true);
        setError("");

        try {
            // Save email for future use
            localStorage.setItem("dpino-user-email", userEmail);

            const checkoutCart = calculatedCart.cart;

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart: checkoutCart,
                    userId,
                    calculatedTotal: calculatedCart.total,
                    calculatedTickets: calculatedCart.totalTickets,
                    paymentMethod: "etransfer",
                    userEmail: userEmail
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "E-Transfer request failed");
            }

            if (data.success) {
                // Clear cart on successful E-Transfer request
                localStorage.removeItem("dpino-cart");
                setCart([]);
                setCalculatedCart({ cart: [], total: 0, totalTickets: 0 });

                // Show success message with E-Transfer instructions
                alert(`✅ E-Transfer request submitted successfully!\n\nPlease send $${calculatedCart.total} to:\n📧 etransfer@darkpino.xyz\n\nInclude your user ID in the message: ${userId}\n\nOnce payment is confirmed, your tickets will be added automatically.`);
            } else {
                throw new Error("E-Transfer request failed");
            }
        } catch (err) {
            console.error("E-Transfer error:", err);
            setError(err.message || "E-Transfer request failed. Please try again.");
        } finally {
            setCheckoutLoading(false);
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

                                    <div className="item-tickets">
                                        🎟 Tickets: {item.totalTickets}
                                    </div>
                                </div>

                                <div className="cart-qty">
                                    <button
                                        onClick={() => decreaseQty(item.id)}
                                        disabled={checkoutLoading}
                                    >
                                        -
                                    </button>
                                    <span>{item.originalQuantity}</span>
                                    <button
                                        onClick={() => increaseQty(item.id)}
                                        disabled={checkoutLoading}
                                    >
                                        +
                                    </button>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeItem(item.id)}
                                        disabled={checkoutLoading}
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

                        {/* Payment Method Selection */}
                        <div className="payment-method-selector">
                            <h4>Select Payment Method:</h4>
                            <div className="payment-options">
                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="stripe"
                                        checked={paymentMethod === "stripe"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={checkoutLoading}
                                    />
                                    <span>💳 Credit/Debit Card (Stripe)</span>
                                </label>
                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="etransfer"
                                        checked={paymentMethod === "etransfer"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={checkoutLoading}
                                    />
                                    <span>📧 E-Transfer (Email Money Transfer)</span>
                                </label>
                            </div>
                        </div>

                        {/* E-Transfer Form (shown when selected) */}
                        {paymentMethod === "etransfer" && (
                            <div className="etransfer-form">
                                <div className="etransfer-instructions">
                                    <p><strong>Instructions:</strong></p>
                                    <ol>
                                        <li>Enter your email below</li>
                                        <li>Complete checkout to receive E-Transfer details</li>
                                        <li>Send ${calculatedCart.total} to <strong>etransfer@darkpino.xyz</strong></li>
                                        <li>Include your user ID in the message</li>
                                        <li>Tickets will be added once payment is confirmed</li>
                                    </ol>
                                </div>

                                <form onSubmit={handleEtransferSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="userEmail">Your Email Address:</label>
                                        <input
                                            type="email"
                                            id="userEmail"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="your.email@example.com"
                                            required
                                            disabled={checkoutLoading}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="checkout-btn etransfer-btn"
                                        disabled={checkoutLoading || !userEmail || calculatedCart.cart.length === 0}
                                    >
                                        {checkoutLoading ? "Processing..." : "Submit E-Transfer Request"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Stripe Checkout Button (shown when selected) */}
                        {paymentMethod === "stripe" && !showPaymentForm && (
                            <button
                                className="checkout-btn stripe-btn"
                                onClick={handleStripeCheckout}
                                disabled={checkoutLoading || calculatedCart.cart.length === 0}
                            >
                                {checkoutLoading ? "Initializing Payment..." : "Proceed to Secure Checkout"}
                            </button>
                        )}

                        {/* Embedded Stripe Payment Form */}
                        {paymentMethod === "stripe" && showPaymentForm && clientSecret && (
                            <div className="embedded-payment-form">
                                <StripeProvider clientSecret={clientSecret}>
                                    <CheckoutForm
                                        amount={paymentAmount}
                                        tickets={paymentTickets}
                                        onCancel={handleCancelPayment}
                                    />
                                </StripeProvider>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}