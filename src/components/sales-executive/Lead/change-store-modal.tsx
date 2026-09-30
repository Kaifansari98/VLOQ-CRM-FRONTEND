"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import { useFranchisesByVendorId } from "@/api/franchise";
import { changeLeadStoreAPI } from "@/api/leads";
import { apiClient } from "@/lib/apiClient";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Store, Loader2 } from "lucide-react";

interface ChangeStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  currentStoreId?: number | null;
  isOnlineLead?: boolean;
}

export default function ChangeStoreModal({
  open,
  onOpenChange,
  leadId,
  currentStoreId,
  isOnlineLead = false,
}: ChangeStoreModalProps) {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id;
  const userId = user?.id;

  const { data: franchises = [], isLoading: isFranchisesLoading } =
    useFranchisesByVendorId(vendorId, !!vendorId && open);

  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedStoreId(currentStoreId ? String(currentStoreId) : "");
    }
  }, [open, currentStoreId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      toastManager.add({ title: "Please select a store", type: "error" });
      return;
    }

    if (Number(selectedStoreId) === currentStoreId) {
      toastManager.add({
        title: "This lead is already assigned to the selected store",
        type: "info",
      });
      return;
    }

    if (!vendorId || !userId || !leadId) {
      toastManager.add({
        title: "Vendor, User or Lead ID is missing",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (isOnlineLead) {
        const res = await apiClient.post(`/online-leads/${leadId}/assign-store`, {
          to_store_id: Number(selectedStoreId),
          selected_by: userId,
        });

        if (res.data?.success) {
          toastManager.add({
            title: "Store changed & lead assigned to sales executive successfully!",
            type: "success",
          });
          queryClient.invalidateQueries({ queryKey: ["onlineLead", leadId] });
          queryClient.invalidateQueries({ queryKey: ["onlineLeads"] });
          onOpenChange(false);
        }
      } else {
        const res = await changeLeadStoreAPI(
          vendorId,
          leadId,
          Number(selectedStoreId),
          userId,
        );

        if (res?.success) {
          toastManager.add({
            title:
              res?.data?.assignedUser?.name
                ? `Store changed & lead assigned to ${res.data.assignedUser.name}!`
                : "Store changed & lead assigned successfully!",
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: ["lead", leadId, vendorId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["vendorUserLeadsOpen"],
          });
          queryClient.invalidateQueries({
            queryKey: ["siteMeasurementLeadDetails"],
          });
          queryClient.invalidateQueries({
            queryKey: ["designingStageLeads"],
          });
          queryClient.invalidateQueries({
            queryKey: ["ismLeads"],
          });
          onOpenChange(false);
        }
      }
    } catch (err: any) {
      console.error("Change Store error:", err);
      toastManager.add({
        title:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to change store",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Change Store
            </DialogTitle>
            <DialogDescription>
              Select a new store for this lead. The lead will be automatically assigned to the sales executive of the selected store.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm font-medium text-foreground">
              Select Store / Franchise <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedStoreId}
              onValueChange={setSelectedStoreId}
              disabled={isFranchisesLoading || submitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a store..." />
              </SelectTrigger>
              <SelectContent>
                {isFranchisesLoading ? (
                  <div className="p-2 text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading stores...
                  </div>
                ) : franchises.filter((f) => {
                    const name = (f.franchise_name || "").replace(/vloq|furnix/gi, "").trim().toLowerCase();
                    return name !== "b2b" && !f.moduled_for_b2b;
                  }).length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No stores available
                  </div>
                ) : (
                  franchises
                    .filter((f) => {
                      const name = (f.franchise_name || "").replace(/vloq|furnix/gi, "").trim().toLowerCase();
                      return name !== "b2b" && !f.moduled_for_b2b;
                    })
                    .map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.franchise_name.replace(/vloq|furnix/gi, "").trim()}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !selectedStoreId}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Store"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
