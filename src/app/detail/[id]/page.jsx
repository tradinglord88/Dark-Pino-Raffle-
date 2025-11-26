// app/detail/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";

export default function ProductDetail({ params }) {
    const [product, setProduct] = useState(null);
    const [similar, setSimilar] = useState([]);

    // Must unwrap params
    const [id, setId] = useState(null);

    useEffect(() => {
        async function unwrapParams() {
            const resolved = await params;
            setId(resolved.id);
        }
        unwrapParams();
    }, [params]);

    useEffect(() => {
        if (!id) return;

        fetch("/products.json")
            .then(res => res.json())
            .then(data => {
                const item = data.find(p => String(p.id) === String(id));
                setProduct(item);

                const sims = data
                    .filter(v => String(v.id) !== String(id))
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 6);

                setSimilar(sims);
            });
    }, [id]);

    if (!product) {
        return <p style={{ color: "#F8C200" }}>Loading product...</p>;
    }

    const formatUSD = (n) =>
        Number(n || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });

    const calcTickets = (price) => Math.floor((Number(price) || 0) / 100);

    const addToCart = () => {
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
                qty: 1
            });
        }

        // Save back into storage
        localStorage.setItem("dpino-cart", JSON.stringify(cart));

        alert("Added to cart!");
    };

    return (
        <div className="container">
            <div className="detail">
                <div className="image">
                    <img src={product.image} alt={product.name} />
                </div>

                <div className="content">
                    <h1 className="name">{product.name}</h1>

                    <div className="price pagep">
                        {formatUSD(product.price)}
                        <div className="tickets">
                            🎟 {calcTickets(product.price)} Tickets
                        </div>
                    </div>

                    <div className="buttons">
                        <button onClick={addToCart}>
                            Add To Cart
                        </button>
                    </div>

                    <div className="description">{product.description}</div>
                </div>
            </div>

            <div className="title">Similar product</div>

            <div className="listProduct">
                {similar.map((prod) => (
                    <a key={prod.id} href={`/detail/${prod.id}`} className="dp-card">
                        <img src={prod.image} alt={prod.name} />

                        <div className="dp-title">{prod.name}</div>

                        <div className="dp-info">
                            <div className="dp-price">{formatUSD(prod.price)}</div>
                            <div className="dp-tickets">
                                🎟 {calcTickets(prod.price)} Tickets
                            </div>
                        </div>
                    </a>
                ))}
            </div>

        </div>
    );
}