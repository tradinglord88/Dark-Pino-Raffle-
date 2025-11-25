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

    const [userTickets, setUserTickets] = useState(null); // Real balance or null
    const { user, isLoaded } = useUser();


    // --- UNWRAP PARAMS ---
    useEffect(() => {
        async function unwrapParams() {
            const resolved = await params;
            setId(resolved.id);
        }
        unwrapParams();
    }, [params]);


    // --- LOAD PRIZE & SIMILAR PRIZES ---
    useEffect(() => {
        if (!id) return;

        fetch("/prizes.json")
            .then((res) => res.json())
            .then((data) => {
                const found = data.find((p) => String(p.id) === String(id));
                setPrize(found);

                const others = data
                    .filter((p) => String(p.id) !== String(id))
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 6);

                setSimilar(others);
            });
    }, [id]);


    // --- LOAD USER TICKET BALANCE ---
    useEffect(() => {
        async function loadTickets() {
            if (!isLoaded) return; // Wait for Clerk
            if (!user) {
                setUserTickets(null);
                return;
            }

            const { data, error } = await supabase
                .from("users")
                .select("tickets")
                .eq("clerk_id", user.id)
                .single();

            if (error) {
                console.error("Error loading tickets:", error);
                setUserTickets(null);
                return;
            }

            setUserTickets(data?.tickets ?? 0);
        }

        loadTickets();
    }, [isLoaded, user]);


    // --- HANDLE ENTRY SUBMISSION ---
    const submitTickets = async () => {
        if (!user) {
            setConfirmMsg("❌ Please sign in to enter.");
            return;
        }

        if (userTickets === null) {
            setConfirmMsg("⏳ Loading ticket balance...");
            return;
        }

        if (entryTickets > userTickets) {
            setConfirmMsg("❌ Not enough tickets.");
            return;
        }

        // Call API
        const res = await fetch("/api/enter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clerkId: user.id,
                prizeId: Number(id),
                tickets: entryTickets,
            }),
        });

        const data = await res.json();

        if (!data.success) {
            setConfirmMsg("❌ " + data.error);
            return;
        }

        // Update UI instantly
        setUserTickets(data.newBalance);
        setConfirmMsg(`🎉 Successfully entered ${entryTickets} ticket(s)!`);
    };


    if (!prize) {
        return (
            <main style={{ padding: 50, color: "#fff", textAlign: "center" }}>
                Loading prize...
            </main>
        );
    }


    return (
        <main className="container">

            <Link href="/contest" className="back-link">← Back to Contest</Link>

            <div className="detail">

                {/* IMAGE */}
                <div className="image">
                    <Image
                        src={prize.image}
                        alt={prize.name}
                        width={600}
                        height={600}
                        className="detail-img"
                    />
                </div>

                {/* CONTENT */}
                <div className="content">
                    <h1 className="name">{prize.name}</h1>
                    <p className="description">{prize.description}</p>

                    {/* --- TICKET BALANCE --- */}
                    {user ? (
                        <div className="ticket-wallet">
                            You currently have{" "}
                            <strong>
                                {userTickets === null
                                    ? "Loading..."
                                    : `${userTickets} tickets`}
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
                            disabled={userTickets === null}
                            max={userTickets || 1}
                            value={entryTickets}
                            placeholder="1"
                            onChange={(e) => {
                                const value = e.target.value;
                                // Handle empty input or non-numeric values
                                if (value === "" || isNaN(Number(value))) {
                                    setEntryTickets(1);
                                } else {
                                    setEntryTickets(Number(value));
                                }
                            }}
                            onFocus={(e) => {
                                // On mobile, when user focuses on the input, select all text
                                // This makes it easier to replace the initial value
                                e.target.select();
                            }}
                            onKeyDown={(e) => {
                                // Prevent the 'e' character in scientific notation
                                if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </div>

                    {/* --- SUBMIT BUTTON --- */}
                    <button className="btn enter-btn" onClick={submitTickets}>
                        Enter Tickets
                    </button>

                    {confirmMsg && (
                        <p className="confirm-msg">{confirmMsg}</p>
                    )}

                    {/* --- VIEW WINNER BUTTON AFTER CONTEST ENDS --- */}
                    {prize.endDate && Date.now() > new Date(prize.endDate).getTime() && (
                        <a
                            href={`/winners/${prize.id}`}
                            className="winner-btn"
                            style={{
                                display: "inline-block",
                                marginTop: "1.5rem",
                                padding: "12px 26px",
                                background: "#F8C200",
                                color: "black",
                                borderRadius: "30px",
                                fontWeight: "700",
                                textAlign: "center",
                                fontSize: "1rem",
                                transition: "0.2s",
                            }}
                        >
                            🎉 View Winner
                        </a>
                    )}

                </div>

            </div>

            <div className="title">Similar Prizes</div>

            <div className="similar-prizes-grid">
                {similar.map((item) => (
                    <a key={item.id} href={`/prize-detail/${item.id}`}>
                        <img src={item.image} alt={item.name} />
                        <h2>{item.name}</h2>
                    </a>
                ))}
            </div>

        </main>
    );
}
