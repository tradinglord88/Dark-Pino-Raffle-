"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

// Helper: format date
function formatDate(d) {
    if (!d) return "TBA";
    try {
        const date = new Date(d);
        return date.toLocaleString();
    } catch {
        return "TBA";
    }
}

// Helper: simple countdown text
function timeUntil(d) {
    if (!d) return "Draw date TBA";
    const target = new Date(d).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) return "Draw completed";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) return `Draws in ${days}d ${hours}h`;
    if (hours > 0) return `Draws in ${hours}h ${mins}m`;
    return `Draws in ${mins}m`;
}

export default function ContestDashboardPage() {
    const { user, isLoaded } = useUser();

    const [tickets, setTickets] = useState(null);
    const [entries, setEntries] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load prizes from prizes.json
    useEffect(() => {
        fetch("/prizes.json")
            .then((res) => res.json())
            .then((data) => {
                setPrizes(data || []);
            })
            .catch((err) => {
                console.error("Error loading prizes.json:", err);
            });
    }, []);

    // Load user tickets + entries from Supabase
    useEffect(() => {
        async function loadData() {
            if (!isLoaded) return;
            if (!user) {
                setTickets(null);
                setEntries([]);
                setLoading(false);
                return;
            }

            try {
                // 1) Ticket wallet
                const { data: userRow, error: userErr } = await supabase
                    .from("users")
                    .select("tickets")
                    .eq("clerk_id", user.id)
                    .single();

                if (userErr) {
                    console.error("Error loading user tickets:", userErr);
                } else {
                    setTickets(userRow?.tickets ?? 0);
                }

                // 2) Entry history
                const { data: entryRows, error: entryErr } = await supabase
                    .from("entries")
                    .select("*")
                    .eq("clerk_id", user.id)
                    .order("created_at", { ascending: false });

                if (entryErr) {
                    console.error("Error loading entries:", entryErr);
                    setEntries([]);
                } else {
                    setEntries(entryRows || []);
                }
            } catch (err) {
                console.error("Dashboard load error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [isLoaded, user]);

    // Map prizeId -> prize object for quick lookup
    const prizeMap = prizes.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
    }, {});

    if (!isLoaded) {
        return (
            <main className="container" style={{ padding: 40, color: "#fff" }}>
                Loading dashboard...
            </main>
        );
    }

    if (!user) {
        return (
            <main className="container" style={{ padding: 40, color: "#fff" }}>
                <h1>Contest Dashboard</h1>
                <p>Please <Link href="/sign-in">sign in</Link> to view your tickets and entries.</p>
            </main>
        );
    }

    return (
        <main className="container" style={{ paddingBottom: 60 }}>
            <div className="back-link-wrapper">
                <Link href="/contest" className="back-link">
                    ← Back to Contests
                </Link>
            </div>

            <h1 className="title">Your Contest Dashboard</h1>

            {/* 🟢 Ticket Wallet */}
            <section className="ticket-wallet-card">
                <h2>Your Ticket Wallet</h2>
                <p>
                    You currently have{" "}
                    <strong>
                        {tickets === null ? "Loading..." : `${tickets} ticket${tickets === 1 ? "" : "s"}`}
                    </strong>
                </p>
                <p style={{ fontSize: 14, opacity: 0.8 }}>
                    Earn more tickets by purchasing Dark Pino 1 of 1s in the{" "}
                    <Link href="/prod">store</Link>.
                </p>
            </section>

            {/* 🟠 Active Contests */}
            <section className="active-contests">
                <h2>Active Contests</h2>

                {prizes.length === 0 ? (
                    <p>No contests found.</p>
                ) : (
                    <div className="similar-prizes-grid">
                        {prizes.map((prize) => (
                            <Link
                                key={prize.id}
                                href={`/prize-detail/${prize.id}`}
                                className="contest-card"
                            >
                                <div className="contest-card-inner">
                                    <Image
                                        src={prize.image}
                                        alt={prize.name}
                                        width={300}
                                        height={300}
                                        className="contest-card-img"
                                    />
                                    <h3>{prize.name}</h3>
                                    {prize.draw_date ? (
                                        <>
                                            <p className="contest-draw-date">
                                                Draw date: {formatDate(prize.draw_date)}
                                            </p>
                                            <p className="contest-countdown">
                                                {timeUntil(prize.draw_date)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="contest-draw-date">Draw date: TBA</p>
                                    )}
                                    <p className="contest-link-hint">View & enter →</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* 🔵 Entry History */}
            <section className="entry-history">
                <h2>Your Entry History</h2>

                {loading ? (
                    <p>Loading your entries...</p>
                ) : entries.length === 0 ? (
                    <p>You haven&apos;t entered any contests yet.</p>
                ) : (
                    <div className="entry-list">
                        {entries.map((entry) => {
                            const p = prizeMap[entry.prize_id];
                            return (
                                <div key={entry.id} className="entry-row">
                                    <div className="entry-main">
                                        <div className="entry-prize">
                                            {p ? (
                                                <>
                                                    <strong>{p.name}</strong>
                                                    <span className="entry-prize-sub">
                                                        Prize ID: {entry.prize_id}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <strong>Prize #{entry.prize_id}</strong>
                                                    <span className="entry-prize-sub">
                                                        (no prize data found)
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="entry-tickets">
                                            🎟 {entry.tickets_used} ticket
                                            {entry.tickets_used === 1 ? "" : "s"}
                                        </div>
                                    </div>
                                    <div className="entry-meta">
                                        <span>
                                            Entered on{" "}
                                            {new Date(entry.created_at).toLocaleString()}
                                        </span>
                                        {p?.draw_date && (
                                            <span className="entry-countdown">
                                                {timeUntil(p.draw_date)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
