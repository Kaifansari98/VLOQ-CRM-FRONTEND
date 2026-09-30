"use client";
import React from "react";
import BaseModal from "@/components/utils/baseModal";
import EditLeadForm from "./lead-edit-form";

interface EditLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadData?: {
    id: number;
  };
}

export function EditLeadModal({
  open,
  onOpenChange,
  leadData,
}: EditLeadModalProps) {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Lead"
      description="Update the details of this lead."
      size="lg"
    >
      {leadData ? (
        <EditLeadForm leadData={leadData} onClose={() => onOpenChange(false)} />
      ) : null}
    </BaseModal>
  );
}
