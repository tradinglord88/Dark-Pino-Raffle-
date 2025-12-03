"use client";

import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            {/* Gold accent line at top */}
            <div className="footer-accent"></div>

            <div className="footer-content">
                <div className="footer-grid">
                    {/* Column 1: Company */}
                    <div className="footer-column">
                        <h4 className="footer-heading">COMPANY</h4>
                        <ul className="footer-links">
                            <li><Link href="/contact">Contact Us</Link></li>
                            <li><Link href="/terms">Terms of Service</Link></li>
                            <li><Link href="/careers">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Column 2: Business Info */}
                    <div className="footer-column">
                        <h4 className="footer-heading">DARK PINO®, LLC</h4>
                        <div className="footer-info">
                            <p>123 Luxury Lane, Suite #1</p>
                            <p>Los Angeles, CA 90001</p>
                        </div>
                        <div className="footer-hours">
                            <p className="hours-label">Business Hours:</p>
                            <p>Mon - Fri / 9:00AM - 5:00PM</p>
                        </div>
                    </div>

                    {/* Column 3: My Account */}
                    <div className="footer-column">
                        <h4 className="footer-heading">MY ACCOUNT</h4>
                        <ul className="footer-links">
                            <li><Link href="/my-entries">My Account</Link></li>
                            <li><Link href="/shipping">Shipping and Deliveries</Link></li>
                            <li><Link href="/faq">FAQ / Help</Link></li>
                            <li><Link href="/returns">Return and Exchanges</Link></li>
                            <li><Link href="/privacy">Privacy Policy</Link></li>
                            <li><Link href="/accessibility">Report Accessibility Issue</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Legal / Giveaway Rules */}
                    <div className="footer-column footer-legal">
                        <h4 className="footer-heading">DARK PINO® PRIZE GIVEAWAY®</h4>
                        <p className="legal-text">
                            * NO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING.
                            Open to legal residents of the 50 United States, the District of Columbia and Canada. Void in
                            Puerto Rico and US territories and where prohibited by law. Must be age of majority in state/province
                            of residence and licensed driver as of {currentYear}. Skill-testing question required if a Canadian
                            resident is selected as potential winner. Odds of winning depend upon the number of eligible purchase
                            and non-purchase entries received. See <Link href="/rules" className="legal-link">Official Rules</Link> for
                            details including how to enter without making a purchase. Sponsor: Dark Pino® LLC, 123 Luxury Lane,
                            Suite #1, Los Angeles, CA 90001.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <p className="copyright">
                        © {currentYear} Dark Pino Prizes. All rights reserved.
                    </p>
                    <div className="footer-social">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <i className="ri-instagram-line"></i>
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                            <i className="ri-twitter-x-line"></i>
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <i className="ri-facebook-fill"></i>
                        </a>
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                            <i className="ri-tiktok-fill"></i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
