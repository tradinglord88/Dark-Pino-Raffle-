// app/api/draw-winners/route.js - FIXED VERSION
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

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

// Load prizes from local file instead of HTTP fetch
function getPrizes() {
    try {
        const prizesPath = path.join(process.cwd(), 'public', 'prizes.json');
        const prizesData = fs.readFileSync(prizesPath, 'utf-8');
        return JSON.parse(prizesData);
    } catch (error) {
        console.error("Error loading prizes:", error);
        return null;
    }
}

export async function POST(request) {
    try {
        // SECURITY: Verify admin status
        const { isAdmin, userId, error: authError } = await verifyAdmin(request);

        if (!userId) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        if (!isAdmin) {
            console.warn(`⚠️ Unauthorized draw attempt by user: ${userId}`);
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Load prizes from local file
        const prizes = getPrizes();
        if (!prizes) {
            return Response.json({ error: 'Unable to load prizes' }, { status: 500 });
        }

        const now = new Date();
        const results = [];

        for (const prize of prizes) {
            // Check if prize should be drawn
            if (!prize.is_drawn && new Date(prize.drawTime) <= now) {
                // Check if already drawn in database
                const { data: existingWinner } = await supabaseAdmin
                    .from('winners')
                    .select('id')
                    .eq('prize_id', prize.id)
                    .single();

                if (existingWinner) {
                    console.log(`Prize ${prize.id} already has a winner`);
                    continue;
                }

                // Get all entries for this prize using admin client
                const { data: entries, error } = await supabaseAdmin
                    .from('entries')
                    .select(`
                        clerk_id,
                        tickets_used,
                        users!inner(email)
                    `)
                    .eq('prize_id', prize.id);

                if (error) {
                    console.error(`Error fetching entries for prize ${prize.id}:`, error);
                    continue;
                }

                if (entries && entries.length > 0) {
                    // Create weighted pool based on tickets
                    const weightedPool = [];
                    for (const entry of entries) {
                        const ticketCount = entry.tickets_used || 1;
                        for (let i = 0; i < ticketCount; i++) {
                            weightedPool.push(entry);
                        }
                    }

                    // Pick random winner from weighted pool
                    const randomIndex = Math.floor(Math.random() * weightedPool.length);
                    const winner = weightedPool[randomIndex];

                    // PERSIST WINNER TO DATABASE
                    const { data: savedWinner, error: saveError } = await supabaseAdmin
                        .from('winners')
                        .insert({
                            prize_id: prize.id,
                            clerk_id: winner.clerk_id,
                            winner_email: winner.users.email,
                            tickets_used: winner.tickets_used,
                            drawn_at: new Date().toISOString(),
                            drawn_by: userId // Track who drew the winner
                        })
                        .select()
                        .single();

                    if (saveError) {
                        console.error(`Error saving winner for prize ${prize.id}:`, saveError);
                        continue;
                    }

                    console.log(`✅ Winner saved for prize ${prize.id}: ${winner.users.email}`);

                    results.push({
                        prize_id: prize.id,
                        prize_name: prize.name,
                        winner_email: winner.users.email,
                        winner_clerk_id: winner.clerk_id,
                        winner_id: savedWinner.id
                    });
                }
            }
        }

        return Response.json({
            success: true,
            drawn: results,
            message: `Drew winners for ${results.length} prizes`
        });

    } catch (error) {
        console.error('Error drawing winners:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';