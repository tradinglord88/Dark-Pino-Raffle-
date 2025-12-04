import { NextResponse } from 'next/server';

export async function GET(request) {
    return NextResponse.json({
        isAdmin: false,
        error: 'Auth disabled',
        timestamp: new Date().toISOString()
    });
}

export const dynamic = 'force-dynamic';
