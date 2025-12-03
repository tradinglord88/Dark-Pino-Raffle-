// src/app/api/admin/cancel-order/route.js - SECURED
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Helper function to verify admin status
async function verifyAdmin(request) {
    const { userId } = getAuth(request);

    if (!userId) {
        return { isAdmin: false, error: 'Not authenticated', userId: null };
    }

    const adminIdsFromEnv = process.env.ADMIN_USER_IDS || '';
    const ADMIN_USER_IDS = adminIdsFromEnv
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

    const isAdmin = ADMIN_USER_IDS.includes(userId);

    return { isAdmin, userId, error: null };
}

export async function POST(req) {
    try {
        // SECURITY: Verify admin status before proceeding
        const { isAdmin, userId: adminUserId, error: authError } = await verifyAdmin(req);

        if (!adminUserId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        if (!isAdmin) {
            console.warn(`⚠️ Unauthorized cancel attempt by user: ${adminUserId}`);
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        // Update order status
        const { error: updateError } = await supabaseAdmin
            .from("pending_orders")
            .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancelled_by: adminUserId
            })
            .eq("id", orderId);

        if (updateError) throw updateError;

        console.log(`❌ Order ${orderId} cancelled by admin ${adminUserId}`);

        return NextResponse.json({
            success: true,
            message: "Order cancelled successfully"
        });

    } catch (error) {
        console.error("Error cancelling order:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
