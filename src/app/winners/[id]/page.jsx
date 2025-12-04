"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

export default function WinnerRevealPage({ params }) {
    const { id: prizeId } = use(params);
    const [loading, setLoading] = useState(true);
    const [prize, setPrize] = useState(null);

    useEffect(() => {
        if (!prizeId) return;

        async function loadData() {
            try {
                const prizesResponse = await fetch('/prizes.json');
                const prizes = await prizesResponse.json();
                const foundPrize = prizes.find(p => String(p.id) === String(prizeId));
                setPrize(foundPrize || null);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [prizeId]);

    if (loading) {
        return (
            <main className="winner-page">
                <h1 className="winner-title">Loading Prize...</h1>
                <p className="winner-sub">Please wait while we load the details.</p>
            </main>
        );
    }

    if (!prize) {
        return (
            <main className="winner-page">
                <h1 className="winner-title">Prize Not Found</h1>
                <p className="winner-sub">This prize does not exist.</p>
                <Link href="/contest">
                    <button className="winner-btn">Back to Contests</button>
                </Link>
            </main>
        );
    }

    return (
        <main className="winner-page">
            <h1 className="winner-title">Prize Details</h1>
            <p className="winner-sub">Sign in to view winner information.</p>

            <section className="winner-card">
                <div className="winner-image-box">
                    <img
                        src={prize.image}
                        className="winner-image"
                        alt={prize.name}
                        onError={(e) => {
                            e.target.src = "/Image/step1.png";
                        }}
                    />
                </div>

                <div className="winner-info">
                    <h2 className="winner-prize-name">{prize.name}</h2>
                    <p className="winner-prize-desc">{prize.description}</p>
                    <div className="winner-prize-value">🎯 Prize Value: ${prize.price.toLocaleString()}</div>

                    <div className="winner-pending">
                        <span>⏳ Sign in to view winner details</span>
                    </div>

                    <div className="winner-actions">
                        <Link href="/contest">
                            <button className="winner-btn secondary">View All Contests</button>
                        </Link>
                        <Link href="/sign-in">
                            <button className="winner-btn">Sign In</button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
