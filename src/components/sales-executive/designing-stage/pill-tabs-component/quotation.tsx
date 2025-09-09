import React, { useEffect } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useQuery } from "@tanstack/react-query";
import { getQuotationDoc } from "@/api/designingStageQueries";
import { Ban, Calendar, File } from "lucide-react";

const QuotationTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data, error, isLoading } = useQuery({
    queryKey: ["getQuotationDoc", vendorId, leadId],
    queryFn: () => {
      if (!vendorId || !leadId) {
        throw new Error("vendorId and leadId are required");
      }
      return getQuotationDoc(vendorId, leadId);
    },
    enabled: !!vendorId && !!leadId,
  });

  const designQuotationDocs = data?.data?.documents;

  useEffect(() => {
    if (data) {
      console.log("Lead Details:", data.data);
    }
  }, [data]);

  if (!designQuotationDocs || designQuotationDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="text-center flex flex-col justify-center items-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Ban size={40} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-xl mb-3">No quotations found</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            You don't have any design quotations uploaded yet. Quotation
            documents will appear here once they are added.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading lead data.</p>}

      {designQuotationDocs.length ? (
        <div className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {designQuotationDocs.map((doc: any) => {
              const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.doc_og_name);

              return (
                <div
                  key={doc.id}
                  className="border border-border bg-card rounded-lg w-full p-3 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* File Name + Type */}
                  <div className="w-full flex items-center gap-2 mb-2">
                    <span
                      className="truncate text-xs font-medium text-foreground flex-1"
                      title={doc.doc_og_name}
                    >
                      {doc.doc_og_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {doc.doc_og_name.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>

                  {/* Preview Section */}
                  {isImage ? (
                    <img
                      src={doc.signedUrl}
                      alt={doc.doc_og_name}
                      className="w-full h-40 object-cover rounded border border-border bg-muted"
                    />
                  ) : (
                    <div className="flex flex-col items-center w-full">
                      <div className="flex items-center justify-center w-full h-40 bg-muted rounded border border-border mb-2">
                        <File size={50} className="text-gray-600" />
                      </div>
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline text-sm font-medium hover:opacity-80 transition"
                      >
                        View Document
                      </a>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="mt-3 w-full flex flex-col sm:flex-row justify-between text-xs text-muted-foreground">
                    <span>
                      Uploaded:{" "}
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                    <span>By: {doc.createdBy?.user_name || "Unknown"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No design quotations available.
        </p>
      )}
    </div>
  );
};

export default QuotationTab;
