"use client";

import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
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

  const [openCreateConfirm, setOpenCreateConfirm] = useState(false);
  const [selectedItemCodeId, setSelectedItemCodeId] = useState<number | null>(
    null,
  );
  const [selectedSpec, setSelectedSpec] =
    useState<LeadSpecificationEntry | null>(null);

  const { data: specifications = [] } = useLeadSpecifications(vendorId, leadId);
  const hasSpecifications = specifications.length > 0;

  const {
    data: structureInstancesData,
    isLoading: isProductItemCodesLoading,
  } = useLeadProductStructureInstances(leadId, vendorId);
  const structureInstances = structureInstancesData?.data || [];
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
            Specifications
          </h1>
        </div>
        <Button size="sm" onClick={() => setOpenCreateConfirm(true)}>
          <Plus size={16} className="mr-1" />
          <span>Add Specs</span>
        </Button>
      </div>

      {hasSpecifications ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specifications.map((spec) => (
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
