"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// VIP Tier definitions
const VIP_TIERS = [
    {
        id: "bronze",
        name: "Bronze",
        minSpend: 0,
        maxSpend: 499,
        ticketBonus: 0,
        perks: [
            "Access to all raffles",
            "Email notifications for new prizes",
            "Basic customer support"
        ],
        color: "#CD7F32",
        icon: "ri-medal-line"
    },
    {
        id: "silver",
        name: "Silver",
        minSpend: 500,
        maxSpend: 1499,
        ticketBonus: 5,
        perks: [
            "All Bronze perks",
            "+5% bonus tickets on purchases",
            "Early access to new raffles (1 hour)",
            "Priority customer support"
        ],
        color: "#C0C0C0",
        icon: "ri-medal-fill"
    },
    {
        id: "gold",
        name: "Gold",
        minSpend: 1500,
        maxSpend: 4999,
        ticketBonus: 10,
        perks: [
            "All Silver perks",
            "+10% bonus tickets on purchases",
            "Early access to new raffles (24 hours)",
            "Exclusive Gold-only raffles",
            "Birthday bonus tickets"
        ],
        color: "#FFD700",
        icon: "ri-vip-crown-line"
    },
    {
        id: "platinum",
        name: "Platinum",
        minSpend: 5000,
        maxSpend: Infinity,
        ticketBonus: 20,
        perks: [
            "All Gold perks",
            "+20% bonus tickets on purchases",
            "Early access to new raffles (48 hours)",
            "Exclusive Platinum-only raffles",
            "Double birthday bonus tickets",
            "Free shipping on all orders",
            "Dedicated VIP concierge"
        ],
        color: "#E5E4E2",
        icon: "ri-vip-crown-fill"
    }
];

// Calculate tier based on total spend
function calculateTier(totalSpend) {
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
        if (totalSpend >= VIP_TIERS[i].minSpend) {
            return VIP_TIERS[i];
        }
    }
    return VIP_TIERS[0];
}

// Calculate progress to next tier
function calculateProgress(totalSpend, currentTier) {
    const currentIndex = VIP_TIERS.findIndex(t => t.id === currentTier.id);
    if (currentIndex === VIP_TIERS.length - 1) {
        return { progress: 100, nextTier: null, amountNeeded: 0 };
    }

    const nextTier = VIP_TIERS[currentIndex + 1];
    const progressInTier = totalSpend - currentTier.minSpend;
    const tierRange = nextTier.minSpend - currentTier.minSpend;
    const progress = Math.min((progressInTier / tierRange) * 100, 100);
    const amountNeeded = nextTier.minSpend - totalSpend;

    return { progress, nextTier, amountNeeded };
}

