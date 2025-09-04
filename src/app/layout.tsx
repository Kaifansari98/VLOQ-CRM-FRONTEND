import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProviders } from "@/redux/provider";
import { ToastProvider } from "@/providers/ToastProvider";
import { SessionLoader } from "@/components/SessionLoader"
import { ProtectedLayout } from "@/providers/ProtectedLayout";
import { NuqsAdapter } from "nuqs/adapters/next/app";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
              </NuqsAdapter>
              <ToastProvider />
            </ProtectedLayout>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
