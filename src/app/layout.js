import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import UserSync from "./UserSync";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalBubbles from "@/components/GlobalBubbles";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata = {
  title: "DPino Contests",
  description: "Dark Pino raffles & entries",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dark Pino",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

// Conditional wrapper - renders without Clerk if key is missing
function ConditionalClerkProvider({ children }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // No Clerk key - render without auth (site still works)
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#F8C200" }
      }}
      publishableKey={publishableKey}
    >
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout({ children }) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </head>

      <body>
        {/* GLOBAL BUBBLES */}
        <GlobalBubbles />

        <ConditionalClerkProvider>
          <ToastProvider>
            {hasClerk && <UserSync />}
            <Navbar />

            {/* PAGE CONTENT */}
            {children}

            <Footer />
          </ToastProvider>
        </ConditionalClerkProvider>
      </body>
    </html>
  );
}
