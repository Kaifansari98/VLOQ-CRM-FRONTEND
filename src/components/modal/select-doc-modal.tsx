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
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

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
  created_at?: string;
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
  const [loading, setLoading] = useState(false);

  const quotations: DocItem[] =
    quotationData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "quotation" as const,
      created_at: doc.created_at,
    })) || [];

  const designs: DocItem[] =
    designData?.data?.documents.map((doc: any) => ({
      id: doc.id,
      doc_og_name: doc.doc_og_name,
      signedUrl: doc.signedUrl,
      type: "design" as const,
      created_at: doc.created_at,
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
      size="md"
    >
      <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
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
                    <div className="flex flex-col">
                      <span className="text-sm">{doc.doc_og_name}</span>
                      {doc.created_at && (
                        <span className="text-xs text-gray-500">
                          Uploaded at{" "}
                          {format(
                            new Date(doc.created_at),
                            "HH:mm, dd MMM yyyy"
                          )}
                        </span>
                      )}
                    </div>
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
                    <div className="flex flex-col">
                      <span className="text-sm">{doc.doc_og_name}</span>
                      {doc.created_at && (
                        <span className="text-xs text-gray-500">
                          Uploaded at{" "}
                          {format(
                            new Date(doc.created_at),
                            "HH:mm, dd MMM yyyy"
                          )}
                        </span>
                      )}
                    </div>
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
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background px-6 py-4">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedDocs([]);
          }}
          disabled={loading} // 👈 disable while loading
        >
          Clear
        </Button>

        <Button
          disabled={loading || selectedDocs.length === 0}
          onClick={async () => {
            setLoading(true); // 👈 start loader
            try {
              const convertedFiles: File[] = [];

              for (const doc of selectedDocs) {
                let mime = "application/octet-stream";
                if (doc.doc_og_name.endsWith(".pdf")) mime = "application/pdf";
                if (doc.doc_og_name.match(/\.(jpg|jpeg)$/)) mime = "image/jpeg";
                if (doc.doc_og_name.endsWith(".png")) mime = "image/png";

                const file = await urlToFile(
                  doc.signedUrl,
                  doc.doc_og_name,
                  mime
                );
                convertedFiles.push(file);
              }

              onSelectDocs?.(convertedFiles);
              onOpenChange(false);
            } catch (err) {
              console.error("Error converting docs:", err);
            } finally {
              setLoading(false); // 👈 stop loader
            }
          }}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Select"
          )}
        </Button>
      </div>
    </BaseModal>
  );
};

export default SelectDocumentModal;
