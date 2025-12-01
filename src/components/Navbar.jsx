"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
    return (
        <nav className="dp-nav">

            {/* LEFT SIDE MENU */}
            <ul className="nav-links">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/prod">Dark Pino 1 of 1s</Link></li>
                <li><Link href="/contest">Prizes</Link></li>
                <li><Link href="/cart">Cart</Link></li>

                {/* ⭐ Mobile-only My Entries */}
                <SignedIn>
                    <li className="mobile-only">
                        <Link href="/my-entries">My Entries</Link>
                    </li>
                </SignedIn>

                {/* Mobile-only Auth */}
                <SignedOut>
                    <li className="mobile-only">
                        <Link href="/sign-in">Sign In</Link>
                    </li>
                    <li className="mobile-only">
                        <Link href="/sign-up">Sign Up</Link>
                    </li>
                </SignedOut>

                <SignedIn>
                    <li className="mobile-only">
                        <UserButton afterSignOutUrl="/" />
                    </li>
                </SignedIn>
            </ul>

            {/* CENTER LOGO */}
            <div className="logo">DPino Prizes</div>

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
                className="hamburger"
                onClick={() => {
                    document.querySelector(".nav-links")?.classList.toggle("open");
                    document.querySelector(".hamburger")?.classList.toggle("active");
                }}
            >
                <span></span>
                <span></span>
                <span></span>
            </div>

        </nav>
    );
}
