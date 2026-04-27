"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { UiLeadStatusCounts, LeadStageItem } from "@/api/dashboard/dashboard.api";
import { useGetDashboardAllLeads } from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import { cn, getInitials } from "@/lib/utils";

interface SiteSupervisorPipelineCardProps {
  data?: UiLeadStatusCounts | null;
  isLoading?: boolean;
}

const STAGES = [
  {
    key: "total_final_measurement_leads" as keyof UiLeadStatusCounts,
    label: "Final Measurement",
    type: "Type 5",
    stageDataKey: "finalSiteMeasurementStage",
    path: "/dashboard/project/final-measurement/details",
    color: "var(--stage-ism)",
  },
  {
    key: "total_site_readiness_stage_leads" as keyof UiLeadStatusCounts,
    label: "Site Readiness",
    type: "Type 12",
    stageDataKey: "siteReadinessStage",
    path: "/dashboard/installation/site-readiness/details",
    color: "var(--stage-booking)",
  },
  {
    key: "total_under_installation_stage_leads" as keyof UiLeadStatusCounts,
    label: "Under Installation",
    type: "Type 15",
    stageDataKey: "underInstallationStage",
    path: "/dashboard/installation/under-installation/details",
    color: "var(--stage-approval)",
  },
  {
    key: "total_final_handover_stage_leads" as keyof UiLeadStatusCounts,
    label: "Final Handover",
    type: "Type 16",
    stageDataKey: "finalHandoverStage",
    path: "/dashboard/installation/final-handover/details",
    color: "var(--stage-open)",
  },
];

interface ModalState {
  open: boolean;
  stageDataKey: string | null;
  stageName: string | null;
  stagePath: string | null;
}

export default function SiteSupervisorPipelineCard({
  data,
  isLoading,
}: SiteSupervisorPipelineCardProps) {
  const router = useRouter();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;

  const { data: allLeads, isLoading: isLoadingLeads } = useGetDashboardAllLeads(
    vendorId,
    userId
  );

  const [modal, setModal] = useState<ModalState>({
    open: false,
    stageDataKey: null,
    stageName: null,
    stagePath: null,
  });

  const pieData = STAGES.map((s) => ({
    name: s.label,
    type: s.type,
    value: (data?.[s.key] as number) ?? 0,
    fill: s.color,
    stageDataKey: s.stageDataKey,
    path: s.path,
  }));

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  const handleDoubleClick = (entry: {
    name: string;
    stageDataKey: string;
    path: string;
  }) => {
    setModal({
      open: true,
      stageDataKey: entry.stageDataKey,
      stageName: entry.name,
      stagePath: entry.path,
    });
  };

  const modalLeads: LeadStageItem[] = useMemo(() => {
    if (!modal.stageDataKey || !allLeads) return [];
    return (allLeads[modal.stageDataKey as keyof typeof allLeads] as LeadStageItem[]) ?? [];
  }, [allLeads, modal.stageDataKey]);

  const handleLeadClick = (lead: LeadStageItem) => {
    if (!modal.stagePath) return;
    router.push(`${modal.stagePath}/${lead.id}?accountId=${lead.account_id}`);
    setModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Card className="w-full h-full border flex flex-col bg-background">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium">
              Sales Pipeline Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Active projects across installation stages
            </p>
          </div>
          <div className="flex items-end gap-2">
            {/* <span className="text-xs text-muted-foreground">Total</span>/ */}
            <span className="text-3xl font-semibold text-gray-500">
              {total.toLocaleString()} 
            </span>
            <span className="text-xl font-semibold text-gray-500">Leads in Total</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 h-full">
              {/* Donut chart */}
              <div className="w-full md:w-1/2 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number" ? value.toLocaleString() : ""
                      }
                      contentStyle={{
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "10px",
                        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="none"
                      onDoubleClick={(entry) => handleDoubleClick(entry)}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.fill}
                          className="cursor-pointer"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="w-full md:w-1/2 flex items-center">
                {total === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No active projects
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4 w-full">
                    {pieData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex flex-col items-start gap-1 cursor-pointer"
                        onDoubleClick={() => handleDoubleClick(entry)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: entry.fill }}
                          />
                          <span className="text-muted-foreground text-xs leading-tight">
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold pl-5">
                          {entry.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Modal */}
      <Dialog
        open={modal.open}
        onOpenChange={(val) => setModal((prev) => ({ ...prev, open: val }))}
      >
        <DialogContent className="sm:max-w-[500px] p-0">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search leads..." />
            <CommandList>
              <CommandGroup heading={modal.stageName ?? "Stage"}>
                {isLoadingLeads && (
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading leads...
                  </div>
                )}
                {!isLoadingLeads && modalLeads.length > 0
                  ? modalLeads.map((lead) => (
                      <CommandItem
                        key={lead.id}
                        onSelect={() => handleLeadClick(lead)}
                        className={cn("cursor-pointer")}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101016] text-white font-semibold shrink-0">
                            {getInitials(lead.name)}
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium">
                              {lead.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {lead.lead_code ?? "No Code"}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    ))
                  : !isLoadingLeads && (
                      <div className="p-4 text-sm text-muted-foreground">
                        No leads found.
                      </div>
                    )}
              </CommandGroup>
              <CommandEmpty>No results found.</CommandEmpty>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
