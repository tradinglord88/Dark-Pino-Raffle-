"use client";

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

const formatUSD = (n) =>
    Number(n || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });

export default function VIPPage() {
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

            {/* Tiers Grid */}
            <section className="vip-tiers-section">
                <div className="container">
                    <h2 className="section-title">Membership Tiers</h2>
                    <p className="section-subtitle">
                        The more you spend, the more rewards you unlock. All tiers are based on lifetime spending.
                    </p>

                    <div className="vip-tiers">
                        {VIP_TIERS.map((tier) => (
                            <div
                                key={tier.id}
                                className={`vip-tier ${tier.id}`}
                                style={{ "--tier-color": tier.color }}
                            >
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

                                <Link href="/sign-up">
                                    <button className="tier-cta-btn">Join Now</button>
                                </Link>
                            </div>
                        ))}
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
        </main>
    );
}
