"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function obfuscateEmail(email) {
    if (!email) return "winner@dpino.com";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const visible = user.slice(0, Math.min(2, user.length));
    return `${visible}***@${domain}`;
}

export default function PastWinnersPage() {
    const [winners, setWinners] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState("all");

    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    // Load winners and prizes
    useEffect(() => {
        async function loadData() {
            try {
                // Load prizes from JSON
                const prizesResponse = await fetch("/prizes.json");
                const prizesData = await prizesResponse.json();
                setPrizes(prizesData);

                // Load winners from Supabase
                const { data: winnersData, error } = await supabase
                    .from("winners")
                    .select("*")
                    .order("drawn_at", { ascending: false });

                if (!error && winnersData) {
                    setWinners(winnersData);
                }
            } catch (err) {
                console.error("Error loading winners:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Get prize details by ID
    const getPrizeById = (prizeId) => {
        return prizes.find((p) => p.id === prizeId) || null;
    };

    // Filter by month
    const getFilteredWinners = () => {
        if (selectedMonth === "all") return winners;

        return winners.filter((w) => {
            const date = new Date(w.drawn_at);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            return monthYear === selectedMonth;
        });
    };

    // Get unique months for filter
    const getUniqueMonths = () => {
        const months = new Set();
        winners.forEach((w) => {
            const date = new Date(w.drawn_at);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            months.add(monthYear);
        });
        return Array.from(months).sort().reverse();
    };

    // Format month for display
    const formatMonth = (monthYear) => {
        const [year, month] = monthYear.split("-");
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    // Calculate total prize value
    const totalPrizeValue = winners.reduce((sum, w) => {
        const prize = getPrizeById(w.prize_id);
        return sum + (prize?.price || 0);
    }, 0);

    const filteredWinners = getFilteredWinners();
    const uniqueMonths = getUniqueMonths();

    return (
        <main className="past-winners-page">
            {/* Hero Section */}
            <section className="winners-hero">
                <div className="container">
                    <h1 className="winners-title">
                        Past <span>Winners</span>
                    </h1>
                    <p className="winners-subtitle">
                        Celebrating our lucky winners! See who took home incredible prizes.
                    </p>

                    {/* Stats */}
                    <div className="winners-stats">
                        <div className="stat-card">
                            <span className="stat-value">{winners.length}</span>
                            <span className="stat-label">Total Winners</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{formatUSD(totalPrizeValue)}</span>
                            <span className="stat-label">Prizes Awarded</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{uniqueMonths.length}</span>
                            <span className="stat-label">Months of Drawings</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter Section */}
            {winners.length > 0 && (
                <section className="winners-filter">
                    <div className="container">
                        <div className="filter-row">
                            <label htmlFor="month-filter">Filter by Month:</label>
                            <select
                                id="month-filter"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="month-select"
                            >
                                <option value="all">All Time</option>
                                {uniqueMonths.map((month) => (
                                    <option key={month} value={month}>
                                        {formatMonth(month)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>
            )}

            {/* Winners Grid */}
            <section className="winners-gallery">
                <div className="container">
                    {loading ? (
                        <div className="loading-grid">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="skeleton-card">
                                    <div className="skeleton skeleton-image"></div>
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-text"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredWinners.length === 0 ? (
                        <div className="no-winners">
                            <div className="no-winners-icon">🏆</div>
                            <h3>No Winners Yet</h3>
                            <p>
                                {selectedMonth === "all"
                                    ? "Be the first to win! Enter our prize drawings today."
                                    : "No winners for this month. Try a different filter."}
                            </p>
                            <Link href="/contest">
                                <button className="enter-now-btn">Enter Drawings</button>
                            </Link>
                        </div>
                    ) : (
                        <div className="winners-grid">
                            {filteredWinners.map((winner) => {
                                const prize = getPrizeById(winner.prize_id);
                                if (!prize) return null;

                                return (
                                    <div key={winner.id} className="winner-card">
                                        <div className="winner-card-image">
                                            <img
                                                src={prize.image}
                                                alt={prize.name}
                                                onError={(e) => {
                                                    e.target.src = "/Image/step1.png";
                                                }}
                                            />
                                            <div className="winner-trophy">🏆</div>
                                        </div>

                                        <div className="winner-card-content">
                                            <h3 className="winner-prize-name">{prize.name}</h3>

                                            <div className="winner-info-row">
                                                <span className="winner-label">Winner:</span>
                                                <span className="winner-email">
                                                    {obfuscateEmail(winner.winner_email)}
                                                </span>
                                            </div>

                                            <div className="winner-info-row">
                                                <span className="winner-label">Prize Value:</span>
                                                <span className="winner-value">{formatUSD(prize.price)}</span>
                                            </div>

                                            <div className="winner-info-row">
                                                <span className="winner-label">Drawn:</span>
                                                <span className="winner-date">
                                                    {new Date(winner.drawn_at).toLocaleDateString("en-US", {
                                                        month: "long",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>

                                            <Link href={`/winners/${winner.prize_id}`}>
                                                <button className="view-details-btn">
                                                    View Details →
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="winners-cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>You Could Be Next!</h2>
                        <p>
                            Join thousands of participants for a chance to win luxury prizes,
                            electronics, and more. Every purchase earns you tickets!
                        </p>
                        <div className="cta-buttons">
                            <Link href="/quick-entries">
                                <button className="cta-btn primary">Get Tickets</button>
                            </Link>
                            <Link href="/contest">
                                <button className="cta-btn secondary">View Prizes</button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
