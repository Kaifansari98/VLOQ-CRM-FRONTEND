"use client";

import React, { useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { Plus } from "lucide-react";
import UploadMoreClientDocumentationModal from "./uploadmore-client-documentaition-modal";
import DocumentPreview from "@/components/utils/file-preview";
import ImageCard from "@/components/utils/image-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";

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
  const [openCarouselModal, setOpenCarouselModal] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const leadProps = {
    leadId: leadId ?? 0,
    accountId: accountId ?? 0,
  };
  const [addMoreDoc, setAddMoreDoc] = useState<boolean>(false);
  const { data: leadDetails, isLoading } = useClientDocumentationDetails(
    vendorId!,
    leadId!
  );

  const allDocuments = leadDetails?.documents || [];

  // 🔹 Images filter
  const images = allDocuments.filter((doc) =>
    isImageExt(getFileExtension(doc.doc_sys_name))
  );

  // 🔹 Non-images (Docs) filter
  const docs = allDocuments.filter(
    (doc) => !isImageExt(getFileExtension(doc.doc_sys_name))
  );

  console.log("Lead details: ", leadDetails);

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
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">
                Client Documentation Files
              </h2>
              <Button
                onClick={() => setAddMoreDoc(true)}
                className="flex items-center text-xs sm:text-sm gap-2 h-8 sm:h-9"
              >
                <Plus className="h-4 w-4" />
                Add More Files
              </Button>
            </div>

            {/*Images */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {images.map((img, idx) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    size="medium"
                    onClick={() => {
                      setStartIndex(idx);
                      setOpenCarouselModal(true);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {docs
                  .filter(
                    (m) => !isImageExt(getFileExtension(m.doc_sys_name || ""))
                  )
                  .map((doc) => (
                    <DocumentPreview
                      key={doc.id}
                      file={doc}
                      size="medium"
                      onClick={() => console.log("Clicked Document:", doc)}
                    />
                  ))}
              </div>
            </div>
          </Card>
        </div>
      </BaseModal>

      <UploadMoreClientDocumentationModal
        open={addMoreDoc}
        onOpenChange={setAddMoreDoc}
        data={leadProps}
      />

      <ImageCarouselModal
        images={images}
        onClose={() => setOpenCarouselModal(false)}
        initialIndex={startIndex}
        open={openCarouselModal}
      />
    </>
  );
};

export default ViewClientDocumentationModal;
