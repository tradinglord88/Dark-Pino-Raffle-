// src/app/api/admin/verify/route.js - SIMPLE & RELIABLE
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
    try {
        // Get authenticated user
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                isAdmin: false,
                error: 'User not authenticated',
                timestamp: new Date().toISOString()
            }, { status: 401 });
        }

        // Get admin IDs from environment
        const adminIdsFromEnv = process.env.ADMIN_USER_IDS || '';
        const ADMIN_USER_IDS = adminIdsFromEnv
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);

        const isAdmin = ADMIN_USER_IDS.includes(userId);

        // SECURITY: Only return minimal information - no admin IDs exposed
        const response = {
            isAdmin,
            userId,
            timestamp: new Date().toISOString()
        };

        console.log(`🔍 Admin check for ${userId}: ${isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);

        return NextResponse.json(response);

    } catch (error) {
        console.error('Admin verification error:', error);
        return NextResponse.json({
            isAdmin: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';