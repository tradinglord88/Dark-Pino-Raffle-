"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function obfuscateEmail(email) {
    if (!email) return "winner@dpino.com";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const visible = user.slice(0, Math.min(2, user.length));
    return `${visible}***@${domain}`;
}

export default function WinnerRevealPage({ params }) {

    // ⬇️ THIS IS THE FIX
    const { id: prizeId } = use(params);



    const [loading, setLoading] = useState(true);
    const [prize, setPrize] = useState(null);
    const [winnerRow, setWinnerRow] = useState(null);

    const [slotItems, setSlotItems] = useState([]);
    const [reel1, setReel1] = useState("");
    const [reel2, setReel2] = useState("");
    const [reel3, setReel3] = useState("");
    const [winnerMasked, setWinnerMasked] = useState("");
    const [isRevealed, setIsRevealed] = useState(false);

    // Load prize + winner
    useEffect(() => {
        if (!prizeId) return;

        async function loadData() {
            const res = await fetch("/prizes.json");
            const prizes = await res.json();
            const foundPrize = prizes.find(p => String(p.id) === String(prizeId));
            setPrize(foundPrize || null);

            const { data, error } = await supabase
                .from("winners")
                .select("*")
                .eq("prize_id", Number(prizeId))
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error("Winner load error:", error);
                setWinnerRow(null);
            } else {
                setWinnerRow(data || null);

                if (data?.winner_email) {
                    const masked = obfuscateEmail(data.winner_email);
                    setWinnerMasked(masked);

                    const base = [
                        masked,
                        "ka***@gmail.com",
                        "so***@yahoo.com",
                        "ma***@outlook.com",
                        "lu***@hotmail.com",
                        "ch***@proton.me",
                        "de***@icloud.com",
                    ];

                    setSlotItems(base);
                    setReel1(base[1]);
                    setReel2(base[2]);
                    setReel3(base[3]);
                }
            }

            setLoading(false);
        }

        loadData();
    }, [prizeId]);

    // Slot animation
    useEffect(() => {
        if (!winnerRow || !winnerMasked || slotItems.length === 0) return;

        setIsRevealed(false);

        let i1 = 0, i2 = 1, i3 = 2;
        const speed = 80;

        const spin1 = setInterval(() => {
            setReel1(slotItems[i1 % slotItems.length]);
            i1++;
        }, speed);

        const spin2 = setInterval(() => {
            setReel2(slotItems[i2 % slotItems.length]);
            i2++;
        }, speed);

        const spin3 = setInterval(() => {
            setReel3(slotItems[i3 % slotItems.length]);
            i3++;
        }, speed);

        const t1 = setTimeout(() => clearInterval(spin1), 1200);
        const t2 = setTimeout(() => clearInterval(spin2), 1800);

        const t3 = setTimeout(() => {
            clearInterval(spin3);
            setReel3(winnerMasked);
            setIsRevealed(true);
        }, 2500);

        return () => {
            clearInterval(spin1);
            clearInterval(spin2);
            clearInterval(spin3);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [winnerRow, winnerMasked, slotItems]);

    if (loading) {
        return (
            <main className="winner-page">
                <h1 className="winner-title">Drawing Winner...</h1>
                <p className="winner-sub">Please wait while we reveal the champion.</p>
            </main>
        );
    }

    if (!prize) {
        return (
            <main className="winner-page">
                <h1 className="winner-title">Prize Not Found</h1>
                <p className="winner-sub">This prize does not exist.</p>
                <Link href="/contest">
                    <button className="winner-btn">Back to Contests</button>
                </Link>
            </main>
        );
    }

    const hasWinner = !!winnerRow;

    return (
        <main className="winner-page">
            {hasWinner && isRevealed && <div className="confetti-layer" />}

            <h1 className="winner-title">Winner Revealed</h1>
            <p className="winner-sub">Thank you to everyone who entered.</p>

            <section className="winner-card">
                <div className="winner-image-box">
                    <img src={prize.image} className="winner-image" />
                </div>

                <div className="winner-info">
                    <h2 className="winner-prize-name">{prize.name}</h2>
                    <p className="winner-prize-desc">{prize.description}</p>

                    {hasWinner ? (
                        <>
                            <div className="winner-badge">🏆 Official Winner</div>

                            <div className="slot-wrapper">
                                <div className="slot-machine">
                                    <div className="slot-reel">
                                        <div className="slot-window">
                                            <span>{reel1 || "???"}</span>
                                        </div>
                                    </div>

                                    <div className="slot-reel">
                                        <div className="slot-window">
                                            <span>{reel2 || "???"}</span>
                                        </div>
                                    </div>

                                    <div className={`slot-reel ${isRevealed ? "slot-winner" : ""}`}>
                                        <div className="slot-window">
                                            <span>{reel3 || "???"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="winner-details-row">
                                <span className="winner-label">Winner:</span>
                                <span className="winner-value">{winnerMasked}</span>
                            </div>

                            <div className="winner-details-row">
                                <span className="winner-label">Tickets Used:</span>
                                <span className="winner-value">🎟 {winnerRow.tickets_used}</span>
                            </div>

                            <div className="winner-details-row">
                                <span className="winner-label">Drawn On:</span>
                                <span className="winner-value">
                                    {new Date(winnerRow.created_at).toLocaleString()}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="winner-pending">
                            <span>⏳ Winner has not been drawn yet.</span>
                        </div>
                    )}

                    <div className="winner-actions">
                        <Link href="/contest">
                            <button className="winner-btn secondary">View All Contests</button>
                        </Link>
                        <Link href="/my-entries">
                            <button className="winner-btn">My Entries</button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
