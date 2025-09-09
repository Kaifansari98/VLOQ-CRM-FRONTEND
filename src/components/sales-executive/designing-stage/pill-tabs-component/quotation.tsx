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
                <div
                  key={doc.id}
                  className="border shadow-sm bg-white rounded-lg w-60 p-3 flex flex-col items-center hover:shadow-lg transition-shadow duration-200 relative group"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={doc.signedUrl}
                      download={doc.doc_og_name}
                      className="text-gray-400 hover:text-blue-600"
                      title="Download"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="flex flex-col items-center w-full">
                    <div className="w-full flex items-center gap-2 mb-2">
                      <span className="truncate text-xs font-medium flex-1" title={doc.doc_og_name}>
                        {doc.doc_og_name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {doc.doc_og_name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                    {isImage ? (
                      <img
                        src={doc.signedUrl}
                        alt={doc.doc_og_name}
                        className="w-full h-36 object-cover rounded border bg-gray-50"
                      />
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <div className="flex items-center justify-center w-full h-36 bg-gray-50 rounded border mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm font-medium hover:text-blue-800 transition"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 w-full flex justify-between text-xs text-gray-500">
                    <span>
                      Uploaded:{" "}
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                    <span>
                      By: {doc.createdBy?.user_name || "Unknown"}
                    </span>
                  </div>
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
