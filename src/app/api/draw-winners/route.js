// app/api/draw-winners/route.js
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        // Load prizes from JSON
        const prizesResponse = await fetch(`${process.env.NEXTAUTH_URL}/prizes.json`);
        const prizes = await prizesResponse.json();

        const now = new Date();
        const results = [];

        for (const prize of prizes) {
            // Check if prize should be drawn
            if (!prize.is_drawn && new Date(prize.drawTime) <= now) {
                // Get all entries for this prize
                const { data: entries, error } = await supabase
                    .from('entries')
                    .select(`
                        clerk_id,
                        users!inner(email)
                    `)
                    .eq('prize_id', prize.id);

                if (error) {
                    console.error(`Error fetching entries for prize ${prize.id}:`, error);
                    continue;
                }

                if (entries && entries.length > 0) {
                    // Pick random winner
                    const randomIndex = Math.floor(Math.random() * entries.length);
                    const winner = entries[randomIndex];

                    // Update prize with winner info
                    prize.winner_email = winner.users.email;
                    prize.winner_clerk_id = winner.clerk_id;
                    prize.is_drawn = true;
                    prize.drawn_at = new Date().toISOString();

                    results.push({
                        prize_id: prize.id,
                        prize_name: prize.name,
                        winner_email: winner.users.email,
                        winner_clerk_id: winner.clerk_id
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