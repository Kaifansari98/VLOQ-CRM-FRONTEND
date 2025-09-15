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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ModeToggle";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import OpenLeadDetails from "@/components/tabScreens/OpenLeadDetails";
import SiteMeasurementLeadDetails from "@/components/tabScreens/SiteMeasurementLeadDetails";
import BookingLeadsDetails from "@/components/tabScreens/BookingLeadsDetails";

export default function BookingStageLeadsDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  const lead = data?.data?.lead;
  const createdAt = lead?.created_at;
  const accountId = lead?.account_id;

  console.log(lead);

  const leadInfo = {
    leadId: leadId,
    createdAt: createdAt,
    accountId: accountId,
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <p className="p-6">Loading lead details...</p>;
  }

  const tabs = [
    {
      id: "details",
      title: "Details",
      color: "bg-zinc-900 hover:bg-zinc-800",
      cardContent: (
        <OpenLeadDetails lead={lead} formatDateTime={formatDateTime} />
      ),
    },
    {
      id: "measurement",
      title: "Site measurement",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: (
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">No closed leads yet.</p>
        </div>
      ),
    },
    {
      id: "designing",
      title: "Desiging Stage",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: <SiteMeasurementLeadDetails lead={leadInfo} />,
    },
    {
      id: "booking",
      title: "Booking Stage",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: <BookingLeadsDetails lead={leadInfo} />,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/sales-executive/booking-stage">
                    Booking Stage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {lead?.firstname} {lead?.lastname} Details
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <SmoothTab items={tabs} defaultTabId="details" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
