import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcessedSiteMeasurementLead } from "@/types/site-measrument-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, FileText, Plus, Download, Eye } from "lucide-react";
import SiteMesurementEditModal from "./site-mesurement-edit-modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AddCurrentSitePhotos from "./current-site-image-add-modal";
import AddPaymentDetailsPhotos from "./payment-details-image-add-modal";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import BaseModal from "@/components/utils/baseModal";

interface ViewInitialSiteMeasurmentLeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: ProcessedSiteMeasurementLead;
}

const SiteMesurementModal: React.FC<ViewInitialSiteMeasurmentLeadProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [openImageModal, setOpenImageModal] = useState<boolean>(false);
  const [openImageModal2, setOpenImageModal2] = useState<boolean>(false);
  const [openCarouselModal, setOpenCarouselModal] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [openPaymentCarouselModal, setOpenPaymentCarouselModal] =
    useState(false);
  const [paymentModalStartIndex, setPaymentModalStartIndex] = useState(0);

  const documents = data?.documentUrl || [];
  const payment = data?.paymentInfo;

  const pdfDocs = documents.filter((doc) =>
    doc.doc_sys_name.startsWith("initial_site_measurement_documents")
  );

  const currentSitePhotos = documents.filter((doc) =>
    doc.doc_sys_name.startsWith("current_site_photos")
  );

  const paymentImages = documents.filter((doc) =>
    doc.doc_sys_name.startsWith("initial-site-measurement-payment-images")
  );

  const formatFileSize = (url: string) => {
    return "PDF Document";
  };

  const formatFileName = (filename: string) => {
    const maxLength = 25;
    if (filename.length <= maxLength) return filename;
    const extension = filename.split(".").pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension!.length - 4
    );
    return `${truncatedName}...${extension}`;
  };

  console.log("Payment Details: ", payment);

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Site Measurement Details"
        description="Review initial site measurement documentation and payment information"
        size="lg"
      >
        <div className="px-6 py-6 space-y-8">
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
            {pdfDocs.length > 0 && (
              <div className="md:w-[40%] order-1 space-y-4 flex flex-col">
                <h3 className="text-md font-semibold">Measurement Documents</h3>

                <div className="grid grid-cols-1 gap-4 flex-1">
                  {pdfDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="hover:shadow-xl transition-shadow duration-300 cursor-pointer group rounded-lg border border-gray-100 h-full flex flex-col justify-between"
                    >
                      <div className="flex flex-col items-center h-full justify-center text-center space-y-5 p-4">
                        <div className="w-20 h-20 md:w-22 md:h-22 bg-gray-50 rounded-lg flex items-center justify-center transition-colors">
                          <FileText size={50} className="text-red-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm leading-tight truncate max-w-[120px]">
                            {formatFileName(doc.doc_og_name)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.signed_url)}
                          </p>
                        </div>
                        <div className="flex gap-2 justify-center pb-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.signed_url, "_blank");
                            }}
                            className="text-xs gap-1 h-7"
                          >
                            <Eye size={12} />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement("a");
                              link.href = doc.signed_url;
                              link.download = doc.doc_og_name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="text-xs gap-1 h-7"
                          >
                            <Download size={12} />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- Payment Section ---------------- */}
            {payment && (
              <div className="md:w-[60%] order-2 flex flex-col h-full">
                <div className="flex flex-row justify-between items-start">
                  <h3 className="text-md font-semibold">Payment Information</h3>
                  <Button
                    size="sm"
                    onClick={() => setOpenEditModal(true)}
                    className="gap-2"
                  >
                    <Edit2 size={16} />
                    <span className="text-sm">Edit Details</span>
                  </Button>
                </div>

                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="flex flex-col gap-1 mt-4">
                    <p className="text-sm font-medium">Payment Amount</p>
                    <div className="bg-muted border rounded-sm py-1 px-2 text-sm max-h-200 overflow-y-auto">
                      {payment.amount || "N/A"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-4">
                    <p className="text-sm font-medium">Payment Date</p>
                    <div className="bg-muted border rounded-sm py-1 px-2 text-sm max-h-200 overflow-y-auto">
                      {payment.payment_date || "N/A"}
                    </div>
                  </div>
                  {/* Bottom Section: Description */}
                  <div className="flex flex-col gap-1 mt-4">
                    <p className="text-sm font-medium">Payment Description</p>
                    <div
                      className="bg-muted border rounded-sm py-1 px-2 text-sm 
               overflow-hidden line-clamp-4"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {payment.payment_text || "N/A"}You can write lorem20*5 and
                      press the tab. 20 = number of words 5 = number of lines.
                      This will generate 20 random words in 5 lines in VSCode
                      ...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Site Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  gap-3 sm:gap-4">
                {currentSitePhotos.map((doc, idx) => (
                  <div key={doc.id} className="relative group">
                    <img
                      src={doc.signed_url}
                      alt={doc.doc_og_name ?? "site photo"}
                      className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 
                   hover:border-blue-400 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                    />

                    {/* Overlay with filename */}
                    <div
                      onClick={() => {
                        setModalStartIndex(idx);
                        setOpenCarouselModal(true);
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                   flex items-center justify-center rounded-lg transition-opacity"
                    >
                      <span className="text-white text-xs font-medium px-2 text-center">
                        {doc.doc_og_name ?? "site photo"}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add Button */}
                <div
                  className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 
               rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 
               transition-all duration-200 group"
                  onClick={() => setOpenImageModal(true)}
                >
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-blue-600">
                    <Plus size={24} className="mb-1" />
                    <span className="text-xs font-medium">Add Photos</span>
                  </div>
                </div>
              </div>
            </div>

            {paymentImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Proofs</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  gap-3 sm:gap-4">
                  {paymentImages.map((doc, idx) => (
                    <div key={doc.id} className="relative group">
                      <img
                        src={doc.signed_url}
                        alt={doc.doc_og_name ?? "Payment Proof"}
                        className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                      />

                      {/* Overlay with filename */}
                      <div
                        onClick={() => {
                          setPaymentModalStartIndex(idx);
                          setOpenPaymentCarouselModal(true);
                        }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"
                      >
                        <span className="text-white text-xs font-medium px-2 text-center">
                          {doc.doc_og_name ?? "Payment Proof"}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Add More Payment Proofs Button */}
                  <div
                    className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-400 transition-all duration-200 group"
                    onClick={() => setOpenImageModal2(true)}
                  >
                    <div className="flex flex-col items-center text-gray-500 group-hover:text-green-600">
                      <Plus size={24} className="mb-1" />
                      <span className="text-xs font-medium">Add Proofs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <SiteMesurementEditModal
          open={openEditModal}
          onOpenChange={setOpenEditModal}
          data={
            data
              ? {
                  accountId: data.accountId,
                  id: data.id,
                  paymentInfo: data.paymentInfo,
                }
              : undefined
          }
        />
        <AddCurrentSitePhotos
          open={openImageModal}
          onOpenChange={setOpenImageModal}
          data={
            data
              ? {
                  accountId: data.accountId,
                  id: data.id,
                  paymentId: data.paymentInfo?.id ?? null,
                }
              : undefined
          }
        />

        <AddPaymentDetailsPhotos
          open={openImageModal2}
          onOpenChange={setOpenImageModal2}
          data={
            data
              ? {
                  accountId: data.accountId,
                  id: data.id,
                  paymentId: data.paymentInfo?.id ?? null,
                }
              : undefined
          }
        />
      </BaseModal>
      <ImageCarouselModal
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
      />
    </>
  );
};

export default SiteMesurementModal;
