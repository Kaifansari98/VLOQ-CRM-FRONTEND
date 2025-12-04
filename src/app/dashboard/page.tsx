"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useAppSelector } from "@/redux/store";
import DashboardWrapper from "@/components/dashboard/DashboardWrapper";
import { Bell, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import GlobalLeadSearchModal from "@/components/dashboard/GlobalLeadSearchModal";
import { Kbd } from "@/components/ui/kbd";

export default function Page() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  const [openSearchModal, setOpenSearchModal] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");

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
  }, []);

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
                    <BreadcrumbPage>{userType}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2 pr-4">
              <div
                onClick={() => setOpenSearchModal(true)}
                className="flex items-center justify-between w-full sm:w-[260px] rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
              >
                <span className="truncate">Search leads...</span>

                <div className="hidden sm:flex items-center gap-1">
                  <Kbd>{navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}</Kbd>

                  <Kbd className="">K</Kbd>
                </div>
              </div>

              <Bell />
              <AnimatedThemeToggler />
              {/* <Settings/> */}
            </div>
          </header>

          {/* Wrap everything inside the conditional dashboard renderer */}
          <DashboardWrapper>
            {/* DEFAULT existing dashboard content */}
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
              </div>
              <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
            </div>
          </DashboardWrapper>
        </SidebarInset>
      </SidebarProvider>

      <GlobalLeadSearchModal
        open={openSearchModal}
        onOpenChange={setOpenSearchModal}
      />
    </>
  );
}
