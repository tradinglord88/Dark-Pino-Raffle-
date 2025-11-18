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
                        <button>Check Out</button>
                        <button>Add To Cart</button>
                    </div>

                    <div className="description">{product.description}</div>
                </div>
            </div>

            <div className="title">Similar product</div>
            <div className="listProduct">
                {similar.map((prod) => (
                    <a key={prod.id} href={`/detail/${prod.id}`} className="item">
                        <img src={prod.image} alt={prod.name} />
                        <h2>{prod.name}</h2>
                        <div className="price-line">
                            <div className="price">{formatUSD(prod.price)}</div>
                            <div className="tickets">
                                🎟 {calcTickets(prod.price)} Tickets
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
