"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="dp-nav">

            {/* LEFT SIDE MENU */}
            <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
                <li><Link href="/" onClick={closeMobileMenu}>Home</Link></li>
                <li><Link href="/prod" onClick={closeMobileMenu}>Shop</Link></li>

                {/* Prizes Dropdown */}
                <li className="nav-dropdown">
                    <Link href="/contest" onClick={closeMobileMenu}>
                        Prizes <i className="ri-arrow-down-s-line"></i>
                    </Link>
                    <div className="dropdown-menu">
                        <Link href="/contest" onClick={closeMobileMenu}>
                            <i className="ri-gift-line"></i> All Prizes
                        </Link>
                        <Link href="/quick-entries" onClick={closeMobileMenu}>
                            <i className="ri-ticket-2-line"></i> Quick Entries
                        </Link>
                        <Link href="/past-winners" onClick={closeMobileMenu}>
                            <i className="ri-trophy-line"></i> Past Winners
                        </Link>
                    </div>
                </li>

                <li><Link href="/cart" onClick={closeMobileMenu}>Cart</Link></li>

                {/* Mobile-only Quick Links */}
                <li className="mobile-only">
                    <Link href="/quick-entries" onClick={closeMobileMenu}>Quick Entries</Link>
                </li>
                <li className="mobile-only">
                    <Link href="/past-winners" onClick={closeMobileMenu}>Past Winners</Link>
                </li>

                {/* Mobile-only My Entries */}
                <SignedIn>
                    <li className="mobile-only">
                        <Link href="/my-entries" onClick={closeMobileMenu}>My Entries</Link>
                    </li>
                </SignedIn>

                {/* Mobile-only Auth */}
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

            {/* CENTER LOGO */}
            <Link href="/" className="logo-link">
                <div className="logo">DPino Prizes</div>
            </Link>

            {/* RIGHT BUTTONS (DESKTOP) */}
            <div className="btns desktop-only">

                <SignedIn>
                    <Link href="/my-entries">
                        <button className="btn entries-btn">My Entries</button>
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>

                <SignedOut>
                    <Link href="/sign-in">
                        <button className="btn">Sign In</button>
                    </Link>
                    <Link href="/sign-up">
                        <button className="btn">Sign Up</button>
                    </Link>
                </SignedOut>

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
