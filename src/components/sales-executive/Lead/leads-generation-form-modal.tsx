"use client";

import * as React from "react";
import LeadsGenerationForm from "./leads-generation-form";
import BaseModal from "@/components/utils/baseModal";

export function GenerateLeadFormModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Lead"
      description="Fill in the details to create a new lead for your sales pipeline."
      size="lg"
    >
      <LeadsGenerationForm onClose={() => onOpenChange(false)} />
    </BaseModal>
  );
}
