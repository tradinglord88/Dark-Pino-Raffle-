// lib/admin.js - Clerk disabled for build

export async function isUserAdmin(userId) {
    return false;
}

export async function checkCurrentUserAdmin(auth) {
    return { isAdmin: false, error: 'Auth disabled' };
}
