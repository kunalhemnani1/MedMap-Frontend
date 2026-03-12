import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Chatbot from "@/components/Chatbot";
import OfflineBanner from "@/components/shared/OfflineBanner";
import BackgroundNearbyCache from "@/components/shared/BackgroundNearbyCache";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedMap - Healthcare Cost Transparency",
  description: "Compare healthcare costs, check insurance coverage, and find the best care for your budget.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedMap",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Chatbot />
        <OfflineBanner />
        <BackgroundNearbyCache />
      </body>
    </html>
  );
}
