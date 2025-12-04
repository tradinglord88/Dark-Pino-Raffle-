"use client";

import Link from "next/link";

export default function PendingOrdersPage() {
    return (
        <div style={{ padding: "100px 20px", textAlign: "center", color: "#fff" }}>
            <h1 style={{ color: "#F8C200" }}>Pending Orders</h1>
            <p style={{ marginTop: "20px" }}>Authentication is being set up.</p>
            <Link href="/admin" style={{ color: "#F8C200", marginTop: "20px", display: "inline-block" }}>
                ← Back to Admin
            </Link>
        </div>
    );
}
