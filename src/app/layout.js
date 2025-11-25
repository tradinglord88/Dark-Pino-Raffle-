import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import UserSync from "./UserSync";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalBubbles from "@/components/GlobalBubbles";
import "./globals.css";

export const metadata = {
  title: "DPino Contests",
  description: "Dark Pino raffles & entries",
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
          <UserSync />
          <Navbar />

          {/* PAGE CONTENT */}
          {children}

          <Footer />
        </ClerkProvider>

      </body>
    </html>
  );
}
