import { NextResponse } from 'next/server';

export async function GET(request) {
    return NextResponse.json({ error: 'Auth disabled' }, { status: 503 });
}

export const dynamic = 'force-dynamic';
