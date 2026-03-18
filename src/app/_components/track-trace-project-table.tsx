"use client";

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
import { useAppSelector } from "@/redux/store";
import DashboardWrapper from "@/components/dashboard/DashboardWrapper";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import GlobalLeadSearchModal from "@/components/dashboard/GlobalLeadSearchModal";
import { Kbd } from "@/components/ui/kbd";
import { FadeInProvider } from "@/components/framer-motion/FadeInProvider";
import TraceTraceDashboard from "@/components/dashboard/TraceTraceDashboard";

export default function Page() {
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [isMac, setIsMac] = useState(true); // <-- FIX

  // Runs only in the browser → safe
  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" && navigator.platform.includes("Mac")
    );

    const handleKey = (e: KeyboardEvent) => {
      if (
        (isMac && e.metaKey && e.key === "k") ||
        (!isMac && e.ctrlKey && e.key === "k")
      ) {
        e.preventDefault();
        setOpenSearchModal(true);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMac]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Track Trace</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2 pr-4">
          {/* 🔍 Mobile Search Icon */}
          <button
            onClick={() => setOpenSearchModal(true)}
            className="sm:hidden flex"
            aria-label="Search"
          >
            <Search  />
          </button>

          {/* 🔍 Desktop Search Input */}
          <div
            onClick={() => setOpenSearchModal(true)}
            className="hidden sm:flex items-center justify-between w-[260px] rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground cursor-pointer"
          >
            <span className="truncate">Search leads...</span>

            <div className="flex items-center gap-1">
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </div>
          </div>

          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* Wrap everything inside the conditional dashboard renderer */}

      <FadeInProvider>
              <TraceTraceDashboard></TraceTraceDashboard>
            </FadeInProvider>

        {/* <DashboardWrapper>
            
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
            </div>
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
            </div>
        </DashboardWrapper> */}

      <GlobalLeadSearchModal
        open={openSearchModal}
        onOpenChange={setOpenSearchModal}
      />
    </>
  );
}
