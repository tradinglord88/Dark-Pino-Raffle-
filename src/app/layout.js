import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
// CHANGE TO (CORRECT):
import UserSync from "./UserSync";
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
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#F8C200',
            }
          }}
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <UserSync />
          <Navbar />
          {children}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}