"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import DocumentPreview from "@/components/utils/file-preview";
import ImageCard from "@/components/utils/image-card";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import UploadMoreClientDocumentationModal from "./uploadmore-client-documentaition-modal";
import { Plus } from "lucide-react";
import { canUploadMoreClientDocumentationFiles } from "@/components/utils/privileges";

type Props = {
  leadId: number;
  accountId: number;
  name?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const getFileExtension = (filename: string): string =>
  filename?.split(".").pop()?.toLowerCase() ?? "";
const isImageExt = (ext: string): boolean => IMAGE_EXTENSIONS.includes(ext);

export default function ClientDocumentationDetails({
  leadId,
  accountId,
  name,
}: Props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: leadDetails, isLoading } = useClientDocumentationDetails(
    vendorId!,
    leadId
  );

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  const [openCarouselModal, setOpenCarouselModal] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [addMoreDoc, setAddMoreDoc] = useState(false);

  if (isLoading) {
    return <p className="p-6">Loading client documentation...</p>;
  }

  const pptDocs = leadDetails?.documents?.ppt || [];
  const pythaDocs = leadDetails?.documents?.pytha || [];

  // Extract images and non-image docs from PPT docs
  const images = pptDocs.filter((doc) =>
    isImageExt(getFileExtension(doc.doc_sys_name))
  );
  const otherDocs = pptDocs.filter(
    (doc) => !isImageExt(getFileExtension(doc.doc_sys_name))
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="border rounded-lg w-full h-full p-6 space-y-8"
    >
      {/* -------- Header -------- */}
      <motion.div variants={itemVariants} className="flex justify-between">
        {canUploadMoreClientDocumentationFiles(userType) && (
          <Button
            onClick={() => setAddMoreDoc(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Add More Files
          </Button>
        )}
      </motion.div>

      {/* -------- Images -------- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold">Client Images (PPT)</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {images.length > 0 ? (
            images.map((img, idx) => (
              <ImageCard
                key={img.id}
                image={img}
                size="medium"
                onClick={() => {
                  setStartIndex(idx);
                  setOpenCarouselModal(true);
                }}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No client images uploaded yet.
            </p>
          )}
        </div>
      </motion.div>

      {/* -------- Documents (PPT, PDF, DOCX, etc.) -------- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold">
          Client Documents (PPT, PDF, DOCX)
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {otherDocs.length > 0 ? (
            otherDocs.map((doc) => (
              <DocumentPreview
                key={doc.id}
                file={doc}
                size="medium"
                onClick={() => window.open(doc.signed_url, "_blank")}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No client documents uploaded yet.
            </p>
          )}
        </div>
      </motion.div>

      {/* -------- PYTHA Files -------- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold">Design Files</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {pythaDocs.length > 0 ? (
            pythaDocs.map((doc) => (
              <DocumentPreview
                key={doc.id}
                file={doc}
                size="medium"
                onClick={() => window.open(doc.signed_url, "_blank")}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No Design files uploaded yet.
            </p>
          )}
        </div>
      </motion.div>

      {/* 🔹 Add More Documentation */}
      <UploadMoreClientDocumentationModal
        open={addMoreDoc}
        onOpenChange={setAddMoreDoc}
        data={{ leadId, accountId }}
      />

      {/* 🔹 Image Carousel */}
      <ImageCarouselModal
        images={images}
        onClose={() => setOpenCarouselModal(false)}
        initialIndex={startIndex}
        open={openCarouselModal}
      />
    </motion.div>
  );
}
