"use client";

import BaseModal from "@/components/utils/baseModal";
import React from "react";

import { useAppSelector } from "@/redux/store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number;
  };
}

const FinalMeasurementEditModal = ({ open, onOpenChange, data }: Props) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit Final Measurement for ${data?.name || "Customer"}`}
      size="lg"
      description="Update the final measurement details, modify notes, or adjust attachments as needed."
    >
      <div className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Critical Discussion Notes</p>
          <div className="bg-muted border rounded-sm py-1 h-20 px-2 text-sm max-h-200 overflow-y-auto">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem
            excepturi natus unde modi porro blanditiis reprehenderit sit et
            dolorum beatae.
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default FinalMeasurementEditModal;
