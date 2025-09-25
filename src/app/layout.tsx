import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProviders } from "@/redux/provider";
import { ToastProvider } from "@/providers/ToastProvider";
import { SessionLoader } from "@/components/SessionLoader"
import { ProtectedLayout } from "@/providers/ProtectedLayout";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Furnix",
  description: "Furniture CRM Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload Google Maps */}
        <link rel="dns-prefetch" href="//maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Load Google Maps script early */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyC1FZNdpxsDhZvcDJcTbbxEfvjJYQUFgSg&libraries=places,geometry`}
          strategy="beforeInteractive"
        />
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>
            <SessionLoader />
            <ProtectedLayout>
              <NuqsAdapter>
                {children}
                <ToastProvider />
              </NuqsAdapter>
            </ProtectedLayout>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}