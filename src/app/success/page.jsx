"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SuccessPage() {
    useEffect(() => {
        // Clear cart when success page loads
        localStorage.removeItem("dpino-cart");
        console.log("✅ Cart cleared on success page");

        // Optional: You can also trigger any post-purchase actions here
        console.log("🎉 Purchase completed successfully");
    }, []);

    return (
        <div style={{ padding: "40px", textAlign: "center" }}>
            <h1>🎉 Payment Successful!</h1>
            <p>Your order has been processed.</p>
            <p>Your tickets have been added to your account. 🎟</p>

            <div style={{ marginTop: "20px" }}>
                <Link href="/contest" style={{ color: "blue", marginRight: "20px" }}>
                    Enter Raffles
                </Link>
                <Link href="/" style={{ color: "blue" }}>
                    Go back to home
                </Link>
            </div>
        </div>
    );
}