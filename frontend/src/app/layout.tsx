import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mosaictalent | AI-Powered Hiring Intelligence",
  description:
    "Discover the full picture of developer talent. AI-driven soft skill assessment, peer reviews, and team simulation for smarter hiring.",
  keywords: [
    "hiring",
    "developer assessment",
    "AI",
    "soft skills",
    "peer reviews",
    "team simulation",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0A0B0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
