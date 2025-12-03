"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Simulated clearance data - in production, this would come from a database
const CLEARANCE_ITEMS = [
    {
        id: 101,
        name: "Sample Clearance Item 1",
        originalPrice: 500,
        salePrice: 350,
        discount: 30,
        image: "/img/9.jpeg",
        description: "Limited quantity available at this price!",
        tickets: 35
    },
    {
        id: 102,
        name: "Sample Clearance Item 2",
        originalPrice: 800,
        salePrice: 480,
        discount: 40,
        image: "/img/10.jpeg",
        description: "Final sale - while supplies last!",
        tickets: 48
    },
    {
        id: 103,
        name: "Sample Clearance Item 3",
        originalPrice: 1200,
        salePrice: 720,
        discount: 40,
        image: "/img/11.jpg",
        description: "Exclusive clearance deal!",
        tickets: 72
    }
];

export default function ClearancePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProducts() {
            try {
                // Load actual products and create clearance versions
                const res = await fetch("/products.json");
                const data = await res.json();

                // Take some mid-range products and mark them as clearance
                const clearanceProducts = data
                    .filter(p => !p.specialOffer && p.price >= 600 && p.price <= 2000)
                    .slice(0, 6)
                    .map(product => ({
                        ...product,
                        originalPrice: product.price,
                        salePrice: Math.round(product.price * 0.7), // 30% off
                        discount: 30,
                        tickets: Math.floor((product.price * 0.7) / 100) * 10
                    }));

                setProducts(clearanceProducts);
            } catch (err) {
                console.error("Error loading clearance products:", err);
                // Fallback to sample data
                setProducts(CLEARANCE_ITEMS);
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    const addToCart = (product) => {
        let cart = JSON.parse(localStorage.getItem("dpino-cart")) || [];
        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.salePrice,
                originalPrice: product.originalPrice,
                image: product.image,
                qty: 1,
                isClearance: true,
                discount: product.discount
            });
        }

        localStorage.setItem("dpino-cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cart-updated"));
        alert(`Added to cart! You save ${formatUSD(product.originalPrice - product.salePrice)}!`);
    };

    return (
        <main className="clearance-page">
            {/* Hero Section */}
            <section className="clearance-hero">
                <div className="container">
                    <div className="clearance-badge">
                        <i className="ri-percent-fill"></i>
                        Limited Time
                    </div>
                    <h1 className="clearance-title">
                        Clearance <span>Sale</span>
                    </h1>
                    <p className="clearance-subtitle">
                        Score incredible deals on select luxury items. Same quality, massive savings.
                        Don't miss out - quantities are limited!
                    </p>
                    <div className="clearance-stats">
                        <div className="stat">
                            <span className="stat-value">Up to 40%</span>
                            <span className="stat-label">OFF</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">Full</span>
                            <span className="stat-label">Tickets Earned</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">Limited</span>
                            <span className="stat-label">Quantities</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Clearance Items Grid */}
            <section className="clearance-items">
                <div className="container">
                    {loading ? (
                        <div className="loading-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="clearance-skeleton">
                                    <div className="skeleton-image"></div>
                                    <div className="skeleton-content">
                                        <div className="skeleton-line"></div>
                                        <div className="skeleton-line short"></div>
                                        <div className="skeleton-line"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="no-clearance">
                            <i className="ri-shopping-bag-line"></i>
                            <h2>No Clearance Items Available</h2>
                            <p>Check back soon for new deals!</p>
                            <Link href="/prod">
                                <button className="browse-btn">Browse All Products</button>
                            </Link>
                        </div>
                    ) : (
                        <div className="clearance-grid">
                            {products.map((product) => (
                                <div key={product.id} className="clearance-card">
                                    <div className="discount-badge">
                                        <span className="discount-value">-{product.discount}%</span>
                                    </div>

                                    <Link href={`/detail/${product.id}`}>
                                        <div className="clearance-image">
                                            <img src={product.image} alt={product.name} />
                                            <div className="sale-ribbon">SALE</div>
                                        </div>
                                    </Link>

                                    <div className="clearance-content">
                                        <Link href={`/detail/${product.id}`}>
                                            <h3 className="clearance-name">{product.name}</h3>
                                        </Link>

                                        <div className="price-section">
                                            <span className="original-price">
                                                {formatUSD(product.originalPrice)}
                                            </span>
                                            <span className="sale-price">
                                                {formatUSD(product.salePrice)}
                                            </span>
                                        </div>

                                        <div className="savings">
                                            <i className="ri-price-tag-3-line"></i>
                                            Save {formatUSD(product.originalPrice - product.salePrice)}
                                        </div>

                                        <div className="clearance-tickets">
                                            <i className="ri-ticket-2-line"></i>
                                            Earn {product.tickets} tickets
                                        </div>

                                        <button
                                            className="clearance-btn"
                                            onClick={() => addToCart(product)}
                                        >
                                            <i className="ri-shopping-cart-line"></i>
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Info Banner */}
            <section className="clearance-info">
                <div className="container">
                    <div className="info-cards">
                        <div className="info-card">
                            <i className="ri-shield-check-line"></i>
                            <h3>Same Quality</h3>
                            <p>All clearance items are brand new and in perfect condition.</p>
                        </div>
                        <div className="info-card">
                            <i className="ri-ticket-2-line"></i>
                            <h3>Full Ticket Value</h3>
                            <p>Earn tickets based on the sale price - no penalties!</p>
                        </div>
                        <div className="info-card">
                            <i className="ri-time-line"></i>
                            <h3>Limited Time</h3>
                            <p>Clearance deals won't last forever. Act fast!</p>
                        </div>
                        <div className="info-card">
                            <i className="ri-exchange-line"></i>
                            <h3>Final Sale</h3>
                            <p>All clearance sales are final. No returns or exchanges.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="clearance-cta">
                <div className="container">
                    <h2>Want More Options?</h2>
                    <p>Browse our full collection of luxury items</p>
                    <div className="cta-buttons">
                        <Link href="/prod">
                            <button className="cta-primary">
                                <i className="ri-shopping-bag-line"></i> Shop All Products
                            </button>
                        </Link>
                        <Link href="/contest">
                            <button className="cta-secondary">
                                <i className="ri-gift-line"></i> View Prizes
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
