"use client";

import { useEffect } from "react";

export default function GlobalBubbles() {
    useEffect(() => {
        const anchor = document.getElementById("bubble-anchor");
        if (!anchor) return;

        // Create container
        const container = document.createElement("div");
        container.id = "global-bubbles";

        // Add SVG goo filter
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.innerHTML = `
            <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                <feColorMatrix in="blur" mode="matrix"
                    values="
                        1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 22 -12
                    "
                    result="goo"
                />
                <feBlend in="SourceGraphic" in2="goo" />
            </filter>
        `;
        container.appendChild(svg);

        // Create bubbles
        for (let i = 0; i < 20; i++) {
            const bubble = document.createElement("div");
            bubble.className = "bubble";

            bubble.style.setProperty("--size", `${1.6 + Math.random() * 3}rem`);
            bubble.style.setProperty("--position", `${Math.random() * 100}%`);
            bubble.style.setProperty("--time", `${6 + Math.random() * 5}s`);
            bubble.style.setProperty("--delay", `${Math.random() * 4}s`);
            bubble.style.setProperty("--distance", `${100 + Math.random() * 140}vh`);

            container.appendChild(bubble);
        }

        anchor.appendChild(container);

        return () => container.remove();
    }, []);

    return null;
}
