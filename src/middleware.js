import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// IMPORTANT: This makes Clerk run only on routes that need auth
export const config = {
    matcher: [
        "/((?!_next|.*\\..*).*)",
    ],
};
