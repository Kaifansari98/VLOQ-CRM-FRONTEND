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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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
  ChevronsUpDown,
  Search,
} from "lucide-react";
import type {
  RuleConditionType,
  RuleOperator,
  RuleFieldDataType,
  LogicalOperator,
  CreateRulePayload,
} from "@/types/track-trace";

const OPERATORS_BY_DATA_TYPE: Record<
  RuleFieldDataType,
  { value: RuleOperator; label: string }[]
> = {
  NUMBER: [
    { value: "EQUALS", label: "Equals" },
    { value: "NOT_EQUALS", label: "Not Equals" },
    { value: "GREATER_THAN", label: "Greater Than" },
    { value: "GREATER_THAN_OR_EQUAL", label: "Greater Than Or Equal" },
    { value: "LESS_THAN", label: "Less Than" },
    { value: "LESS_THAN_OR_EQUAL", label: "Less Than Or Equal" },
    { value: "BETWEEN", label: "Between" },
  ],
  STRING: [
    { value: "EQUALS", label: "Equals" },
    { value: "NOT_EQUALS", label: "Not Equals" },
    { value: "CONTAINS", label: "Contains" },
    { value: "NOT_CONTAINS", label: "Does Not Contain" },
    { value: "STARTS_WITH", label: "Starts With" },
    { value: "ENDS_WITH", label: "Ends With" },
    { value: "IS_BLANK", label: "Is Blank" },
    { value: "IS_NOT_BLANK", label: "Is Not Blank" },
    { value: "IN", label: "In (Comma separated)" },
    { value: "NOT_IN", label: "Not In" },
  ],
  BOOLEAN: [
    { value: "EQUALS", label: "Is True" },
  ],
  ARRAY: [
    { value: "IN", label: "In (Comma separated)" },
    { value: "NOT_IN", label: "Not In" },
    { value: "CONTAINS", label: "Contains" },
    { value: "NOT_CONTAINS", label: "Does Not Contain" },
  ],
};

