"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Edit2, FileText, Plus, Download, Eye } from "lucide-react";
import { useSiteMeasurementLeadById } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { SiteMeasurementFile } from "@/types/site-measrument-types";
import SiteMesurementEditModal from "../siteMeasurement/site-mesurement-edit-modal";
import AddCurrentSitePhotos from "../siteMeasurement/current-site-image-add-modal";
import AddPaymentDetailsPhotos from "../siteMeasurement/payment-details-image-add-modal";

interface LeadInfo {
  leadId: number;
  accountId: number;
}
type Props = {
  leadInfo: LeadInfo;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function SiteMeasurementDetailsLeads({ leadInfo }: Props) {
  const { leadId, accountId } = leadInfo;
  const { data } = useSiteMeasurementLeadById(leadId);

  // Modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openImageModal2, setOpenImageModal2] = useState(false);
  const [openCarouselModal, setOpenCarouselModal] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [openPaymentCarouselModal, setOpenPaymentCarouselModal] =
    useState(false);
  const [paymentModalStartIndex, setPaymentModalStartIndex] = useState(0);


  console.log(leadId, accountId)
  if (!data) {
    return (
      <div className="border rounded-lg p-6">
        <p>No site measurement details found.</p>
      </div>
    );
  }

  // Extract data
  const pdfDocs: SiteMeasurementFile[] =
    data.initial_site_measurement_documents;
  const currentSitePhotos: SiteMeasurementFile[] = data.current_site_photos;
  const paymentImages: SiteMeasurementFile[] =
    data.initial_site_measurement_payment_details;
  const payment = data.payment_info;

  const formatFileName = (filename: string) => {
    const maxLength = 25;
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
      {/* -------- Documents & Payment -------- */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0"
      >
        {/* Documents */}
        {pdfDocs.length > 0 && (
          <div className="md:w-[40%] space-y-4 flex flex-col">
            <h3 className="text-md font-semibold">Measurement Documents</h3>
            <div className="grid grid-cols-1 gap-4 flex-1">
              {pdfDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="hover:shadow-xl transition-shadow duration-300 rounded-lg border border-gray-100 flex flex-col justify-between p-4 text-center"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center">
                      <FileText size={50} className="text-red-500" />
                    </div>
                    <p className="font-medium text-sm truncate max-w-[120px]">
                      {formatFileName(doc.originalName)}
                    </p>
                    <div className="flex gap-2 justify-center">
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
                          link.download = doc.originalName;
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Info */}
        {payment && (
          <div className="md:w-[60%] flex flex-col">
            <div className="flex justify-between items-start">
              <h3 className="text-md font-semibold">Payment Information</h3>
              <Button
                size="sm"
                onClick={() => setOpenEditModal(true)}
                className="gap-2"
              >
                <Edit2 size={16} />{" "}
                <span className="text-sm">Edit Details</span>
              </Button>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm font-medium">Payment Amount</p>
                <div className="bg-muted border rounded-sm py-1 px-2 text-sm">
                  {payment.amount ?? "N/A"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Payment Date</p>
                <div className="bg-muted border rounded-sm py-1 px-2 text-sm">
                  {payment.payment_date ?? "N/A"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Payment Description</p>
                <div
                  className="bg-muted border rounded-sm py-1 px-2 text-sm overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {payment.payment_text || "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* -------- Current Site Photos -------- */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-lg font-semibold">Current Site Photos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {currentSitePhotos.map((doc, idx) => (
            <div key={doc.id} className="relative group">
              <img
                src={doc.signedUrl}
                alt={doc.originalName}
                className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 
                       hover:border-blue-400 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => {
                  setModalStartIndex(idx);
                  setOpenCarouselModal(true);
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                <span className="text-white text-xs px-2 text-center">
                  {doc.originalName}
                </span>
              </div>
            </div>
          ))}

          {/* Add Button */}
          <div
            onClick={() => setOpenImageModal(true)}
            className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group"
          >
            <div className="flex flex-col items-center text-gray-500 group-hover:text-blue-600">
              <Plus size={24} className="mb-1" />
              <span className="text-xs font-medium">Add Photos</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* -------- Payment Proofs -------- */}
      {paymentImages.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Proofs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {paymentImages.map((doc, idx) => (
              <div key={doc.id} className="relative group">
                <img
                  src={doc.signedUrl}
                  alt={doc.originalName}
                  className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => {
                    setPaymentModalStartIndex(idx);
                    setOpenPaymentCarouselModal(true);
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                  <span className="text-white text-xs px-2 text-center">
                    {doc.originalName}
                  </span>
                </div>
              </div>
            ))}

            {/* Add Proof Button */}
            <div
              onClick={() => setOpenImageModal2(true)}
              className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-400 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center text-gray-500 group-hover:text-green-600">
                <Plus size={24} className="mb-1" />
                <span className="text-xs font-medium">Add Proofs</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* -------- Modals -------- */}
      <SiteMesurementEditModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        data={{
          accountId: accountId,
          id: leadId,
          paymentInfo: payment,
        }}
      />
      <AddCurrentSitePhotos
        open={openImageModal}
        onOpenChange={setOpenImageModal}
        data={{
          accountId,
          id: leadId,
          paymentId: payment?.id ?? null,
        }}
      />
      <AddPaymentDetailsPhotos
        open={openImageModal2}
        onOpenChange={setOpenImageModal2}
        data={{
          accountId,
          id: leadId,
          paymentId: payment?.id ?? null,
        }}
      />
      {/* <ImageCarouselModal
        open={openCarouselModal}
        initialIndex={modalStartIndex}
        images={currentSitePhotos}
        onClose={() => setOpenCarouselModal(false)}
      />
      <ImageCarouselModal
        open={openPaymentCarouselModal}
        initialIndex={paymentModalStartIndex}
        images={paymentImages}
        onClose={() => setOpenPaymentCarouselModal(false)}
      /> */}
    </motion.div>
  );
}
