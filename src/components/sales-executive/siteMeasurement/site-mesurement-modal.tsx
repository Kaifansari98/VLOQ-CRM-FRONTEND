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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-4xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Site Measurement Details
          </DialogTitle>
          <DialogDescription>
            Review initial site measurement documentation and payment
            information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 py-6 space-y-8">
            {payment && (
              <div className="space-y-4">
                <div className="flex flex-row justify-between items-center">
                  <h3 className="text-lg font-semibold ">
                    Payment Information
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setOpenEditModal(true)}
                    className="gap-2"
                  >
                    <Edit2 size={16} />
                    <span className="text-sm">Edit Details</span>
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Payment Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                          Payment Amount
                        </Label>
                        <div className="relative">
                          <Input
                            id="amount"
                            type="text"
                            value={`₹${payment.amount.toLocaleString("en-IN")}`}
                            readOnly
                            className="font-semibold text-lg cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Payment Date */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="payment_date"
                          className="text-sm font-medium"
                        >
                          Payment Date
                        </Label>
                        <Input
                          id="payment_date"
                          type="text"
                          value={new Date(
                            payment.payment_date
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                        />
                      </div>

                      {/* Payment Description - Full width */}
                      <div className="md:col-span-2 space-y-2">
                        <Label
                          htmlFor="payment_text"
                          className="text-sm font-medium "
                        >
                          Payment Description
                        </Label>
                        <Textarea
                          id="payment_text"
                          value={
                            payment.payment_text || "No description provided"
                          }
                          readOnly
                          rows={3}
                          className="bg-gray-50 cursor-not-allowed resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {pdfDocs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Measurement Documents</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pdfDocs?.[0] && (
                    <Card
                      key={pdfDocs[0].id}
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="relative">
                            <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                              <FileText size={32} className="text-red-500" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium text-sm leading-tight">
                              {formatFileName(pdfDocs[0].doc_og_name)}
                            </p>
                            <p className="text-xs">
                              {formatFileSize(pdfDocs[0].signed_url)}
                            </p>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(pdfDocs[0].signed_url, "_blank");
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
                                link.href = pdfDocs[0].signed_url;
                                link.download = pdfDocs[0].doc_og_name;
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
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {currentSitePhotos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Site Photos</h3>

                <div className="flex flex-wrap gap-4">
                  {currentSitePhotos.map((doc) => (
                    <div key={doc.id} className="relative group">
                      <img
                        src={doc.signed_url}
                        alt={doc.doc_og_name}
                        className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                      />
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group"
                    onClick={() => setOpenImageModal(true)}
                  >
                    <div className="flex flex-col items-center text-gray-500 group-hover:text-blue-600">
                      <Plus size={24} className="mb-1" />
                      <span className="text-xs font-medium">Add Photos</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Proofs</h3>
                <div className="flex flex-wrap gap-4">
                  {paymentImages.map((doc) => (
                    <div key={doc.id} className="relative group">
                      <img
                        src={doc.signed_url}
                        alt={doc.doc_og_name}
                        className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                      />
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
