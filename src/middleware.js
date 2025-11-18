import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({});

export const config = {
    matcher: [
        // Protect these routes
        "/contest",
        "/prize-detail/:id*",
        "/dashboard/:path*",
    ],
};
