"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Prize segments for the wheel - Dark/black alternating style
const WHEEL_SEGMENTS = [
    { label: "5 Tickets", color: "#1a1a1a", prize: 5 },
    { label: "$100", color: "#2d2d2d", prize: 100 },
    { label: "10 Tickets", color: "#1a1a1a", prize: 10 },
    { label: "JACKPOT", color: "#FFD700", prize: "jackpot", isJackpot: true },
    { label: "2 Tickets", color: "#2d2d2d", prize: 2 },
    { label: "$50", color: "#1a1a1a", prize: 50 },
    { label: "25 Tickets", color: "#2d2d2d", prize: 25 },
    { label: "Try Again", color: "#1a1a1a", prize: 0 },
    { label: "1 Ticket", color: "#2d2d2d", prize: 1 },
    { label: "$200", color: "#1a1a1a", prize: 200 },
    { label: "50 Tickets", color: "#2d2d2d", prize: 50 },
    { label: "FREE SPIN", color: "#00875a", prize: "free", isFree: true },
];

export default function RouletteWheel() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const wheelRef = useRef(null);

    // Handle collect/redeem - requires sign in
    const handleCollect = () => {
        if (!user) {
            router.push("/sign-in");
            return;
        }
        // User is signed in, close the popup
        setShowResult(false);
    };

    const spinWheel = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setShowResult(false);
        setResult(null);

        // Random number of full rotations (6-10) plus random segment
        const fullRotations = 6 + Math.floor(Math.random() * 5);
        const segmentAngle = 360 / WHEEL_SEGMENTS.length;
        const randomSegment = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
        const extraAngle = randomSegment * segmentAngle + segmentAngle / 2;

        const newRotation = rotation + (fullRotations * 360) + extraAngle;
        setRotation(newRotation);

        // Show result after spin completes
        setTimeout(() => {
            const winningIndex = (WHEEL_SEGMENTS.length - randomSegment - 1) % WHEEL_SEGMENTS.length;
            setResult(WHEEL_SEGMENTS[winningIndex]);
            setShowResult(true);
            setIsSpinning(false);
        }, 5500);
    };

    const segmentAngle = 360 / WHEEL_SEGMENTS.length;

    return (
        <section className="roulette-section casino-style">
            <div className="container">
                {/* Header */}
                <div className="roulette-header">
                    <h2 className="section-title casino-title">
                        SPIN TO WIN
                    </h2>
                    <p className="section-subtitle">
                        Try your luck! Spin the wheel for a chance to win tickets and cash prizes!
                    </p>
                </div>

                <div className="roulette-container casino-container">

                    {/* Wheel pointer - Casino style */}
                    <div className="wheel-pointer casino-pointer">
                        <svg viewBox="0 0 60 80" fill="none">
                            <defs>
                                <linearGradient id="pointerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFD700" />
                                    <stop offset="50%" stopColor="#FFA500" />
                                    <stop offset="100%" stopColor="#FFD700" />
                                </linearGradient>
                                <filter id="pointerGlow">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <path d="M30 75L5 10H55L30 75Z" fill="url(#pointerGold)" filter="url(#pointerGlow)" />
                            <path d="M30 65L12 15H48L30 65Z" fill="#FFEC8B" />
                            <circle cx="30" cy="18" r="6" fill="#FFD700" />
                        </svg>
                    </div>

                    {/* The wheel */}
                    <div
                        className="roulette-wheel casino-wheel"
                        ref={wheelRef}
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isSpinning ? 'transform 5.5s cubic-bezier(0.15, 0.60, 0.10, 1)' : 'none'
                        }}
                    >
                        <svg viewBox="0 0 400 400" className="wheel-svg">
                            {/* Outer wheel border */}
                            <circle cx="200" cy="200" r="198" fill="none" stroke="#8B4513" strokeWidth="4" />
                            <circle cx="200" cy="200" r="195" fill="#1a1a1a" stroke="#D4AF37" strokeWidth="2" />

                            {WHEEL_SEGMENTS.map((segment, index) => {
                                const startAngle = index * segmentAngle - 90;
                                const endAngle = startAngle + segmentAngle;
                                const startRad = (startAngle * Math.PI) / 180;
                                const endRad = (endAngle * Math.PI) / 180;
                                const x1 = 200 + 190 * Math.cos(startRad);
                                const y1 = 200 + 190 * Math.sin(startRad);
                                const x2 = 200 + 190 * Math.cos(endRad);
                                const y2 = 200 + 190 * Math.sin(endRad);
                                const largeArc = segmentAngle > 180 ? 1 : 0;

                                // Text position
                                const textAngle = startAngle + segmentAngle / 2;
                                const textRad = (textAngle * Math.PI) / 180;
                                const textX = 200 + 130 * Math.cos(textRad);
                                const textY = 200 + 130 * Math.sin(textRad);

                                // Pin positions at segment boundaries
                                const pinX = 200 + 185 * Math.cos(startRad);
                                const pinY = 200 + 185 * Math.sin(startRad);

                                return (
                                    <g key={index}>
                                        <path
                                            d={`M200,200 L${x1},${y1} A190,190 0 ${largeArc},1 ${x2},${y2} Z`}
                                            fill={segment.color}
                                            stroke="#D4AF37"
                                            strokeWidth="1"
                                        />
                                        {/* Segment divider pins */}
                                        <circle cx={pinX} cy={pinY} r="4" fill="#D4AF37" />
                                        <circle cx={pinX} cy={pinY} r="2" fill="#FFE4B5" />

                                        <text
                                            x={textX}
                                            y={textY}
                                            fill={segment.isJackpot ? "#000" : "#fff"}
                                            fontSize={segment.isJackpot || segment.isFree ? "14" : "11"}
                                            fontWeight="800"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                                            style={{ textShadow: segment.isJackpot ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)' }}
                                        >
                                            {segment.label}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Inner decorative rings */}
                            <circle cx="200" cy="200" r="60" fill="#0a0a0a" stroke="#D4AF37" strokeWidth="3" />
                            <circle cx="200" cy="200" r="50" fill="url(#centerGold)" />
                            <circle cx="200" cy="200" r="35" fill="#0a0a0a" stroke="#D4AF37" strokeWidth="2" />

                            {/* Center logo */}
                            <text x="200" y="195" fill="#FFD700" fontSize="12" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                                DARK
                            </text>
                            <text x="200" y="210" fill="#FFD700" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
                                PINO
                            </text>

                            <defs>
                                <radialGradient id="centerGold" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#FFD700" />
                                    <stop offset="70%" stopColor="#B8860B" />
                                    <stop offset="100%" stopColor="#8B4513" />
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Spin button - Casino style */}
                    <button
                        className={`spin-button casino-spin-btn ${isSpinning ? 'spinning' : ''}`}
                        onClick={spinWheel}
                        disabled={isSpinning}
                    >
                        <span className="btn-shine"></span>
                        {isSpinning ? (
                            <>
                                <i className="ri-loader-4-line spinning-icon"></i>
                                SPINNING...
                            </>
                        ) : (
                            <>
                                <i className="ri-play-circle-fill"></i>
                                SPIN NOW
                            </>
                        )}
                    </button>

                    {/* Result popup - Casino style */}
                    {showResult && result && (
                        <div className="result-popup casino-result">
                            <div className="result-confetti"></div>
                            <div className="result-content casino-result-content">
                                {result.prize === 0 ? (
                                    <>
                                        <div className="result-icon lose">
                                            <i className="ri-emotion-sad-line"></i>
                                        </div>
                                        <h3>NO LUCK!</h3>
                                        <p>Better luck next time, high roller!</p>
                                    </>
                                ) : result.isJackpot ? (
                                    <>
                                        <div className="result-icon jackpot">
                                            <i className="ri-trophy-fill"></i>
                                        </div>
                                        <h3 className="jackpot-text">JACKPOT!</h3>
                                        <p>CONGRATULATIONS! Contact us to claim your grand prize!</p>
                                    </>
                                ) : result.isFree ? (
                                    <>
                                        <div className="result-icon free">
                                            <i className="ri-gift-fill"></i>
                                        </div>
                                        <h3>FREE SPIN!</h3>
                                        <p>You won another spin! Keep the luck rolling!</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="result-icon win">
                                            <i className="ri-star-fill"></i>
                                        </div>
                                        <h3>WINNER!</h3>
                                        <p className="win-amount">{result.label}</p>
                                    </>
                                )}
                                <button
                                    className="result-close casino-close-btn"
                                    onClick={result.isFree ? () => setShowResult(false) : handleCollect}
                                >
                                    {result.isFree ? 'SPIN AGAIN' : (user ? 'COLLECT' : 'SIGN IN TO COLLECT')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="roulette-info casino-info">
                    <p>
                        <strong>VIP SPINS:</strong> Every $100 spent = 1 FREE spin!
                    </p>
                </div>
            </div>
        </section>
    );
}
