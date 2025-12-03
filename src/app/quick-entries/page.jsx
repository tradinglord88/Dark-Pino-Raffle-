"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// Quick entry ticket bundles - $100 = 1 ticket base rate
const TICKET_BUNDLES = [
    { id: 1, tickets: 1, price: 100, popular: false, savings: 0, bonus: 0 },
    { id: 2, tickets: 3, price: 250, popular: false, savings: 50, bonus: 0 },
    { id: 3, tickets: 5, price: 400, popular: true, savings: 100, bonus: 0 },
    { id: 4, tickets: 10, price: 750, popular: false, savings: 250, bonus: 0 },
    { id: 5, tickets: 25, price: 1500, popular: false, savings: 1000, bonus: 5 },
];

export default function QuickEntriesPage() {
    const { user, isLoaded } = useUser();
    const [ticketBalance, setTicketBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState(null);

    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    // Load user ticket balance
    useEffect(() => {
        if (!isLoaded) return;

        async function loadBalance() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("users")
                    .select("tickets")
                    .eq("clerk_id", user.id)
                    .single();

                if (!error && data) {
                    setTicketBalance(data.tickets || 0);
                }
            } catch (err) {
                console.error("Error loading balance:", err);
            } finally {
                setLoading(false);
            }
        }

        loadBalance();
    }, [user, isLoaded]);

    // Handle bundle purchase
    const handlePurchase = async (bundle) => {
        if (!user) {
            window.location.href = "/sign-in";
            return;
        }

        setSelectedBundle(bundle.id);
        setPurchasing(true);

        try {
            // Create checkout session for quick entry bundle
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart: [{
                        id: `quick-entry-${bundle.id}`,
                        name: `${bundle.tickets} Quick Entry Tickets`,
                        price: bundle.price,
                        image: "/Image/BuyTicket.png",
                        qty: 1,
                        paidQuantity: 1,
                        totalTickets: bundle.tickets
                    }],
                    userId: user.id,
                    userEmail: user.primaryEmailAddress?.emailAddress,
                    paymentMethod: "stripe"
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Failed to create checkout session");
            }
        } catch (err) {
            console.error("Purchase error:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setPurchasing(false);
            setSelectedBundle(null);
        }
    };

    return (
        <main className="quick-entries-page">
            {/* Hero Section */}
            <section className="quick-entries-hero">
                <div className="container">
                    <h1 className="quick-entries-title">
                        Quick <span>Entry Tickets</span>
                    </h1>
                    <p className="quick-entries-subtitle">
                        Get more chances to win with bulk ticket bundles.
                        The more tickets you have, the better your odds!
                    </p>

                    {/* Ticket Balance Display */}
                    {isLoaded && user && (
                        <div className="ticket-balance-card">
                            <div className="balance-icon">🎟</div>
                            <div className="balance-info">
                                <span className="balance-label">Your Current Balance</span>
                                <span className="balance-value">{ticketBalance} Tickets</span>
                            </div>
                            <Link href="/contest" className="use-tickets-btn">
                                Use Tickets →
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Bundles Grid */}
            <section className="quick-entries-bundles">
                <div className="container">
                    <h2 className="section-title">Choose Your Bundle</h2>
                    <p className="section-subtitle">
                        Save more when you buy in bulk. All tickets can be used on any prize!
                    </p>

                    <div className="bundles-grid">
                        {TICKET_BUNDLES.map((bundle) => (
                            <div
                                key={bundle.id}
                                className={`quick-entry-card ${bundle.popular ? "popular" : ""}`}
                            >
                                {bundle.popular && (
                                    <div className="popular-badge">Most Popular</div>
                                )}

                                {bundle.bonus > 0 && (
                                    <div className="bonus-badge">
                                        +{bundle.bonus} Bonus Tickets!
                                    </div>
                                )}

                                <div className="bundle-tickets">
                                    <span className="ticket-count">{bundle.tickets}</span>
                                    <span className="ticket-label">Tickets</span>
                                </div>

                                <div className="bundle-price">
                                    {formatUSD(bundle.price)}
                                </div>

                                <div className="price-per-ticket">
                                    ${(bundle.price / bundle.tickets).toFixed(2)} per ticket
                                </div>

                                {bundle.savings > 0 && (
                                    <div className="savings-text">
                                        You save {formatUSD(bundle.savings)}!
                                    </div>
                                )}

                                <button
                                    className="buy-bundle-btn"
                                    onClick={() => handlePurchase(bundle)}
                                    disabled={purchasing}
                                >
                                    {purchasing && selectedBundle === bundle.id ? (
                                        <span className="loading-spinner">Processing...</span>
                                    ) : (
                                        <>
                                            <i className="ri-shopping-cart-line"></i> Buy Now
                                        </>
                                    )}
                                </button>

                                <div className="bundle-features">
                                    <div className="feature">
                                        <i className="ri-check-line"></i>
                                        Use on any prize
                                    </div>
                                    <div className="feature">
                                        <i className="ri-check-line"></i>
                                        Never expires
                                    </div>
                                    <div className="feature">
                                        <i className="ri-check-line"></i>
                                        Instant delivery
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="quick-entries-info">
                <div className="container">
                    <h2 className="section-title">How Quick Entries Work</h2>

                    <div className="info-grid">
                        <div className="info-card">
                            <div className="info-icon">1</div>
                            <h3>Purchase Tickets</h3>
                            <p>Choose a ticket bundle that fits your budget. Larger bundles offer better value.</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">2</div>
                            <h3>Browse Prizes</h3>
                            <p>Head to the Prizes page and explore all available drawings and grand prizes.</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">3</div>
                            <h3>Enter Raffles</h3>
                            <p>Use your tickets to enter any prize drawing. More tickets = better odds!</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">4</div>
                            <h3>Win Big</h3>
                            <p>Winners are selected randomly from all entries. You could be next!</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grand Prizes Reminder */}
            <section className="grand-prizes-reminder">
                <div className="container">
                    <div className="reminder-content">
                        <div className="reminder-text">
                            <h2>Every Ticket Counts Toward Grand Prizes</h2>
                            <p>
                                All eligible entries are automatically included in our Grand Prize drawings,
                                including the 2022 Lamborghini Huracan and Rolex Daytona Rose Gold!
                            </p>
                            <Link href="/contest" className="view-prizes-btn">
                                View All Prizes →
                            </Link>
                        </div>
                        <div className="reminder-images">
                            <img src="/Image/lambo.jpg" alt="Lamborghini" />
                            <img src="/Image/rolex.jpg" alt="Rolex" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!user && isLoaded && (
                <section className="quick-entries-cta">
                    <div className="container">
                        <h2>Ready to Start Winning?</h2>
                        <p>Sign up now to purchase tickets and enter our exclusive prize drawings.</p>
                        <div className="cta-buttons">
                            <Link href="/sign-up">
                                <button className="cta-btn primary">Create Account</button>
                            </Link>
                            <Link href="/sign-in">
                                <button className="cta-btn secondary">Sign In</button>
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
