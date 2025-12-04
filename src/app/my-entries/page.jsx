"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyEntriesPage() {
    return (
        <main className="entries-container fade-in">
            <h1 className="entries-title">MY ENTRIES</h1>
            <p className="empty-msg">Please sign in to view your entries. Authentication is being set up.</p>
            <Link href="/" style={{ color: "#F8C200", marginTop: "20px", display: "inline-block" }}>
                ← Back to Home
            </Link>
        </main>
    );
}
