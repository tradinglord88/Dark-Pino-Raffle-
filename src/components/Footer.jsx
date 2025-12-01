export default function Footer() {
    return (
        <footer className="footer">
            <div id="bubble-anchor"></div>

            {/* === GRID CONTENT === */}
            <div className="footer-grid">

                <div className="col footer-brand">
                    <img
                        src="/Image/logo.png"   // ⬅️ replace with your actual logo path
                        alt="DPino Logo"
                        className="footer-logo"
                    />

                    <h3>DPino Prizes</h3>
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
                    <h3>Contact & Connect</h3>
                    <div className="icon-links">
                        {/* WhatsApp */}
                        <a
                            href="https://wa.me/17787155559"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Contact us on WhatsApp"
                        >
                            <i className="ri-whatsapp-line"></i>
                        </a>

                        {/* Phone */}
                        <a
                            href="tel:+17787155559"
                            title="Call us at 778-715-5559"
                        >
                            <i className="ri-phone-line"></i>
                        </a>

                        {/* Email - Contest Inquiries */}
                        <a
                            href="mailto:contest@darkpino.xyz"
                            title="Email for contest inquiries"
                        >
                            <i className="ri-mail-line"></i>
                        </a>

                        {/* Instagram */}
                        <a
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Follow us on Instagram"
                        >
                            <i className="ri-instagram-line"></i>
                        </a>
                    </div>

                    {/* Contact Info Text */}

                </div>

            </div>

            <div className="footer-copy">
                © {new Date().getFullYear()} DPino Prizes — All Rights Reserved
            </div>
        </footer>
    );
}