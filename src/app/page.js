"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
    const router = useRouter();
    const [specialOffers, setSpecialOffers] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [activeRaffles, setActiveRaffles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalWinners: 247,
        prizesGiven: "$1.2M+",
        activeRaffles: 12
    });
    const [ticketQuantities, setTicketQuantities] = useState({});

    useEffect(() => {
        async function loadData() {
            try {
                // Load products
                const res = await fetch("/products.json");
                const data = await res.json();

                // Special offers (items with specialOffer flag)
                const offers = data.filter(product => product.specialOffer === true);
                setSpecialOffers(offers);

                // All products for Featured Prizes section (excluding special offers)
                const allProds = [...data]
                    .filter(p => !p.specialOffer)
                    .sort((a, b) => b.price - a.price);
                setAllProducts(allProds);

                // Featured products (highest priced items) - for backwards compatibility
                const featured = allProds.slice(0, 4);
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

    const calculateTickets = (price) => Math.floor(price / 100);

    // Get ticket quantity for a product (default 1)
    const getTicketQty = (productId) => ticketQuantities[productId] || 1;

    // Update ticket quantity for a product
    const updateTicketQty = (productId, delta) => {
        setTicketQuantities(prev => {
            const current = prev[productId] || 1;
            const newQty = Math.max(1, current + delta);
            return { ...prev, [productId]: newQty };
        });
    };

    // Set specific ticket quantity
    const setTicketQty = (productId, qty) => {
        const newQty = Math.max(1, parseInt(qty) || 1);
        setTicketQuantities(prev => ({ ...prev, [productId]: newQty }));
    };

    // Add tickets to cart for a prize
    const addTicketsToCart = (product, ticketCount) => {
        const totalPrice = ticketCount * 100; // $100 per ticket
        let cart = JSON.parse(localStorage.getItem("dpino-cart")) || [];

        // Create a unique ID for ticket entries
        const ticketItemId = `ticket-${product.id}`;
        const existing = cart.find(item => item.id === ticketItemId);

        if (existing) {
            existing.qty += ticketCount;
        } else {
            cart.push({
                id: ticketItemId,
                name: `${ticketCount} Ticket${ticketCount > 1 ? 's' : ''} for ${product.name}`,
                price: 100,
                image: product.image,
                qty: ticketCount,
                isTicket: true,
                prizeId: product.id,
                prizeName: product.name
            });
        }

        localStorage.setItem("dpino-cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cart-updated"));

        // Reset quantity after adding
        setTicketQuantities(prev => ({ ...prev, [product.id]: 1 }));

        alert(`Added ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} to cart! Total: ${formatUSD(totalPrice)}`);
    };

    // Buy tickets now (add to cart and go to checkout)
    const buyTicketsNow = (product, ticketCount) => {
        const totalPrice = ticketCount * 100;
        let cart = JSON.parse(localStorage.getItem("dpino-cart")) || [];

        const ticketItemId = `ticket-${product.id}`;
        const existing = cart.find(item => item.id === ticketItemId);

        if (existing) {
            existing.qty += ticketCount;
        } else {
            cart.push({
                id: ticketItemId,
                name: `${ticketCount} Ticket${ticketCount > 1 ? 's' : ''} for ${product.name}`,
                price: 100,
                image: product.image,
                qty: ticketCount,
                isTicket: true,
                prizeId: product.id,
                prizeName: product.name
            });
        }

        localStorage.setItem("dpino-cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cart-updated"));
        router.push("/cart");
    };

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

    const buyNow = (product) => {
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
        window.dispatchEvent(new Event("cart-updated"));
        router.push("/cart");
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
                    <img
                        src="/images/hero-mascot.png"
                        alt="Dark Pino Mascot"
                        className="hero-mascot"
                    />
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
                            <p>Each ticket costs $100. More tickets = more chances to win!</p>
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

            {/* Featured Prizes - All Products */}
            <section className="featured-prizes">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Featured Prizes</h2>
                            <p className="section-subtitle">Shop now to earn tickets and win amazing prizes</p>
                        </div>
                    </div>

                    <div className="prizes-grid all-prizes">
                        {allProducts.map((product, index) => (
                            <div key={product.id} className="prize-card">
                                {index < 2 && (
                                    <div className="new-badge">NEW</div>
                                )}
                                <Link href={`/detail/${product.id}`}>
                                    <div className="prize-image">
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                </Link>
                                <div className="prize-content">
                                    <Link href={`/detail/${product.id}`}>
                                        <h3 className="prize-name">{product.name}</h3>
                                    </Link>
                                    <div className="prize-value">
                                        <span className="prize-price">{formatUSD(product.price)}</span>
                                        <span className="prize-value-label">Prize Value</span>
                                    </div>

                                    {/* Ticket Quantity Selector */}
                                    <div className="ticket-selector">
                                        <div className="ticket-selector-label">
                                            <i className="ri-ticket-2-line"></i> Buy Tickets
                                        </div>
                                        <div className="ticket-qty-controls">
                                            <button
                                                className="qty-btn minus"
                                                onClick={() => updateTicketQty(product.id, -1)}
                                                disabled={getTicketQty(product.id) <= 1}
                                            >
                                                <i className="ri-subtract-line"></i>
                                            </button>
                                            <input
                                                type="number"
                                                className="qty-input"
                                                value={getTicketQty(product.id)}
                                                onChange={(e) => setTicketQty(product.id, e.target.value)}
                                                min="1"
                                            />
                                            <button
                                                className="qty-btn plus"
                                                onClick={() => updateTicketQty(product.id, 1)}
                                            >
                                                <i className="ri-add-line"></i>
                                            </button>
                                        </div>
                                        <div className="ticket-total">
                                            <span className="ticket-total-price">
                                                {formatUSD(getTicketQty(product.id) * 100)}
                                            </span>
                                            <span className="ticket-total-label">
                                                for {getTicketQty(product.id)} ticket{getTicketQty(product.id) > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="prize-buttons">
                                        <button
                                            className="prize-btn add-to-cart-btn"
                                            onClick={() => addTicketsToCart(product, getTicketQty(product.id))}
                                        >
                                            <i className="ri-shopping-cart-line"></i> Add to Cart
                                        </button>
                                        <button
                                            className="prize-btn buy-now-btn"
                                            onClick={() => buyTicketsNow(product, getTicketQty(product.id))}
                                        >
                                            <i className="ri-flashlight-line"></i> Buy Now
                                        </button>
                                    </div>
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
