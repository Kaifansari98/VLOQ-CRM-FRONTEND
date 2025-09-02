import React from "react";
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
import { FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

interface ViewInitialSiteMeasurmentLeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: ProcessedSiteMeasurementLead;
}

// const paymentSchema = z.object({
//   amount: z.number().min(1, "Amount must be greater than 0"),
//   payment_date: z.string().min(1, "Payment date is required"), // yyyy-mm-dd
//   payment_text: z
//     .string()
//     .min(5, "Description should be at least 5 characters"),
// });

// type PaymentFormValues = z.infer<typeof paymentSchema>;

const SiteMesurementModal: React.FC<ViewInitialSiteMeasurmentLeadProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  // Categorize documents
  const documents = data?.documentUrl || [];
  const payment = data?.paymentInfo;

//   const form = useForm<PaymentInfo>({
//     resolver?: zodResolver(paymentSchema),
//     defaultValues: {
//       amount: data?.paymentInfo?.amount || 0,
//       payment_date: data?.paymentInfo?.payment_date
//         ? data.paymentInfo.payment_date.split("T")[0]
//         : "",
//       payment_text: data?.paymentInfo?.payment_text || "",
//     },
//   });

  const pdfDocs = documents.filter((doc) =>
    doc.doc_sys_name.startsWith("initial_site_measurement_documents")
  );

  const currentSitePhotos = documents.filter((doc) =>
    doc.doc_sys_name.startsWith("current_site_photos")
  );

  //   const oldSitePhotos = documents.filter((doc) =>
  //     doc.doc_sys_name.startsWith("site-photos")
  //   );

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
                      onClick={() =>
                        window.open(pdfDocs[0].signed_url, "_blank")
                      }
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
                    <h4 className="text-md font-semibold mb-4">
                      Payment Details
                    </h4>

                    {/* Payment Amount */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Amount
                      </label>
                      <input
                        type="text"
                        value={payment ? `₹${payment.amount}` : "N/A"}
                        readOnly
                        className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* Payment Date */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Payment Date
                      </label>
                      <input
                        type="text"
                        value={
                          payment
                            ? new Date(
                                payment.payment_date
                              ).toLocaleDateString()
                            : "N/A"
                        }
                        readOnly
                        className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* Payment Description */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        value={payment?.payment_text || "N/A"}
                        readOnly
                        rows={2}
                        className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm resize-none focus:outline-none cursor-not-allowed"
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
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SiteMesurementModal;
