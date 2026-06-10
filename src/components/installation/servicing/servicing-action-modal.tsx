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
  type ServiceSchedule,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { useUpdateAmcOptedStatus } from "@/api/installation/useFinalHandoverStageLeads";

import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import CustomeTooltip from "@/components/custom-tooltip";

interface ServicingActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceLabel?: string;
  leadId: number;
  service?: ServiceSchedule | null;
}

const ServicingActionModal: React.FC<ServicingActionModalProps> = ({
  open,
  onOpenChange,
  serviceLabel,
  leadId,
  service,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type as string | undefined,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const [openRescheduleConfirm, setOpenRescheduleConfirm] = useState(false);
  const [openRejectConfirm, setOpenRejectConfirm] = useState(false);
  const [openReopenConfirm, setOpenReopenConfirm] = useState(false);
  const [openCompleteModal, setOpenCompleteModal] = useState(false);
  const [confirmAmcStatus, setConfirmAmcStatus] = useState<boolean | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const rescheduleMutation = useRescheduleService();
  const rejectMutation = useRejectService();
  const reopenMutation = useReopenService();
  const updateAmcOptedMutation = useUpdateAmcOptedStatus();
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const normalizedUserType = (userType || "").toLowerCase();
  const isCustomUser = normalizedUserType === "custom";
  const canCompleteService = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.servicing.service_actions.mark_as_complete",
    )
    : true;
  const canRescheduleService = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.servicing.service_actions.mark_as_reschedule",
    )
    : true;
  const canRejectService = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.servicing.service_actions.mark_as_reject",
    )
    : [
      "head-site-supervisor",
      "admin",
      "super-admin",
    ].includes(normalizedUserType);
  const canReopenRejected = ["admin", "super-admin"].includes(
    normalizedUserType,
  );
  const isRejectedService = service?.status === "rejected";
  const rejectedTooltipMessage =
    "This service is rejected. Change it back to open first.";
  const serviceId = service?.id;
  const accountId = service?.account_id;
  const isRescheduled = service?.rescheduled_once ?? false;
  const isAmcOpted = !!leadData?.is_amc_opted;
  const amcOptedAt = leadData?.amc_opted_at as string | undefined;
  const isThirdFreeService =
    service?.service_type === "free" && service?.service_no === 3;
  const canSetAmcYes = ["site-supervisor", "admin", "super-admin"].includes(
    normalizedUserType,
  );
  const canSetAmcNo = ["admin", "super-admin"].includes(normalizedUserType);
  const canToggleAmc =
    !updateAmcOptedMutation.isPending &&
    ((!isAmcOpted && canSetAmcYes) || (isAmcOpted && canSetAmcNo));
  const amcDisabledReason = !["site-supervisor", "admin", "super-admin"].includes(
    normalizedUserType,
  )
    ? "Only site-supervisor, admin, and super-admin can update AMC status."
    : isAmcOpted && !canSetAmcNo
      ? "Only admin and super-admin can mark AMC back to No."
      : undefined;

  const formatAmcDateTime = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const fullDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${time} - ${dayName}, ${fullDate}`;
  };


  const {
    shouldDisableBlockedActions,
    blockedTooltip,
  } = useLeadAccessControl({
    leadId,
    userType,
  });


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
          {isThirdFreeService ? (
            <div className="flex items-center gap-3 px-4 py-3">
                  <div className="shrink-0">
              <CustomeTooltip
                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                truncateValue={
                  <Checkbox
                    checked={isAmcOpted}
                    disabled={
                      shouldDisableBlockedActions ||
                      !canToggleAmc
                    }
                    onCheckedChange={() => {
                      if (shouldDisableBlockedActions) return;
                      if (!canToggleAmc) return;

                      setConfirmAmcStatus(!isAmcOpted);
                    }}
                  />
                }
              />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="is-amc-opted-servicing"
                  className={`text-sm ${canToggleAmc
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-70"
                    }`}
                >
                  Is AMC Opted in ?
                </label>
                {isAmcOpted && amcOptedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatAmcDateTime(amcOptedAt)}
                  </p>
                )}
                {!canToggleAmc && amcDisabledReason && (
                  <p className="text-xs text-muted-foreground">
                    {amcDisabledReason}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {canCompleteService ? (
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

                    <div className="shrink-0">
                <CustomeTooltip
                  value={shouldDisableBlockedActions ? blockedTooltip : ""}
                  truncateValue={
                    <span className="inline-flex">
                      <Button
                        className="w-28"
                        disabled={shouldDisableBlockedActions}
                        onClick={() => {
                          if (shouldDisableBlockedActions) return;
                          setOpenCompleteModal(true);
                        }}
                      >
                        Complete
                      </Button>
                    </span>
                  }
                />

                </div>
              )}
            </div>
          ) : null}

{canRescheduleService ? (
  <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
    <div className="flex flex-col gap-1">
      <span className="text-base font-semibold">
        Mark as Reschedule
      </span>
      <p className="text-sm text-muted-foreground">
        Move this servicing visit to the next month on the same date.
      </p>
    </div>

    {shouldDisableBlockedActions ? (
      <div className="shrink-0">
        <CustomeTooltip
          value={blockedTooltip}
          truncateValue={
            <Button
              className="w-28"
              variant="outline"
              disabled
            >
              Reschedule
            </Button>
          }
        />
      </div>
    ) : isRejectedService ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button
              className="w-28"
              variant="outline"
              disabled
            >
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
            <Button
              className="w-28"
              variant="outline"
              disabled
            >
              Reschedule
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          This service has been already rescheduled.
        </TooltipContent>
      </Tooltip>
    ) : (
      <div className="shrink-0">
        <Button
          className="w-28"
          variant="outline"
          disabled={rescheduleMutation.isPending}
          onClick={() => setOpenRescheduleConfirm(true)}
        >
          Reschedule
        </Button>
      </div>
    )}
  </div>
) : null}
          {canRejectService && !isRejectedService ? (
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
                <div className="shrink-0">
                <CustomeTooltip
                  value={shouldDisableBlockedActions ? blockedTooltip : ""}
                  truncateValue={
                    <span className="inline-flex">
                      <Button
                        variant="destructive"
                        disabled={
                          shouldDisableBlockedActions ||
                          !rejectRemark.trim() ||
                          rejectMutation.isPending
                        }
                      >
                        Reject
                      </Button>
                    </span>
                  }
                />
                </div>
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
        requireAmcContractDocuments={isThirdFreeService && isAmcOpted}
      />

      <AlertDialog open={confirmAmcStatus !== null} onOpenChange={(open) => {
        if (!open) setConfirmAmcStatus(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAmcStatus ? "Mark AMC as opted?" : "Mark AMC as not opted?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAmcStatus
                ? "This will set AMC opted status to Yes and store the current date and time."
                : "This will set AMC opted status to No and clear the stored AMC date and time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateAmcOptedMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={updateAmcOptedMutation.isPending}
              onClick={() => {
                if (confirmAmcStatus === null || !userId || !vendorId) return;

                updateAmcOptedMutation.mutate(
                  {
                    vendorId,
                    leadId,
                    updated_by: userId,
                    is_amc_opted: confirmAmcStatus,
                  },
                  {
                    onSuccess: () => {
                      toastManager.add({
                        title: confirmAmcStatus
                          ? "AMC opted status marked as Yes."
                          : "AMC opted status marked as No.",
                        type: "success",
                      });
                      setConfirmAmcStatus(null);
                    },
                  },
                );
              }}
            >
              {updateAmcOptedMutation.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServicingActionModal;
