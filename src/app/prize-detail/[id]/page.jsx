// app/prize-detail/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function PrizeDetailPage({ params }) {
    const [id, setId] = useState(null);
    const [prize, setPrize] = useState(null);
    const [similar, setSimilar] = useState([]);

    const [entryTickets, setEntryTickets] = useState(1);
    const [confirmMsg, setConfirmMsg] = useState("");

    const USER_TICKETS = 25;

    // Unwrap params (fixes Promise problem)
    useEffect(() => {
        async function unwrap() {
            const resolved = await params;
            setId(resolved.id);
        }
        unwrap();
    }, [params]);

    // Load prize
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

    if (!prize) {
        return (
            <main style={{ padding: 50, color: "#fff", textAlign: "center" }}>
                Loading prize...
            </main>
        );
    }

    const submitTickets = () => {
        if (entryTickets > USER_TICKETS) {
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

                    <div className="ticket-wallet">
                        You currently have <strong>{USER_TICKETS}</strong> tickets
                    </div>

                    <div className="ticket-entry">
                        <label>Enter Tickets:</label>
                        <input
                            type="number"
                            min="1"
                            max={USER_TICKETS}
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

            <div className="listProduct">
                {similar.map(item => (
                    <a key={item.id} href={`/prize-detail/${item.id}`} className="item">
                        <img src={item.image} alt={item.name} />
                        <h2>{item.name}</h2>
                    </a>
                ))}
            </div>
        </main>
    );
}
