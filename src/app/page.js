"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
    const [specialOffers, setSpecialOffers] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [activeRaffles, setActiveRaffles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalWinners: 247,
        prizesGiven: "$1.2M+",
        activeRaffles: 12
    });

    useEffect(() => {
        async function loadData() {
            try {
                // Load products
                const res = await fetch("/products.json");
                const data = await res.json();

                // Special offers (items with specialOffer flag)
                const offers = data.filter(product => product.specialOffer === true);
                setSpecialOffers(offers);

                // Featured products (highest priced items)
                const featured = [...data]
                    .filter(p => !p.specialOffer)
                    .sort((a, b) => b.price - a.price)
                    .slice(0, 4);
                setFeaturedProducts(featured);

                // New arrivals (latest products by ID - highest IDs = newest)
                const arrivals = [...data]
                    .filter(p => !p.specialOffer)
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 6);
                setNewArrivals(arrivals);

                // Load active raffles from Supabase
                const { data: raffles, error } = await supabase
                    .from("raffles")
                    .select("*")
                    .eq("status", "active")
                    .order("end_date", { ascending: true })
                    .limit(3);

                if (!error && raffles) {
                    setActiveRaffles(raffles);
                }
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    const calculateTickets = (price) => Math.floor(price / 100) * 10;

    const addToCart = (product) => {
        let cart = JSON.parse(localStorage.getItem("dpino-cart")) || [];
        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                qty: 1,
                specialOffer: product.specialOffer || false,
                offerType: product.offerType || null
            });
        }

        localStorage.setItem("dpino-cart", JSON.stringify(cart));

        // Dispatch cart update event
        window.dispatchEvent(new Event("cart-updated"));

        if (product.specialOffer) {
            alert("Added to cart! Special Offer: Buy 10 Get 2 Free!");
        } else {
            alert(`Added to cart! Earn ${calculateTickets(product.price)} tickets!`);
        }
    };

    return (
        <main className="home-page">
            {/* Hero Section */}
            <section className="home-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        Dark Pino <span>Prizes</span>
                    </h1>
                    <p className="hero-subtitle">
                        Shop exclusive custom luxury items and earn tickets to win incredible prizes.
                        Every purchase gets you closer to winning.
                    </p>
                    <div className="hero-cta">
                        <Link href="/contest">
                            <button className="cta-primary">
                                <i className="ri-gift-line"></i> View Prizes
                            </button>
                        </Link>
                        <Link href="/prod">
                            <button className="cta-secondary">
                                <i className="ri-shopping-bag-line"></i> Shop Now
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Floating Stats */}
                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-number">{stats.totalWinners}+</span>
                        <span className="stat-label">Winners</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.prizesGiven}</span>
                        <span className="stat-label">Prizes Given</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.activeRaffles}</span>
                        <span className="stat-label">Active Raffles</span>
                    </div>
                </div>
            </section>

            {/* Just Arrived Section */}
            {newArrivals.length > 0 && (
                <section className="just-arrived">
                    <div className="container">
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">
                                    <i className="ri-sparkle-fill"></i> Just Arrived
                                </h2>
                                <p className="section-subtitle">Fresh drops you don't want to miss</p>
                            </div>
                            <Link href="/prod" className="view-all-link">
                                Shop All <i className="ri-arrow-right-line"></i>
                            </Link>
                        </div>

                        <div className="arrivals-grid">
                            {newArrivals.map((product, index) => (
                                <div key={product.id} className="arrival-card">
                                    {index < 2 && (
                                        <div className="new-badge">
                                            <i className="ri-sparkle-line"></i> NEW
                                        </div>
                                    )}
                                    <Link href={`/detail/${product.id}`}>
                                        <div className="arrival-image">
                                            <img src={product.image} alt={product.name} />
                                        </div>
                                    </Link>
                                    <div className="arrival-content">
                                        <Link href={`/detail/${product.id}`}>
                                            <h3 className="arrival-name">{product.name}</h3>
                                        </Link>
                                        <div className="arrival-meta">
                                            <span className="arrival-price">{formatUSD(product.price)}</span>
                                            <span className="arrival-tickets">
                                                <i className="ri-ticket-2-line"></i>
                                                {calculateTickets(product.price)} tickets
                                            </span>
                                        </div>
                                        <button
                                            className="arrival-btn"
                                            onClick={() => addToCart(product)}
                                        >
                                            <i className="ri-shopping-cart-line"></i> Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">Three simple steps to start winning</p>

                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">
                                <i className="ri-shopping-cart-line"></i>
                            </div>
                            <h3>Shop Products</h3>
                            <p>Browse our collection of exclusive custom luxury items and add to cart.</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">
                                <i className="ri-ticket-2-line"></i>
                            </div>
                            <h3>Earn Tickets</h3>
                            <p>Every $10 spent earns you 1 ticket. More tickets = more chances to win!</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">
                                <i className="ri-trophy-line"></i>
                            </div>
                            <h3>Win Prizes</h3>
                            <p>Enter your tickets into raffles for a chance to win amazing prizes.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Prizes */}
            <section className="featured-prizes">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Featured Prizes</h2>
                            <p className="section-subtitle">This month's hottest items up for grabs</p>
                        </div>
                        <Link href="/contest" className="view-all-link">
                            View All Prizes <i className="ri-arrow-right-line"></i>
                        </Link>
                    </div>

                    <div className="prizes-grid">
                        {featuredProducts.map((product, index) => (
                            <div key={product.id} className={`prize-card ${index === 0 ? "featured" : ""}`}>
                                {index === 0 && (
                                    <div className="featured-badge">
                                        <i className="ri-fire-fill"></i> Hot Prize
                                    </div>
                                )}
                                <div className="prize-image">
                                    <img src={product.image} alt={product.name} />
                                </div>
                                <div className="prize-content">
                                    <h3 className="prize-name">{product.name}</h3>
                                    <div className="prize-value">
                                        <span className="value-label">Value</span>
                                        <span className="value-amount">{formatUSD(product.price)}</span>
                                    </div>
                                    <div className="prize-tickets">
                                        <i className="ri-ticket-2-line"></i>
                                        {calculateTickets(product.price)} tickets to enter
                                    </div>
                                    <Link href={`/detail/${product.id}`}>
                                        <button className="prize-btn">
                                            View Details <i className="ri-arrow-right-s-line"></i>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Entry Banner */}
            <section className="quick-entry-banner">
                <div className="container">
                    <div className="banner-content">
                        <div className="banner-text">
                            <h2>
                                <i className="ri-flashlight-line"></i>
                                Quick Entry Tickets
                            </h2>
                            <p>Don't want to shop? Buy tickets directly and enter any raffle instantly!</p>
                        </div>
                        <Link href="/quick-entries">
                            <button className="banner-btn">
                                Buy Tickets <i className="ri-arrow-right-line"></i>
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Special Offers */}
            {specialOffers.length > 0 && (
                <section className="special-offers">
                    <div className="container">
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">
                                    <i className="ri-price-tag-3-fill"></i> Special Offers
                                </h2>
                                <p className="section-subtitle">Limited time deals - Buy 10 Get 2 Free!</p>
                            </div>
                        </div>

                        <div className="offers-grid">
                            {specialOffers.map((product) => (
                                <div key={product.id} className="offer-card">
                                    <div className="offer-badge">
                                        <i className="ri-gift-line"></i> Buy 10 Get 2 Free
                                    </div>
                                    <div className="offer-image">
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                    <div className="offer-content">
                                        <h3 className="offer-name">{product.name}</h3>
                                        <div className="offer-price">{formatUSD(product.price)}</div>
                                        <div className="offer-tickets">
                                            <i className="ri-ticket-2-line"></i>
                                            Earn {calculateTickets(product.price)} tickets each
                                        </div>
                                        <button
                                            className="offer-btn"
                                            onClick={() => addToCart(product)}
                                        >
                                            <i className="ri-shopping-cart-line"></i> Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* VIP Membership Promo */}
            <section className="vip-promo">
                <div className="container">
                    <div className="vip-promo-card">
                        <div className="vip-promo-content">
                            <div className="vip-icon">
                                <i className="ri-vip-crown-fill"></i>
                            </div>
                            <h2>Become a VIP Member</h2>
                            <p>
                                Unlock exclusive perks, bonus tickets on every purchase, and early access
                                to the hottest raffles. Platinum members get +20% bonus tickets!
                            </p>
                            <div className="vip-tiers-preview">
                                <span className="tier bronze"><i className="ri-medal-line"></i> Bronze</span>
                                <span className="tier silver"><i className="ri-medal-fill"></i> Silver +5%</span>
                                <span className="tier gold"><i className="ri-vip-crown-line"></i> Gold +10%</span>
                                <span className="tier platinum"><i className="ri-vip-crown-fill"></i> Platinum +20%</span>
                            </div>
                            <Link href="/vip">
                                <button className="vip-promo-btn">
                                    Learn More <i className="ri-arrow-right-line"></i>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Winners */}
            <section className="recent-winners">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Recent Winners</h2>
                            <p className="section-subtitle">Real people winning real prizes</p>
                        </div>
                        <Link href="/past-winners" className="view-all-link">
                            View All Winners <i className="ri-arrow-right-line"></i>
                        </Link>
                    </div>

                    <div className="winners-marquee">
                        <div className="marquee-track">
                            {/* Sample winners - would be dynamic from database */}
                            {[
                                { name: "Alex M.", prize: "LV Custom Bag", value: "$15,000" },
                                { name: "Sarah K.", prize: "Chanel Boots", value: "$4,000" },
                                { name: "Mike R.", prize: "Nike SB Dunks", value: "$1,900" },
                                { name: "Jessica L.", prize: "Gucci Jacket", value: "$2,600" },
                                { name: "David W.", prize: "Custom Sneakers", value: "$1,600" },
                                { name: "Emma T.", prize: "LV Clutch", value: "$2,800" },
                            ].map((winner, index) => (
                                <div key={index} className="winner-chip">
                                    <div className="winner-avatar">
                                        <i className="ri-user-smile-line"></i>
                                    </div>
                                    <div className="winner-info">
                                        <span className="winner-name">{winner.name}</span>
                                        <span className="winner-prize">Won {winner.prize}</span>
                                    </div>
                                    <span className="winner-value">{winner.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta">
                <div className="container">
                    <h2>Ready to Win?</h2>
                    <p>Start shopping today and you could be our next big winner!</p>
                    <div className="cta-buttons">
                        <Link href="/prod">
                            <button className="cta-primary">
                                <i className="ri-shopping-bag-line"></i> Start Shopping
                            </button>
                        </Link>
                        <Link href="/quick-entries">
                            <button className="cta-secondary">
                                <i className="ri-ticket-2-line"></i> Buy Tickets
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
