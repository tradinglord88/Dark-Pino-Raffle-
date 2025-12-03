"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Load Stripe outside of component to avoid recreating on re-renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Stripe Elements appearance to match Dark Pino theme
const appearance = {
    theme: 'night',
    variables: {
        colorPrimary: '#F8C200',
        colorBackground: '#1a1a1a',
        colorText: '#ffffff',
        colorDanger: '#ff4444',
        colorTextSecondary: '#aaaaaa',
        colorTextPlaceholder: '#666666',
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
    },
    rules: {
        '.Input': {
            backgroundColor: '#0d0d0d',
            border: '1px solid #333',
            boxShadow: 'none',
        },
        '.Input:focus': {
            border: '1px solid #F8C200',
            boxShadow: '0 0 0 1px #F8C200',
        },
        '.Input--invalid': {
            border: '1px solid #ff4444',
        },
        '.Label': {
            color: '#ffffff',
            fontWeight: '500',
        },
        '.Tab': {
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
        },
        '.Tab--selected': {
            backgroundColor: '#F8C200',
            color: '#000000',
        },
        '.Tab:hover': {
            backgroundColor: '#2a2a2a',
        },
    }
};

export default function StripeProvider({ children, clientSecret }) {
    const options = {
        clientSecret,
        appearance,
    };

    if (!clientSecret) {
        return children;
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
}
