// src/middleware.js - Passthrough middleware (Clerk disabled for now)
import { NextResponse } from 'next/server';

export default function middleware(req) {
    // Pass through all requests - no auth protection
    // Re-enable Clerk after deployment is working
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
};
