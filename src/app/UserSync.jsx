'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function UserSync() { // ← ADD 'default'
    const { user, isLoaded } = useUser();
    const [syncAttempted, setSyncAttempted] = useState(false);

    useEffect(() => {
        if (isLoaded && user && !syncAttempted) {
            console.log('🔄 UserSync: User detected, triggering sync for:', user.id);
            setSyncAttempted(true);

            // Add user data to the request body
            fetch('/api/sync-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress
                })
            })
                .then(async (response) => {
                    // Handle response safely
                    const text = await response.text();
                    let data = {};
                    try {
                        data = JSON.parse(text);
                    } catch (parseError) {
                        console.error('❌ Response is not JSON:', text);
                        return;
                    }

                    if (!response.ok) {
                        console.error('❌ Sync failed:', data.error);
                    } else {
                        console.log('✅ Sync successful:', data.action);
                    }
                })
                .catch(error => {
                    console.error('❌ Sync request failed:', error);
                });
        }
    }, [user, isLoaded, syncAttempted]);

    return null;
}