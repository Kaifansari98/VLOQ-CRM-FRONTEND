"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBookingLeadById } from "@/hooks/booking-stage/use-booking";
import { useAppSelector } from "@/redux/store";
import {
  User,
  IndianRupee,
  Receipt,
  CreditCard,
  Calendar,
  MapPin,
  Plus,
} from "lucide-react";
import { DocumentBooking } from "@/types/booking-types";
import UploadFinalDoc from "./add-final-doc";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number;
  };
}

const BookingViewModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const leadId = data?.id;
  const [openFinalDocModal, setOpenFinalDocModal] = useState<boolean>(false);
  const {
    data: leadData,
    isLoading,
    isError,
  } = useBookingLeadById(vendorId, leadId);
  console.log("Account id: ", data?.accountId);
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-4xl p-0 gap-0">
          <DialogHeader className="flex items-start justify-between px-6 py-4 border-b">
            <DialogTitle className="capitalize">
              Loading Booking Details...
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-4xl p-0 gap-0">
          <DialogHeader className="flex items-start justify-between px-6 py-4 border-b">
            <DialogTitle className="capitalize text-red-600">
              Error Loading Booking Details
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64 text-gray-500">
            Failed to load booking information
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const finalDocs =
    leadData?.documents?.filter((doc) =>
      doc.s3Key.includes("final-documents-booking")
    ) || [];

  const bookingPaymentDocs =
    leadData?.documents?.filter((doc) =>
      doc.s3Key.includes("booking-amount-payment-details")
    ) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
          {/* Header */}
          <DialogHeader className="flex items-start justify-between px-6 py-4 border-b">
            <DialogTitle className="capitalize">
              View Booking for {data?.name || "Customer"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="p-6 space-y-6">
              {/* Top 3 Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Site Supervisor */}
                <Card className="py-4 relative overflow-hidden border-l-4  border-l-green-500">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Site Supervisor</p>
                          <p className="text-lg font-bold">
                            {leadData?.supervisors?.[0]?.userName ||
                              "Not Assigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Amount Received */}
                <Card className="py-4 relative overflow-hidden border-l-4  border-l-blue-500">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <IndianRupee className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium ">
                            Amount Received
                          </p>
                          <p className="text-lg font-bold ">
                            ₹
                            {leadData?.payments?.[0]?.amount?.toLocaleString(
                              "en-IN"
                            ) || "0"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Final Booking Amount */}
                <Card className="py-4 relative overflow-hidden border-l-4  border-l-purple-500">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium ">
                            Total Booking Amount
                          </p>
                          <p className="text-lg font-bold ">
                            ₹
                            {leadData?.finalBookingAmount?.toLocaleString(
                              "en-IN"
                            ) || "0"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2 mb-4">
                <h1 className="text-sm font-medium">Design Remarks</h1>
                <div className="bg-muted border rounded-sm py-1 px-2 text-sm max-h-200 overflow-y-auto">
                  {leadData?.payments?.[0].text || "N/A"}
                </div>
              </div>

              <div className="space-y-4 mb-2">
                <div className="space-y-2">
                  <h1 className="text-sm font-medium">
                    Final Documents (Quotations + Design)
                  </h1>

                  <div className="flex flex-wrap gap-3">
                    {finalDocs.map((doc: DocumentBooking) => {
                      const fileExt = doc.originalName
                        .split(".")
                        .pop()
                        ?.toLowerCase();

                      const isImage = ["jpg", "jpeg", "png"].includes(
                        fileExt || ""
                      );
                      const isPdf = fileExt === "pdf";
                      const isPresentation = ["ppt", "pptx", "pyo"].includes(
                        fileExt || ""
                      );

                      return (
                        <div
                          key={doc.id}
                          className="h-32 w-32 rounded-lg border flex items-center justify-center overflow-hidden relative bg-gray-50"
                        >
                          {isImage ? (
                            <img
                              src={doc.signedUrl}
                              alt={doc.originalName}
                              className="h-full w-full object-cover"
                            />
                          ) : isPdf ? (
                            <div className="flex flex-col items-center justify-center w-full h-full bg-red-50 text-red-600 rounded-lg">
                              <i className="fa-regular fa-file-pdf text-4xl"></i>
                              <span className="text-xs font-medium mt-1">
                                PDF
                              </span>
                            </div>
                          ) : isPresentation ? (
                            <div className="flex flex-col items-center justify-center w-full h-full bg-orange-50 text-orange-600 rounded-lg">
                              <i className="fa-regular fa-file-powerpoint text-4xl"></i>
                              <span className="text-xs font-medium mt-1">
                                PPT
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 text-gray-500 rounded-lg">
                              <i className="fa-regular fa-file text-4xl"></i>
                              <span className="text-xs font-medium mt-1">
                                FILE
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Image / File button */}
                    <div
                      className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setOpenFinalDocModal(true)}
                    >
                      <div className="flex flex-col items-center text-gray-400">
                        <Plus size={40} />
                        <span className="text-xs mt-1">Add File</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-sm font-medium">
                    Booking Amount Payment Details Document
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    {bookingPaymentDocs.map((doc: DocumentBooking) => (
                      <img
                        key={doc.id}
                        src={doc.signedUrl}
                        alt={doc.originalName}
                        className="h-32 w-32 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <UploadFinalDoc
        open={openFinalDocModal}
        onOpenChange={setOpenFinalDocModal}
        leadId={leadId}
        accountId={data?.accountId!}
      />
    </>
  );
};

export default BookingViewModal;
