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
  themeColor: "#000000",
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
};

export default function RootLayout({ children }) {
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

        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: { colorPrimary: "#F8C200" }
          }}
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <ToastProvider>
            <UserSync />
            <Navbar />

            {/* PAGE CONTENT */}
            {children}

            <Footer />
          </ToastProvider>
        </ClerkProvider>

      </body>
    </html>
  );
}
