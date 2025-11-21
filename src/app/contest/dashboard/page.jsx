"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AdminDashboard() {
    const [prizes, setPrizes] = useState([]);
    const [entriesByPrize, setEntriesByPrize] = useState({});
    const [loading, setLoading] = useState(true);
    const [drawing, setDrawing] = useState(null);

    useEffect(() => {
        async function loadData() {
            const prizeRes = await fetch("/prizes.json");
            const prizeList = await prizeRes.json();
            setPrizes(prizeList);

            const { data, error } = await supabase
                .from("entries")
                .select("*");

            if (!error && data) {
                const grouped = {};
                data.forEach(row => {
                    if (!grouped[row.prize_id]) grouped[row.prize_id] = [];
                    grouped[row.prize_id].push(row);
                });
                setEntriesByPrize(grouped);
            }

            setLoading(false);
        }

        loadData();
    }, []);

    async function drawWinner(prize_id) {
        setDrawing(prize_id);

        const prizeEntries = entriesByPrize[prize_id];
        if (!prizeEntries || prizeEntries.length === 0) {
            alert("No entries for this contest yet.");
            setDrawing(null);
            return;
        }

        const random = prizeEntries[Math.floor(Math.random() * prizeEntries.length)];

        const { data: userData } = await supabase
            .from("users")
            .select("email, clerk_id")
            .eq("clerk_id", random.clerk_id)
            .single();

        const { error } = await supabase
            .from("winners")
            .insert({
                prize_id,
                clerk_id: random.clerk_id,
                winner_email: userData?.email || "unknown",
                winner_name: null,
                tickets_used: random.tickets_used,
            });

        if (error) {
            console.error(error);
            alert("Error inserting winner.");
            setDrawing(null);
            return;
        }

        alert("Winner drawn successfully!");
        setDrawing(null);
        window.location.href = `/winners/${prize_id}`;
    }

    if (loading) {
        return (
            <main className="dashboard-page">
                <h1>Loading Dashboard…</h1>
            </main>
        );
    }

    return (
        <main className="dashboard-page">
            <h1 className="dash-title">Admin Contest Dashboard</h1>
            <p className="dash-sub">Manage contests, entries, and draw winners.</p>

            <div className="dash-grid">
                {prizes.map(prize => {
                    const entryCount = entriesByPrize[prize.id]?.length || 0;

                    return (
                        <div className="dash-card" key={prize.id}>
                            <img src={prize.image} alt={prize.name} className="dash-img" />

                            <h2 className="dash-name">{prize.name}</h2>
                            <p className="dash-desc">{prize.description}</p>

                            <p className="dash-count">
                                Entries: <strong>{entryCount}</strong>
                            </p>

                            <div className="dash-actions">
                                <Link href={`/prize-detail/${prize.id}`}>
                                    <button className="dash-btn secondary">View Prize</button>
                                </Link>

                                <Link href={`/winners/${prize.id}`}>
                                    <button className="dash-btn">View Winner Page</button>
                                </Link>

                                <button
                                    className="dash-btn draw"
                                    disabled={drawing === prize.id}
                                    onClick={() => drawWinner(prize.id)}
                                >
                                    {drawing === prize.id ? "Drawing…" : "Draw Winner"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
