import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata = {
  title: "DPino Contests",
  description: "Dark Pino raffles & entries",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider appearance={{ theme: dark }}>
          <Navbar />
          {children}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
