"use client";

import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { apiClient } from "@/lib/apiClient";
import { useAppSelector } from "@/redux/store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { MetaIcon } from "@/components/icons/meta-icon";
import { GoogleSheetsGuideSection } from "@/components/integration/google-sheets-guide-modal";

export default function MetaIntegrationPage() {
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id;
  const userType = user?.user_type?.user_type?.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  const isSuperAdmin = userType === "super-admin" || userType === "auditor";
  const isOnlineLeadFeatureEnabled =
    user?.vendor?.is_online_lead_feature_enabled === true;

  const isAllowed = isSuperAdmin && isOnlineLeadFeatureEnabled;

  const [vendorToken, setVendorToken] = useState<string>("");

  // Environment-aware Base URL: staging uses staging-api, production continues using api
  const env = (process.env.NEXT_PUBLIC_ENVIRONMENT ?? "").toUpperCase();
  const isProduction =
    env === "PRODUCTION" ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "furnixcrm.com" ||
       window.location.hostname === "app.furnixcrm.com" ||
       window.location.origin.toLowerCase().includes("production")));

  const apiBaseUrl = isProduction
    ? "https://api.furnixcrm.com"
    : "https://staging-api.furnixcrm.com";

  const genericWebhookUrl = vendorToken
    ? `${apiBaseUrl}/webhook?vendor_token=${vendorToken}`
    : "";

  // Fetch or generate vendor token
  const loadVendorToken = async () => {
    if (!vendorId) return;
    try {
      const res = await apiClient.post("/vendor-tokens/generate", {
        vendor_id: vendorId,
      });
      if (res.data?.success && res.data?.data?.token) {
        setVendorToken(res.data.data.token);
      }
    } catch (err) {
      console.error("Failed to load vendor token:", err);
    }
  };

  useEffect(() => {
    if (isAllowed) {
      loadVendorToken();
    }
  }, [vendorId, isAllowed]);

  if (user && !isAllowed) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                    Integration
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <AnimatedThemeToggler />
          </div>
        </header>

        <main className="flex-1 p-6 max-w-lg mx-auto w-full flex items-center justify-center">
          <div className="text-center space-y-4 p-8 border rounded-2xl bg-card shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">
              {!isSuperAdmin ? "Access Restricted" : "Feature Not Enabled"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {!isSuperAdmin
                ? "This integration page is only accessible to Super Admin users. Callers, Sales Executives, and other staff members do not have permission to view this section."
                : "Online Lead & Integration feature is currently disabled for your vendor account. Please enable is_online_lead_feature_enabled in Vendor Master to access Meta integration."}
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-muted-foreground">Integration</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold flex items-center gap-1.5">
                  <MetaIcon className="w-4 h-4 text-primary" /> Meta
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* Main Content Area - Clean Direct Guide */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <GoogleSheetsGuideSection
          webhookUrl={genericWebhookUrl}
          vendorToken={vendorToken}
        />
      </main>
    </div>
  );
}
