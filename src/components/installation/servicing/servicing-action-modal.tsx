"use client";

import React, { useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
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
import { useAppSelector } from "@/redux/store";
import { useRescheduleService } from "@/api/installation/useServicingStageLeads";
import { toastManager } from "@/components/ui/toast";

interface ServicingActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceLabel?: string;
  leadId: number;
  serviceId?: number;
}

const ServicingActionModal: React.FC<ServicingActionModalProps> = ({
  open,
  onOpenChange,
  serviceLabel,
  leadId,
  serviceId,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [openRescheduleConfirm, setOpenRescheduleConfirm] = useState(false);
  const rescheduleMutation = useRescheduleService();

  const handleConfirmReschedule = () => {
    if (!vendorId || !userId || !serviceId) return;

    rescheduleMutation.mutate(
      {
        vendorId,
        leadId,
        serviceId,
        payload: {
          updated_by: userId,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${serviceLabel || "Service"} rescheduled successfully`,
            type: "success",
          });
          setOpenRescheduleConfirm(false);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title={`${serviceLabel || "Service"} Actions`}
        description="Choose the servicing action you want to perform for this scheduled visit."
        size="lg"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Complete</span>
              <p className="text-sm text-muted-foreground">
                Upload the service document and add an optional remark to complete
                this servicing visit.
              </p>
            </div>
            <Button className="w-28">Complete</Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Reschedule</span>
              <p className="text-sm text-muted-foreground">
                Move this servicing visit to the next month on the same date.
              </p>
            </div>
            <Button
              className="w-28"
              variant="outline"
              onClick={() => setOpenRescheduleConfirm(true)}
              disabled={rescheduleMutation.isPending}
            >
              Reschedule
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Reject</span>
              <p className="text-sm text-muted-foreground">
                Reject this servicing visit with a mandatory remark when required.
              </p>
            </div>
            <Button className="w-28" variant="destructive">
              Reject
            </Button>
          </div>
        </div>
      </BaseModal>

      <AlertDialog
        open={openRescheduleConfirm}
        onOpenChange={setOpenRescheduleConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reschedule {serviceLabel || "service"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will move the service to the next month on the same date. A
              service can only be rescheduled once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rescheduleMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReschedule}
              disabled={rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServicingActionModal;
