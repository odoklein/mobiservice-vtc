import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { dmSans } from "@/lib/fonts";
import { AddToHomeScreenPrompt } from "@/components/add-to-home-screen";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "MobiService VTC - Votre chauffeur premium en Haute-Savoie",
  description: "Service de transport avec chauffeur privé premium en Haute-Savoie. Sérénité, confidentialité, écologie et expérience au service de vos déplacements.",
  keywords: ["VTC Haute-Savoie", "chauffeur privé", "transport premium", "transfert aéroport Genève", "VTC Cluses"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if current route is an admin route
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || headersList.get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MobiService VTC" />
        <meta name="theme-color" content="#5CD85A" />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased tracking-tight`}>
        {!isAdminRoute && <Header />}
        {children}
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <AddToHomeScreenPrompt />}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

