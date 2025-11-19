import { ClerkProvider } from "@clerk/nextjs";
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
      <ClerkProvider>
        <body>
          <Navbar />
          {children}
          <Footer />
        </body>
      </ClerkProvider>
    </html>
  );
}
