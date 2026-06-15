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
import { GenerateLeadFormModal } from "@/components/sales-executive/Lead/leads-generation-form-modal";
import { useState } from "react";
import { useAppSelector } from "@/redux/store";
import { canCreateLead } from "@/components/utils/privileges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Plus } from "lucide-react";
import DraftLeadsTable from "../../../_components/draft-leads-table";

export default function DraftLeadsPage() {
  const [openCreateLead, setOpenCreateLead] = useState(false);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const normalizedUserType = userType?.trim().toLowerCase();
  const canShowAddNewLeadButton =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.add_lead",
        )
      : canCreateLead(userType);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Draft Leads</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          {canShowAddNewLeadButton && (
            <>
              <Button size="sm" className="hidden sm:flex" onClick={() => setOpenCreateLead(true)}>
                Add New Lead
              </Button>

              <GenerateLeadFormModal
                open={openCreateLead}
                onOpenChange={setOpenCreateLead}
              />
            </>
          )}

          <NotificationBell />
          <AnimatedThemeToggler />

          {canShowAddNewLeadButton && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="sm:hidden relative bg-accent p-1.5 rounded-sm h-8 w-8"
                >
                  <EllipsisVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setOpenCreateLead(true)}>
                  <Plus size={16} className="mr-2" />
                  Add New Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <DraftLeadsTable />
      </main>
    </>
  );
}
