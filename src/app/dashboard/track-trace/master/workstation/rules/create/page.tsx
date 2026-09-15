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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useAppSelector } from "@/redux/store";
import { useMachinesByVendor } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import {
  useRuleFields,
  useVendorRuleActions,
  useRuleDetails,
  useMachineRules,
  useCreateRule,
  useUpdateRule,
} from "@/hooks/track-trace-hooks/useCutListRulesHooks";
import { useProjectCategories } from "@/hooks/track-trace/useProjectCategories";
import { toastManager } from "@/components/ui/toast";
import {
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  SlidersHorizontal,
  Filter,
  Zap,
  Sparkles,
  Code2,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
} from "lucide-react";
import type {
  RuleConditionType,
  RuleOperator,
  LogicalOperator,
  CreateRulePayload,
} from "@/types/track-trace";

interface ConditionFormState {
  id?: number;
  condition_type: RuleConditionType | "";
  field_key: string;
  operator: RuleOperator | "";
  value: string;
  logical_operator: LogicalOperator;
}

interface ConditionGroupFormState {
  id?: number;
  logical_operator: LogicalOperator;
  conditions: ConditionFormState[];
}

function SmoothPillToggle({
  value,
  onChange,
  label,
}: {
  value: "AND" | "OR";
  onChange: (val: "AND" | "OR") => void;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      {label && (
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          {label}
        </span>
      )}
      <div className="relative inline-flex items-center rounded-full bg-muted/80 p-1 border border-border/60 shadow-2xs select-none w-28">
        <div
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-xs transition-transform duration-300 ease-in-out ${
            value === "AND" ? "translate-x-0" : "translate-x-full"
          }`}
        />
        <button
          type="button"
          onClick={() => onChange("AND")}
          className={`relative z-10 flex-1 py-1 font-extrabold text-center rounded-full text-xs transition-colors duration-200 ${
            value === "AND" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          AND
        </button>
        <button
          type="button"
          onClick={() => onChange("OR")}
          className={`relative z-10 flex-1 py-1 font-extrabold text-center rounded-full text-xs transition-colors duration-200 ${
            value === "OR" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          OR
        </button>
      </div>
    </div>
  );
}

function RuleEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const machineIdParam = searchParams.get("machine_id");
  const ruleIdParam = searchParams.get("rule_id");

  const machineId = machineIdParam ? Number(machineIdParam) : 0;
  const ruleId = ruleIdParam && ruleIdParam !== "new" ? Number(ruleIdParam) : null;
  const isForceCreate = ruleIdParam === "new";

  const authUser = useAppSelector((state) => state.auth.user);
  const vendorId = authUser?.vendor_id;
  const userId = authUser?.id;

  const { data: machines = [] } = useMachinesByVendor(vendorId ?? 0);
  const { data: ruleFields = [], isLoading: fieldsLoading } = useRuleFields();
  const { data: vendorActions = [], isLoading: actionsLoading } = useVendorRuleActions(vendorId);
  const { data: projectCategoriesData, isLoading: categoriesLoading } = useProjectCategories(vendorId);
  const projectCategories = useMemo(() => {
    return projectCategoriesData?.categories ?? [];
  }, [projectCategoriesData]);

  const { data: existingMachineRules = [], isLoading: existingRulesLoading } =
    useMachineRules(machineId, vendorId);

  const targetRuleId = isForceCreate
    ? null
    : ruleId || (existingMachineRules.length > 0 ? existingMachineRules[0].id : null);
  const isEdit = !!targetRuleId;

  const { data: editRule, isLoading: ruleDetailsLoading } = useRuleDetails(machineId, targetRuleId);
  const ruleToPreFill = editRule || (!isForceCreate && existingMachineRules.length > 0 ? existingMachineRules[0] : null);

  const { mutate: createRule, isPending: isCreating } = useCreateRule(machineId);
  const { mutate: updateRule, isPending: isUpdating } = useUpdateRule(machineId);

  const isSubmitting = isCreating || isUpdating;

  const currentMachine = useMemo(() => {
    return machines.find((m) => m.id === machineId) || null;
  }, [machines, machineId]);

  // Form State
  const [ruleName, setRuleName] = useState("");
  const [ruleCode, setRuleCode] = useState("");
  const [priority, setPriority] = useState<number | "">("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [copied, setCopied] = useState(false);
  const [showJsonPayload, setShowJsonPayload] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(liveJsonPreview, null, 2));
    setCopied(true);
    toastManager.add({ title: "JSON payload copied to clipboard", type: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  // Selected Action State
  const [selectedActionId, setSelectedActionId] = useState<number | "">("");
  const [replacementMachineId, setReplacementMachineId] = useState<string>("");

  // Condition Groups State
  const [conditionGroups, setConditionGroups] = useState<ConditionGroupFormState[]>([
    {
      logical_operator: "OR",
      conditions: [
        {
          condition_type: "",
          field_key: "",
          operator: "",
          value: "",
          logical_operator: "AND",
        },
      ],
    },
  ]);

  // Pre-fill form when editing or when machine has an existing rule
  useEffect(() => {
    if (ruleToPreFill) {
      setRuleName(ruleToPreFill.rule_name || (ruleToPreFill as any).ruleName || "");
      setRuleCode(ruleToPreFill.rule_code || (ruleToPreFill as any).ruleCode || "");
      setPriority(ruleToPreFill.priority ?? 10);
      setStatus(ruleToPreFill.status || "ACTIVE");

      const rawActions =
        ruleToPreFill.actions ||
        (ruleToPreFill as any).rule_actions ||
        (ruleToPreFill as any).ruleActions ||
        [];
      if (rawActions && rawActions.length > 0) {
        const act: any = rawActions[0];
        const actId =
          act.action_id ||
          act.actionId ||
          (act.actionMaster ? act.actionMaster.id : 0);
        if (actId) setSelectedActionId(actId);

        const actVal = act.action_value ?? act.actionValue;
        if (actVal) {
          const valObj = typeof actVal === "object" && actVal !== null ? actVal : {};
          setReplacementMachineId(
            String(valObj.machine_id || valObj.machineId || actVal || "")
          );
        }
      }

      const rawGroups =
        ruleToPreFill.conditionGroups ||
        (ruleToPreFill as any).condition_groups ||
        (ruleToPreFill as any).conditionGroups ||
        [];

      if (rawGroups && rawGroups.length > 0) {
        const mappedGroups: ConditionGroupFormState[] = rawGroups.map((g: any) => {
          const rawConds =
            g.conditions || g.rule_conditions || g.ruleConditions || [];
          return {
            id: g.id,
            logical_operator: g.logical_operator || g.logicalOperator || "OR",
            conditions: rawConds.map((c: any) => {
              const rawType = c.condition_type || c.conditionType || "";
              const typeStr = String(rawType).toUpperCase();
              const rawField = c.field_key || c.fieldKey || "";
              const rawOp = c.operator || c.ruleOperator || "EQUALS";
              const rawLogOp = c.logical_operator || c.logicalOperator || "AND";
              const rawVal = c.value;

              let resolvedType: RuleConditionType = "COLUMN";
              if (typeStr === "CATEGORY") {
                resolvedType = "CATEGORY";
              } else if (typeStr === "COLUMN") {
                resolvedType = "COLUMN";
              } else if (rawField) {
                resolvedType = "COLUMN";
              } else {
                resolvedType = "COLUMN";
              }

              let formattedVal = "";
              if (Array.isArray(rawVal)) {
                formattedVal = rawVal.join(",");
              } else if (typeof rawVal === "object" && rawVal !== null) {
                formattedVal = String(
                  rawVal.id ||
                    rawVal.category_id ||
                    rawVal.categoryId ||
                    rawVal.category_name ||
                    rawVal.categoryName ||
                    rawVal.value ||
                    ""
                );
              } else {
                formattedVal =
                  rawVal !== null && rawVal !== undefined ? String(rawVal) : "";
              }

              return {
                id: c.id,
                condition_type: resolvedType,
                field_key: rawField,
                operator: rawOp as RuleOperator,
                value: formattedVal,
                logical_operator: rawLogOp as LogicalOperator,
              };
            }),
          };
        });

        setConditionGroups(mappedGroups);
      }
    }
  }, [ruleToPreFill]);

  // Auto-generate Rule Code from Rule Name if empty or auto-updating
  const handleNameChange = (val: string) => {
    setRuleName(val);
    if (!isEdit && !ruleCode) {
      const generatedCode = val
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      setRuleCode(generatedCode);
    }
  };

  // Group & Condition Management
  const addGroup = () => {
    setConditionGroups((prev) => [
      ...prev,
      {
        logical_operator: "OR",
        conditions: [
          {
            condition_type: "",
            field_key: "",
            operator: "",
            value: "",
            logical_operator: "AND",
          },
        ],
      },
    ]);
  };

  const removeGroup = (gIdx: number) => {
    if (conditionGroups.length === 1) {
      toastManager.add({ title: "Rule must contain at least one condition group", type: "error" });
      return;
    }
    setConditionGroups((prev) => prev.filter((_, idx) => idx !== gIdx));
  };

  const addCondition = (gIdx: number) => {
    setConditionGroups((prev) =>
      prev.map((group, idx) => {
        if (idx !== gIdx) return group;
        return {
          ...group,
          conditions: [
            ...group.conditions,
            {
              condition_type: "",
              field_key: "",
              operator: "",
              value: "",
              logical_operator: "AND",
            },
          ],
        };
      })
    );
  };

  const removeCondition = (gIdx: number, cIdx: number) => {
    setConditionGroups((prev) =>
      prev.map((group, idx) => {
        if (idx !== gIdx) return group;
        if (group.conditions.length === 1) {
          return group; // Keep at least one condition
        }
        return {
          ...group,
          conditions: group.conditions.filter((_, condIdx) => condIdx !== cIdx),
        };
      })
    );
  };

  const updateCondition = (
    gIdx: number,
    cIdx: number,
    field: keyof ConditionFormState,
    value: any
  ) => {
    setConditionGroups((prev) =>
      prev.map((group, idx) => {
        if (idx !== gIdx) return group;
        return {
          ...group,
          conditions: group.conditions.map((cond, condIdx) => {
            if (condIdx !== cIdx) return cond;
            if (field === "condition_type" && value !== cond.condition_type) {
              return {
                ...cond,
                condition_type: value,
                field_key: "",
                operator: value === "CATEGORY" ? "EQUALS" : "",
                value: "",
              };
            }
            return { ...cond, [field]: value };
          }),
        };
      })
    );
  };

  const updateGroupOperator = (gIdx: number, operator: LogicalOperator) => {
    setConditionGroups((prev) =>
      prev.map((group, idx) => {
        if (idx !== gIdx) return group;
        return { ...group, logical_operator: operator };
      })
    );
  };

  // Selected Action Details
  const selectedAction = useMemo(() => {
    return vendorActions.find((a) => a.id === Number(selectedActionId)) || null;
  }, [vendorActions, selectedActionId]);

  // Live JSON Preview Construction
  const liveJsonPreview = useMemo(() => {
    const actionVal =
      selectedAction?.action_code === "REPLACE_MACHINE" && replacementMachineId
        ? { machine_id: Number(replacementMachineId) }
        : null;

    return {
      rule_name: ruleName || "Untitled Rule",
      rule_code: ruleCode || "UNTITLED_RULE",
      priority: Number(priority),
      status: status,
      condition_groups: conditionGroups.map((g, gIdx) => ({
        sequence_no: gIdx + 1,
        logical_operator: gIdx < conditionGroups.length - 1 ? g.logical_operator : null,
        conditions: g.conditions.map((c, cIdx) => ({
          sequence_no: cIdx + 1,
          condition_type: c.condition_type,
          field_key: c.condition_type === "COLUMN" ? c.field_key : null,
          operator: c.operator,
          value: c.value,
          logical_operator: cIdx < g.conditions.length - 1 ? c.logical_operator : null,
        })),
      })),
      actions: [
        {
          action_id: Number(selectedActionId),
          action_code: selectedAction?.action_code || "",
          action_name: selectedAction?.action_name || "",
          action_value: actionVal,
        },
      ],
    };
  }, [
    ruleName,
    ruleCode,
    priority,
    status,
    conditionGroups,
    selectedActionId,
    selectedAction,
    replacementMachineId,
  ]);

  // Live Human-Readable Preview Construction
  const humanReadableWhen = useMemo(() => {
    return conditionGroups
      .map((group, gIdx) => {
        const condsText = group.conditions
          .map((cond, cIdx) => {
            const fieldLabel =
              cond.condition_type === "CATEGORY"
                ? "Category"
                : ruleFields.find((f) => f.field_key === cond.field_key)?.field_name ||
                  (cond.field_key ? cond.field_key : "[Select field]");

            const opText = cond.operator
              ? cond.operator.replace(/_/g, " ").toLowerCase()
              : "[Select operator]";
            const valDisplay =
              cond.condition_type === "CATEGORY"
                ? projectCategories.find(
                    (cat) =>
                      String(cat.id) === String(cond.value) ||
                      cat.category_name.toLowerCase() === String(cond.value ?? "").toLowerCase()
                  )?.category_name || (cond.value ? cond.value : "[Select Category]")
                : cond.value !== ""
                ? cond.value
                : "[Enter value]";
            const valStr = `"${valDisplay}"`;
            const innerJoin =
              cIdx < group.conditions.length - 1 ? ` ${cond.logical_operator} ` : "";
            return `${fieldLabel} ${opText} ${valStr}${innerJoin}`;
          })
          .join("");

        const outerJoin =
          gIdx < conditionGroups.length - 1 ? ` ${group.logical_operator} ` : "";
        return `${condsText}${outerJoin}`;
      })
      .join(" ");
  }, [conditionGroups, ruleFields, projectCategories]);

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruleName.trim()) {
      toastManager.add({ title: "Rule Name is required", type: "error" });
      return;
    }
    if (!ruleCode.trim()) {
      toastManager.add({ title: "Rule Code is required", type: "error" });
      return;
    }
    if (!selectedActionId) {
      toastManager.add({ title: "Action selection is required", type: "error" });
      return;
    }

    for (let g = 0; g < conditionGroups.length; g++) {
      const group = conditionGroups[g];
      for (let c = 0; c < group.conditions.length; c++) {
        const cond = group.conditions[c];
        if (!cond.condition_type) {
          toastManager.add({
            title: `Please select Condition Type for condition #${c + 1} in Group #${g + 1}`,
            type: "error",
          });
          return;
        }
        if (cond.condition_type === "COLUMN" && !cond.field_key) {
          toastManager.add({
            title: `Please select Column for condition #${c + 1} in Group #${g + 1}`,
            type: "error",
          });
          return;
        }
        if (cond.condition_type === "COLUMN" && !cond.operator) {
          toastManager.add({
            title: `Please select Operator for condition #${c + 1} in Group #${g + 1}`,
            type: "error",
          });
          return;
        }
      }
    }

    const payload: CreateRulePayload = {
      vendor_id: vendorId ?? 0,
      rule_name: ruleName.trim(),
      rule_code: ruleCode.trim(),
      priority: Number(priority),
      status: status,
      created_by: userId,
      conditionGroups: conditionGroups.map((g, gIdx) => ({
        sequence_no: gIdx + 1,
        logical_operator: gIdx < conditionGroups.length - 1 ? g.logical_operator : null,
        conditions: g.conditions.map((c, cIdx) => ({
          sequence_no: cIdx + 1,
          condition_type: (c.condition_type || "COLUMN") as RuleConditionType,
          field_key: c.condition_type === "COLUMN" ? c.field_key : null,
          operator: (c.operator || "EQUALS") as RuleOperator,
          value:
            c.operator === "LESS_THAN" ||
            c.operator === "LESS_THAN_OR_EQUAL" ||
            c.operator === "GREATER_THAN" ||
            c.operator === "GREATER_THAN_OR_EQUAL" ||
            c.operator === "EQUALS"
              ? isNaN(Number(c.value))
                ? c.value
                : Number(c.value)
              : c.value,
          logical_operator: cIdx < g.conditions.length - 1 ? c.logical_operator : null,
        })),
      })),
      actions: [
        {
          action_id: Number(selectedActionId),
          action_value:
            selectedAction?.action_code === "REPLACE_MACHINE" && replacementMachineId
              ? { machine_id: Number(replacementMachineId) }
              : null,
          sequence_no: 1,
        },
      ],
    };

    if (isEdit && targetRuleId) {
      updateRule(
        { ruleId: targetRuleId, payload },
        {
          onSuccess: () => {
            toastManager.add({ title: "Rule updated successfully", type: "success" });
            router.push("/dashboard/track-trace/master/workstation");
          },
          onError: (err: any) => {
            toastManager.add({
              title: err.message || "Failed to update rule",
              type: "error",
            });
          },
        }
      );
    } else {
      createRule(payload, {
        onSuccess: () => {
          toastManager.add({ title: "Rule created successfully", type: "success" });
          router.push("/dashboard/track-trace/master/workstation");
        },
        onError: (err: any) => {
          toastManager.add({
            title: err.message || "Failed to create rule",
            type: "error",
          });
        },
      });
    }
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
                <BreadcrumbLink href="/dashboard/track-trace">Track & Trace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/track-trace/master/workstation">
                  Workstations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isEdit ? "Edit Cutlist Rule" : "Create Cutlist Rule"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main className="flex-1 overflow-x-hidden p-6 w-full">
        <form onSubmit={handleSubmit}>
          {/* Top Title & Save Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-border/60 hover:bg-muted/80 transition-colors shrink-0"
                  onClick={() =>
                    router.push("/dashboard/track-trace/master/workstation")
                  }
                >
                  <ArrowLeft size={16} />
                </Button>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      {isEdit ? "Edit Cutlist Rule" : "Create Cutlist Rule"}
                    </h1>
                    {currentMachine && (
                      <Badge variant="secondary" className="gap-1.5 py-0.5 px-2.5 font-medium text-xs bg-primary/10 text-primary border-primary/20">
                        <Cpu size={12} />
                        {currentMachine.machine_name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure automated Cutlist routing and specs validation rules for this workstation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-4 text-xs font-medium"
                onClick={() =>
                  router.push("/dashboard/track-trace/master/workstation")
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-4 gap-2 text-xs font-semibold shadow-xs hover:shadow-md transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEdit ? "Update Rule" : "Save Rule"}
              </Button>
            </div>
          </div>

          {ruleDetailsLoading && (
            <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading rule details...
            </div>
          )}

          {!ruleDetailsLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COLUMN: Rule Details + Conditions + Actions (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Rule Details Card */}
                <div className="border border-border/80 rounded-xl p-5 bg-card space-y-5 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-foreground">Rule Details</h2>
                      <p className="text-xs text-muted-foreground">
                        Basic identification and execution priority parameters.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground/80 block mb-1.5">
                        Rule Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Back Panel CNC Exclusion"
                        value={ruleName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="h-9 text-xs focus-visible:ring-primary/30"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground/80 block mb-1.5">
                        Rule Code <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="e.g. BACK_PANEL_EXCLUDE_CNC"
                        value={ruleCode}
                        onChange={(e) => setRuleCode(e.target.value)}
                        className="h-9 text-xs font-mono focus-visible:ring-primary/30"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground/80 block mb-1.5">
                        Priority <span className="text-xs text-muted-foreground font-normal">(Lower = Higher evaluation priority)</span>
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 1"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-9 text-xs focus-visible:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 bg-muted/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      <div>
                        <label className="text-xs font-semibold text-foreground block">
                          Rule Status: <span className={status === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{status}</span>
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Inactive rules are ignored during Cutlist rule engine processing.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={status === "ACTIVE"}
                      onCheckedChange={(val: boolean) => setStatus(val ? "ACTIVE" : "INACTIVE")}
                    />
                  </div>
                </div>

                {/* 2. When Section (Conditions Builder) */}
                <div className="border border-border/80 rounded-xl p-5 bg-card space-y-5 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Filter size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-foreground">When (Conditions Builder)</h2>
                      <p className="text-xs text-muted-foreground">
                        Define matching criteria for this rule.
                      </p>
                    </div>
                  </div>

                  {conditionGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-3">
                      {/* Group Card */}
                      <div className="border border-border/70 border-l-4 border-l-primary rounded-xl p-4 bg-muted/10 space-y-3 relative">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[11px] font-bold tracking-wide uppercase bg-primary/10 text-primary border-primary/20">
                              Condition Group #{gIdx + 1}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({group.conditions.length} {group.conditions.length === 1 ? "condition" : "conditions"})
                            </span>
                          </div>
                          {conditionGroups.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 rounded-md px-2"
                              onClick={() => removeGroup(gIdx)}
                            >
                              <Trash2 size={13} /> Remove Group
                            </Button>
                          )}
                        </div>

                        {/* Conditions inside Group */}
                        {group.conditions.map((cond, cIdx) => (
                          <div key={cIdx} className="space-y-2">
                            <div className="border border-border/60 rounded-lg p-3 bg-card shadow-2xs space-y-2 relative">
                              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Condition {cIdx + 1}
                                </span>
                                {group.conditions.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                    onClick={() => removeCondition(gIdx, cIdx)}
                                  >
                                    <X size={13} />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                {/* Condition Type */}
                                <div>
                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                    Condition Type
                                  </label>
                                  <Select
                                    key={`type-select-${gIdx}-${cIdx}-${cond.condition_type}`}
                                    value={cond.condition_type}
                                    onValueChange={(val: RuleConditionType) => {
                                      updateCondition(gIdx, cIdx, "condition_type", val);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 text-xs">
                                      <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="COLUMN">Column</SelectItem>
                                      <SelectItem value="CATEGORY">Category</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Column / Category Select */}
                                <div>
                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                    {cond.condition_type === "CATEGORY"
                                      ? "Category"
                                      : "Column"}
                                  </label>
                                  {cond.condition_type === "COLUMN" ? (
                                    <Select
                                      key={`col-select-${gIdx}-${cIdx}-${cond.field_key}-${ruleFields.length}-${fieldsLoading}`}
                                      value={cond.field_key}
                                      onValueChange={(val) =>
                                        updateCondition(gIdx, cIdx, "field_key", val)
                                      }
                                    >
                                      <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Select field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {ruleFields.map((f) => (
                                          <SelectItem key={f.field_key} value={f.field_key}>
                                            {f.field_name} · {f.data_type.toLowerCase()}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Select
                                      key={`cat-select-${gIdx}-${cIdx}-${cond.value}-${projectCategories.length}-${categoriesLoading}`}
                                      value={
                                        projectCategories.find(
                                          (c) =>
                                            String(c.id) === String(cond.value) ||
                                            c.category_name === cond.value
                                        )
                                          ? String(
                                              projectCategories.find(
                                                (c) =>
                                                  String(c.id) === String(cond.value) ||
                                                  c.category_name === cond.value
                                              )!.id
                                            )
                                          : String(cond.value ?? "")
                                      }
                                      onValueChange={(val) =>
                                        updateCondition(gIdx, cIdx, "value", val)
                                      }
                                    >
                                      <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Select Category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categoriesLoading ? (
                                          <div className="p-2 text-xs text-muted-foreground">
                                            Loading categories...
                                          </div>
                                        ) : projectCategories.length === 0 ? (
                                          <div className="p-2 text-xs text-muted-foreground">
                                            No categories found
                                          </div>
                                        ) : (
                                          projectCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                              {cat.category_name}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                {/* Operator Select */}
                                <div>
                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                    Operator
                                  </label>
                                  <Select
                                    key={`op-select-${gIdx}-${cIdx}-${cond.operator}-${cond.condition_type}`}
                                    value={cond.operator}
                                    onValueChange={(val: RuleOperator) =>
                                      updateCondition(gIdx, cIdx, "operator", val)
                                    }
                                    disabled={cond.condition_type === "CATEGORY"}
                                  >
                                    <SelectTrigger className="h-9 text-xs">
                                      <SelectValue placeholder="Select Operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="CONTAINS">Contains</SelectItem>
                                      <SelectItem value="NOT_CONTAINS">Not Contains</SelectItem>
                                      <SelectItem value="EQUALS">Equals</SelectItem>
                                      <SelectItem value="NOT_EQUALS">Not Equals</SelectItem>
                                      <SelectItem value="LESS_THAN">Less Than</SelectItem>
                                      <SelectItem value="LESS_THAN_OR_EQUAL">
                                        Less Than Or Equal
                                      </SelectItem>
                                      <SelectItem value="GREATER_THAN">Greater Than</SelectItem>
                                      <SelectItem value="GREATER_THAN_OR_EQUAL">
                                        Greater Than Or Equal
                                      </SelectItem>
                                      <SelectItem value="IN">In (Comma separated)</SelectItem>
                                      <SelectItem value="NOT_IN">Not In</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Value Input */}
                                <div>
                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                    Value
                                  </label>
                                  {cond.condition_type === "CATEGORY" ? (
                                    <Input
                                      className="h-9 text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
                                      disabled
                                      value={
                                        projectCategories.find(
                                          (c) =>
                                            String(c.id) === String(cond.value) ||
                                            c.category_name === cond.value
                                        )?.category_name || (cond.value ? String(cond.value) : "Select category on left")
                                      }
                                    />
                                  ) : (
                                    <Input
                                      className="h-9 text-xs"
                                      placeholder="Enter value"
                                      value={cond.value}
                                      onChange={(e) =>
                                        updateCondition(gIdx, cIdx, "value", e.target.value)
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Inner Condition Logical Operator Toggle (AND / OR) */}
                            {cIdx < group.conditions.length - 1 && (
                              <div className="flex items-center justify-center my-2">
                                <SmoothPillToggle
                                  value={cond.logical_operator || "AND"}
                                  onChange={(val) => updateCondition(gIdx, cIdx, "logical_operator", val)}
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add Condition Button */}
                        <div className="pt-1 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed text-xs gap-1.5 hover:bg-muted/40 transition-colors"
                            onClick={() => addCondition(gIdx)}
                          >
                            <Plus size={14} /> Add Condition
                          </Button>
                        </div>
                      </div>

                      {/* Outer Group Logical Operator Toggle (AND / OR) */}
                      {gIdx < conditionGroups.length - 1 && (
                        <div className="flex items-center justify-center my-3">
                          <SmoothPillToggle
                            label="JOIN GROUPS WITH:"
                            value={group.logical_operator || "OR"}
                            onChange={(val) => updateGroupOperator(gIdx, val)}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Group Button */}
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed border-border/80 gap-1.5 hover:bg-muted/40 hover:border-primary/50 transition-colors"
                      onClick={addGroup}
                    >
                      <Plus size={15} /> Add Condition Group
                    </Button>
                  </div>
                </div>

                {/* 3. Then Section (Action Selection) */}
                <div className="border border-border/80 rounded-xl p-5 bg-card space-y-4 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-foreground">Then (Action Selection)</h2>
                      <p className="text-xs text-muted-foreground">
                        Specify the rule action executed when conditions evaluate to true.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground/80 block mb-1.5">
                        Select Action <span className="text-destructive">*</span>
                      </label>
                      <Select
                        key={`action-select-${selectedActionId}-${vendorActions.length}-${actionsLoading}`}
                        value={String(selectedActionId)}
                        onValueChange={(val) => setSelectedActionId(Number(val))}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Action" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorActions.map((act) => (
                            <SelectItem key={act.id} value={String(act.id)}>
                              {act.action_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedAction?.action_code === "REPLACE_MACHINE" && (
                      <div>
                        <label className="text-xs font-medium text-foreground/80 block mb-1.5">
                          Target Replacement Machine <span className="text-destructive">*</span>
                        </label>
                        <Select
                          key={`machine-select-${replacementMachineId}-${machines.length}`}
                          value={replacementMachineId}
                          onValueChange={(val) => setReplacementMachineId(val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select machine" />
                          </SelectTrigger>
                          <SelectContent>
                            {machines
                              .filter((m) => m.id !== machineId)
                              .map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  {m.machine_name} ({m.machine_code})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live Preview (Human readable + JSON preview) */}
              <div className="space-y-6">
                <div className="border border-border/80 rounded-xl p-5 bg-card space-y-4 shadow-2xs sticky top-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-foreground">Live Preview</h2>
                      <p className="text-xs text-muted-foreground">
                        Human-readable rule summary and raw JSON storage preview.
                      </p>
                    </div>
                  </div>

                  {/* Human Readable Box */}
                  <div className="border border-primary/20 rounded-xl p-4 bg-gradient-to-br from-primary/5 via-muted/20 to-background space-y-3 text-xs shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        RULE NAME
                      </span>
                      <p className="font-semibold text-sm mt-0.5 text-foreground">
                        {ruleName || "Untitled Rule"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        WHEN
                      </span>
                      <p className="font-medium text-foreground/90 mt-0.5 leading-relaxed bg-background/60 p-2 rounded-md border border-border/50">
                        {humanReadableWhen || "No conditions defined"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        THEN
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary border-primary/20">
                          {selectedAction?.action_name || "Select Action"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* JSON Preview Box */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-2 justify-between border-dashed hover:bg-muted/50"
                      onClick={() => setShowJsonPayload(!showJsonPayload)}
                    >
                      <div className="flex items-center gap-2">
                        <Code2 size={14} className="text-primary" />
                        <span>{showJsonPayload ? "Hide JSON Payload" : "View JSON Payload"}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {showJsonPayload ? "▲" : "▼"}
                      </span>
                    </Button>

                    {showJsonPayload && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Code2 size={13} className="text-emerald-500" />
                            JSON Payload
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                            onClick={handleCopyJson}
                          >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copied ? "Copied" : "Copy JSON"}
                          </Button>
                        </div>

                        <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                          <div className="bg-slate-900/90 px-3.5 py-1.5 flex items-center justify-between border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                              <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                              <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                            </div>
                            <span>payload.json</span>
                          </div>
                          <div className="p-3.5 font-mono text-[11px] overflow-x-auto max-h-[360px] leading-relaxed">
                            <pre className="text-emerald-400/90">{JSON.stringify(liveJsonPreview, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>
    </>
  );
}

export default function RuleEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading rule editor...
        </div>
      }
    >
      <RuleEditorContent />
    </Suspense>
  );
}
