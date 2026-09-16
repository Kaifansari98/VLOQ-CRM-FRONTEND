"use client";

import * as React from "react";
import LeadsGenerationForm from "./leads-generation-form";
import BaseModal from "@/components/utils/baseModal";

export function GenerateLeadFormModal({
  open,
  onOpenChange,
  mode = "standard",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "standard" | "lead-pool";
}) {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "lead-pool" ? "Add Walk-In Customer" : "Create New Lead"}
      description={
        mode === "lead-pool"
          ? "Log a manual entry for a customer who physically visited the store."
          : "Fill in the details to create a new lead for your sales pipeline."
      }
      size="lg"
    >
      <LeadsGenerationForm onClose={() => onOpenChange(false)} mode={mode} />
    </BaseModal>
  );
}
