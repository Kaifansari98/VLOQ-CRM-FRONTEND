import React, { useEffect } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useQuery } from "@tanstack/react-query";
import { fetchLeadById } from "@/api/designingStageQueries";

const QuotationTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data, error, isLoading } = useQuery({
    queryKey: ["leadById", vendorId, leadId],
    queryFn: () => {
      if (!vendorId || !leadId) {
        throw new Error('vendorId and leadId are required');
      }
      return fetchLeadById(vendorId, leadId);
    },
    enabled: !!vendorId && !!leadId
  });

  // After fetch, extract only "design-quotation" docs
  const designQuotationDocs =
    data?.data?.documents?.filter(
      (doc: any) => doc.documentType?.type === "design-quotation"
    ) || [];

  useEffect(() => {
    if (data) {
      console.log("Lead Details:", data);
    }
  }, [data]);

  return (
    <div className="w-full px-4">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading lead data.</p>}

      {designQuotationDocs.length ? (
        <div>
          {/* <h2 className="font-semibold mt-4 mb-2">Design Quotation Documents</h2> */}
          <div className="flex flex-wrap gap-4">
            {designQuotationDocs.map((doc: any) => {
              // Check file extension for image
              const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.doc_og_name);

              return (
                <div key={doc.id} className="border p-2 rounded w-52">
                  <p className="text-sm">{doc.doc_og_name}</p>
                  {isImage ? (
                    <img
                      src={doc.signedUrl}
                      alt={doc.doc_og_name}
                      className="w-full h-32 object-contain mt-2"
                    />
                  ) : (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline block mt-2"
                    >
                      View Document
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4">No design quotations available.</p>
      )}
    </div>
  );
};

export default QuotationTab;
