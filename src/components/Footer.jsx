export default function Footer() {
    return (
        <footer className="footer">

            {/* === ULTRA-LIGHT BUBBLES (Zero Lag) === */}
            <div className="bubbles">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div
                        key={i}
                        className="bubble"
                        style={{
                            "--size": `${1.5 + Math.random() * 2.5}rem`,
                            "--distance": `${12 + Math.random() * 60}rem`,
                            "--position": `${Math.random() * 100}%`,
                            "--time": `${4 + Math.random() * 3}s`,
                            "--delay": `${Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* === GRID CONTENT === */}
            <div className="footer-grid">

                <div className="col">
                    <h3>DPino Contests</h3>
                    <p>Premium raffles, luxury 1 of 1 drops, and life-changing prizes.</p>
                </div>

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
                © {new Date().getFullYear()} DPino Contests — All Rights Reserved
            </div>
        </footer>
    );
}
