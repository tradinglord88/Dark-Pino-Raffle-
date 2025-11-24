export default function Footer() {
    return (
        <footer className="footer">

            {/* === GOO FILTER FOR BLUB EFFECT === */}
            <svg width="0" height="0">
                <filter id="goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
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
            </svg>

            {/* === BUBBLES === */}
            <div className="bubbles">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="bubble"
                        style={{
                            "--size": `${2 + Math.random() * 4}rem`,
                            "--distance": `${20 + Math.random() * 40}rem`,
                            "--position": `${Math.random() * 100}%`,
                            "--time": `${5 + Math.random() * 5}s`,
                            "--delay": `${Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* === GRID CONTENT === */}
            <div className="footer-grid">

                {/* BRAND COLUMN */}
                <div className="col">
                    <h3>DPino Contests</h3>
                    <p>Premium raffles, luxury 1 of 1 drops, and life changing prizes.</p>
                </div>

                {/* NAVIGATION ICONS */}
                <div className="col">
                    <h3>Navigation</h3>
                    <div className="icon-links">
                        <a href="/"><i className="ri-home-4-line"></i></a>
                        <a href="/prod"><i className="ri-store-2-line"></i></a>
                        <a href="/contest"><i className="ri-trophy-line"></i></a>
                        <a href="/cart"><i className="ri-shopping-cart-2-line"></i></a>
                        <a href="/my-entries"><i className="ri-user-line"></i></a>
                    </div>
                </div>

                {/* SOCIAL ICONS */}
                <div className="col">
                    <h3>Connect</h3>
                    <div className="icon-links">
                        <a href="#"><i className="ri-instagram-line"></i></a>
                        <a href="#"><i className="ri-tiktok-line"></i></a>
                        <a href="#"><i className="ri-twitter-x-line"></i></a>
                        <a href="#"><i className="ri-youtube-line"></i></a>
                    </div>
                </div>

            </div>

            <div className="footer-copy">
                © {new Date().getFullYear()} DPino Contests All Rights Reserved
            </div>

        </footer>
    );
}
