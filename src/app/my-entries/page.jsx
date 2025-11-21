"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyEntriesPage() {
    const { user, isLoaded } = useUser();
    const [entries, setEntries] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [filter, setFilter] = useState("latest");

    useEffect(() => {
        async function loadEverything() {
            if (!isLoaded || !user) return;

            const prizeRes = await fetch("/prizes.json");
            const prizeData = await prizeRes.json();
            setPrizes(prizeData);

            const { data } = await supabase
                .from("entries")
                .select("*")
                .eq("clerk_id", user.id)
                .order("created_at", { ascending: false });

            if (!data) return;

            const merged = data.map(entry => {
                const prize = prizeData.find(p => p.id == entry.prize_id);
                return { ...entry, prize };
            });

            setEntries(merged);
        }

        loadEverything();
    }, [user, isLoaded]);

    // TICKET BADGE COLOR
    function getBadge(tickets) {
        if (tickets >= 5) return { label: "Gold", class: "badge-gold" };
        if (tickets >= 2) return { label: "Silver", class: "badge-silver" };
        return { label: "Bronze", class: "badge-bronze" };
    }

    // APPLY FILTERS
    const filteredEntries = [...entries].sort((a, b) => {
        if (filter === "latest") return new Date(b.created_at) - new Date(a.created_at);
        if (filter === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        if (filter === "high") return b.tickets_used - a.tickets_used;
        if (filter === "low") return a.tickets_used - b.tickets_used;
        return 0;
    });

    const totalTickets = entries.reduce((sum, e) => sum + e.tickets_used, 0);

    return (
        <main className="entries-container fade-in">

            <h1 className="entries-title">MY ENTRIES</h1>

            <div className="entry-summary-box">
                <span>🔥 Total Tickets Spent:</span>
                <strong>{totalTickets}</strong>
            </div>

            {/* FILTERS */}
            <div className="entry-filter-box">
                <button className={filter === "latest" ? "active" : ""} onClick={() => setFilter("latest")}>Latest</button>
                <button className={filter === "oldest" ? "active" : ""} onClick={() => setFilter("oldest")}>Oldest</button>
                <button className={filter === "high" ? "active" : ""} onClick={() => setFilter("high")}>Highest Tickets</button>
                <button className={filter === "low" ? "active" : ""} onClick={() => setFilter("low")}>Lowest Tickets</button>
            </div>

            {filteredEntries.length === 0 ? (
                <p className="empty-msg">No entries yet.</p>
            ) : (
                <div className="entries-grid">
                    {filteredEntries.map((entry, i) => {
                        const badge = getBadge(entry.tickets_used);

                        return (
                            <div className="entry-card-ui pop-in" key={entry.id} style={{ "--i": i }}>

                                {/* IMAGE */}
                                <div className="entry-image-box">
                                    <img
                                        src={entry.prize?.image || "/placeholder.png"}
                                        alt={entry.prize?.name}
                                        className="entry-image"
                                    />
                                </div>

                                {/* DETAILS */}
                                <div className="entry-details">

                                    <h3 className="entry-title">{entry.prize?.name}</h3>

                                    {/* BADGES */}
                                    <div className="badge-row">
                                        <span className={`ticket-badge ${badge.class}`}>
                                            {badge.label}
                                        </span>

                                        <span className="date-badge">
                                            📅 {new Date(entry.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* META INFO */}
                                    <p className="entry-meta">
                                        🎟 {entry.tickets_used} ticket(s)
                                    </p>

                                    <Link href={`/prize-detail/${entry.prize_id}`}>
                                        <button className="entry-btn">View Prize</button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </main>
    );
}
