"use client";

import React, { useState, useEffect } from "react";
import { useAppSelector } from "@/redux/store";
import {
  createSiteReadiness,
  getSiteReadinessRecords,
  updateSiteReadiness,
} from "@/api/installation/useSiteReadinessLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  Save,
  Check,
  X,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorSiteRedinessStage } from "@/components/utils/privileges";
import CustomeTooltip from "@/components/cutome-tooltip";

interface SiteReadinessDetailsProps {
  leadId: number;
  accountId: number;
  name?: string;
}

interface ChecklistItem {
  id?: number;
  type: string;
  label: string;
  value: boolean | null;
  remark: string;
}

const CHECKLIST_ITEMS = [
  { type: "1st_layer_paint", label: "1st Layer of Paint" },
  { type: "dust_free_area", label: "Dust free working area" },
  { type: "cept_completion", label: "CEPT Completion Status" },
  { type: "appliances_on_site", label: "Appliances on site" },
  { type: "client_scope_material", label: "Client's scope material" },
  { type: "counter_top_material", label: "Counter Top Material" },
];

export default function SiteReadinessDetails({
  leadId,
  accountId,
  name,
}: SiteReadinessDetailsProps) {
  const vendor_id = useAppSelector((state) => state.auth.user?.vendor_id);
  const user_id = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  const [checklistData, setChecklistData] = useState<ChecklistItem[]>(
    CHECKLIST_ITEMS.map((item) => ({
      type: item.type,
      label: item.label,
      value: null,
      remark: "",
    }))
  );

  const { data: leadData } = useLeadStatus(leadId, vendor_id);
  const leadStatus = leadData?.status;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!vendor_id || !leadId) return;

      try {
        setFetchLoading(true);
        const response = await getSiteReadinessRecords(
          vendor_id,
          leadId,
          accountId
        );

        if (response?.records && response.records.length > 0) {
          const updatedChecklist = checklistData.map((item) => {
            const existing = response.records.find(
              (r: any) => r.type === item.type
            );
            return existing
              ? {
                  ...item,
                  id: existing.id,
                  value: existing.value,
                  remark: existing.remark || "",
                }
              : item;
          });
          setChecklistData(updatedChecklist);
        }
      } catch (err: any) {
        console.error("Error fetching records:", err);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchRecords();
  }, [vendor_id, leadId, accountId]);

  const handleChecklistChange = (
    index: number,
    field: "value" | "remark",
    value: any
  ) => {
    setChecklistData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async () => {
    if (!vendor_id || !user_id) {
      setError("Vendor ID or User ID is missing");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = checklistData.map((item) => ({
        id: item.id,
        account_id: accountId,
        type: item.type,
        remark: item.remark || null,
        value: item.value,
        created_by: user_id,
        updated_by: user_id,
      }));

      const hasExistingRecords = checklistData.some((item) => item.id);

      if (hasExistingRecords) {
        await updateSiteReadiness(vendor_id, leadId, payload);
      } else {
        await createSiteReadiness(vendor_id, leadId, payload);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save site readiness data");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = checklistData.filter(
    (item) => item.value !== null
  ).length;

  const totalCount = checklistData.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading checklist...</p>
      </div>
    );
  }

  const canViewAndWork = canViewAndWorSiteRedinessStage(userType, leadStatus);

  return (
    <div className="space-y-4 w-full mx-auto">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
            Site readiness data saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Checklist Card */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Site Readiness Checklist
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete all mandatory checks before proceeding
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <span className="text-primary">{completedCount}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span>{totalCount}</span>
              </Badge>
              <Badge
                variant={completionPercentage === 100 ? "default" : "outline"}
                className={cn(
                  "text-xs px-2 py-0.5",
                  completionPercentage === 100 &&
                    "bg-green-500 hover:bg-green-600"
                )}
              >
                {completionPercentage}%
              </Badge>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <CustomeTooltip
                truncateValue={
                  <div
                    className={`${
                      !canViewAndWork ? "opacity-70 pointer-events-none" : ""
                    }`}
                  >
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !canViewAndWork}
                      size="sm"
                      className="gap-1.5 h-8 px-3"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-xs">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          <span className="text-xs">Save Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                }
                value={
                  !canViewAndWork && userType === "site-supervisor"
                    ? "This lead stage has progressed. Site Supervisors cannot modify this section."
                    : !canViewAndWork
                    ? "You do not have access to save changes."
                    : undefined
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3 ">
          {checklistData.map((item, index) => (
            <div
              key={item.type}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                "hover:border-primary/30 hover:shadow-sm",
                item.value === true &&
                  "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/30",
                item.value === false &&
                  "border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/30"
              )}
            >
              {/* Checklist Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors mt-0.5",
                      item.value
                        ? "bg-green-500 text-white ring-2 ring-green-500/20"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {item.value ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold leading-tight cursor-default">
                      {item.label}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Please verify and select an option
                    </p>
                  </div>
                </div>

                {/* Compact Yes/No Toggle */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={!canViewAndWork}
                    onClick={() => handleChecklistChange(index, "value", true)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all duration-150",
                      "focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-offset-1",
                      item.value === true
                        ? "bg-green-500 border-green-500 text-white shadow-sm"
                        : "bg-background border-border text-muted-foreground hover:border-green-400 hover:text-green-600",
                      !canViewAndWork && "opacity-60 cursor-not-allowed" // 🔥 added here
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Yes</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canViewAndWork}
                    onClick={() => handleChecklistChange(index, "value", false)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all duration-150",
                      "focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1",
                      item.value === false
                        ? "bg-red-500 border-red-500 text-white shadow-sm"
                        : "bg-background border-border text-muted-foreground hover:border-red-400 hover:text-red-600",
                      !canViewAndWork && "opacity-60 cursor-not-allowed" // 🔥 added here
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>No</span>
                  </button>
                </div>
              </div>

              {/* Remark Field */}
              <div className="space-y-1.5 ml-8">
                <Label
                  htmlFor={`remark-${item.type}`}
                  className="text-xs text-muted-foreground"
                >
                  Remark{" "}
                  <span className="text-[10px] text-muted-foreground/60">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  id={`remark-${item.type}`}
                  value={item.remark}
                  onChange={(e) =>
                    handleChecklistChange(index, "remark", e.target.value)
                  }
                  placeholder="Add any relevant notes or observations..."
                  disabled={!canViewAndWork}
                  className="resize-none text-xs h-16 py-2"
                  rows={2}
                />
              </div>

              {/* Status Indicator Dot */}
              <div
                className={cn(
                  "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background transition-all",
                  item.value === true && "bg-green-500",
                  item.value === false && "bg-red-500",
                  item.value === null && "bg-gray-300"
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
