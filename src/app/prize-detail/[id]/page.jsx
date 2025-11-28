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

    const [userTickets, setUserTickets] = useState(null);
    const { user, isLoaded } = useUser();

    // Format currency function (same as contest page)
    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    // Calculate tickets function (same as contest page)
    const calcTickets = (price) => Math.floor((Number(price) || 0) / 100);

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
            if (!isLoaded) return;
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

        // Ensure we have a valid number (handle empty/cleared input)
        const ticketsToEnter = entryTickets || 1;

        if (ticketsToEnter > userTickets) {
            setConfirmMsg("❌ Not enough tickets.");
            return;
        }

        const res = await fetch("/api/enter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clerkId: user.id,
                prizeId: Number(id),
                tickets: ticketsToEnter,
            }),
        });

        const data = await res.json();

        if (!data.success) {
            setConfirmMsg("❌ " + data.error);
            return;
        }

        setUserTickets(data.newBalance);
        setConfirmMsg(`🎉 Successfully entered ${ticketsToEnter} ticket(s)!`);
    };

    // Handle input changes with better mobile support
    const handleInputChange = (e) => {
        const value = e.target.value;

        // If input is empty (user cleared it), set to empty string temporarily
        // This allows mobile users to type freely without the "1" interfering
        if (value === "") {
            setEntryTickets("");
            return;
        }

        // Parse the number
        const numValue = Number(value);

        // If it's a valid positive number, use it
        if (!isNaN(numValue) && numValue > 0) {
            setEntryTickets(numValue);
        }
        // If invalid (like negative or zero), default to 1
        else {
            setEntryTickets(1);
        }
    };

    // Handle blur event - when user leaves the field, ensure we have a valid value
    const handleInputBlur = (e) => {
        const value = e.target.value;

        // If field is empty or invalid, set to 1
        if (value === "" || isNaN(Number(value)) || Number(value) < 1) {
            setEntryTickets(1);
        }

        // If value exceeds user's ticket balance, set to max available
        if (userTickets !== null && Number(value) > userTickets) {
            setEntryTickets(userTickets);
        }
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

                    {/* ADDED: Worth and Tickets info (like contest page) */}
                    <div className="prize-value-info">
                        <div className="worth">Worth: {formatUSD(prize.price)}</div>
                        <div className="tickets-earned">🎟 {calcTickets(prize.price)} Tickets when purchased</div>
                    </div>

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
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
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
                    {prize.drawTime && Date.now() > new Date(prize.drawTime).getTime() && (
                        <Link
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
                        </Link>
                    )}
                </div>
            </div>

            <div className="title">Similar Prizes</div>

            {/* UPDATED: Use same styling as contest page */}
            <div className="listProduct">
                {similar.map((item) => (
                    <Link key={item.id} href={`/detail/${item.id}`} className="dp-card">
                        <img src={item.image} alt={item.name} />
                        <div className="dp-title">{item.name}</div>
                        <div className="dp-info">
                            <div className="dp-price">Worth: {formatUSD(item.price)}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}