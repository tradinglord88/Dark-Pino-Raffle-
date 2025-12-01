// lib/admin.js
import { clerkClient } from '@clerk/nextjs';

/**
 * Check if a user is admin using Clerk's private metadata
 */
export async function isUserAdmin(userId) {
    if (!userId) return false;

    try {
        // Get user from Clerk with private metadata
        const user = await clerkClient.users.getUser(userId);

        // Check private metadata for admin role
        const isAdmin = user.privateMetadata?.role === 'admin';

        return isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Check if current authenticated user is admin
 * For use in API routes/middleware
 */
export async function checkCurrentUserAdmin(auth) {
    const { userId } = auth();

    if (!userId) {
        return { isAdmin: false, error: 'Not authenticated' };
    }

    const isAdmin = await isUserAdmin(userId);

    return { isAdmin, userId };
}