// src/middleware.js - FIXED VERSION
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
    '/contest(.*)',
    '/my-entries(.*)',
    '/prize-detail(.*)',
    '/cart(.*)',
    '/admin(.*)',
]);

// Admin-specific routes
const isAdminRoute = createRouteMatcher([
    '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl.clone();

    // Check if this is a protected route
    if (isProtectedRoute(req)) {
        try {
            // Protect the route - this will redirect to sign-in if not authenticated
            await auth.protect();

            // Get the authenticated user properly with await
            const authObj = await auth();
            const userId = authObj.userId;

            if (!userId) {
                console.log('🚫 No user ID found, redirecting to home');
                const homeUrl = new URL('/', url.origin);
                return NextResponse.redirect(homeUrl);
            }

            console.log('🔄 Middleware: User authenticated, ID:', userId);

            // ADMIN ROUTE CHECK
            if (isAdminRoute(req)) {
                console.log('🔒 Admin route access attempt by:', userId);

                try {
                    // Get the session claims which include user metadata
                    const sessionClaims = await auth();
                    const session = sessionClaims.sessionClaims;

                    // Check admin role from session claims or use environment variable fallback
                    let isAdmin = false;

                    // Method 1: Check environment variable (backup method)
                    const adminIdsFromEnv = process.env.ADMIN_USER_IDS || '';
                    const ADMIN_USER_IDS = adminIdsFromEnv
                        .split(',')
                        .map(id => id.trim())
                        .filter(id => id.length > 0);

                    if (ADMIN_USER_IDS.includes(userId)) {
                        console.log('✅ Admin access via environment variable for:', userId);
                        isAdmin = true;
                    }
                    // Method 2: Check session metadata (if available)
                    else if (session && session.metadata) {
                        isAdmin = session.metadata.role === 'admin';
                        console.log('✅ Admin check via session metadata:', { userId, role: session.metadata.role, isAdmin });
                    }
                    // Method 3: Check private metadata via auth().userPublicMetadata
                    else {
                        const userPublicMetadata = authObj.userPublicMetadata || {};
                        isAdmin = userPublicMetadata.role === 'admin';
                        console.log('✅ Admin check via public metadata:', { userId, role: userPublicMetadata.role, isAdmin });
                    }

                    if (!isAdmin) {
                        console.log('🚫 Non-admin attempted to access admin area:', userId);
                        const homeUrl = new URL('/', url.origin);
                        return NextResponse.redirect(homeUrl);
                    }

                    console.log('✅ Admin access granted to:', userId);
                } catch (error) {
                    console.error('❌ Admin check failed:', error);
                    const homeUrl = new URL('/', url.origin);
                    return NextResponse.redirect(homeUrl);
                }
            }
        } catch (error) {
            console.error('❌ Middleware auth error:', error);
            // Clerk will handle redirect to sign-in
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};