interface ConditionFormState {
  id?: number;
  condition_type: RuleConditionType | "ALL_CATEGORY" | "";
  field_key: string;
  operator: RuleOperator | "";
  value: any;
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

interface CategoryMultiSelectProps {
  categories: { id: number; category_name: string }[];
  value: any;
  onChange: (val: any) => void;
  isLoading?: boolean;
}

function CategoryMultiSelect({
  categories = [],
  value,
  onChange,
  isLoading = false,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIdStrs = useMemo(() => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v));
    }
    if (typeof value === "string" && value) {
      if (value.includes(",")) return value.split(",").map((s) => s.trim());
      return [value];
    }
    if (typeof value === "number") {
      return [String(value)];
    }
    return [];
  }, [value]);

  const handleToggleCategory = (catId: number) => {
    const idStr = String(catId);
    let nextSelected: number[] = [];
    const currentIds = selectedIdStrs.map(Number);
    if (selectedIdStrs.includes(idStr)) {
      nextSelected = currentIds.filter((id) => String(id) !== idStr);
    } else {
      nextSelected = [...currentIds, catId];
    }
    onChange(nextSelected);
  };

  const handleSelectAll = () => {
    onChange(categories.map((c) => c.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((c) =>
      c.category_name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [categories, search]);

  const triggerLabel = useMemo(() => {
    if (isLoading) return <span className="text-muted-foreground text-xs">Loading categories...</span>;
    if (selectedIdStrs.length === 0) {
      return <span className="text-muted-foreground text-xs">Select categories...</span>;
    }

    const selectedCats = selectedIdStrs
      .map((id) => categories.find((c) => String(c.id) === id))
      .filter(Boolean) as { id: number; category_name: string }[];

    if (selectedCats.length === 0) {
      return <span className="text-muted-foreground text-xs">Select categories...</span>;
    }

    const maxVisible = 4;

    if (selectedCats.length <= maxVisible) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap py-0.5">
          {selectedCats.map((cat) => (
            <Badge
              key={cat.id}
              variant="secondary"
              className="text-[11px] font-medium px-2 py-0.5 bg-secondary text-secondary-foreground shrink-0 max-w-[130px] truncate"
            >
              {cat.category_name}
            </Badge>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap py-0.5">
        {selectedCats.slice(0, maxVisible).map((cat) => (
          <Badge
            key={cat.id}
            variant="secondary"
            className="text-[11px] font-medium px-2 py-0.5 bg-secondary text-secondary-foreground shrink-0 max-w-[120px] truncate"
          >
            {cat.category_name}
          </Badge>
        ))}
        <Badge
          variant="outline"
          className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20 px-1.5 py-0.5 shrink-0"
        >
          +{selectedCats.length - maxVisible} more
        </Badge>
      </div>
    );
  }, [isLoading, selectedIdStrs, categories]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex items-center w-full">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-h-9 h-auto py-1 w-full justify-between text-xs font-normal border-input px-3 hover:bg-muted/50 transition-colors"
          >
            <div className="text-left flex-1 mr-6 overflow-hidden">{triggerLabel}</div>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </Button>
        </PopoverTrigger>
        {selectedIdStrs.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClearAll();
            }}
            className="absolute right-7 p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
            title="Clear category selection"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <PopoverContent className="w-72 p-0 shadow-md border border-border" align="start">
        <div className="p-2 border-b border-border/60 space-y-1.5">
          <div className="relative flex items-center">
            <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 pr-6 text-xs border-none bg-muted/40 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1.5 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center px-1 text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary hover:underline font-medium"
            >
              Select All
            </button>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto p-1 text-xs space-y-0.5">
          {isLoading ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" /> Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No categories found
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isSelected = selectedIdStrs.includes(String(cat.id));
              return (
                <div
                  key={cat.id}
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer select-none transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted/60 text-foreground/85"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleCategory(cat.id)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="truncate">{cat.category_name}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border/50 flex items-center justify-between bg-muted/20 text-[11px] text-muted-foreground">
          <span>
            {selectedIdStrs.length} of {categories.length} selected
          </span>
          {selectedIdStrs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-destructive hover:underline font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
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
      setRuleName(ruleToPreFill.rule_name || (ruleToPreFill as any).ruleName || currentMachine?.machine_name || "");
      setRuleCode(ruleToPreFill.rule_code || (ruleToPreFill as any).ruleCode || currentMachine?.machine_name || "");
      setPriority(1);
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
              const rawOp =
                c.operator ||
                c.ruleOperator ||
                (typeStr === "CATEGORY" ? "IN" : "EQUALS");
              const rawLogOp = c.logical_operator || c.logicalOperator || "AND";
              const rawVal = c.value;

              let resolvedType: ConditionFormState["condition_type"] = "COLUMN";
              if (typeStr === "CATEGORY") {
                resolvedType = "CATEGORY";
              } else if (typeStr === "COLUMN") {
                resolvedType = "COLUMN";
              } else if (rawField) {
                resolvedType = "COLUMN";
              } else {
                resolvedType = "COLUMN";
              }

              let formattedVal: any = "";
              if (resolvedType === "CATEGORY") {
                if (
                  rawVal === "ALL" ||
                  rawVal === "*" ||
                  (Array.isArray(rawVal) &&
                    rawVal.some((v: any) => String(v).toUpperCase() === "ALL"))
                ) {
                  resolvedType = "ALL_CATEGORY";
                  formattedVal = "ALL";
                } else if (Array.isArray(rawVal)) {
                  formattedVal = rawVal.map((v: any) =>
                    typeof v === "object" && v !== null
                      ? v.id || v.category_id || v.categoryId || v.value
                      : v
                  );
                } else if (typeof rawVal === "string" && rawVal.includes(",")) {
                  formattedVal = rawVal.split(",").map((s: string) => s.trim());
                } else if (typeof rawVal === "object" && rawVal !== null) {
                  formattedVal = [
                    rawVal.id || rawVal.category_id || rawVal.categoryId || rawVal.value,
                  ];
                } else if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
                  formattedVal = [rawVal];
                } else {
                  formattedVal = [];
                }
              } else {
                const field = ruleFields.find((f) => f.field_key === rawField);
                if (field?.data_type === "BOOLEAN") {
                  formattedVal =
                    rawVal === false || rawVal === "false" || rawVal === 0 ? false : true;
                } else if (Array.isArray(rawVal)) {
                  formattedVal = rawVal.join(",");
                } else if (typeof rawVal === "object" && rawVal !== null) {
                  formattedVal = String(rawVal.value || "");
                } else {
                  formattedVal =
                    rawVal !== null && rawVal !== undefined ? String(rawVal) : "";
                }
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
    } else if (currentMachine) {
      setRuleName(currentMachine.machine_name);
      setRuleCode(currentMachine.machine_name);
      setPriority(1);
    }
  }, [ruleToPreFill, currentMachine]);

  // Auto-generate Rule Code from Rule Name if empty or auto-updating
  const handleNameChange = (val: string) => {
    setRuleName(val);
    if (!isEdit && (!ruleCode || ruleCode === ruleName)) {
      setRuleCode(val);
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
    fieldOrUpdates: keyof ConditionFormState | "condition_type" | Partial<ConditionFormState>,
    value?: any
  ) => {
    setConditionGroups((prev) =>
      prev.map((group, idx) => {
        if (idx !== gIdx) return group;
        return {
          ...group,
          conditions: group.conditions.map((cond, condIdx) => {
            if (condIdx !== cIdx) return cond;
            if (typeof fieldOrUpdates === "object" && fieldOrUpdates !== null) {
              return { ...cond, ...fieldOrUpdates };
            }
            if (fieldOrUpdates === "condition_type") {
              if (value === "ALL_CATEGORY") {
                return {
                  ...cond,
                  condition_type: "ALL_CATEGORY",
                  field_key: "",
                  operator: "IN" as RuleOperator,
                  value: "ALL",
                };
              }
              if (value === "CATEGORY") {
                return {
                  ...cond,
                  condition_type: "CATEGORY",
                  field_key: "",
                  operator: "IN" as RuleOperator,
                  value:
                    Array.isArray(cond.value) && !cond.value.includes("ALL")
                      ? cond.value
                      : [],
                };
              }
              if (value === "COLUMN") {
                return {
                  ...cond,
                  condition_type: "COLUMN",
                  field_key: "",
                  operator: "" as RuleOperator,
                  value: "",
                };
              }
            }
            if (fieldOrUpdates === "operator") {
              if (value === "BETWEEN") {
                let rangeVal = ["", ""];
                if (Array.isArray(cond.value)) {
                  rangeVal = [cond.value[0] ?? "", cond.value[1] ?? ""];
                } else if (typeof cond.value === "string" && cond.value.includes(",")) {
                  const parts = cond.value.split(",");
                  rangeVal = [parts[0]?.trim() ?? "", parts[1]?.trim() ?? ""];
                } else if (cond.value !== "" && cond.value !== undefined && cond.value !== null) {
                  rangeVal = [String(cond.value), ""];
                }
                return { ...cond, operator: value, value: rangeVal };
              } else if (cond.operator === "BETWEEN" && Array.isArray(cond.value)) {
                return { ...cond, operator: value, value: cond.value[0] ?? "" };
              }
            }
            return { ...cond, [fieldOrUpdates]: value };
          }),
        };
      })
    );
  };

  const handleColumnChange = (gIdx: number, cIdx: number, fieldKey: string) => {
    const field = ruleFields.find((f) => f.field_key === fieldKey);
    const dataType = field?.data_type || "STRING";

    if (dataType === "BOOLEAN") {
      updateCondition(gIdx, cIdx, {
        field_key: fieldKey,
        operator: "EQUALS",
        value: true,
      });
      return;
    }

    const validOps = OPERATORS_BY_DATA_TYPE[dataType] || OPERATORS_BY_DATA_TYPE.STRING;
    const currentOp = conditionGroups[gIdx]?.conditions[cIdx]?.operator;
    const isCurrentOpValid = validOps.some((o) => o.value === currentOp);
    const nextOp = isCurrentOpValid ? currentOp : validOps[0].value;

    const currentVal = conditionGroups[gIdx]?.conditions[cIdx]?.value;
    let nextVal = typeof currentVal === "boolean" ? "" : currentVal;
    if (nextOp === "BETWEEN" && !Array.isArray(nextVal)) {
      nextVal = nextVal !== "" && nextVal !== undefined && nextVal !== null ? [String(nextVal), ""] : ["", ""];
    } else if (nextOp !== "BETWEEN" && Array.isArray(nextVal)) {
      nextVal = nextVal[0] ?? "";
    }

    updateCondition(gIdx, cIdx, {
      field_key: fieldKey,
      operator: nextOp,
      value: nextVal,
    });
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

    const finalRuleName = (ruleName.trim() || currentMachine?.machine_name || "Untitled Rule").trim();
    const finalRuleCode = (ruleCode.trim() || currentMachine?.machine_name || "UNTITLED_RULE").trim();

    return {
      rule_name: finalRuleName,
      rule_code: finalRuleCode,
      priority: 1,
      status: status,
      condition_groups: conditionGroups.map((g, gIdx) => ({
        sequence_no: gIdx + 1,
        logical_operator: gIdx < conditionGroups.length - 1 ? g.logical_operator : null,
        conditions: g.conditions.map((c, cIdx) => {
          const field = ruleFields.find((f) => f.field_key === c.field_key);
          const isBool = field?.data_type === "BOOLEAN";

          let finalVal = c.value;
          if (c.condition_type === "ALL_CATEGORY") {
            finalVal = "ALL";
          } else if (c.condition_type === "CATEGORY") {
            finalVal = Array.isArray(c.value) ? c.value.map(Number) : c.value;
          } else if (isBool) {
            finalVal = c.value === false || c.value === "false" || c.value === 0 ? false : true;
          } else if (c.operator === "IS_BLANK" || c.operator === "IS_NOT_BLANK") {
            finalVal = "";
          } else if (field?.data_type === "NUMBER") {
            if (c.operator === "BETWEEN") {
              if (Array.isArray(c.value)) {
                finalVal = c.value
                  .filter((v: any) => v !== "" && v !== null && v !== undefined)
                  .map((v: any) => (isNaN(Number(v)) ? v : Number(v)));
              } else if (typeof c.value === "string" && c.value.includes(",")) {
                finalVal = c.value.split(",").map((s: string) => Number(s.trim()));
              } else {
                finalVal = c.value;
              }
            } else {
              finalVal = isNaN(Number(c.value)) ? c.value : Number(c.value);
            }
          }

          return {
            sequence_no: cIdx + 1,
            condition_type:
              c.condition_type === "ALL_CATEGORY" ? "CATEGORY" : c.condition_type,
            field_key: c.condition_type === "COLUMN" ? c.field_key : null,
            operator:
              c.condition_type === "ALL_CATEGORY"
                ? "IN"
                : isBool
                ? "EQUALS"
                : c.operator || (c.condition_type === "CATEGORY" ? "IN" : ""),
            value: finalVal,
            logical_operator: cIdx < g.conditions.length - 1 ? c.logical_operator : null,
          };
        }),
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
    currentMachine,
    priority,
    status,
    conditionGroups,
    selectedActionId,
    selectedAction,
    replacementMachineId,
    ruleFields,
  ]);

  // Live Human-Readable Preview Construction
  const humanReadableWhen = useMemo(() => {
    return conditionGroups
      .map((group, gIdx) => {
        const condsText = group.conditions
          .map((cond, cIdx) => {
            let valDisplay = "";
            let fieldLabel = "";
            let opText = "";

            if (cond.condition_type === "ALL_CATEGORY") {
              fieldLabel = "Category";
              opText = "in";
              valDisplay = "All Categories";
            } else if (cond.condition_type === "CATEGORY") {
              fieldLabel = "Category";
              opText = cond.operator
                ? cond.operator.replace(/_/g, " ").toLowerCase()
                : "in";

              const isAll =
                cond.value === "ALL" ||
                cond.value === "*" ||
                (Array.isArray(cond.value) &&
                  cond.value.some((v: any) => String(v).toUpperCase() === "ALL"));

              if (isAll) {
                valDisplay = "All Categories";
              } else {
                const valArr: string[] = Array.isArray(cond.value)
                  ? cond.value.map(String)
                  : typeof cond.value === "string" && cond.value
                  ? cond.value.includes(",")
                    ? cond.value.split(",").map((s) => s.trim())
                    : [cond.value]
                  : typeof cond.value === "number"
                  ? [String(cond.value)]
                  : [];

                if (valArr.length > 0) {
                  valDisplay = valArr
                    .map((id) => {
                      const cat = projectCategories.find((c) => String(c.id) === id);
                      return cat ? cat.category_name : id;
                    })
                    .join(", ");
                } else {
                  valDisplay = "[Select Category]";
                }
              }
            } else {
              const field = ruleFields.find((f) => f.field_key === cond.field_key);
              fieldLabel =
                field?.field_name || (cond.field_key ? cond.field_key : "[Select field]");

              if (field?.data_type === "BOOLEAN") {
                const isFalse = cond.value === false || cond.value === "false" || cond.value === 0;
                opText = isFalse ? "is false" : "is true";
                valDisplay = "";
              } else if (cond.operator === "IS_BLANK" || cond.operator === "IS_NOT_BLANK") {
                opText = cond.operator === "IS_BLANK" ? "is blank" : "is not blank";
                valDisplay = "";
              } else if (cond.operator === "BETWEEN") {
                opText = "is between";
                const min = Array.isArray(cond.value) ? cond.value[0] : "";
                const max = Array.isArray(cond.value) ? cond.value[1] : "";
                if (min !== "" && max !== "" && min !== undefined && max !== undefined) {
                  valDisplay = `${min} and ${max}`;
                } else if (min !== "" && min !== undefined) {
                  valDisplay = `${min} and [Max]`;
                } else if (max !== "" && max !== undefined) {
                  valDisplay = `[Min] and ${max}`;
                } else {
                  valDisplay = "[Enter range]";
                }
              } else {
                opText = cond.operator
                  ? cond.operator === "NOT_CONTAINS"
                    ? "does not contain"
                    : cond.operator === "STARTS_WITH"
                    ? "starts with"
                    : cond.operator === "ENDS_WITH"
                    ? "ends with"
                    : cond.operator.replace(/_/g, " ").toLowerCase()
                  : "[Select operator]";
                valDisplay = cond.value !== "" ? String(cond.value) : "[Enter value]";
              }
            }

            const valStr = valDisplay
              ? cond.operator === "BETWEEN"
                ? ` ${valDisplay}`
                : ` "${valDisplay}"`
              : "";
            const innerJoin =
              cIdx < group.conditions.length - 1 ? ` ${cond.logical_operator} ` : "";
            return `${fieldLabel} ${opText}${valStr}${innerJoin}`;
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

    const finalRuleName = (ruleName.trim() || currentMachine?.machine_name || "Rule").trim();
    const finalRuleCode = (ruleCode.trim() || currentMachine?.machine_name || "RULE").trim();
    const finalPriority = 1;

    if (!finalRuleName) {
      toastManager.add({ title: "Rule Name is required", type: "error" });
      return;
    }
    if (!finalRuleCode) {
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
        if (cond.condition_type === "COLUMN") {
          if (!cond.field_key) {
            toastManager.add({
              title: `Please select Column for condition #${c + 1} in Group #${g + 1}`,
              type: "error",
            });
            return;
          }
          const field = ruleFields.find((f) => f.field_key === cond.field_key);
          const isNoValueOperator =
            field?.data_type === "BOOLEAN" ||
            cond.operator === "IS_BLANK" ||
            cond.operator === "IS_NOT_BLANK";

          if (!isNoValueOperator) {
            if (!cond.operator) {
              toastManager.add({
                title: `Please select Operator for condition #${c + 1} in Group #${g + 1}`,
                type: "error",
              });
              return;
            }
            if (cond.operator === "BETWEEN") {
              const minVal = Array.isArray(cond.value) ? cond.value[0] : "";
              const maxVal = Array.isArray(cond.value) ? cond.value[1] : "";
              if (
                minVal === "" || minVal === undefined || minVal === null ||
                maxVal === "" || maxVal === undefined || maxVal === null
              ) {
                toastManager.add({
                  title: `Please enter both Min and Max values for condition #${c + 1} in Group #${g + 1}`,
                  type: "error",
                });
                return;
              }
              if (field?.data_type === "NUMBER" && Number(minVal) > Number(maxVal)) {
                toastManager.add({
                  title: `Min value cannot be greater than Max value in condition #${c + 1} in Group #${g + 1}`,
                  type: "error",
                });
                return;
              }
            } else if (cond.value === "" || cond.value === undefined || cond.value === null) {
              toastManager.add({
                title: `Please enter Value for condition #${c + 1} in Group #${g + 1}`,
                type: "error",
              });
              return;
            }
          }
        }
        if (cond.condition_type === "CATEGORY") {
          const hasItems = Array.isArray(cond.value) && cond.value.length > 0;
          const hasStr = typeof cond.value === "string" && cond.value.trim() !== "";
          const hasNum = typeof cond.value === "number";

          if (!hasItems && !hasStr && !hasNum) {
            toastManager.add({
              title: `Please select at least one Category for condition #${c + 1} in Group #${g + 1}`,
              type: "error",
            });
            return;
          }
        }
      }
    }

    const payload: CreateRulePayload = {
      vendor_id: vendorId ?? 0,
      rule_name: finalRuleName,
      rule_code: finalRuleCode,
      priority: finalPriority,
      status: status,
      created_by: userId,
      conditionGroups: conditionGroups.map((g, gIdx) => ({
        sequence_no: gIdx + 1,
        logical_operator: gIdx < conditionGroups.length - 1 ? g.logical_operator : null,
        conditions: g.conditions.map((c, cIdx) => {
          const field = ruleFields.find((f) => f.field_key === c.field_key);
          const isBool = field?.data_type === "BOOLEAN";

          let finalVal = c.value;
          if (c.condition_type === "ALL_CATEGORY") {
            finalVal = "ALL";
          } else if (c.condition_type === "CATEGORY") {
            finalVal = Array.isArray(c.value)
              ? c.value.map((v: any) => (isNaN(Number(v)) ? v : Number(v)))
              : isNaN(Number(c.value))
              ? c.value
              : Number(c.value);
          } else if (isBool) {
            finalVal = c.value === false || c.value === "false" || c.value === 0 ? false : true;
          } else if (c.operator === "IS_BLANK" || c.operator === "IS_NOT_BLANK") {
            finalVal = "";
          } else if (field?.data_type === "NUMBER") {
            if (c.operator === "BETWEEN") {
              if (Array.isArray(c.value)) {
                finalVal = c.value.map(Number);
              } else if (typeof c.value === "string" && c.value.includes(",")) {
                finalVal = c.value.split(",").map((s: string) => Number(s.trim()));
              } else {
                finalVal = [Number(c.value), Number(c.value)];
              }
            } else {
              finalVal = isNaN(Number(c.value)) ? c.value : Number(c.value);
            }
          }

          return {
            sequence_no: cIdx + 1,
            condition_type: (c.condition_type === "ALL_CATEGORY"
              ? "CATEGORY"
              : c.condition_type || "COLUMN") as RuleConditionType,
            field_key: c.condition_type === "COLUMN" ? c.field_key : null,
            operator: (c.condition_type === "ALL_CATEGORY"
              ? "IN"
              : isBool
              ? "EQUALS"
              : c.operator || (c.condition_type === "CATEGORY" ? "IN" : "EQUALS")) as RuleOperator,
            value: finalVal,
            logical_operator: cIdx < g.conditions.length - 1 ? c.logical_operator : null,
          };
        }),
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
                {/* 1. Rule Status Card */}
                <div className="border border-border/80 rounded-xl p-4 bg-card shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    <div>
                      <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                        Rule Status:{" "}
                        <span
                          className={
                            status === "ACTIVE"
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-muted-foreground font-bold"
                          }
                        >
                          {status}
                        </span>
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

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                {(() => {
                                    const conditionTypeValue = cond.condition_type;
                                    const selectedFieldForType = ruleFields.find((f) => f.field_key === cond.field_key);
                                    const isUnaryColumn =
                                      conditionTypeValue === "COLUMN" &&
                                      (selectedFieldForType?.data_type === "BOOLEAN" ||
                                        cond.operator === "IS_BLANK" ||
                                        cond.operator === "IS_NOT_BLANK");

                                    const conditionTypeSpan =
                                      conditionTypeValue === "ALL_CATEGORY" || conditionTypeValue === "CATEGORY" || isUnaryColumn
                                        ? "sm:col-span-3 min-w-0"
                                        : "sm:col-span-2 min-w-0";

                                    return (
                                      <>
                                        {/* Condition Type */}
                                        <div className={conditionTypeSpan}>
                                          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                            Condition Type
                                          </label>
                                          <Select
                                            key={`type-select-${gIdx}-${cIdx}-${conditionTypeValue}`}
                                            value={conditionTypeValue}
                                            onValueChange={(val) => {
                                              updateCondition(gIdx, cIdx, "condition_type", val);
                                            }}
                                          >
                                            <SelectTrigger className="w-full min-w-0 h-9 text-xs justify-between overflow-hidden [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block">
                                              <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="COLUMN">Column</SelectItem>
                                              <SelectItem value="CATEGORY">Category</SelectItem>
                                              <SelectItem value="ALL_CATEGORY">All Category</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* MODE 1: ALL CATEGORY */}
                                        {conditionTypeValue === "ALL_CATEGORY" && (
                                          <>
                                            <div className="sm:col-span-2 min-w-0">
                                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                Operator
                                              </label>
                                              <div className="h-9 px-3 flex items-center border border-border/70 rounded-md bg-muted/40 text-xs font-medium text-foreground">
                                                In
                                              </div>
                                            </div>

                                            <div className="sm:col-span-7 min-w-0">
                                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                Target Scope
                                              </label>
                                              <div className="h-9 px-3 flex items-center justify-between border border-primary/25 rounded-md bg-primary/5 text-xs text-primary font-medium shadow-2xs">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <Sparkles size={14} className="text-primary shrink-0" />
                                                  <span className="font-semibold">All Categories</span>
                                                  <span className="text-[11px] text-muted-foreground font-normal truncate hidden md:inline">
                                                    (Auto-includes future categories)
                                                  </span>
                                                </div>
                                                <Badge
                                                  variant="secondary"
                                                  className="bg-primary/15 text-primary text-[10px] font-bold border-primary/20 py-0.5 shrink-0 ml-2"
                                                >
                                                  {projectCategories.length} Current
                                                </Badge>
                                              </div>
                                            </div>
                                          </>
                                        )}

                                        {/* MODE 2: SPECIFIC CATEGORY MULTI-SELECT */}
                                        {conditionTypeValue === "CATEGORY" && (
                                          <>
                                            <div className="sm:col-span-2 min-w-0">
                                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                Operator
                                              </label>
                                              <Select
                                                key={`op-select-${gIdx}-${cIdx}-${cond.operator}`}
                                                value={cond.operator || "IN"}
                                                onValueChange={(val: RuleOperator) =>
                                                  updateCondition(gIdx, cIdx, "operator", val)
                                                }
                                              >
                                                <SelectTrigger className="w-full min-w-0 h-9 text-xs justify-between overflow-hidden [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block">
                                                  <SelectValue placeholder="Select Operator" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="IN">In</SelectItem>
                                                  <SelectItem value="NOT_IN">Not In</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div className="sm:col-span-7 min-w-0">
                                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                Categories
                                              </label>
                                              <CategoryMultiSelect
                                                key={`cat-multiselect-${gIdx}-${cIdx}-${projectCategories.length}-${categoriesLoading}`}
                                                categories={projectCategories}
                                                value={cond.value}
                                                onChange={(val) =>
                                                  updateCondition(gIdx, cIdx, "value", val)
                                                }
                                                isLoading={categoriesLoading}
                                              />
                                            </div>
                                          </>
                                        )}

                                        {/* MODE 3: COLUMN CONDITION */}
                                        {conditionTypeValue === "COLUMN" && (() => {
                                          const selectedField = ruleFields.find(
                                            (f) => f.field_key === cond.field_key
                                          );
                                          const fieldDataType = selectedField?.data_type;

                                          // Case 1: No Column Selected Yet
                                          if (!cond.field_key) {
                                            return (
                                              <>
                                                <div className="sm:col-span-4 min-w-0">
                                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                    Column
                                                  </label>
                                                  <Select
                                                    key={`col-select-${gIdx}-${cIdx}-${cond.field_key}-${ruleFields.length}-${fieldsLoading}`}
                                                    value={cond.field_key}
                                                    onValueChange={(val) =>
                                                      handleColumnChange(gIdx, cIdx, val)
                                                    }
                                                  >
                                                    <SelectTrigger className="w-full min-w-0 h-9 text-xs justify-between overflow-hidden [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block">
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
                                                </div>
                                                <div className="sm:col-span-3 min-w-0">
                                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                    Operator
                                                  </label>
                                                  <div className="h-9 px-3 flex items-center border border-dashed rounded-md text-xs text-muted-foreground">
                                                    Select column first
                                                  </div>
                                                </div>
                                                <div className="sm:col-span-3 min-w-0">
                                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                    Value
                                                  </label>
                                                  <div className="h-9 px-3 flex items-center border border-dashed rounded-md text-xs text-muted-foreground">
                                                    -
                                                  </div>
                                                </div>
                                              </>
                                            );
                                          }

                                          // Case 2: BOOLEAN Column (Matches Image 3)
                                          if (fieldDataType === "BOOLEAN") {
                                            const boolVal =
                                              cond.value === false || cond.value === "false" || cond.value === 0
                                                ? "IS_FALSE"
                                                : "IS_TRUE";

                                            return (
                                              <>
                                                <div className="sm:col-span-5 min-w-0">
                                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                    Column
                                                  </label>
                                                  <Select
                                                    key={`col-select-${gIdx}-${cIdx}-${cond.field_key}-${ruleFields.length}-${fieldsLoading}`}
                                                    value={cond.field_key}
                                                    onValueChange={(val) =>
                                                      handleColumnChange(gIdx, cIdx, val)
                                                    }
                                                  >
                                                    <SelectTrigger
                                                      title={selectedField ? `${selectedField.field_name} · ${selectedField.data_type.toLowerCase()}` : undefined}
                                                      className="w-full min-w-0 h-9 text-xs justify-between overflow-hidden [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block"
                                                    >
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
                                                </div>

                                                <div className="sm:col-span-4 min-w-0">
                                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                    Operator
                                                  </label>
                                                  <Select
                                                    key={`bool-op-select-${gIdx}-${cIdx}-${boolVal}`}
                                                    value={boolVal}
                                                    onValueChange={(val) => {
                                                      updateCondition(gIdx, cIdx, {
                                                        operator: "EQUALS",
                                                        value: val === "IS_TRUE",
                                                      });
                                                    }}
                                                  >
                                                    <SelectTrigger className="w-full min-w-0 h-9 text-xs justify-between overflow-hidden [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block">
                                                      <SelectValue placeholder="Select Operator" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="IS_TRUE">Is True</SelectItem>
                                                      <SelectItem value="IS_FALSE">Is False</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </>
                                            );
                                          }

                                          // Case 3: NUMBER, STRING, or ARRAY Column (Matches Images 1 & 2)
                                          const availableOperators =
                                            OPERATORS_BY_DATA_TYPE[fieldDataType || "STRING"] ||
                                            OPERATORS_BY_DATA_TYPE.STRING;

                                          const isUnaryOp = cond.operator === "IS_BLANK" || cond.operator === "IS_NOT_BLANK";
                                          const isBetweenOp = cond.operator === "BETWEEN";

                                          const colSpanClass = isUnaryOp
                                            ? "sm:col-span-5 min-w-0"
                                            : isBetweenOp
                                            ? "sm:col-span-3 min-w-0"
                                            : "sm:col-span-4 min-w-0";

                                          const opSpanClass = isUnaryOp
                                            ? "sm:col-span-4 min-w-0"
                                            : "sm:col-span-3 min-w-0";

                                          const valSpanClass = isBetweenOp
                                            ? "sm:col-span-4 min-w-0"
                                            : "sm:col-span-3 min-w-0";

                                          const rangeMin = Array.isArray(cond.value)
                                            ? (cond.value[0] ?? "")
                                            : typeof cond.value === "string" && cond.value.includes(",")
                                            ? (cond.value.split(",")[0]?.trim() ?? "")
                                            : (cond.value ?? "");

                                          const rangeMax = Array.isArray(cond.value)
                                            ? (cond.value[1] ?? "")
                                            : typeof cond.value === "string" && cond.value.includes(",")
                                            ? (cond.value.split(",")[1]?.trim() ?? "")
                                            : "";

                                          return (
                                            <>
                                              <div className={colSpanClass}>
                                                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                  Column
                                                </label>
                                                <Select
                                                  key={`col-select-${gIdx}-${cIdx}-${cond.field_key}-${ruleFields.length}-${fieldsLoading}`}
                                                  value={cond.field_key}
                                                  onValueChange={(val) =>
                                                    handleColumnChange(gIdx, cIdx, val)
                                                  }
                                                >
                                                  <SelectTrigger
                                                    title={selectedField ? `${selectedField.field_name} · ${selectedField.data_type.toLowerCase()}` : undefined}
                                                    className="w-full min-w-0 h-9 text-xs justify-between overflow-hidden [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block"
                                                  >
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
                                              </div>

                                              <div className={opSpanClass}>
                                                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                  Operator
                                                </label>
                                                <Select
                                                  key={`op-select-${gIdx}-${cIdx}-${cond.operator}-${fieldDataType}`}
                                                  value={cond.operator}
                                                  onValueChange={(val: RuleOperator) =>
                                                    updateCondition(gIdx, cIdx, "operator", val)
                                                  }
                                                >
                                                  <SelectTrigger className="w-full min-w-0 h-9 text-xs justify-between overflow-hidden [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:block">
                                                    <SelectValue placeholder="Select Operator" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {availableOperators.map((op) => (
                                                      <SelectItem key={op.value} value={op.value}>
                                                        {op.label}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              {!isUnaryOp && (
                                                <div className={valSpanClass}>
                                                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                    {isBetweenOp ? "Range (Min — Max)" : "Value"}
                                                  </label>
                                                  {isBetweenOp ? (
                                                    <div className="flex items-center gap-1.5 w-full min-w-0">
                                                      <Input
                                                        type={fieldDataType === "NUMBER" ? "number" : "text"}
                                                        className="w-full min-w-0 h-9 text-xs"
                                                        placeholder="Min"
                                                        value={rangeMin}
                                                        onChange={(e) =>
                                                          updateCondition(gIdx, cIdx, "value", [e.target.value, rangeMax])
                                                        }
                                                      />
                                                      <span className="text-xs text-muted-foreground font-medium shrink-0 px-0.5">
                                                        to
                                                      </span>
                                                      <Input
                                                        type={fieldDataType === "NUMBER" ? "number" : "text"}
                                                        className="w-full min-w-0 h-9 text-xs"
                                                        placeholder="Max"
                                                        value={rangeMax}
                                                        onChange={(e) =>
                                                          updateCondition(gIdx, cIdx, "value", [rangeMin, e.target.value])
                                                        }
                                                      />
                                                    </div>
                                                  ) : (
                                                    <Input
                                                      type={fieldDataType === "NUMBER" ? "number" : "text"}
                                                      className="w-full min-w-0 h-9 text-xs"
                                                      placeholder={
                                                        fieldDataType === "NUMBER"
                                                          ? "Enter number"
                                                          : fieldDataType === "ARRAY"
                                                          ? "Enter comma separated"
                                                          : "Enter value"
                                                      }
                                                      value={cond.value ?? ""}
                                                      onChange={(e) =>
                                                        updateCondition(gIdx, cIdx, "value", e.target.value)
                                                      }
                                                    />
                                                  )}
                                                </div>
                                              )}
                                            </>
                                          );
                                        })()}

                                        {/* UNSET CONDITION TYPE */}
                                        {!conditionTypeValue && (
                                          <>
                                            <div className="sm:col-span-3 min-w-0">
                                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                Field
                                              </label>
                                              <div className="h-9 px-3 flex items-center border border-dashed rounded-md text-xs text-muted-foreground">
                                                Select condition type
                                              </div>
                                            </div>
                                            <div className="sm:col-span-3 min-w-0">
                                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                Operator
                                              </label>
                                              <div className="h-9 px-3 flex items-center border border-dashed rounded-md text-xs text-muted-foreground">
                                                -
                                              </div>
                                            </div>
                                            <div className="sm:col-span-3 min-w-0">
                                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                                Value
                                              </label>
                                              <div className="h-9 px-3 flex items-center border border-dashed rounded-md text-xs text-muted-foreground">
                                                -
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </>
                                    );
                                  })()}
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
                        {currentMachine?.machine_name || ruleName || "Untitled Rule"}
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
