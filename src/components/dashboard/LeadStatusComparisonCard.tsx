"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PipeLineActionModal from "./PipeLineActionModal";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { GenerateLeadFormModal } from "../sales-executive/Lead/leads-generation-form-modal";

interface SalesExecutiveStageCounts {
  [key: string]: number | undefined;
}

interface PipelinePieChartProps {
  data?: SalesExecutiveStageCounts | null;
  isLoading?: boolean;
}

const STAGE_COLORS = {
  Open: "var(--stage-open)",
  ISM: "var(--stage-ism)",
  Design: "var(--stage-design)",
  Booking: "var(--stage-booking)",
  Docs: "var(--stage-docs)",
  Approval: "var(--stage-approval)",
  "Tech Check": "var(--stage-tech-check)",
  "RTD Stage": "var(--stage-rtd)",
  "Dispatch Plan": "var(--stage-dispatch)",
};

const STAGE_MAPPING = [
  { key: "openLead", label: "Open", type: "Type 1" },
  { key: "ismLead", label: "ISM", type: "Type 2" },
  { key: "designing", label: "Design", type: "Type 3" },
  { key: "bookingDone", label: "Booking", type: "Type 4" },
  { key: "clientDocumentation", label: "Docs", type: "Type 6" },
  { key: "clientApproval", label: "Approval", type: "Type 7" },
  { key: "techCheck", label: "Tech Check", type: "Type 8" },
  { key: "readyToDispatch", label: "RTD Stage", type: "Type 11" },
  { key: "dispatchPlanning", label: "Dispatch Plan", type: "Type 13" },
];

export default function PipelinePieChart({
  data,
  isLoading,
}: PipelinePieChartProps) {
  const router = useRouter();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const [openCreateLead, setOpenCreateLead] = useState(false);

  // Prepare Pie Data
  const pieData = STAGE_MAPPING.map((s) => ({
    name: s.label,
    type: s.type,
    value: data?.[s.key] ?? 0,
    fill: STAGE_COLORS[s.label as keyof typeof STAGE_COLORS] || "#94a3b8",
  })).filter((item) => item.value > 0);

  const [modalData, setModalData] = useState<{
    open: boolean;
    stageKey: string | null;
    stageName: string | null;
    stageType: string | null;
  }>();

  const handleSliceDoubleClick = (entry: any) => {
    const matched = STAGE_MAPPING.find((s) => s.label === entry.name);

    setModalData({
      open: true,
      stageKey: matched?.key ?? null,
      stageName: entry.name,
      stageType: matched?.type ?? null,
    });
  };

  return (
    <>
      <Card className="w-full h-full border flex flex-col justify-between bg-background">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              Pipeline Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground ">
              Breakdown of leads across stages
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenCreateLead(true)}
              className="px-3 py-1.5 text-xs border  bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md"
            >
              Add New Lead
            </button>

            <button
              onClick={() =>
                router.push("/dashboard/accounting/payments/create")
              }
              className="px-3 py-1.5 text-xs border bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md"
            >
              Add Payment
            </button>
          </div>
        </CardHeader>

        {/* Chart */}
        <CardContent className="flex-1 flex items-center">
          {isLoading ? (
            <div className="h-[220px] w-1/2 flex items-center justify-center">
              <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="h-[220px] w-full flex items-center gap-6">
              {/* PIE */}
              <div className="h-full w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: number) => value.toLocaleString()}
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
                      onDoubleClick={handleSliceDoubleClick}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.fill}
                          className="cursor-pointer transition-all"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* LEGENDS */}
              <div className="flex-1 h-full flex flex-col justify-center">
                {pieData.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No data to display
                  </p>
                ) : (
                  <div className="grid grid-cols-3 text-sm h-full gap-y-4">
                    {pieData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex flex-col items-start gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.fill }}
                          ></span>
                          <span className="text-muted-foreground text-xs cursor-pointer" onDoubleClick={() => handleSliceDoubleClick(entry)}>
                            {entry.name}
                          </span>
                        </div>

                        <span className="text-md font-semibold pl-5 cursor-pointer" onDoubleClick={() => handleSliceDoubleClick(entry)}>
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

      <PipeLineActionModal
        open={modalData?.open ?? false}
        onOpenChange={(val) =>
          setModalData((prev) => ({ ...prev!, open: val }))
        }
        vendorId={vendorId}
        userId={userId}
        stageKey={modalData?.stageKey ?? null}
        stageName={modalData?.stageName ?? null}
        stageType={modalData?.stageType ?? null}
      />

      <GenerateLeadFormModal
        open={openCreateLead}
        onOpenChange={setOpenCreateLead}
      />
    </>
  );
}
