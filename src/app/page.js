"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [specialOffers, setSpecialOffers] = useState([]);

  useEffect(() => {
    // Load special offer products
    fetch("/products.json")
      .then(res => res.json())
      .then(data => {
        const offers = data.filter(product => product.specialOffer === true);
        setSpecialOffers(offers);
      });
  }, []);

  const formatUSD = (n) =>
    Number(n || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const addToCart = (product) => {
    // Get existing cart
    let cart = JSON.parse(localStorage.getItem("dpino-cart")) || [];

    // Check if item already exists
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.qty += 1;   // increase quantity
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1,
        specialOffer: true,
        offerType: "buy10get2"
      });
    }

    // Save back into storage
    localStorage.setItem("dpino-cart", JSON.stringify(cart));

    alert("Added to cart! Special Offer: Buy 10 Get 2 Free!");
  };

  return (
    <main>
      <section className="hero-section"></section>

      <section className="sp-section">
        <div className="sp-desc">
          <h1>Special Offers</h1>
          <p>Limited Time Offers - Buy 10 Get 2 Free!</p>
        </div>

        <div className="sp-container">
          {specialOffers.map((product) => (
            <div key={product.id} className="sp-card">
              <img src={product.image} alt={product.name} />
              <div className="sp-card-content">
                <div className="sp-card-text">
                  <h3>{product.name}</h3>
                  <div className="sp-price">{formatUSD(product.price)}</div>
                  <div className="sp-tickets">🎟 {Math.floor(product.price / 100) * 10} Tickets</div>
                </div>

                {/* Special Offer Badge */}
                <div className="sp-badge">
                  🎁 Buy 10 Get 2 Free!
                </div>

                {/* Offer Details */}
                <div className="sp-offer-details">
                  <p>• Buy 10 items, get 2 FREE</p>
                  <p>• Earn {Math.floor(product.price / 100) * 10} tickets per item</p>
                  <p>• Free items don't earn tickets</p>
                </div>

                <button
                  className="sp-add-to-cart-btn"
                  onClick={() => addToCart(product)}
                >
                  Add To Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}