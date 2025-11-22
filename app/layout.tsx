import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { samsungSharpSans } from "@/lib/fonts";
import { AddToHomeScreenPrompt } from "@/components/add-to-home-screen";

export const metadata: Metadata = {
  title: "MobiService VTC - Votre chauffeur premium à Lyon",
  description: "Service de transport avec chauffeur privé premium à Lyon. Sérénité, confidentialité, écologie et expérience au service de vos déplacements.",
  keywords: ["VTC Lyon", "chauffeur privé", "transport premium", "taxi Lyon", "transfert aéroport Lyon"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MobiService VTC",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MobiService VTC" />
        <meta name="theme-color" content="#00FF88" />
      </head>
      <body className={`${samsungSharpSans.variable} font-sans antialiased`}>
        <Header />
        {children}
        <Footer />
        <AddToHomeScreenPrompt />
      </body>
    </html>
  );
}
