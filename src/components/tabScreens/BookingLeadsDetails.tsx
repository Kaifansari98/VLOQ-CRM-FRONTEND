"use client";

import { useBookingLeadById } from "@/hooks/booking-stage/use-booking";
import { useAppSelector } from "@/redux/store";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  IndianRupee,
  Receipt,
  CreditCard,
  Calendar,
  MapPin,
  Plus,
  FileText,
  Download,
} from "lucide-react";
import { DocumentBooking } from "@/types/booking-types";

type OpenLeadDetailsProps = {
  lead: any;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

export default function BookingLeadsDetails({ lead }: OpenLeadDetailsProps) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const leadId = lead.leadId;

  const {
    data: leadData,
    isLoading,
    isError,
  } = useBookingLeadById(vendorId, leadId);

  if (!lead) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500">No lead details found.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="rounded-lg border h-full bg-white"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Loading Booking Details...
          </h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="rounded-lg border h-full bg-white"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading Booking Details
          </h2>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Failed to load booking information
        </div>
      </motion.div>
    );
  }

  const finalDocs =
    leadData?.documents?.filter((doc: any) =>
      doc.s3Key.includes("final-documents-booking")
    ) || [];

  const bookingPaymentDocs =
    leadData?.documents?.filter((doc: any) =>
      doc.s3Key.includes("booking-amount-payment-details")
    ) || [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border h-full overflow-hidden"
    >
      <div className="p-6 space-y-6">
        {/* Top 3 Key Metrics Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Site Supervisor */}
          <Card className="py-4 relative overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium ">
                    Site Supervisor
                  </p>
                  <p className="text-lg font-bold ">
                    {leadData?.supervisors?.[0]?.userName || "Not Assigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Received */}
          <Card className="py-4 relative overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Amount Received
                  </p>
                  <p className="text-lg font-bold ">
                    ₹
                    {leadData?.payments?.[0]?.amount?.toLocaleString("en-IN") ||
                      "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Booking Amount */}
          <Card className="py-4 relative overflow-hidden border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Total Booking Amount
                  </p>
                  <p className="text-lg font-bold ">
                    ₹
                    {leadData?.finalBookingAmount?.toLocaleString("en-IN") ||
                      "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Design Remarks */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold ">
              Design Remarks
            </h3>
          </div>

          <div className="bg-gray-50 border rounded-lg p-2 min-h-20 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700 text-start ">
              {leadData?.payments?.[0]?.text || "No design remarks available"}
            </p>
          </div>
        </motion.div>

        {/* Final Documents */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              Final Documents (Quotations + Design)
            </h3>
            <Badge variant="outline" className="ml-auto">
              {finalDocs.length} files
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4">
            {finalDocs.map((doc: DocumentBooking) => {
              const fileExt = doc.originalName.split(".").pop()?.toLowerCase();
              const isImage = ["jpg", "jpeg", "png"].includes(fileExt || "");
              const isPdf = fileExt === "pdf";
              const isPresentation = ["ppt", "pptx", "pyo"].includes(
                fileExt || ""
              );

              return (
                <div
                  key={doc.id}
                  className="group relative h-32 w-32 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors overflow-hidden bg-gray-50"
                >
                  {isImage ? (
                    <img
                      src={doc.signedUrl}
                      alt={doc.originalName}
                      className="h-full w-full object-cover"
                    />
                  ) : isPdf ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-red-50 text-red-600">
                      <i className="fa-regular fa-file-pdf text-3xl"></i>
                      <span className="text-xs font-medium mt-1">PDF</span>
                    </div>
                  ) : isPresentation ? (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-orange-50 text-orange-600">
                      <i className="fa-regular fa-file-powerpoint text-3xl"></i>
                      <span className="text-xs font-medium mt-1">PPT</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 text-gray-500">
                      <i className="fa-regular fa-file text-3xl"></i>
                      <span className="text-xs font-medium mt-1">FILE</span>
                    </div>
                  )}

                  
                  {/* File name tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {doc.originalName}
                  </div>
                </div>
              );
            })}

           
          </div>

          {finalDocs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No final documents uploaded yet</p>
            </div>
          )}
        </motion.div>

        {/* Booking Payment Documents */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold ">
              Booking Amount Payment Details
            </h3>
            <Badge variant="outline" className="ml-auto">
              {bookingPaymentDocs.length} files
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4">
            {bookingPaymentDocs.map((doc: DocumentBooking) => (
              <div
                key={doc.id}
                className="group relative h-32 w-32 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors overflow-hidden"
              >
                <img
                  src={doc.signedUrl}
                  alt={doc.originalName}
                  className="h-full w-full object-cover"
                />

                
                {/* File name tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {doc.originalName}
                </div>
              </div>
            ))}
          </div>

          {bookingPaymentDocs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No payment documents uploaded yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
