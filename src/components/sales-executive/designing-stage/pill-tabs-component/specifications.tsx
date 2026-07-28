"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComingSoon from "@/components/generics/ComingSoon";
import ViewSpecsModal from "./modals/view-specs-modal";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import {
  useLeadSpecifications,
  useCreateLeadSpecification,
} from "@/hooks/designing-stage/designing-leads-hooks";
import type { LeadSpecificationEntry } from "@/api/designingStageQueries";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import AssignToPicker from "@/components/assign-to-picker";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";

export default function SpecificationsTab() {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );

  const [openCreateConfirm, setOpenCreateConfirm] = useState(false);
  const [selectedItemCodeId, setSelectedItemCodeId] = useState<number | null>(
    null,
  );
  const [selectedSpec, setSelectedSpec] =
    useState<LeadSpecificationEntry | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: specifications = [] } = useLeadSpecifications(vendorId, leadId);
  const hasSpecifications = specifications.length > 0;

  const {
    data: structureInstancesData,
    isLoading: isProductItemCodesLoading,
  } = useLeadProductStructureInstances(leadId, vendorId);
  const structureInstances: any[] = Array.isArray(structureInstancesData?.data)
    ? structureInstancesData.data
    : [];
  const itemCodeGroupMap = new Map<number, string>(
    structureInstances
      .filter((instance: any) => instance.productItemCode)
      .map((instance: any) => [
        instance.productItemCode.id,
        instance.productType?.type ||
          instance.productItemCode?.productStructure?.productType?.type ||
          "—",
      ]),
  );
  const itemCodePickerData = Array.from(
    new Map<number, { id: number; label: string; subLabel: string }>(
      structureInstances
        .filter((instance: any) => instance.productItemCode)
        .map((instance: any) => [
          instance.productItemCode.id,
          {
            id: instance.productItemCode.id,
            label: instance.productItemCode.item_code,
            subLabel: `${itemCodeGroupMap.get(instance.productItemCode.id)}`,
          },
        ]),
    ).values(),
  );
  const selectedItemGroup = selectedItemCodeId
    ? itemCodeGroupMap.get(selectedItemCodeId)
    : undefined;

  const groupedSpecifications = useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return [];
    }

    const groups = new Map<
      string,
      {
        id: string;
        title: string;
        specs: LeadSpecificationEntry[];
      }
    >();

    for (const spec of specifications) {
      const title =
        (spec.item_code_id ? itemCodeGroupMap.get(spec.item_code_id) : null) ||
        "Other Specifications";
      const key = title.trim().toLowerCase();

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          title,
          specs: [],
        });
      }

      groups.get(key)!.specs.push(spec);
    }

    const uniqueProductTypes = [
      ...new Set(
        structureInstances
          .map((instance: any) => instance.productType?.type)
          .filter(Boolean),
      ),
    ];

    for (const productType of uniqueProductTypes) {
      const key = String(productType).trim().toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          title: String(productType),
          specs: [],
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [handlesLargeScaleProjects, specifications, structureInstances, itemCodeGroupMap]);

  const selectedGroup = useMemo(
    () => groupedSpecifications.find((group) => group.id === selectedGroupId) || null,
    [groupedSpecifications, selectedGroupId],
  );

  const createSpecification = useCreateLeadSpecification();

  const handleCreateSpecification = () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Vendor or user information is missing!",
        type: "error",
      });
      return;
    }

    createSpecification.mutate(
      {
        vendorId,
        leadId,
        createdBy: userId,
        itemCodeId: selectedItemCodeId ?? undefined,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Specification created successfully!",
            type: "success",
          });
          setOpenCreateConfirm(false);
          setSelectedItemCodeId(null);
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.message || "Failed to create specification",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="shrink-0" />
          <h1 className="text-lg font-semibold tracking-tight">
            {handlesLargeScaleProjects && selectedGroup
              ? selectedGroup.title
              : "Specifications"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {handlesLargeScaleProjects && selectedGroup && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedGroupId(null)}
            >
              <ArrowLeft size={14} className="mr-1" />
              Back
            </Button>
          )}
          <Button size="sm" onClick={() => setOpenCreateConfirm(true)}>
            <Plus size={16} className="mr-1" />
            <span>Add Specs</span>
          </Button>
        </div>
      </div>

      {handlesLargeScaleProjects && !selectedGroup ? (
        groupedSpecifications.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groupedSpecifications.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className="group rounded-xl border bg-white/60 p-5 text-left transition-all hover:border-border/80 dark:bg-[#0a0a0a] min-w-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Product Type
                      </span>
                    </div>
                    <p className="line-clamp-2 text-base font-semibold leading-tight break-words">
                      {group.title}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {group.specs.length} {group.specs.length === 1 ? "spec" : "specs"}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <ComingSoon
            heading="No Specifications Added"
            description="Specifications for this lead will show up here once added."
          />
        )
      ) : hasSpecifications || selectedGroup ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(selectedGroup ? selectedGroup.specs : specifications).map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => setSelectedSpec(spec)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate" title={spec.name}>
                  {spec.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(spec.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <ComingSoon
          heading="No Specifications Added"
          description="Specifications for this lead will show up here once added."
        />
      )}

      <AlertDialog
        open={openCreateConfirm}
        onOpenChange={(open) => {
          setOpenCreateConfirm(open);
          if (!open) setSelectedItemCodeId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Specification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new specification card for this lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <label className="text-xs font-medium text-muted-foreground">
              Item Code
            </label>
            <div className="mt-1">
              {isProductItemCodesLoading ? (
                <p className="text-xs text-muted-foreground">
                  Loading item codes...
                </p>
              ) : (
                <AssignToPicker
                  data={itemCodePickerData}
                  value={selectedItemCodeId ?? undefined}
                  onChange={(id) => setSelectedItemCodeId(id)}
                  placeholder="Search item code..."
                />
              )}
            </div>
            {selectedItemCodeId && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-foreground">{selectedItemGroup}</span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createSpecification.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateSpecification}
              disabled={createSpecification.isPending}
            >
              {createSpecification.isPending ? "Creating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ViewSpecsModal
        open={!!selectedSpec}
        onOpenChange={(open) => {
          if (!open) setSelectedSpec(null);
        }}
        specification={selectedSpec}
      />
    </div>
  );
}
