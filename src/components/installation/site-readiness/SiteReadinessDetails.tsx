"use client";

import React, { useState, useEffect } from "react";
import { useAppSelector } from "@/redux/store";
import {
  getSiteReadinessRecords,
  useCreateSiteReadiness,
  useUpdateSiteReadiness,
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
import { canViewAndWorkSiteRedinessStage } from "@/components/utils/privileges";
import CustomeTooltip from "@/components/custom-tooltip";
import { useQueryClient } from "@tanstack/react-query";

import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useLeadById } from "@/hooks/useLeadsQueries";

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

function checklistFromResponse(response: { questions: { key: string; label: string }[]; records: { id: number; type: string; value: boolean | null; remark?: string }[] }): ChecklistItem[] {
  return response.questions.map((question) => {
    const existing = response.records.find((record) => record.type === question.key);
    return { type: question.key, label: question.label, id: existing?.id, value: existing?.value ?? null, remark: existing?.remark ?? "" };
  });
}

export default function SiteReadinessDetails({
  leadId,
  accountId,
}: SiteReadinessDetailsProps) {
  const vendor_id = useAppSelector((state) => state.auth.user?.vendor_id);
  const user_id = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);

  const { data: leadData } = useLeadStatus(leadId, vendor_id);
  const leadStatus = leadData?.status;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateSiteReadiness();
  const updateMutation = useUpdateSiteReadiness();

  const { data: leadResponse } = useLeadById(
    leadId,
    vendor_id,
    user_id,
  );

  const lead = leadResponse?.data?.lead;

  const {
    blockedTooltip,
    shouldDisableBlockedActions,
  } = useLeadAccessControl({
    leadId,
    userType,
    lead,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchRecords = async () => {
      if (!vendor_id || !leadId) return;
      setFetchLoading(true);
      setError(null);
      setChecklistData([]);
      try {
        const response = await getSiteReadinessRecords(vendor_id, leadId, accountId);
        if (!cancelled) setChecklistData(checklistFromResponse(response));
      } catch {
        if (!cancelled) setError("Failed to load the site readiness checklist. Please retry.");
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };
    void fetchRecords();
    return () => { cancelled = true; };
  }, [vendor_id, leadId, accountId]);

  const refetchRecords = async () => {
    if (!vendor_id || !leadId) return;
    const response = await getSiteReadinessRecords(vendor_id, leadId, accountId);
    setChecklistData(checklistFromResponse(response));
  };

  const handleChecklistChange = (
    index: number,
    field: "value" | "remark",
    value: any,
  ) => {
    setChecklistData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
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
      // ✅ Only send items that have at least one field filled
      const filledItems = checklistData.filter(
        (item) =>
          item.value !== null || (item.remark && item.remark.trim() !== ""),
      );

      const toCreate = filledItems.filter((item) => !item.id);
      const toUpdate = filledItems.filter((item) => item.id);

      const createPayload = toCreate.map((item) => ({
        account_id: accountId,
        type: item.type,
        remark: item.remark?.trim() || null,
        value: item.value,
        created_by: user_id,
        updated_by: user_id,
      }));

      const updatePayload = toUpdate.map((item) => ({
        id: item.id!,
        account_id: accountId,
        type: item.type,
        remark: item.remark?.trim() || null,
        value: item.value,
        updated_by: user_id,
      }));

      if (createPayload.length > 0) {
        await createMutation.mutateAsync({
          vendorId: vendor_id,
          leadId,
          payload: createPayload,
        });
      }

      if (updatePayload.length > 0) {
        await updateMutation.mutateAsync({
          vendorId: vendor_id,
          leadId,
          payload: updatePayload,
        });
      }

      queryClient.invalidateQueries({
        // ← ADD THIS
        queryKey: ["checkSiteReadinessCompletion", vendor_id, leadId],
      });

      await refetchRecords();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save site readiness data");
    } finally {
      setLoading(false);
    }
  };
  const completedCount = checklistData.filter(
    (item) => item.value !== null,
  ).length;

  const totalCount = checklistData.length;
  const completionPercentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading checklist...</p>
      </div>
    );
  }

  const canViewAndWork = canViewAndWorkSiteRedinessStage(userType, leadStatus);
  const canEditChecklist =
    !shouldDisableBlockedActions &&
    (
      userType === "custom"
        ? customPrivilegeCodes.includes(
          "installation.site_readiness.checklist_of_site_readiness.update_edit",
        )
        : canViewAndWork
    );

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
          <AlertDescription className="text-sm">{error}{!checklistData.length && <Button variant="link" onClick={() => refetchRecords().then(() => setError(null)).catch(() => setError("Failed to load the site readiness checklist. Please retry."))}>Retry</Button>}</AlertDescription>
        </Alert>
      )}

      {/* Main Checklist Card */}
      <Card className="border bg-[#fff] dark:bg-[#0a0a0a]">
        <CardHeader className="border-b">
          <div className="flex flex-col  sm:flex-row sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Site Readiness Checklist
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Complete all mandatory checks before proceeding
                </p>
              </div>
            </div>

            <div className="flex md:flex-col lg:flex-row items-center gap-2">
              <div className="flex justify-between gap-3 w-full ">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  <span className="text-primary">{completedCount}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span>{totalCount}</span>
                </Badge>
                <Badge
                  variant={completionPercentage === 100 ? "default" : "outline"}
                  className={cn(
                    "text-xs px-2 py-0.5",
                    completionPercentage === 100 && "bg-primary",
                  )}
                >
                  {completionPercentage}%
                </Badge>
              </div>

              <CustomeTooltip
                truncateValue={
                  <div
                    className={`${!canEditChecklist ? "opacity-70 pointer-events-none" : ""
                      }`}
                  >
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !canEditChecklist || !checklistData.length}
                      size="sm"
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
                  shouldDisableBlockedActions
                    ? blockedTooltip
                    : !canEditChecklist && userType === "site-supervisor"
                      ? "This lead stage has progressed. Site Supervisors cannot modify this section."
                      : !canEditChecklist && userType === "custom"
                        ? "You do not have permission to update the Site Readiness checklist."
                        : !canEditChecklist
                          ? "You do not have access to save changes."
                          : undefined
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 space-y-2">
          {checklistData.map((item, index) => (
            <div
              key={item.type}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                item.value === true && "",
                item.value === false && "",
              )}
            >
              {/* Checklist Header */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors mt-0.5",
                      item.value === true
                        ? "bg-green-500 text-white ring-2 ring-green-500/20"
                        : item.value === false
                          ? "bg-red-500 text-white ring-2 ring-red-500/20"
                          : "bg-muted text-foreground ring-2 ring-border",
                    )}
                  >
                    {item.value === true ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : item.value === false ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
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
                  <CustomeTooltip
                    value={
                      shouldDisableBlockedActions
                        ? blockedTooltip
                        : undefined
                    }
                    truncateValue={
                      <span>
                        <button
                          type="button"
                          disabled={
                            !canEditChecklist ||
                            shouldDisableBlockedActions
                          }
                          onClick={() =>
                            handleChecklistChange(
                              index,
                              "value",
                              true,
                            )
                          }
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all duration-150",
                            "focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-offset-1",
                            item.value === true
                              ? "bg-green-500 border-green-500 text-white shadow-sm"
                              : "bg-background border-border text-muted-foreground hover:border-green-400 hover:text-green-600",
                            (!canEditChecklist ||
                              shouldDisableBlockedActions) &&
                            "opacity-60 cursor-not-allowed",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Yes</span>
                        </button>
                      </span>
                    }
                  />
                  <CustomeTooltip
                    value={
                      shouldDisableBlockedActions
                        ? blockedTooltip
                        : undefined
                    }
                    truncateValue={
                      <span>
                        <button
                          type="button"
                          disabled={
                            !canEditChecklist ||
                            shouldDisableBlockedActions
                          }
                          onClick={() =>
                            handleChecklistChange(
                              index,
                              "value",
                              false,
                            )
                          }
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all duration-150",
                            "focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1",
                            item.value === false
                              ? "bg-red-500 border-red-500 text-white shadow-sm"
                              : "bg-background border-border text-muted-foreground hover:border-red-400 hover:text-red-600",
                            (!canEditChecklist ||
                              shouldDisableBlockedActions) &&
                            "opacity-60 cursor-not-allowed",
                          )}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>No</span>
                        </button>
                      </span>
                    }
                  />
                </div>
              </div>

              {/* Remark Field */}
              <div className="space-y-1.5 sm:ml-8">
                <Label
                  htmlFor={`remark-${item.type}`}
                  className="text-xs text-muted-foreground"
                >
                  Remark{" "}
                  <span className="text-[10px] text-muted-foreground/60">
                    (Optional)
                  </span>
                </Label>
                {shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <div className="w-full">
                        <Textarea
                          id={`remark-${item.type}`}
                          value={item.remark}
                          disabled
                          placeholder="Add any relevant notes or observations..."
                          className="resize-none text-xs h-16 py-2 cursor-not-allowed"
                          rows={2}
                        />
                      </div>
                    }
                  />
                ) : (
                  <Textarea
                    id={`remark-${item.type}`}
                    value={item.remark}
                    onChange={(e) =>
                      handleChecklistChange(
                        index,
                        "remark",
                        e.target.value,
                      )
                    }
                    placeholder="Add any relevant notes or observations..."
                    disabled={!canEditChecklist}
                    className="resize-none text-xs h-16 py-2"
                    rows={2}
                  />
                )}
              </div>

              {/* Status Indicator Dot */}
              <div
                className={cn(
                  "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background transition-all",
                  item.value === true && "bg-green-500",
                  item.value === false && "bg-red-500",
                  item.value === null && "bg-gray-300",
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
