"use client";

import { useEffect, useState } from "react";

export default function ProdPage() {
    const [products, setProducts] = useState([]);

    // Formatters
    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    const calcTickets = (price) => Math.floor((Number(price) || 0) / 100);

    // Load products.json from public folder
    useEffect(() => {
        fetch("/products.json")
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((err) => console.error("Failed loading JSON:", err));
    }, []);

    return (
        <div className="container">
            <div className="title">Dark Pino 1 of 1s For Sale</div>

            <div className="listProduct">
                {products.length === 0 && (
                    <p style={{ color: "#F8C200" }}>Loading products...</p>
                )}

                {products.map((prod) => {
                    const price = Number(prod.price);
                    const tickets = calcTickets(price);

                    return (
                        <a
                            key={prod.id}
                            href={`/detail/${prod.id}`}
                            className="dp-card"
                        >
                            <img src={prod.image} alt={prod.name} />

                            <div className="dp-content">
                                <div className="dp-title">{prod.name}</div>

                                <div className="dp-info">
                                    <div className="dp-price">{formatUSD(price)}</div>
                                    <div className="dp-tickets">🎟 {tickets} Tickets</div>
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}