import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
    '/contest(.*)',
    '/my-entries(.*)',
    '/prize-detail(.*)',
    '/cart(.*)',
    '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        // Protect the route
        await auth.protect();

        // Get the authenticated user
        const user = await auth();

        if (user && user.id) {
            console.log('🔄 Middleware: User authenticated, triggering sync for:', user.id);

            // Trigger user sync WITH user data in body
            fetch(`${req.nextUrl.origin}/api/sync-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress
                })
            })
                .then(response => {
                    if (!response.ok) {
                        console.log('⚠️ Sync API returned:', response.status);
                    }
                })
                .catch(error => {
                    console.error('❌ Sync failed:', error);
                });
        } else {
            console.log('⚠️ Middleware: User authenticated but no user ID available');
        }
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};