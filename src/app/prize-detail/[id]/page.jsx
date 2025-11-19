// app/prize-detail/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

export default function PrizeDetailPage({ params }) {
    const [id, setId] = useState(null);
    const [prize, setPrize] = useState(null);
    const [similar, setSimilar] = useState([]);

    const [entryTickets, setEntryTickets] = useState(1);
    const [confirmMsg, setConfirmMsg] = useState("");

    const [userTickets, setUserTickets] = useState(null); // REAL ticket balance

    const { user, isLoaded } = useUser(); // Clerk user

    // --- UNWRAP PARAMS ---
    useEffect(() => {
        async function unwrap() {
            const resolved = await params;
            setId(resolved.id);
        }
        unwrap();
    }, [params]);

    // --- LOAD PRIZE + SIMILAR ---
    useEffect(() => {
        if (!id) return;

        fetch("/prizes.json")
            .then(res => res.json())
            .then(data => {
                const found = data.find(p => String(p.id) === String(id));
                setPrize(found);

                const sims = data
                    .filter(item => String(item.id) !== String(id))
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 6);

                setSimilar(sims);
            });
    }, [id]);

    // --- LOAD USER TICKETS FROM SUPABASE ---
    useEffect(() => {
        async function loadTickets() {
            if (!isLoaded) return;      // Clerk not ready
            if (!user) return;          // User not logged in yet

            const { data, error } = await supabase
                .from("users")
                .select("tickets")
                .eq("clerk_id", user.id)
                .single();

            if (error) {
                console.error("Error fetching ticket balance:", error);
                return;
            }

            setUserTickets(data?.tickets ?? 0);
        }

        loadTickets();
    }, [user, isLoaded]);

    if (!prize) {
        return (
            <main style={{ padding: 50, color: "#fff", textAlign: "center" }}>
                Loading prize...
            </main>
        );
    }

    const submitTickets = () => {
        if (!user) {
            setConfirmMsg("❌ Please sign in to enter this contest.");
            return;
        }

        if (entryTickets > userTickets) {
            setConfirmMsg("❌ Not enough tickets.");
            return;
        }

        setConfirmMsg(`🎉 You entered ${entryTickets} ticket(s)!`);
    };

    return (
        <main className="container">

            <Link href="/contest" className="back-link">
                ← Back to Contest
            </Link>

            <div className="detail">
                <div className="image">
                    <Image
                        src={prize.image}
                        alt={prize.name}
                        width={600}
                        height={600}
                        className="detail-img"
                    />
                </div>

                <div className="content">
                    <h1 className="name">{prize.name}</h1>
                    <p className="description">{prize.description}</p>

                    {/* --- TICKET BALANCE --- */}
                    {user ? (
                        <div className="ticket-wallet">
                            You currently have{" "}
                            <strong>
                                {userTickets === null ? "Loading..." : userTickets}
                                {" "}tickets
                            </strong>
                        </div>
                    ) : (
                        <div className="ticket-wallet">
                            <strong>Sign in to see your ticket balance</strong>
                        </div>
                    )}

                    {/* --- TICKET ENTRY INPUT --- */}
                    <div className="ticket-entry">
                        <label>Enter Tickets:</label>
                        <input
                            type="number"
                            min="1"
                            disabled={!userTickets && user}
                            max={userTickets ?? 1}
                            value={entryTickets}
                            onChange={e => setEntryTickets(Number(e.target.value))}
                        />
                    </div>

                    <button className="btn enter-btn" onClick={submitTickets}>
                        Enter Tickets
                    </button>

                    {confirmMsg && (
                        <p className="confirm-msg">{confirmMsg}</p>
                    )}
                </div>
            </div>

            <div className="title">Similar Prizes</div>

            <div className="similar-prizes-grid">
                {similar.map(item => (
                    <a key={item.id} href={`/prize-detail/${item.id}`}>
                        <img src={item.image} alt={item.name} />
                        <h2>{item.name}</h2>
                    </a>
                ))}
            </div>

        </main>
    );
}
