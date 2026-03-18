"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import SelectionsTabForClientDocs from "@/components/sales-executive/designing-stage/pill-tabs-component/SelectionsTabForClientDocs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number;
  };
}

const ClientDocumentationModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const leadId = data?.id;
  const accountId = data?.accountId;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Client Documentation"
      size="xl"
      description="Upload docs per product instance, save selections, and move stage when all requirements are complete."
    >
      <div className="px-5 py-4">
        {leadId && accountId ? (
          <SelectionsTabForClientDocs leadId={leadId} accountId={accountId} />
        ) : (
          <p className="text-sm text-muted-foreground">Lead details missing.</p>
        )}
      </div>
    </BaseModal>
  );
};

export default ClientDocumentationModal;
