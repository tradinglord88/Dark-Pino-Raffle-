// src/app/api/admin/confirm-order/route.js - SECURED VERSION
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Helper function to verify admin status
async function verifyAdmin(request) {
    const { userId } = getAuth(request);

    if (!userId) {
        return { isAdmin: false, error: 'Not authenticated', userId: null };
    }

    // Get admin IDs from environment (server-side only, not NEXT_PUBLIC_)
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
            console.warn(`⚠️ Unauthorized order confirmation attempt by user: ${adminUserId}`);
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { orderId, clerkId, tickets } = await req.json();

        if (!orderId || !clerkId || !tickets) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // 1. Get current user tickets
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("tickets")
            .eq("clerk_id", clerkId)
            .single();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Add tickets to user
        const newTickets = user.tickets + tickets;

        const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({ tickets: newTickets })
            .eq("clerk_id", clerkId);

        if (updateError) throw updateError;

        // 3. Update order status
        const { error: orderError } = await supabaseAdmin
            .from("pending_orders")
            .update({
                status: "confirmed",
                confirmed_at: new Date().toISOString()
            })
            .eq("id", orderId);

        if (orderError) throw orderError;

        // 4. Get order details for purchase record
        const { data: order } = await supabaseAdmin
            .from("pending_orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (order) {
            // 5. Record purchase - MATCHING YOUR EXACT TABLE STRUCTURE
            await supabaseAdmin
                .from("purchases")
                .insert({
                    clerk_id: clerkId,
                    amount_total: order.total_amount,
                    tickets_earned: tickets,
                    payment_method: "etransfer",
                    etransfer_order_id: orderId,
                    metadata: {
                        order_id: orderId,
                        items: order.metadata?.items || "",
                        item_ids: order.metadata?.item_ids || "",
                        special_offers: order.metadata?.special_offers || [],
                        cart_items: order.cart_items // Include full cart
                    },
                    purchased_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                });
            console.log(`📝 Purchase recorded for order ${orderId}`);
        }

        console.log(`✅ Added ${tickets} tickets to user ${clerkId}`);

        return NextResponse.json({
            success: true,
            message: `Added ${tickets} tickets. New total: ${newTickets}`
        });

    } catch (error) {
        console.error("Error confirming order:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';