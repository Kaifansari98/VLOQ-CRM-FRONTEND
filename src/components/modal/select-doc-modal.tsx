"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "../utils/baseModal";
import { useAppSelector } from "@/redux/store";
import {
  useQuotationDoc,
  useDesignsDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
}

interface DocItem {
  id: number;
  doc_og_name: string;
  signedUrl: string;
  type: "quotation" | "design";
}

const SelectDocumentModal: React.FC<Props> = ({
  open,
  onOpenChange,
  leadId,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data: quotationData } = useQuotationDoc(vendorId, leadId);
  const { data: designData } = useDesignsDoc(vendorId!, leadId);

  const [selectedDocs, setSelectedDocs] = useState<DocItem[]>([]);

  const documents: DocItem[] = [
    ...(quotationData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "quotation" as const,
    })) || []),
    ...(designData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "design" as const,
    })) || []),
  ];

  const toggleSelect = (doc: DocItem) => {
    setSelectedDocs((prev) =>
      prev.find((d) => d.id === doc.id)
        ? prev.filter((d) => d.id !== doc.id)
        : [...prev, doc]
    );
  };


  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Select Documents"
      description="Choose documents for the lead"
      size="md"
    >
      <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto"></div>
    </BaseModal>
  );
};

export default SelectDocumentModal;
