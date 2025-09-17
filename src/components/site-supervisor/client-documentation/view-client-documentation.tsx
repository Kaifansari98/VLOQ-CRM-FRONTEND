"use client";

import React, { useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { Plus } from "lucide-react";
import UploadMoreClientDocumentationModal from "./uploadmore-client-documentaition-modal";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

const getFileExtension = (filename: string): string =>
  filename?.split(".").pop()?.toLowerCase() ?? "";

const isImageExt = (ext: string): boolean => IMAGE_EXTENSIONS.includes(ext);

const handleDownload = (url: string, name: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number;
  };
}

const ViewClientDocumentationModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const leadId = data?.id;
  const accountId = data?.accountId;

  const leadProps = {
    leadId: leadId ?? 0,
    accountId: accountId ?? 0,
  };
  const [addMoreDoc, setAddMoreDoc] = useState<boolean>(false);
  const { data: leadDetails, isLoading } = useClientDocumentationDetails(
    vendorId!,
    leadId!
  );

  const documents = leadDetails?.documents || [];

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title={`View Client Documentation for ${data?.name || "Customer"}`}
        size="lg"
        description="View, upload, and manage client-related documentation in one place."
      >
        <div className="px-5 py-4">
          {/* Loading State */}
          {isLoading && (
            <p className="text-sm text-gray-500">Loading documents...</p>
          )}

          {/* Empty State */}
          {!isLoading && documents.length === 0 && (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          )}

          {/* Documents Grid */}
          {documents.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {documents.map((doc) => {
                const ext = getFileExtension(doc.doc_sys_name);
                const isImage = isImageExt(ext);

                return (
                  <div
                    key={doc.id}
                    className="relative h-32 w-32 rounded-lg border overflow-hidden bg-gray-50 group cursor-pointer"
                    onClick={() =>
                      !isImage && handleDownload(doc.signedUrl, doc.doc_og_name)
                    }
                    title={doc.doc_og_name}
                  >
                    {isImage ? (
                      <img
                        src={doc.signedUrl}
                        alt={doc.doc_og_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-600 text-sm font-medium">
                        .{ext.toUpperCase()}
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center px-2 text-center">
                      <span className="text-white text-xs break-words">
                        {doc.doc_og_name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Add Document Button */}
              <div
                className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group"
                // onClick={() => setOpenImageModal(true)}
              >
                <div
                  className="flex flex-col items-center text-gray-500 group-hover:text-blue-600"
                  onClick={() => setAddMoreDoc(true)}
                >
                  <Plus size={24} className="mb-1" />
                  <span className="text-xs font-medium">Add Documents</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </BaseModal>

      <UploadMoreClientDocumentationModal
        open={addMoreDoc}
        onOpenChange={setAddMoreDoc}
        data={leadProps}
      />
    </>
  );
};

export default ViewClientDocumentationModal;
