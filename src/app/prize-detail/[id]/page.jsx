"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function PrizeDetailPage({ params }) {
    const [id, setId] = useState(null);
    const [prize, setPrize] = useState(null);
    const [similar, setSimilar] = useState([]);

    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    useEffect(() => {
        async function unwrapParams() {
            const resolved = await params;
            setId(resolved.id);
        }
        unwrapParams();
    }, [params]);

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

                    <div className="prize-value-info">
                        <div className="worth">Worth: {formatUSD(prize.price)}</div>
                    </div>

                    <p className="description">{prize.description}</p>

                    <div className="ticket-wallet">
                        <strong>Sign in to see your ticket balance and enter</strong>
                    </div>

                    <Link href="/sign-in">
                        <button className="btn enter-btn">
                            Sign In to Enter
                        </button>
                    </Link>

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

            <div className="listProduct">
                {similar.map((item) => (
                    <Link key={item.id} href={`/prize-detail/${item.id}`} className="dp-card">
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
