"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyEntriesPage() {
    const { user, isLoaded } = useUser();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) return;

        async function loadEntries() {
            // 1. Fetch user entries
            const { data: entryRows, error: entryError } = await supabase
                .from("entries")
                .select("*")
                .eq("clerk_id", user.id)
                .order("created_at", { ascending: false });

            if (entryError) {
                console.error("Error loading entries:", entryError);
                return;
            }

            // 2. Load all prizes from prizes.json
            const res = await fetch("/prizes.json");
            const prizes = await res.json();

            // 3. Merge entries with prize info
            const merged = entryRows.map((entry) => {
                const prize = prizes.find((p) => Number(p.id) === Number(entry.prize_id));

                return {
                    ...entry,
                    prize_name: prize?.name ?? "Unknown Prize",
                    prize_image: prize?.image ?? "/placeholder.png",
                };
            });

            setEntries(merged);
            setLoading(false);
        }



        loadEntries();
    }, [user, isLoaded]);

    if (!user) {
        return (
            <main style={{ padding: 50, color: "#fff", textAlign: "center" }}>
                <h2>Please sign in to view your entries.</h2>
                <Link href="/sign-in">
                    <button className="btn">Sign In</button>
                </Link>
            </main>
        );
    }

    if (loading) {
        return (
            <main style={{ padding: 50, color: "#fff", textAlign: "center" }}>
                <h2>Loading your entries...</h2>
            </main>
        );
    }

    return (
        <main className="container" style={{ padding: "40px", color: "#fff" }}>
            <h1 className="title">My Entries</h1>

            {entries.length === 0 ? (
                <p>You have not entered any contests yet.</p>
            ) : (
                <div className="entries-list">
                    {entries.map((entry) => (
                        <div key={entry.id} className="entry-card">
                            <img
                                src={entry.prizes?.image}
                                alt={entry.prizes?.name}
                                className="entry-img"
                            />

                            <div className="entry-info">
                                <h2>{entry.prizes?.name}</h2>
                                <p>🎟 Tickets Used: {entry.tickets_used}</p>
                                <p>📅 {new Date(entry.created_at).toLocaleString()}</p>

                                <Link href={`/prize-detail/${entry.prize_id}`}>
                                    <button className="btn">View Prize</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
