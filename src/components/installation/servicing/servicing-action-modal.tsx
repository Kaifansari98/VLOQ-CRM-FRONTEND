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
import {
  useRejectService,
  useReopenService,
  useRescheduleService,
} from "@/api/installation/useServicingStageLeads";
import { toastManager } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import ServicingCompleteModal from "./servicing-complete-modal";

interface ServicingActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceLabel?: string;
  leadId: number;
  accountId?: number;
  serviceId?: number;
  isRescheduled?: boolean;
  serviceStatus?: "open" | "completed" | "rejected";
}

const ServicingActionModal: React.FC<ServicingActionModalProps> = ({
  open,
  onOpenChange,
  serviceLabel,
  leadId,
  accountId,
  serviceId,
  isRescheduled = false,
  serviceStatus = "open",
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type as string | undefined,
  );
  const [openRescheduleConfirm, setOpenRescheduleConfirm] = useState(false);
  const [openRejectConfirm, setOpenRejectConfirm] = useState(false);
  const [openReopenConfirm, setOpenReopenConfirm] = useState(false);
  const [openCompleteModal, setOpenCompleteModal] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const rescheduleMutation = useRescheduleService();
  const rejectMutation = useRejectService();
  const reopenMutation = useReopenService();
  const normalizedUserType = (userType || "").toLowerCase();
  const canViewRejectSection = [
    "head-site-supervisor",
    "admin",
    "super-admin",
  ].includes(normalizedUserType);
  const canReopenRejected = ["admin", "super-admin"].includes(
    normalizedUserType,
  );
  const isRejectedService = serviceStatus === "rejected";
  const rejectedTooltipMessage =
    "This service is rejected. Change it back to open first.";

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

  const handleConfirmReject = () => {
    if (!vendorId || !userId || !serviceId || !rejectRemark.trim()) return;

    rejectMutation.mutate(
      {
        vendorId,
        leadId,
        serviceId,
        payload: {
          updated_by: userId,
          remark: rejectRemark.trim(),
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${serviceLabel || "Service"} rejected successfully`,
            type: "success",
          });
          setOpenRejectConfirm(false);
          setRejectRemark("");
          onOpenChange(false);
        },
      },
    );
  };

  const handleConfirmReopen = () => {
    if (!vendorId || !userId || !serviceId) return;

    reopenMutation.mutate(
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
            title: `${serviceLabel || "Service"} reopened successfully`,
            type: "success",
          });
          setOpenReopenConfirm(false);
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
                Upload the service document and add an optional remark to
                complete this servicing visit.
              </p>
            </div>
            {isRejectedService ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button className="w-28" disabled>
                      Complete
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {rejectedTooltipMessage}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                className="w-28"
                onClick={() => setOpenCompleteModal(true)}
              >
                Complete
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">
                Mark as Reschedule
              </span>
              <p className="text-sm text-muted-foreground">
                Move this servicing visit to the next month on the same date.
              </p>
            </div>
            {isRejectedService ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button className="w-28" variant="outline" disabled>
                      Reschedule
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {rejectedTooltipMessage}
                </TooltipContent>
              </Tooltip>
            ) : isRescheduled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button className="w-28" variant="outline" disabled>
                      Reschedule
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  This service has been already rescheduled.
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                className="w-28"
                variant="outline"
                onClick={() => setOpenRescheduleConfirm(true)}
                disabled={rescheduleMutation.isPending}
              >
                Reschedule
              </Button>
            )}
          </div>

          {canViewRejectSection && !isRejectedService ? (
            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold">
                    Mark as Reject
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Reject this servicing visit with a mandatory remark.
                  </p>
                </div>
                <Button
                  className="w-28"
                  variant="destructive"
                  onClick={() => setOpenRejectConfirm(true)}
                  disabled={!rejectRemark.trim() || rejectMutation.isPending}
                >
                  Reject
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium mb-2">Remark</label>
                <Textarea
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  placeholder="Enter rejection remark"
                  className="min-h-24"
                />
              </div>
            </div>
          ) : null}

          {isRejectedService && canReopenRejected ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold">Mark as Open</span>
                <p className="text-sm text-muted-foreground">
                  Change this rejected service back to open.
                </p>
              </div>
              <Button
                className="w-28"
                variant="outline"
                onClick={() => setOpenReopenConfirm(true)}
                disabled={reopenMutation.isPending}
              >
                Open
              </Button>
            </div>
          ) : null}
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

      <AlertDialog open={openRejectConfirm} onOpenChange={setOpenRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject {serviceLabel || "service"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the service as rejected and save your remark.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending || !rejectRemark.trim()}
            >
              {rejectMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openReopenConfirm} onOpenChange={setOpenReopenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reopen {serviceLabel || "service"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will change the rejected service back to open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reopenMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReopen}
              disabled={reopenMutation.isPending}
            >
              {reopenMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ServicingCompleteModal
        open={openCompleteModal}
        onOpenChange={setOpenCompleteModal}
        onCompleted={() => {
          setOpenCompleteModal(false);
          onOpenChange(false);
        }}
        serviceLabel={serviceLabel}
        leadId={leadId}
        accountId={accountId}
        serviceId={serviceId}
      />
    </>
  );
};

export default ServicingActionModal;
