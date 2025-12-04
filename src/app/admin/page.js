"use client";

import Link from "next/link";

export default function AdminPage() {
    return (
        <div style={{ padding: "100px 20px", textAlign: "center", color: "#fff" }}>
            <h1 style={{ color: "#F8C200" }}>Admin Dashboard</h1>
            <p style={{ marginTop: "20px" }}>Authentication is being set up.</p>
            <Link href="/" style={{ color: "#F8C200", marginTop: "20px", display: "inline-block" }}>
                ← Back to Home
            </Link>
        </div>
    );
}
