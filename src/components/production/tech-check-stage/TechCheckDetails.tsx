"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { useSiteMeasurementLeadById } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import DocumentPreview from "@/components/utils/file-preview";
import ImageCard from "@/components/utils/image-card";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";

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
const getExt = (f: string) => f?.split(".").pop()?.toLowerCase() ?? "";
const isImg = (ext: string) => IMAGE_EXTENSIONS.includes(ext);

export default function TechCheckDetails({ leadId, accountId, name }: Props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)!;

  // ✅ Hooks
  const { data: clientDocs } = useClientDocumentationDetails(vendorId, leadId);
  const { data: siteMeasurement } = useSiteMeasurementLeadById(leadId);
  const { data: finalMeasurement } = useFinalMeasurementLeadById(
    vendorId,
    leadId
  );

  // ✅ State for image preview
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const pptDocs = clientDocs?.documents?.ppt ?? [];
  const pythaDocs = clientDocs?.documents?.pytha ?? [];
  const images = pptDocs.filter((d) => isImg(getExt(d.doc_sys_name)));
  const otherDocs = pptDocs.filter((d) => !isImg(getExt(d.doc_sys_name)));

  const currentSitePhotos = siteMeasurement?.current_site_photos ?? [];
  const finalDocs = finalMeasurement?.measurementDocs ?? [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="border rounded-lg w-full h-full p-6 space-y-10"
    >
      {/* ========== CLIENT DOCUMENTATION ========== */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-semibold">
          Client Documentation for {name || "Customer"}
        </h2>

        {/* PPT Images */}
        <div className="space-y-3">
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
                    setOpenCarousel(true);
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No images found.</p>
            )}
          </div>
        </div>

        {/* Other PPT Docs */}
        <div className="space-y-3">
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
              <p className="text-sm text-gray-500 italic">No documents found.</p>
            )}
          </div>
        </div>

        {/* Pytha Files */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Client Pytha Files (.pyo)</h3>
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
              <p className="text-sm text-gray-500 italic">No Pytha files found.</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ========== SITE PHOTOS AT THE TIME OF INITIAL SITE MEASUREMENT ========== */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold capitalize">Site Photos At The Time Of Initial Site Measurements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {currentSitePhotos.length > 0 ? (
            currentSitePhotos.map((photo, idx) => (
              <ImageCard
                key={photo.id}
                image={{
                  id: photo.id,
                  signed_url: photo.signedUrl,
                  doc_og_name: photo.originalName,
                }}
                size="medium"
                onClick={() => {
                  setStartIndex(idx);
                  setOpenCarousel(true);
                }}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No current site photos found.
            </p>
          )}
        </div>
      </motion.div>

      {/* ========== FINAL MEASUREMENT DOCS ========== */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold">Final Measurement Documents</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {finalDocs?.length > 0 ? (
            finalDocs.map((doc: any) => (
              <DocumentPreview
                key={doc.id}
                file={doc}
                size="medium"
                onClick={() => window.open(doc.signed_url, "_blank")}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No final measurement documents uploaded yet.
            </p>
          )}
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <ImageCarouselModal
        images={images}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      />
    </motion.div>
  );
}
