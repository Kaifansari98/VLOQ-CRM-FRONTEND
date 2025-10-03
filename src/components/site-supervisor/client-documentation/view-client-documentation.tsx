"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Download } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import DocumentPreview from "@/components/utils/file-preview";
import ImageCard from "@/components/utils/image-card";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import UploadMoreClientDocumentationModal from "./uploadmore-client-documentaition-modal";

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

  const [openCarouselModal, setOpenCarouselModal] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [addMoreDoc, setAddMoreDoc] = useState(false);

  if (isLoading) {
    return <p className="p-6">Loading client documentation...</p>;
  }

  const allDocuments = leadDetails?.documents || [];
  const images = allDocuments.filter((doc) =>
    isImageExt(getFileExtension(doc.doc_sys_name))
  );
  const docs = allDocuments.filter(
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
        <h2 className="text-xl font-semibold">
          Client Documentation for {name || "Customer"}
        </h2>
        <Button
          onClick={() => setAddMoreDoc(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add More Files
        </Button>
      </motion.div>

      {/* -------- Images -------- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold">Images</h3>
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

      {/* -------- Documents -------- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold">Documents</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {docs.length > 0 ? (
            docs.map((doc) => (
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
