import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
    '/contest(.*)',
    '/my-entries(.*)',
    '/prize-detail(.*)',
    '/cart(.*)',
    '/admin(.*)', // Admin routes are protected
]);

// Admin-specific routes
const isAdminRoute = createRouteMatcher([
    '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    // Get the request URL
    const url = req.nextUrl.clone();

    // Check if this is a protected route
    if (isProtectedRoute(req)) {
        try {
            // Protect the route - this will redirect to sign-in if not authenticated
            await auth.protect();

            // Get the authenticated user
            const userId = auth.userId;

            if (userId) {
                console.log('🔄 Middleware: User authenticated, ID:', userId);

                // Trigger user sync IN THE BACKGROUND (don't await)
                fetch(`${url.origin}/api/sync-user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: userId,
                        email: auth.user?.primaryEmailAddress?.emailAddress || auth.user?.emailAddresses?.[0]?.emailAddress
                    })
                }).catch(error => {
                    console.error('❌ Background sync failed:', error);
                });

                // SPECIAL CHECK FOR ADMIN ROUTES
                if (isAdminRoute(req)) {
                    console.log('🔒 Admin route access attempt by:', userId);

                    try {
                        // Get Clerk client inside the middleware
                        const { clerkClient } = await import('@clerk/nextjs/server');

                        // Get user details with private metadata from Clerk
                        const clerkUser = await clerkClient.users.getUser(userId);

                        // Check private metadata for admin role
                        const isAdmin = clerkUser.privateMetadata?.role === 'admin';

                        if (!isAdmin) {
                            console.log('🚫 Non-admin attempted to access admin area:', userId);

                            // Redirect non-admins to home page
                            const homeUrl = new URL('/', url.origin);
                            return NextResponse.redirect(homeUrl);
                        }

                        console.log('✅ Admin access granted to:', userId);
                    } catch (error) {
                        console.error('❌ Admin check failed:', error);

                        // On error, redirect to home for safety
                        const homeUrl = new URL('/', url.origin);
                        return NextResponse.redirect(homeUrl);
                    }
                }
            } else {
                console.log('⚠️ Middleware: Route is protected but no user ID');
            }
        } catch (error) {
            console.error('❌ Middleware auth error:', error);
            // Clerk will handle the redirect to sign-in
        }
    }

    // Allow the request to continue
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};