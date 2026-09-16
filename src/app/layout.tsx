import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "react-quill-new/dist/quill.snow.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProviders } from "@/redux/provider";
import { SessionLoader } from "@/components/SessionLoader";
import { ToastProvider } from "@/providers/ToastProvider";
import { ProtectedLayout } from "@/providers/ProtectedLayout";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Script from "next/script";
import { Suspense } from "react";
import { MAINTENANCE_MODE } from "@/lib/maintainanceManagement";
import MaintenanceScreen from "@/components/maintenance-screen";
import { BRAND_CONFIGS } from "@/lib/brandConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


// ✅ ONLY ONE METADATA FUNCTION
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  //const host = headersList.get("host") || "";
  const host = headersList.get("x-forwarded-host") 
          || headersList.get("host") 
          || "";
  const brand = BRAND_CONFIGS.find((b) =>
    host.includes(b.match)
  );

  return {
    title: brand?.title || "Furnix CRM Platform",
    description:
      brand?.description ||
      "A modern furniture CRM platform for managing leads, vendors, and projects efficiently.",
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="//maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
      </head>

      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyC1FZNdpxsDhZvcDJcTbbxEfvjJYQUFgSg&libraries=places,geometry`}
          strategy="beforeInteractive"
        />

        {MAINTENANCE_MODE ? (
          <MaintenanceScreen />
        ) : (
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AppProviders>
              <SessionLoader />
              <ProtectedLayout>
                <Suspense fallback={null}>
                  <NuqsAdapter>
                    {children}
                    <ToastProvider />
                  </NuqsAdapter>
                </Suspense>
              </ProtectedLayout>
            </AppProviders>
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
