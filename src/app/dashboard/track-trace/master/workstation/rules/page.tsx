"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useAppSelector } from "@/redux/store";
import {
  useMachinesByVendor,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import {
  useMachineRules,
  useToggleRuleStatus,
  useDeleteRule,
  useRuleFields,
} from "@/hooks/track-trace-hooks/useCutListRulesHooks";
import { useProjectCategories } from "@/hooks/track-trace/useProjectCategories";
import { toastManager } from "@/components/ui/toast";
import {
  Plus,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  Sliders,
  Search,
  CheckCircle2,
  Cpu,
  Zap,
  Filter,
  X,
} from "lucide-react";
import type { CutListRuleMaster } from "@/types/track-trace";

function SmoothFilterTabs({
  statusFilter,
  setStatusFilter,
  totalCount,
  activeCount,
  inactiveCount,
}: {
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  setStatusFilter: (val: "ALL" | "ACTIVE" | "INACTIVE") => void;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
        FILTER:
      </span>
      <div className="relative inline-flex items-center rounded-full bg-muted/80 p-1 border border-border/60 shadow-2xs select-none w-72 h-8">
        <div
          className="absolute top-1 bottom-1 rounded-full bg-primary shadow-xs transition-all duration-300 ease-in-out"
          style={{
            width: "calc((100% - 8px) / 3)",
            left:
              statusFilter === "ALL"
                ? "4px"
                : statusFilter === "ACTIVE"
                ? "calc(4px + (100% - 8px) / 3)"
                : "calc(4px + 2 * (100% - 8px) / 3)",
          }}
        />
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`relative z-10 flex-1 py-1 font-extrabold text-center rounded-full text-xs transition-colors duration-200 ${
            statusFilter === "ALL"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("ACTIVE")}
          className={`relative z-10 flex-1 py-1 font-extrabold text-center rounded-full text-xs transition-colors duration-200 ${
            statusFilter === "ACTIVE"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("INACTIVE")}
          className={`relative z-10 flex-1 py-1 font-extrabold text-center rounded-full text-xs transition-colors duration-200 ${
            statusFilter === "INACTIVE"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>
    </div>
  );
}

function WorkstationRulesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const machineIdParam = searchParams.get("machine_id");
  const machineId = machineIdParam ? Number(machineIdParam) : 0;

  // Auto-redirect to create rule page directly
  useEffect(() => {
    if (machineId) {
      router.replace(
        `/dashboard/track-trace/master/workstation/rules/create?machine_id=${machineId}`
      );
    }
  }, [machineId, router]);

  const authUser = useAppSelector((state) => state.auth.user);
  const vendorId = authUser?.vendor_id;

  const { data: machines = [], isLoading: isMachinesLoading } =
    useMachinesByVendor(vendorId ?? 0);

  const selectedMachine = useMemo(() => {
    return machines.find((m) => m.id === machineId) || null;
  }, [machines, machineId]);

  const {
    data: rules = [],
    isLoading: isRulesLoading,
    error: rulesError,
  } = useMachineRules(machineId, vendorId);

  const { mutate: toggleStatus, isPending: isToggling } =
    useToggleRuleStatus(machineId);
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteRule(machineId);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.rule_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.rule_tag && rule.rule_tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "ALL" ? true : rule.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rules, searchQuery, statusFilter]);

  const activeRulesCount = useMemo(
    () => rules.filter((r) => r.status === "ACTIVE").length,
    [rules]
  );
  const inactiveRulesCount = rules.length - activeRulesCount;

  const handleToggleStatus = (rule: CutListRuleMaster) => {
    const newStatus = rule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    toggleStatus(
      { ruleId: rule.id, status: newStatus },
      {
        onSuccess: () => {
          toastManager.add({
            title: `Rule status updated to ${newStatus}`,
            type: "success",
          });
        },
        onError: (err: any) => {
          toastManager.add({
            title: err.message || "Failed to update rule status",
            type: "error",
          });
        },
      }
    );
  };

  const handleDeleteRule = (ruleId: number, ruleName: string) => {
    if (confirm(`Are you sure you want to delete rule "${ruleName}"?`)) {
      deleteRule(ruleId, {
        onSuccess: () => {
          toastManager.add({
            title: "Rule deleted successfully",
            type: "success",
          });
        },
        onError: (err: any) => {
          toastManager.add({
            title: err.message || "Failed to delete rule",
            type: "error",
          });
        },
      });
    }
  };

  const { data: ruleFields = [] } = useRuleFields();
  const { data: projectCategoriesData } = useProjectCategories(vendorId);
  const projectCategories = useMemo(() => {
    return projectCategoriesData?.categories ?? [];
  }, [projectCategoriesData]);

  // Compact Inline Renderer for Conditions
  const renderInlineConditions = (rule: CutListRuleMaster) => {
    if (!rule.conditionGroups || rule.conditionGroups.length === 0) {
      return (
        <span className="text-xs text-muted-foreground italic">
          Always applies
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
        {rule.conditionGroups.map((group, gIdx) => {
          const isLastGroup = gIdx === rule.conditionGroups.length - 1;
          return (
            <React.Fragment key={gIdx}>
              <div className="inline-flex flex-wrap items-center gap-1.5 bg-muted/30 dark:bg-muted/20 px-2.5 py-1 rounded-md border border-border/50">
                {group.conditions.map((cond, cIdx) => {
                  const fieldLabel =
                    cond.condition_type === "CATEGORY"
                      ? "Category"
                      : ruleFields.find((f) => f.field_key === cond.field_key)?.field_name ||
                        cond.field_key ||
                        "Field";

                  let valDisplay = "";
                  if (cond.condition_type === "CATEGORY") {
                    const rawVal = cond.value;
                    const catObj = projectCategories.find(
                      (c) =>
                        String(c.id) === String(rawVal) ||
                        c.category_name.toLowerCase() === String(rawVal ?? "").toLowerCase()
                    );
                    valDisplay = catObj ? catObj.category_name : String(rawVal ?? "");
                  } else {
                    valDisplay = Array.isArray(cond.value)
                      ? cond.value.join(", ")
                      : String(cond.value ?? "");
                  }

                  const isLastCond = cIdx === group.conditions.length - 1;

                  return (
                    <React.Fragment key={cIdx}>
                      <span className="font-semibold text-primary">{fieldLabel}</span>
                      <span className="text-[11px] text-muted-foreground font-mono px-0.5">
                        {cond.operator.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px] border border-emerald-500/20">
                        "{valDisplay}"
                      </span>
                      {!isLastCond && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25 px-1.5 py-0"
                        >
                          {cond.logical_operator || "AND"}
                        </Badge>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {!isLastGroup && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25 px-1.5 py-0"
                >
                  {group.logical_operator || "OR"}
                </Badge>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Compact Inline Renderer for Actions
  const renderInlineActions = (rule: CutListRuleMaster) => {
    if (!rule.actions || rule.actions.length === 0) {
      return (
        <span className="text-xs text-muted-foreground italic">
          No actions
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {rule.actions.map((act, aIdx) => {
          const actionCode = act.actionMaster?.action_code || "";
          const actionName = act.actionMaster?.action_name || "Custom Action";
          const actValue = act.action_value;

          let replacementMachineName = "";
          if (actionCode === "REPLACE_MACHINE" && actValue) {
            const targetId =
              typeof actValue === "object" && actValue !== null
                ? actValue.machine_id || actValue.machineId
                : actValue;
            if (targetId) {
              const matched = machines.find((m) => m.id === Number(targetId));
              replacementMachineName = matched
                ? matched.machine_name
                : `Machine #${targetId}`;
            }
          }

          return (
            <Badge
              key={aIdx}
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 font-semibold text-xs bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs"
            >
              <Zap size={13} className="text-primary" />
              {actionName}
              {replacementMachineName && (
                <span className="font-normal text-muted-foreground ml-0.5">
                  → {replacementMachineName}
                </span>
              )}
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* ---------------- HEADER ---------------- */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track & Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/track-trace/master/workstation">
                  Workstations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Machine Rules</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 overflow-x-hidden p-6 w-full space-y-4">
        {/* Title & Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-border/60 hover:bg-muted/80 transition-colors shrink-0"
              onClick={() =>
                router.push("/dashboard/track-trace/master/workstation")
              }
            >
              <ArrowLeft size={15} />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Workstation Rules:{" "}
                <span className="text-primary font-extrabold">
                  {selectedMachine?.machine_name || `Machine #${machineId}`}
                </span>
                {selectedMachine?.machine_code && (
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 font-normal">
                    {selectedMachine.machine_code}
                  </Badge>
                )}
              </h1>
            </div>
          </div>

          <Button
            size="sm"
            className="h-8 px-3.5 gap-1.5 text-xs font-semibold shadow-xs shrink-0"
            onClick={() =>
              router.push(
                `/dashboard/track-trace/master/workstation/rules/create?machine_id=${machineId}`
              )
            }
          >
            <Plus size={14} />
            Create Rule
          </Button>
        </div>

        {/* Compact Search & Filter Bar */}
        {!isMachinesLoading && !isRulesLoading && !rulesError && rules.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card px-3 py-2 border border-border/70 rounded-lg shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search rule name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 h-8 text-xs focus-visible:ring-primary/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <SmoothFilterTabs
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              totalCount={rules.length}
              activeCount={activeRulesCount}
              inactiveCount={inactiveRulesCount}
            />
          </div>
        )}

        {/* Loading State */}
        {(isMachinesLoading || isRulesLoading) && (
          <div className="flex items-center justify-center p-12 text-xs text-muted-foreground border rounded-lg bg-card">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
            Loading workstation rules...
          </div>
        )}

        {/* Error State */}
        {rulesError && (
          <div className="p-4 text-xs text-destructive border border-destructive/20 rounded-lg bg-destructive/5 font-medium">
            Failed to load rules for this machine. Please try again.
          </div>
        )}

        {/* Compact Rules List */}
        {!isMachinesLoading && !isRulesLoading && !rulesError && (
          <div>
            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 border border-dashed border-border/80 rounded-lg bg-card text-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Sliders className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">No rules configured</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                    There are currently no cutlist routing or validation rules defined for{" "}
                    <strong>{selectedMachine?.machine_name || "this machine"}</strong>.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold"
                  onClick={() =>
                    router.push(
                      `/dashboard/track-trace/master/workstation/rules/create?machine_id=${machineId}`
                    )
                  }
                >
                  <Plus size={14} />
                  Add First Rule
                </Button>
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card text-center">
                <p className="text-xs text-muted-foreground">
                  No rules match your current search query or filter.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1.5 h-7 text-xs"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredRules.map((rule) => {
                  const isActive = rule.status === "ACTIVE";
                  return (
                    <div
                      key={rule.id}
                      className={`border rounded-xl p-3.5 bg-card shadow-2xs hover:border-primary/40 transition-all duration-200 border-l-2 ${
                        isActive ? "border-l-primary" : "border-l-muted-foreground/30"
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-border/50">
                        <div className="flex items-center gap-2.5">
                          <Badge
                            variant="secondary"
                            className="font-mono font-semibold text-[11px] px-2 py-0.5 bg-primary/5 text-primary border border-primary/15 shrink-0"
                          >
                            Priority #{rule.priority}
                          </Badge>

                          <h3 className="font-bold text-sm text-foreground tracking-tight">
                            {rule.rule_name}
                          </h3>

                          <code className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                            {rule.rule_code}
                          </code>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Active Status Switch */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                              }`}
                            />
                            <span
                              className={`text-xs font-semibold ${
                                isActive ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleToggleStatus(rule)}
                              disabled={isToggling}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 border-l border-border/60 pl-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={() =>
                                router.push(
                                  `/dashboard/track-trace/master/workstation/rules/create?machine_id=${machineId}&rule_id=${rule.id}`
                                )
                              }
                              title="Edit Rule"
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              onClick={() => handleDeleteRule(rule.id, rule.rule_name)}
                              disabled={isDeleting}
                              title="Delete Rule"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Compact Flow Row (WHEN -> THEN) */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 bg-muted px-1.5 py-0.5 rounded">
                            WHEN
                          </span>
                          {renderInlineConditions(rule)}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-2 md:pt-0 md:pl-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded shrink-0">
                            THEN
                          </span>
                          {renderInlineActions(rule)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function WorkstationRulesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading rules page...
        </div>
      }
    >
      <WorkstationRulesContent />
    </Suspense>
  );
}
