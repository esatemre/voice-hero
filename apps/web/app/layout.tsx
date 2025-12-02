import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voice Hero - Self-Optimizing Voice Pitches for Your Website",
  description: "Add a 20-second, AI-powered voice intro to your homepage that adapts to every visitor. Built with Google Cloud and ElevenLabs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
