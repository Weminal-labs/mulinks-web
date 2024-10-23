import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TopLoader from "@/components/layouts/toploader";
import { Providers } from "@/components/wagmi-providers";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="twitter:card" content="player" />
        <meta name="twitter:site" content="@kayx86" />
        <meta name="twitter:title" content="Demo Sblinks" />
        <meta name="twitter:description" content="Brief description of your app" />
        <meta
          name="twitter:player"
          content="https://vite-react-chauanhtuan185s-projects.vercel.app/swap"
        />
        <meta name="twitter:player:width" content="360" />
        <meta name="twitter:player:height" content="560" />
        <meta
          name="twitter:image"
          content="https://app.ekubo.org/pwa-512x512.png"
        />
        <meta property="og:url" content="https://vite-react-chauanhtuan185s-projects.vercel.app/swap" />
        <meta property="og:title" content="test" />
        <meta property="og:description" content="test" />
        <meta property="og:image" content="https://app.ekubo.org/pwa-512x512.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TopLoader />
        <Providers>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
