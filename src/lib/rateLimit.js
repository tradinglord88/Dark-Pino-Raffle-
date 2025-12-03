// src/lib/rateLimit.js - Simple in-memory rate limiting
// For production, consider using Redis-based rate limiting (e.g., @upstash/ratelimit)

const rateLimitMap = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitMap.entries()) {
        if (now - data.firstRequest > 60000) { // 1 minute window
            rateLimitMap.delete(key);
        }
    }
}, 300000); // 5 minutes

/**
 * Simple rate limiter
 * @param {string} identifier - Unique identifier (e.g., IP address or user ID)
 * @param {number} limit - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {{ success: boolean, remaining: number, reset: number }}
 */
export function rateLimit(identifier, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const key = identifier;

    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, {
            count: 1,
            firstRequest: now
        });
        return { success: true, remaining: limit - 1, reset: now + windowMs };
    }

    const data = rateLimitMap.get(key);

    // Reset window if expired
    if (now - data.firstRequest > windowMs) {
        rateLimitMap.set(key, {
            count: 1,
            firstRequest: now
        });
        return { success: true, remaining: limit - 1, reset: now + windowMs };
    }

    // Increment count
    data.count++;

    if (data.count > limit) {
        return {
            success: false,
            remaining: 0,
            reset: data.firstRequest + windowMs
        };
    }

    return {
        success: true,
        remaining: limit - data.count,
        reset: data.firstRequest + windowMs
    };
}

/**
 * Get client identifier from request
 * @param {Request} req - The request object
 * @returns {string} - Client identifier
 */
export function getClientId(req) {
    // Try to get real IP from various headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIp) {
        return realIp;
    }
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    // Fallback - not ideal but better than nothing
    return 'unknown-client';
}
