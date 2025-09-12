import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ProcessedSiteMeasurementLead,
  Document,
  PaymentInfo,
} from "@/types/site-measrument-types";
import { Button } from "@/components/ui/button";
import { Edit2, FileText, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useAppSelector } from "@/redux/store";
import SiteMesurementEditModal from "./site-mesurement-edit-modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AddCurrentSitePhotos from "./current-site-image-add-modal";
import AddPaymentDetailsPhotos from "./payment-details-image-add-modal";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Measurement</DialogTitle>
          <DialogDescription>
            Provides a structured summary of the lead’s initial site measurement
            for review and reference.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-5 py-4 space-y-6">
            <div>
              {pdfDocs.length > 0 && (
                <div className="w-full flex flex-col md:flex-row gap-6">
                  {/* PDF Section - fixed smaller width */}
                  <div className="md:w-1/3 w-full">
                    <h3 className="font-semibold text-md mb-2">
                      Initial Site Measurement Document
                    </h3>
                    <div
                      onClick={() => {
                        window.open(pdfDocs[0].signed_url, "_blank");
                      }}
                      className="cursor-pointer w-full h-56 border rounded-xl shadow-sm flex flex-col items-center justify-center hover:shadow-md transition"
                    >
                      <FileText size={56} className="text-red-500 mb-3" />
                      <p className="text-sm font-medium text-center px-3 truncate">
                        {pdfDocs[0].doc_og_name}
                      </p>
                      <span className="text-xs text-gray-500 mt-1">
                        Click to view
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-row justify-between items-center">
                      <h4 className="text-md font-semibold mb-4">
                        Payment Details
                      </h4>

                      <Button
                        size="sm"
                        onClick={() => setOpenEditModal(true)}
                        className="gap-1"
                      >
                        <Edit2 size={15} />
                        <span className="text-xs">Edit</span>
                      </Button>
                    </div>

                    {/* Payment Amount */}
                    <div className="flex flex-col gap-2 mb-4">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="text"
                        value={payment ? `₹${payment.amount}` : "N/A"}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>

                    {/* Payment Date */}
                    <div className="flex flex-col gap-2 mb-4">
                      <Label htmlFor="payment_date">Payment Date</Label>
                      <Input
                        id="payment_date"
                        type="text"
                        value={
                          payment
                            ? new Date(payment.payment_date).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"
                        }
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>

                    {/* Payment Description */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="payment_text">Description</Label>
                      <Textarea
                        id="payment_text"
                        value={payment?.payment_text || "N/A"}
                        readOnly
                        rows={2}
                        className="bg-muted cursor-not-allowed resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {currentSitePhotos.length > 0 && (
              <div>
                <h3 className="font-semibold text-md mb-2">Site Photos</h3>

                <div className="flex flex-wrap gap-3">
                  {currentSitePhotos.map((doc) => (
                    <img
                      key={doc.id}
                      src={doc.signed_url}
                      alt={doc.doc_og_name}
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                  ))}

                  {/* Add Image Button bhi yahi row me aa gaya */}
                  <div
                    className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setOpenImageModal(true)}
                  >
                    <div className="flex flex-col items-center text-gray-400">
                      <Plus size={40} />
                      <span className="text-xs mt-1">Add Image</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Images */}
            {paymentImages.length > 0 && (
              <div>
                <h3 className="font-semibold text-md mb-2">Payment Proofs</h3>

                <div className="flex flex-wrap gap-3">
                  {paymentImages.map((doc) => (
                    <img
                      key={doc.id}
                      src={doc.signed_url}
                      alt={doc.doc_og_name}
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                  ))}

                  {/* Add Image Button as part of same flex-wrap row */}
                  <div
                    className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setOpenImageModal2(true)}
                  >
                    <div className="flex flex-col items-center text-gray-400">
                      <Plus size={40} />
                      <span className="text-xs mt-1">Add Image</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

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
    </Dialog>
  );
};

export default SiteMesurementModal;
