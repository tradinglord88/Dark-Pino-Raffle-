// src/middleware.js - Conditional Clerk middleware
import { NextResponse } from 'next/server';

// Check for Clerk key at module level
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Define protected routes
const protectedPaths = ['/contest', '/my-entries', '/prize-detail', '/cart', '/admin'];
const adminPaths = ['/admin'];

function isProtectedRoute(pathname) {
    return protectedPaths.some(path => pathname.startsWith(path));
}

function isAdminRoute(pathname) {
    return adminPaths.some(path => pathname.startsWith(path));
}

export default async function middleware(req) {
    // If no Clerk key, pass through all requests (site works without auth)
    if (!hasClerkKey) {
        return NextResponse.next();
    }

    // Dynamically import Clerk to avoid build-time validation
    const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

    // Create the Clerk middleware handler
    const clerkHandler = clerkMiddleware(async (auth, request) => {
        const url = request.nextUrl.clone();
        const pathname = url.pathname;

        // Check if this is a protected route
        if (isProtectedRoute(pathname)) {
            try {
                // Protect the route
                await auth.protect();

                const authObj = await auth();
                const userId = authObj.userId;

                if (!userId) {
                    return NextResponse.redirect(new URL('/', url.origin));
                }

                // ADMIN ROUTE CHECK
                if (isAdminRoute(pathname)) {
                    let isAdmin = false;

                    // Check environment variable
                    const adminIdsFromEnv = process.env.ADMIN_USER_IDS || '';
                    const ADMIN_USER_IDS = adminIdsFromEnv
                        .split(',')
                        .map(id => id.trim())
                        .filter(id => id.length > 0);

                    if (ADMIN_USER_IDS.includes(userId)) {
                        isAdmin = true;
                    } else {
                        // Check public metadata
                        const userPublicMetadata = authObj.userPublicMetadata || {};
                        isAdmin = userPublicMetadata.role === 'admin';
                    }

                    if (!isAdmin) {
                        return NextResponse.redirect(new URL('/', url.origin));
                    }
                }
            } catch (error) {
                console.error('Middleware auth error:', error);
            }
        }

        return NextResponse.next();
    });

    // Run the Clerk middleware
    return clerkHandler(req, { request: req });
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};