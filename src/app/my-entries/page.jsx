// src/app/my-entries/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyEntriesPage() {
    const { user, isLoaded } = useUser();
    const [entries, setEntries] = useState([]);
    const [filter, setFilter] = useState("latest");
    const [winnersMap, setWinnersMap] = useState({});

    useEffect(() => {
        async function loadEverything() {
            if (!isLoaded || !user) return;

            // load prizes metadata
            const prizeRes = await fetch("/prizes.json");
            const prizeData = await prizeRes.json();

            // load user entries
            const { data, error } = await supabase
                .from("entries")
                .select("*")
                .eq("clerk_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error loading entries:", error);
                setEntries([]);
                return;
            }

            if (!data) {
                setEntries([]);
                return;
            }

            const merged = data.map((entry) => {
                const prize = prizeData.find((p) => p.id == entry.prize_id);
                return { ...entry, prize };
            });

            setEntries(merged);

            // load winners per prize_id
            const prizeIds = [...new Set(merged.map((e) => e.prize_id))];
            if (prizeIds.length > 0) {
                const { data: winners, error: wErr } = await supabase
                    .from("winners")
                    .select("*")
                    .in("prize_id", prizeIds);

                if (!wErr && winners) {
                    const map = {};
                    winners.forEach((w) => {
                        // if multiple winners rows per prize, just take latest
                        const existing = map[w.prize_id];
                        if (
                            !existing ||
                            new Date(w.created_at) > new Date(existing.created_at || 0)
                        ) {
                            map[w.prize_id] = w;
                        }
                    });
                    setWinnersMap(map);
                }
            }
        }

        loadEverything();
    }, [user, isLoaded]);

    const getBadge = (tickets) => {
        if (tickets >= 5) return { label: "Gold", class: "badge-gold" };
        if (tickets >= 2) return { label: "Silver", class: "badge-silver" };
        return { label: "Bronze", class: "badge-bronze" };
    };

    const filteredEntries = [...entries].sort((a, b) => {
        if (filter === "latest") return new Date(b.created_at) - new Date(a.created_at);
        if (filter === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        if (filter === "high") return b.tickets_used - a.tickets_used;
        if (filter === "low") return a.tickets_used - b.tickets_used;
        return 0;
    });

    const totalTickets = entries.reduce((sum, e) => sum + e.tickets_used, 0);

    if (!user && isLoaded) {
        return (
            <main className="entries-container fade-in">
                <h1 className="entries-title">MY ENTRIES</h1>
                <p className="empty-msg">Please sign in to view your entries.</p>
            </main>
        );
    }

    return (
        <main className="entries-container fade-in">
            <h1 className="entries-title">MY ENTRIES</h1>

            <div className="entry-summary-box">
                <span>🔥 Total Tickets Spent:</span>
                <strong>{totalTickets}</strong>
            </div>

            <div className="entry-filter-box">
                <button
                    className={filter === "latest" ? "active" : ""}
                    onClick={() => setFilter("latest")}
                >
                    Latest
                </button>
                <button
                    className={filter === "oldest" ? "active" : ""}
                    onClick={() => setFilter("oldest")}
                >
                    Oldest
                </button>
                <button
                    className={filter === "high" ? "active" : ""}
                    onClick={() => setFilter("high")}
                >
                    Highest Tickets
                </button>
                <button
                    className={filter === "low" ? "active" : ""}
                    onClick={() => setFilter("low")}
                >
                    Lowest Tickets
                </button>
            </div>

            {filteredEntries.length === 0 ? (
                <p className="empty-msg">No entries yet.</p>
            ) : (
                <div className="entries-grid">
                    {filteredEntries.map((entry, i) => {
                        const badge = getBadge(entry.tickets_used);
                        const winner = winnersMap[entry.prize_id];
                        const hasWinner = !!winner;

                        return (
                            <div
                                className="entry-card-ui pop-in"
                                key={entry.id}
                                style={{ "--i": i }}
                            >
                                <div className="entry-image-box">
                                    <img
                                        src={entry.prize?.image || "/placeholder.png"}
                                        alt={entry.prize?.name || "Prize"}
                                        className="entry-image"
                                    />
                                </div>

                                <div className="entry-details">
                                    <h3 className="entry-title">
                                        {entry.prize?.name || "Mystery Prize"}
                                    </h3>

                                    <div className="badge-row">
                                        <span className={`ticket-badge ${badge.class}`}>
                                            {badge.label}
                                        </span>
                                        <span className="date-badge">
                                            📅{" "}
                                            {new Date(entry.created_at).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>

                                        {hasWinner && (
                                            <span className="winner-pill small">🏆 Winner Drawn</span>
                                        )}
                                    </div>

                                    <p className="entry-meta">
                                        🎟 {entry.tickets_used} ticket
                                        {entry.tickets_used !== 1 ? "s" : ""}
                                    </p>

                                    <div className="entry-actions-row">
                                        {hasWinner ? (
                                            <Link href={`/winners/${entry.prize_id}`}>
                                                <button className="entry-btn">View Winner</button>
                                            </Link>
                                        ) : (
                                            <button className="entry-btn secondary" disabled>
                                                Draw Pending
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
