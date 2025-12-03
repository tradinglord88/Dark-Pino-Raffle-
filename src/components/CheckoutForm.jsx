"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

export default function CheckoutForm({ amount, tickets, onCancel }) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();

    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't loaded yet
            return;
        }

        setIsProcessing(true);
        setErrorMessage("");

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/success`,
                },
                redirect: "if_required",
            });

            if (error) {
                // Show error to customer
                if (error.type === "card_error" || error.type === "validation_error") {
                    setErrorMessage(error.message);
                } else {
                    setErrorMessage("An unexpected error occurred. Please try again.");
                }
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                // Payment succeeded without redirect
                // Clear cart and redirect to success
                localStorage.removeItem("dpino-cart");
                window.dispatchEvent(new Event("cart-updated"));
                router.push("/success?payment_intent=" + paymentIntent.id);
            } else if (paymentIntent && paymentIntent.status === "requires_action") {
                // 3D Secure or other action required - Stripe will handle redirect
                setIsProcessing(false);
            }
        } catch (err) {
            console.error("Payment error:", err);
            setErrorMessage("Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="checkout-form-container">
            <div className="checkout-form-header">
                <h3>Complete Your Payment</h3>
                <div className="checkout-summary">
                    <span className="checkout-amount">Total: ${amount?.toLocaleString()}</span>
                    <span className="checkout-tickets">Tickets: {tickets}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="stripe-checkout-form">
                <PaymentElement
                    options={{
                        layout: "tabs",
                    }}
                />

                {errorMessage && (
                    <div className="payment-error">
                        {errorMessage}
                    </div>
                )}

                <div className="checkout-form-buttons">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onCancel}
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="pay-btn"
                        disabled={!stripe || isProcessing}
                    >
                        {isProcessing ? "Processing..." : `Pay $${amount?.toLocaleString()}`}
                    </button>
                </div>
            </form>

            <div className="secure-payment-notice">
                <span>Secure payment powered by Stripe</span>
            </div>
        </div>
    );
}
