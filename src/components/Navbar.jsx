"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const toggleMobileMenu = () => {
        const newState = !mobileMenuOpen;
        setMobileMenuOpen(newState);
        // Lock/unlock body scroll
        if (newState) {
            document.body.classList.add("menu-open");
        } else {
            document.body.classList.remove("menu-open");
        }
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        document.body.classList.remove("menu-open");
    };

    // Cleanup scroll lock on unmount
    useEffect(() => {
        return () => {
            document.body.classList.remove("menu-open");
        };
    }, []);

    // Track cart count
    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem("dpino-cart")) || [];
            const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
            setCartCount(count);
        };

        updateCartCount();
        window.addEventListener("cart-updated", updateCartCount);
        return () => window.removeEventListener("cart-updated", updateCartCount);
    }, []);

    return (
        <nav className="dp-nav">
            {/* LEFT: Logo + Brand */}
            <Link href="/" className="logo-link">
                <img src="/images/pepe-mascot.png" alt="Dark Pino" className="logo-img" />
                <div className="logo-text">
                    <span className="logo-name">DARK PINO</span>
                    <span className="logo-sub">PRIZES</span>
                </div>
            </Link>

            <div className="nav-divider"></div>
            <span className="nav-tagline">LUXURY PRIZE RAFFLES</span>

            {/* CENTER: Nav Links */}
            <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
                <li>
                    <Link href="/" onClick={closeMobileMenu}>
                        <i className="ri-home-4-line"></i> Home
                    </Link>
                </li>
                <li>
                    <Link href="/prod" onClick={closeMobileMenu}>
                        <i className="ri-shopping-bag-line"></i> Shop
                    </Link>
                </li>
                <li>
                    <Link href="/contest" onClick={closeMobileMenu}>
                        <i className="ri-gift-line"></i> Prizes
                    </Link>
                </li>
                <li>
                    <Link href="/quick-entries" onClick={closeMobileMenu}>
                        <i className="ri-ticket-2-line"></i> Tickets
                    </Link>
                </li>
                <li>
                    <Link href="/vip" onClick={closeMobileMenu} className="vip-link">
                        <i className="ri-vip-crown-line"></i> VIP
                    </Link>
                </li>

                {/* Mobile-only links */}
                <li className="mobile-only">
                    <Link href="/past-winners" onClick={closeMobileMenu}>
                        <i className="ri-trophy-line"></i> Winners
                    </Link>
                </li>
                <SignedIn>
                    <li className="mobile-only">
                        <Link href="/my-entries" onClick={closeMobileMenu}>
                            <i className="ri-user-line"></i> My Entries
                        </Link>
                    </li>
                </SignedIn>
                <SignedOut>
                    <li className="mobile-only">
                        <Link href="/sign-in" onClick={closeMobileMenu}>Sign In</Link>
                    </li>
                    <li className="mobile-only">
                        <Link href="/sign-up" onClick={closeMobileMenu}>Sign Up</Link>
                    </li>
                </SignedOut>
                <SignedIn>
                    <li className="mobile-only user-btn-mobile">
                        <UserButton afterSignOutUrl="/" />
                    </li>
                </SignedIn>
            </ul>

            {/* RIGHT: Buttons */}
            <div className="nav-btns">
                <SignedIn>
                    <Link href="/my-entries" className="nav-btn entries-btn">
                        <i className="ri-user-line"></i> My Entries
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>

                <SignedOut>
                    <Link href="/sign-in" className="nav-btn signin-btn">
                        <i className="ri-login-box-line"></i> Sign In
                    </Link>
                </SignedOut>

                <Link href="/cart" className="nav-btn cart-btn">
                    <i className="ri-shopping-cart-line"></i> Cart
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
            </div>

            {/* HAMBURGER MENU */}
            <div
                className={`hamburger ${mobileMenuOpen ? "active" : ""}`}
                onClick={toggleMobileMenu}
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
    );
}