export default function VIPPage() {
    const { user, isLoaded } = useUser();
    const [totalSpend, setTotalSpend] = useState(0);
    const [ticketBalance, setTicketBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    // Load user data
    useEffect(() => {
        if (!isLoaded) return;

        async function loadUserData() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Get user's ticket balance
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("tickets, total_spend")
                    .eq("clerk_id", user.id)
                    .single();

                if (!userError && userData) {
                    setTicketBalance(userData.tickets || 0);
                    setTotalSpend(userData.total_spend || 0);
                }

                // If total_spend isn't tracked, calculate from purchases
                if (!userData?.total_spend) {
                    const { data: purchases, error: purchaseError } = await supabase
                        .from("purchases")
                        .select("amount_total")
                        .eq("clerk_id", user.id);

                    if (!purchaseError && purchases) {
                        const total = purchases.reduce((sum, p) => sum + (p.amount_total || 0), 0);
                        setTotalSpend(total);
                    }
                }
            } catch (err) {
                console.error("Error loading user data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadUserData();
    }, [user, isLoaded]);

    const currentTier = calculateTier(totalSpend);
    const { progress, nextTier, amountNeeded } = calculateProgress(totalSpend, currentTier);

    return (
        <main className="vip-page">
            {/* Hero Section */}
            <section className="vip-hero">
                <div className="container">
                    <h1 className="vip-title">
                        VIP <span>Membership</span>
                    </h1>
                    <p className="vip-subtitle">
                        Unlock exclusive perks, bonus tickets, and early access to the hottest raffles.
                    </p>
                </div>
            </section>

            {/* User Status Section */}
            {isLoaded && user && (
                <section className="vip-status">
                    <div className="container">
                        <div className="status-card" style={{ borderColor: currentTier.color }}>
                            <div className="status-header">
                                <div className="current-tier" style={{ color: currentTier.color }}>
                                    <i className={currentTier.icon}></i>
                                    <span>{currentTier.name} Member</span>
                                </div>
                                <div className="tier-bonus">
                                    {currentTier.ticketBonus > 0 && (
                                        <span className="bonus-badge">+{currentTier.ticketBonus}% Bonus</span>
                                    )}
                                </div>
                            </div>

                            <div className="status-stats">
                                <div className="stat">
                                    <span className="stat-label">Total Spend</span>
                                    <span className="stat-value">{formatUSD(totalSpend)}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Ticket Balance</span>
                                    <span className="stat-value">{ticketBalance} Tickets</span>
                                </div>
                            </div>

                            {nextTier && (
                                <div className="progress-section">
                                    <div className="progress-header">
                                        <span>Progress to {nextTier.name}</span>
                                        <span>{formatUSD(amountNeeded)} to go</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${progress}%`,
                                                background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {!nextTier && (
                                <div className="max-tier-message">
                                    <i className="ri-star-fill"></i>
                                    You've reached the highest tier! Enjoy all exclusive benefits.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Tiers Grid */}
            <section className="vip-tiers-section">
                <div className="container">
                    <h2 className="section-title">Membership Tiers</h2>
                    <p className="section-subtitle">
                        The more you spend, the more rewards you unlock. All tiers are based on lifetime spending.
                    </p>

                    <div className="vip-tiers">
                        {VIP_TIERS.map((tier) => {
                            const isCurrentTier = user && currentTier.id === tier.id;
                            const isUnlocked = user && totalSpend >= tier.minSpend;

                            return (
                                <div
                                    key={tier.id}
                                    className={`vip-tier ${tier.id} ${isCurrentTier ? "current" : ""} ${isUnlocked ? "unlocked" : ""}`}
                                    style={{ "--tier-color": tier.color }}
                                >
                                    {isCurrentTier && (
                                        <div className="current-badge">Your Tier</div>
                                    )}

                                    <div className="tier-icon" style={{ color: tier.color }}>
                                        <i className={tier.icon}></i>
                                    </div>

                                    <h3 className="tier-name" style={{ color: tier.color }}>
                                        {tier.name}
                                    </h3>

                                    <div className="tier-requirement">
                                        {tier.minSpend === 0 ? (
                                            <span>Starting tier</span>
                                        ) : tier.maxSpend === Infinity ? (
                                            <span>{formatUSD(tier.minSpend)}+ spent</span>
                                        ) : (
                                            <span>{formatUSD(tier.minSpend)} - {formatUSD(tier.maxSpend)}</span>
                                        )}
                                    </div>

                                    {tier.ticketBonus > 0 && (
                                        <div className="tier-bonus-display">
                                            +{tier.ticketBonus}% Bonus Tickets
                                        </div>
                                    )}

                                    <ul className="tier-perks">
                                        {tier.perks.map((perk, index) => (
                                            <li key={index}>
                                                <i className="ri-check-line"></i>
                                                {perk}
                                            </li>
                                        ))}
                                    </ul>

                                    {!user && (
                                        <Link href="/sign-up">
                                            <button className="tier-cta-btn">Join Now</button>
                                        </Link>
                                    )}

                                    {user && !isUnlocked && (
                                        <div className="tier-locked">
                                            <i className="ri-lock-line"></i>
                                            Spend {formatUSD(tier.minSpend - totalSpend)} more to unlock
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="vip-how-it-works">
                <div className="container">
                    <h2 className="section-title">How VIP Works</h2>

                    <div className="how-it-works-grid">
                        <div className="how-card">
                            <div className="how-icon">
                                <i className="ri-shopping-bag-line"></i>
                            </div>
                            <h3>Make Purchases</h3>
                            <p>Every dollar you spend counts toward your VIP tier. Shop products or buy quick entry tickets.</p>
                        </div>

                        <div className="how-card">
                            <div className="how-icon">
                                <i className="ri-arrow-up-circle-line"></i>
                            </div>
                            <h3>Level Up</h3>
                            <p>Reach spending thresholds to unlock higher tiers with better rewards and perks.</p>
                        </div>

                        <div className="how-card">
                            <div className="how-icon">
                                <i className="ri-gift-line"></i>
                            </div>
                            <h3>Earn Bonuses</h3>
                            <p>Higher tiers earn bonus tickets on every purchase. Platinum members get +20% extra!</p>
                        </div>

                        <div className="how-card">
                            <div className="how-icon">
                                <i className="ri-vip-crown-line"></i>
                            </div>
                            <h3>Exclusive Access</h3>
                            <p>Gold and Platinum members get early access to new raffles and exclusive VIP-only drawings.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!user && isLoaded && (
                <section className="vip-cta">
                    <div className="container">
                        <h2>Start Your VIP Journey Today</h2>
                        <p>Create an account to track your progress and unlock exclusive rewards.</p>
                        <div className="cta-buttons">
                            <Link href="/sign-up">
                                <button className="cta-btn primary">Create Account</button>
                            </Link>
                            <Link href="/prod">
                                <button className="cta-btn secondary">Browse Products</button>
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {user && isLoaded && (
                <section className="vip-cta">
                    <div className="container">
                        <h2>Keep Earning Rewards</h2>
                        <p>Every purchase gets you closer to the next tier. Start shopping now!</p>
                        <div className="cta-buttons">
                            <Link href="/prod">
                                <button className="cta-btn primary">Shop Products</button>
                            </Link>
                            <Link href="/quick-entries">
                                <button className="cta-btn secondary">Buy Tickets</button>
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
