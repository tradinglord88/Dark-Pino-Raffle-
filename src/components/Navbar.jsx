"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
    return (
        <nav>
            <ul className="nav-links">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/prod">Dark Pino 1 of 1s</Link></li>
                <li><Link href="/contest">Contests</Link></li>
                <li><Link href="/cart">Cart</Link></li>
            </ul>

            <div className="logo">DPino Contests</div>

            <div className="btns">
                {/* If user is logged in → show profile bubble */}
                <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>

                {/* If user is logged out → show Sign In / Sign Up */}
                <SignedOut>
                    <Link href="/sign-in">
                        <button className="btn">Sign In</button>
                    </Link>
                    <Link href="/sign-up">
                        <button className="btn">Sign Up</button>
                    </Link>
                </SignedOut>
            </div>

            <div className="hamburger" onClick={() => {
                document.querySelector(".nav-links")?.classList.toggle("open");
                document.querySelector(".hamburger")?.classList.toggle("active");
            }}>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
    );
}
