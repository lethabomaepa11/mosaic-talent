import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers";
import "./globals.css";
import { siteDescription, siteOrigin } from "@/lib/seo";

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
  metadataBase: new URL(siteOrigin),
  title: { default: "mosaic.talent", template: "%s | mosaic.talent" },
  description: siteDescription,
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
  keywords: [
    "developer collaboration",
    "learn by building",
    "cofounders",
    "team projects",
    "peer reviews",
    "developer growth",
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
    <html lang="en" data-theme="light">
      <body className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
