"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download, Plus, Edit2 } from "lucide-react";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import { useAppSelector } from "@/redux/store";

type Props = {
  leadId: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function FinalMeasurementLeadDetails({ leadId }: Props) {
  const vendorId = useAppSelector((state) => state.auth?.user?.vendor_id) || 0;
  const { data } = useFinalMeasurementLeadById(vendorId, leadId);

  const [openEditNoteModal, setOpenEditNoteModal] = useState(false);
  const [openAddPhotosModal, setOpenAddPhotosModal] = useState(false);

  if (!data) {
    return (
      <div className="border rounded-lg p-6">
        <p>No final measurement details found.</p>
      </div>
    );
  }

  const { measurementDocs, sitePhotos, final_desc_note } = data;

  const formatFileName = (filename: string) => {
    const maxLength = 25;
    if (!filename) return "Untitled";
    if (filename.length <= maxLength) return filename;
    const ext = filename.split(".").pop();
    const name = filename.substring(0, filename.lastIndexOf("."));
    return `${name.substring(0, maxLength - (ext?.length ?? 0) - 4)}...${ext}`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="border rounded-lg w-full h-full p-6 space-y-8"
    >
      {/* -------- Current Site Photos -------- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-lg font-semibold">Current Site Photos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sitePhotos && sitePhotos.length > 0 ? (
            sitePhotos.map((photo: any) => (
              <div
                key={photo.id}
                className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={photo.signedUrl}
                  alt={photo.doc_og_name}
                  className="h-32 w-full object-cover cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs px-2 text-center transition-opacity">
                  {photo.doc_og_name}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No site photos uploaded yet.
            </p>
          )}

          {/* Add Button as last grid item */}
          {/* <div
            onClick={() => setOpenAddPhotosModal(true)}
            className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-gray-300 dark:bg-[#262626] rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group bg-[#f5f5f5]"
          >
            <Plus
              size={24}
              className="mb-1 text-gray-500 group-hover:text-blue-600"
            />
            <span className="text-xs font-medium text-gray-500 group-hover:text-blue-600">
              Add Photo
            </span>
          </div> */}
        </div>
      </motion.div>

      {/* -------- Measurement Documents (can be multiple) -------- */}
      {measurementDocs && measurementDocs.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-lg font-semibold">Measurement Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {measurementDocs.map((doc: any) => (
              <div
                key={doc.id}
                className="flex flex-col items-center justify-center border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <FileText size={40} className="text-red-500 mb-3" />
                <p className="text-sm font-medium text-center truncate max-w-[160px]">
                  {formatFileName(doc.doc_og_name)}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(doc.signedUrl, "_blank")}
                    className="text-xs gap-1 h-7"
                  >
                    <Eye size={12} /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = doc.signedUrl;
                      link.download = doc.doc_og_name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-xs gap-1 h-7"
                  >
                    <Download size={12} /> Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* -------- Description Note -------- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Critical Discussion Notes</h3>
          {/* <Button
            size="sm"
            className="gap-1"
            onClick={() => setOpenEditNoteModal(true)}
          >
            <Edit2 size={14} /> Edit
          </Button> */}
        </div>
        <div className="bg-muted border rounded-md p-3 text-sm min-h-[60px]">
          {final_desc_note || "No description provided."}
        </div>
      </motion.div>

      {/* 🔹 Modals (to be implemented like SiteMeasurement modals) */}
      {/* <FinalMeasurementEditNoteModal
        open={openEditNoteModal}
        onOpenChange={setOpenEditNoteModal}
        data={{ note: final_desc_note, leadId }}
      />
      <AddFinalMeasurementPhotos
        open={openAddPhotosModal}
        onOpenChange={setOpenAddPhotosModal}
        data={{ leadId, vendorId }}
      /> */}
    </motion.div>
  );
}
