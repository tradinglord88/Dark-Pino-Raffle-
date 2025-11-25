"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

function obfuscateEmail(email) {
    if (!email) return "winner@dpino.com";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const visible = user.slice(0, Math.min(2, user.length));
    return `${visible}***@${domain}`;
}

export default function WinnerRevealPage({ params }) {
    const { id: prizeId } = use(params);
    const { user, isLoaded } = useUser();
    const [loading, setLoading] = useState(true);
    const [prize, setPrize] = useState(null);
    const [winner, setWinner] = useState(null);
    const [userEntry, setUserEntry] = useState(null);
    const [slotItems, setSlotItems] = useState([]);
    const [reel1, setReel1] = useState("");
    const [reel2, setReel2] = useState("");
    const [reel3, setReel3] = useState("");
    const [winnerMasked, setWinnerMasked] = useState("");
    const [isRevealed, setIsRevealed] = useState(false);

    // Load prize from JSON + winner from database entries
    useEffect(() => {
        if (!prizeId || !isLoaded) return;

        async function loadData() {
            try {
                // Load prize details from prizes.json
                const prizesResponse = await fetch('/prizes.json');
                const prizes = await prizesResponse.json();
                const foundPrize = prizes.find(p => String(p.id) === String(prizeId));

                if (!foundPrize) {
                    setPrize(null);
                    setLoading(false);
                    return;
                }

                setPrize(foundPrize);

                // Check if draw time has passed to determine if we should show winner
                const drawTime = new Date(foundPrize.drawTime);
                const now = new Date();
                const drawTimePassed = drawTime <= now;

                if (drawTimePassed) {
                    // Load ALL entries for this prize
                    const { data: entries, error: entriesError } = await supabase
                        .from("entries")
                        .select(`
                            clerk_id,
                            tickets_used,
                            created_at,
                            users!inner(email)
                        `)
                        .eq("prize_id", Number(prizeId));

                    if (!entriesError && entries && entries.length > 0) {
                        // Pick random winner from entries
                        const randomIndex = Math.floor(Math.random() * entries.length);
                        const randomWinner = entries[randomIndex];

                        setWinner({
                            clerk_id: randomWinner.clerk_id,
                            winner_email: randomWinner.users.email,
                            tickets_used: randomWinner.tickets_used,
                            created_at: randomWinner.created_at
                        });

                        // Setup slot animation
                        const masked = obfuscateEmail(randomWinner.users.email);
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
                    } else {
                        setWinner(null);
                    }
                }

                // Load user's entry for this prize if signed in
                if (user && isLoaded) {
                    const { data: entryData, error: entryError } = await supabase
                        .from("entries")
                        .select("tickets_used, created_at")
                        .eq("prize_id", Number(prizeId))
                        .eq("clerk_id", user.id)
                        .maybeSingle();

                    if (!entryError && entryData) {
                        setUserEntry(entryData);
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [prizeId, user, isLoaded]);

    // Slot animation
    useEffect(() => {
        if (!winner || !winnerMasked || slotItems.length === 0) return;

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

        const t1 = setTimeout(() => {
            clearInterval(spin1);
        }, 1200);

        const t2 = setTimeout(() => {
            clearInterval(spin2);
        }, 1800);

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
    }, [winner, winnerMasked, slotItems]);

    // Check if current user is the winner
    const isCurrentUserWinner = user && winner && winner.clerk_id === user.id;

    // Check if draw time has passed
    const drawTimePassed = prize && new Date(prize.drawTime) <= new Date();
    const hasWinner = drawTimePassed && winner;

    // Show loading state while waiting for authentication
    if (!isLoaded || loading) {
        return (
            <main className="winner-page">
                <h1 className="winner-title">Loading Prize...</h1>
                <p className="winner-sub">Please wait while we load the details.</p>
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

    return (
        <main className="winner-page">
            {hasWinner && isRevealed && <div className="confetti-layer" />}

            <h1 className="winner-title">
                {hasWinner ? "Winner Revealed" : "Prize Details"}
            </h1>
            <p className="winner-sub">
                {hasWinner
                    ? "Thank you to everyone who entered."
                    : "This prize is still open for entries."
                }
            </p>

            <section className="winner-card">
                <div className="winner-image-box">
                    <img
                        src={prize.image}
                        className="winner-image"
                        alt={prize.name}
                        onError={(e) => {
                            // Fallback if image doesn't exist
                            e.target.src = "/Image/step1.png";
                        }}
                    />
                </div>

                <div className="winner-info">
                    <h2 className="winner-prize-name">{prize.name}</h2>
                    <p className="winner-prize-desc">{prize.description}</p>
                    <div className="winner-prize-value">🎯 Prize Value: ${prize.price.toLocaleString()}</div>

                    {/* User Entry Info */}
                    {user && userEntry && (
                        <div className="user-entry-info">
                            <div className="user-entry-badge">
                                🎟 You entered with {userEntry.tickets_used} ticket(s)
                            </div>
                            <div className="entry-date">
                                Entered on: {new Date(userEntry.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    )}

                    {hasWinner ? (
                        <>
                            {isCurrentUserWinner && (
                                <div className="congratulations-banner">
                                    🎉 CONGRATULATIONS! YOU WON! 🎉
                                </div>
                            )}

                            <div className="winner-badge">
                                🏆 Official Winner
                            </div>

                            <div className="slot-wrapper">
                                <div className="slot-machine">
                                    <div className="slot-reel">
                                        <div className="slot-window">
                                            <span className="winner-email">{reel1 || "???"}</span>
                                        </div>
                                    </div>

                                    <div className="slot-reel">
                                        <div className="slot-window">
                                            <span className="winner-email">{reel2 || "???"}</span>
                                        </div>
                                    </div>

                                    <div className={`slot-reel ${isRevealed ? "slot-winner" : ""}`}>
                                        <div className="slot-window">
                                            <span className="winner-email">{reel3 || "???"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="winner-details-row">
                                <span className="winner-label">Winner:</span>
                                <span className="winner-value winner-email">
                                    {isCurrentUserWinner ? "YOU! 🎉" : winnerMasked}
                                </span>
                            </div>

                            <div className="winner-details-row">
                                <span className="winner-label">Tickets Used:</span>
                                <span className="winner-value">🎟 {winner.tickets_used}</span>
                            </div>

                            <div className="winner-details-row">
                                <span className="winner-label">Drawn On:</span>
                                <span className="winner-value">
                                    {new Date(winner.created_at).toLocaleString()}
                                </span>
                            </div>

                            {isCurrentUserWinner && (
                                <div className="winner-instructions">
                                    <h4>🎁 Next Steps:</h4>
                                    <p>You have won: <strong>{prize.name}</strong></p>
                                    <p>You will receive an email with instructions on how to claim your prize within 24 hours.</p>
                                    <p>Please check your spam folder if you don't see it.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="winner-pending">
                            <span>⏳ {drawTimePassed ? "Selecting winner..." : "Winner has not been drawn yet."}</span>
                            {prize.drawTime && (
                                <div className="draw-time">
                                    {drawTimePassed
                                        ? "Draw completed recently"
                                        : `Draw scheduled for: ${new Date(prize.drawTime).toLocaleString()}`
                                    }
                                </div>
                            )}

                            {/* Entry CTA for active prizes */}
                            {!drawTimePassed && (
                                <div className="entry-cta">
                                    <p>🎟 Still time to enter this raffle!</p>
                                    <Link href={`/prize-detail/${prize.id}`}>
                                        <button className="enter-now-btn">
                                            Enter Now
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="winner-actions">
                        <Link href="/contest">
                            <button className="winner-btn secondary">View All Contests</button>
                        </Link>
                        {user ? (
                            <Link href="/my-entries">
                                <button className="winner-btn">My Entries</button>
                            </Link>
                        ) : (
                            <Link href="/sign-in">
                                <button className="winner-btn">Sign In to Enter</button>
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}