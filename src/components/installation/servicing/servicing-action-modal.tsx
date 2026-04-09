"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";

interface ServicingActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceLabel?: string;
}

const ServicingActionModal: React.FC<ServicingActionModalProps> = ({
  open,
  onOpenChange,
  serviceLabel,
}) => {
  return (
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
          <Button className="w-28" variant="outline">
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
  );
};

export default ServicingActionModal;
