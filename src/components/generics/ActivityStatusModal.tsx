"use client";

import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "../date-picker";
import { useAppSelector } from "@/redux/store";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusType: "onHold" | "lostApproval" | "lost"; // which action triggered
  onSubmitRemark: (
    remark: string,
    dueDate?: string,
    selection?: ActivityStatusModalSelectionPayload,
  ) => void; // callback
  loading?: boolean;
  existingRemark?: string;
  existingRemarkLabel?: string;
  vendorId?: number;
  franchiseId?: number | null;
  hasAdmin?: boolean;
  leadId?: number;
}

type ScopedOnHoldItem = {
  id: number;
  itemCode: string;
  description?: string | null;
  specification?: string | null;
};

type ScopedOnHoldGroup = {
  id: number;
  title: string;
  items: ScopedOnHoldItem[];
};

export type ActivityStatusModalSelectionPayload = {
  applyToWholeLead: boolean;
  selectedGroupIds: number[];
  selectedItemIds: number[];
};

const formSchema = z.object({
  remark: z.string().min(1, "Remark is required"),
  dueDate: z.string().optional(), // 👈 conditionally required below
});

const ActivityStatusModal: React.FC<Props> = ({
  open,
  onOpenChange,
  statusType,
  onSubmitRemark,
  loading = false,
  existingRemark,
  existingRemarkLabel = "Sales executive remark",
  vendorId,
  franchiseId,
  hasAdmin,
  leadId,
}) => {
  const params = useParams<{ lead?: string; leadId?: string }>();
  const currentUserType = useAppSelector((state) => {
    const u = state.auth.user as any;
    const role =
      u?.user_type?.user_type ||
      u?.user_type ||
      u?.user_role ||
      u?.role ||
      "";
    return String(role).toLowerCase().trim();
  });

  const isCurrentAdmin =
    currentUserType === "admin" || currentUserType === "super-admin";
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const resolvedLeadId = useMemo(() => {
    if (typeof leadId === "number" && Number.isFinite(leadId)) {
      return leadId;
    }

    const rawLeadId = params?.leadId ?? params?.lead;
    const parsedLeadId = Number(rawLeadId);
    return Number.isFinite(parsedLeadId) ? parsedLeadId : undefined;
  }, [leadId, params?.lead, params?.leadId]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const shouldShowScopedSelection =
    open && statusType === "onHold" && handlesLargeScaleProjects;

  const { data: storeAdminExists = false } = useQuery({
    queryKey: ["franchise-admin-check", vendorId, franchiseId],
    queryFn: async () => {
      if (!vendorId || !franchiseId) return false;
      const res = await apiClient.get(`/users/vendor/${vendorId}`, {
        params: { page: 1, limit: 100, franchise_id: franchiseId },
      });
      const users = Array.isArray(res.data?.data) ? res.data.data : [];
      return users.some((u: any) => {
        const uType = (
          u.user_type?.user_type ||
          u.user_type ||
          u.user_role ||
          u.role ||
          ""
        ).toLowerCase();
        return u.status === "active" && uType === "admin";
      });
    },
    enabled:
      open &&
      !isCurrentAdmin &&
      !!vendorId &&
      !!franchiseId &&
      (statusType === "lost" || statusType === "lostApproval"),
  });
  const {
    data: structureInstancesData,
    isLoading: isStructureInstancesLoading,
  } = useLeadProductStructureInstances(
    resolvedLeadId,
    vendorId,
    shouldShowScopedSelection,
  );

  const itemGroups = useMemo(() => {
    const rawInstances = Array.isArray(structureInstancesData?.data)
      ? structureInstancesData.data
      : [];

    const groups = new Map<number, ScopedOnHoldGroup>();

    for (const instance of rawInstances as any[]) {
      const productTypeId = Number(
        instance.productType?.id ||
          instance.productItemCode?.productStructure?.productType?.id ||
          0,
      );
      if (!productTypeId) {
        continue;
      }
      const groupTitle =
        instance.productType?.type ||
        instance.productItemCode?.productStructure?.productType?.type ||
        "Other Items";
      const existingGroup: ScopedOnHoldGroup = groups.get(productTypeId) ?? {
        id: productTypeId,
        title: groupTitle,
        items: [],
      };

      if (instance.productItemCode?.id) {
        const alreadyExists = existingGroup.items.some(
          (item) => item.id === instance.productItemCode.id,
        );

        if (!alreadyExists) {
          existingGroup.items.push({
            id: instance.productItemCode.id,
            itemCode: instance.productItemCode.item_code,
            description: instance.productItemCode.description,
            specification: instance.productItemCode.specification,
          });
        }
      }

      groups.set(productTypeId, existingGroup);
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => a.itemCode.localeCompare(b.itemCode)),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [structureInstancesData]);

  useEffect(() => {
    if (!shouldShowScopedSelection) {
      setExpandedGroupIds([]);
      setSelectedGroupIds([]);
      setSelectedItemIds([]);
      return;
    }

    setExpandedGroupIds((current) => {
      if (current.length > 0) return current;
      return itemGroups.map((group) => group.id);
    });
  }, [itemGroups, shouldShowScopedSelection]);

  const requiresApproval = isCurrentAdmin
    ? false
    : hasAdmin !== undefined
      ? hasAdmin
      : statusType === "lostApproval" || (statusType === "lost" && storeAdminExists);

  const modalStatusType: Props["statusType"] =
    statusType === "onHold"
      ? "onHold"
      : requiresApproval
        ? "lostApproval"
        : "lost";

  const defaultLostRemark = statusType === "lost" && existingRemark ? "N/A" : "";
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      remark: defaultLostRemark,
      dueDate: "",
    },
  });

  useEffect(() => {
    form.reset({
      remark: defaultLostRemark,
      dueDate: "",
    });
  }, [defaultLostRemark, form, open, statusType]);

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  };

  const toggleGroupSelected = (
    groupId: number,
    itemIds: number[],
    checked: boolean,
  ) => {
    setSelectedGroupIds((current) =>
      checked
        ? Array.from(new Set([...current, groupId]))
        : current.filter((id) => id !== groupId),
    );
    setSelectedItemIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...itemIds]));
      }
      return current.filter((id) => !itemIds.includes(id));
    });
  };

  const toggleItemSelected = (
    groupId: number,
    itemId: number,
    groupItemIds: number[],
    checked: boolean,
  ) => {
    setSelectedItemIds((current) =>
      checked
        ? Array.from(new Set([...current, itemId]))
        : current.filter((id) => id !== itemId),
    );

    setSelectedGroupIds((current) => {
      const nextItemIds = checked
        ? Array.from(new Set([...selectedItemIds, itemId]))
        : selectedItemIds.filter((id) => id !== itemId);
      const isEveryItemSelected = groupItemIds.every((id) =>
        nextItemIds.includes(id),
      );

      if (isEveryItemSelected) {
        return Array.from(new Set([...current, groupId]));
      }

      return current.filter((id) => id !== groupId);
    });
  };

  const hasScopedSelection =
    selectedGroupIds.length > 0 || selectedItemIds.length > 0;
  const areAllItemGroupsSelected =
    shouldShowScopedSelection &&
    itemGroups.length > 0 &&
    itemGroups.every((group) => {
      const groupItemIds = group.items.map((item) => item.id);
      return (
        selectedGroupIds.includes(group.id) ||
        (groupItemIds.length > 0 &&
          groupItemIds.every((itemId) => selectedItemIds.includes(itemId)))
      );
    });
  const isLargeScaleOnHoldSubmitDisabled =
    shouldShowScopedSelection &&
    (!form.watch("dueDate") || !hasScopedSelection);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (statusType === "onHold" && !values.dueDate) {
      form.setError("dueDate", { message: "Follow-up date is required" });
      return;
    }

    if (shouldShowScopedSelection && !hasScopedSelection) {
      return;
    }

    onSubmitRemark(values.remark, values.dueDate, {
      applyToWholeLead: areAllItemGroupsSelected,
      selectedGroupIds,
      selectedItemIds,
    });
    form.reset();
    onOpenChange(false);
  };

  const titles: Record<Props["statusType"], string> = {
    onHold: "Mark Lead as On Hold",
    lostApproval: "Mark Lead as Lost (Needs Approval)",
    lost: "Mark Lead as Lost",
  };

  const descriptions: Record<Props["statusType"], string> = {
    onHold: "Provide a reason why this lead is being put on hold.",
    lostApproval:
      "Provide a reason why this lead is being marked as lost (requires approval).",
    lost: "Provide a reason why this lead is being marked as lost.",
  };

  const buttonText: Record<Props["statusType"], string> = {
    onHold: "Confirm On Hold",
    lostApproval: "Send for Lost Approval",
    lost: "Confirm Lost",
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={titles[modalStatusType]}
      description={descriptions[modalStatusType]}
      size={shouldShowScopedSelection ? "lg" : "md"}
    >
      <div className="p-6 flex flex-col gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

            {/* Date Picker only for onHold */}
            {statusType === "onHold" && (
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Follow-up Date</FormLabel>
                    <FormControl>
                      <CustomeDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        restriction="futureOnly" // 👈 only allow future
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {statusType === "lost" && existingRemark && (
              <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                <p className="text-sm font-medium">{existingRemarkLabel}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {existingRemark}
                </p>
              </div>
            )}

            {shouldShowScopedSelection && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <FormLabel className="text-sm">
                    Select Item Groups / Item Codes <span className="text-destructive">*</span>
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Choose the item groups or item codes to place on hold.
                  </p>
                </div>

                {isStructureInstancesLoading ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading item groups...
                  </div>
                ) : itemGroups.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No item groups found for this lead.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itemGroups.map((group) => {
                      const groupItemIds = group.items.map((item) => item.id);
                      const checkedItemCount = groupItemIds.filter((id) =>
                        selectedItemIds.includes(id),
                      ).length;
                      const isGroupChecked =
                        groupItemIds.length > 0 &&
                        checkedItemCount === groupItemIds.length;
                      const isExpanded = expandedGroupIds.includes(group.id);

                      return (
                        <Collapsible
                          key={group.id}
                          open={isExpanded}
                          onOpenChange={() => toggleGroupExpanded(group.id)}
                        >
                          <div className="rounded-xl border bg-background">
                            <div className="flex items-center gap-3 p-4">
                              <Checkbox
                                checked={isGroupChecked || selectedGroupIds.includes(group.id)}
                                onCheckedChange={(checked) =>
                                  toggleGroupSelected(group.id, groupItemIds, checked === true)
                                }
                                aria-label={`Select ${group.title}`}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                  {group.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {group.items.length} item code{group.items.length === 1 ? "" : "s"}
                                </p>
                              </div>

                              <CollapsibleTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 shrink-0"
                                  aria-label={isExpanded ? "Collapse item group" : "Expand item group"}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-4 transition-transform",
                                      isExpanded && "rotate-180",
                                    )}
                                  />
                                </Button>
                              </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent>
                              <div className="border-t bg-muted/20 px-4 py-3">
                                <div className="space-y-2">
                                  {group.items.map((item) => (
                                    <label
                                      key={item.id}
                                      className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background px-3 py-3"
                                    >
                                      <Checkbox
                                        checked={selectedItemIds.includes(item.id)}
                                        onCheckedChange={(checked) =>
                                          toggleItemSelected(
                                            group.id,
                                            item.id,
                                            groupItemIds,
                                            checked === true,
                                          )
                                        }
                                        aria-label={`Select ${item.itemCode}`}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                          {item.itemCode}
                                        </p>
                                        {(item.description || item.specification) && (
                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {item.description || item.specification}
                                          </p>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Remark */}
            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Remark</FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your remark"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="text-sm"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-sm"
                disabled={loading || isLargeScaleOnHoldSubmitDisabled}
              >
                {buttonText[modalStatusType]}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default ActivityStatusModal;
