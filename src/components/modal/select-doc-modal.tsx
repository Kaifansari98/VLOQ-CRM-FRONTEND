"use client";

import React, { useState } from "react";
import BaseModal from "../utils/baseModal";
import { useAppSelector } from "@/redux/store";
import {
  useQuotationDoc,
  useDesignsDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { urlToFile } from "@/utils/file.utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  onSelectDocs?: (files: File[]) => void; // 👈 callback to booking modal
}

export interface DocItem {
  id: number;
  doc_og_name: string;
  signedUrl: string;
  type: "quotation" | "design";
}

const SelectDocumentModal: React.FC<Props> = ({
  open,
  onOpenChange,
  leadId,
  onSelectDocs,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data: quotationData } = useQuotationDoc(vendorId!, leadId);
  const { data: designData } = useDesignsDoc(vendorId!, leadId);

  const [selectedDocs, setSelectedDocs] = useState<DocItem[]>([]);

  const quotations: DocItem[] =
    quotationData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "quotation" as const,
    })) || [];

  const designs: DocItem[] =
    designData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "design" as const,
    })) || [];

  const toggleSelect = (doc: DocItem) => {
    setSelectedDocs((prev) =>
      prev.find((d) => d.id === doc.id)
        ? prev.filter((d) => d.id !== doc.id)
        : [...prev, doc]
    );
  };

  const isSelected = (id: number) => selectedDocs.some((d) => d.id === id);

  // const handleSelect = () => {
  //   onSelectDocs(selectedDocs);
  //   onOpenChange(false);
  // };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Select Documents"
      description="Choose documents for the lead"
      size="lg"
    >
      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* Quotations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Select Quotations</h3>
            <span className="text-xs text-muted-foreground">
              {selectedDocs.filter((d) => d.type === "quotation").length}{" "}
              selected
            </span>
          </div>
          <div className="space-y-2">
            {quotations.length > 0 ? (
              quotations.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between border rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected(doc.id)}
                      onCheckedChange={() => toggleSelect(doc)}
                    />
                    <span className="text-sm">{doc.doc_og_name}</span>
                  </div>
                  <a
                    href={doc.signedUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4 text-gray-600 hover:text-black" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No quotation documents available
              </p>
            )}
          </div>
        </div>

        {/* Separator */}
        <hr />

        {/* Designs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Select Designs</h3>
            <span className="text-xs text-muted-foreground">
              {selectedDocs.filter((d) => d.type === "design").length} selected
            </span>
          </div>
          <div className="space-y-2">
            {designs.length > 0 ? (
              designs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between border rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected(doc.id)}
                      onCheckedChange={() => toggleSelect(doc)}
                    />
                    <span className="text-sm">{doc.doc_og_name}</span>
                  </div>
                  <a
                    href={doc.signedUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4 text-gray-600 hover:text-black" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No design documents available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t px-6 py-3">
        <Button variant="outline" onClick={() => setSelectedDocs([])}>
          Clear
        </Button>
        <Button
          className="w-full mt-4"
          onClick={async () => {
            const convertedFiles: File[] = [];

            for (const doc of selectedDocs) {
              // guess MIME from extension
              let mime = "application/octet-stream";
              if (doc.doc_og_name.endsWith(".pdf")) mime = "application/pdf";
              if (doc.doc_og_name.endsWith(".jpg") || doc.doc_og_name.endsWith(".jpeg")) mime = "image/jpeg";
              if (doc.doc_og_name.endsWith(".png")) mime = "image/png";

              const file = await urlToFile(doc.signedUrl, doc.doc_og_name, mime);
              convertedFiles.push(file);
            }

            onSelectDocs?.(convertedFiles); // 👈 send to parent
            onOpenChange(false);
          }}
        >
          Select
        </Button>
      </div>
    </BaseModal>
  );
};

export default SelectDocumentModal;
