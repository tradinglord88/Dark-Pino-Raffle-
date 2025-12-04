"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
    // Check if Clerk is configured
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        return (
            <div style={{ marginTop: "100px", display: "flex", justifyContent: "center", color: "#fff" }}>
                <p>Authentication is not configured yet.</p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "100px", display: "flex", justifyContent: "center" }}>
            <SignIn />
        </div>
    );
}
