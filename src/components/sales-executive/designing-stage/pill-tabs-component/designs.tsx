import React from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useDesignsDoc } from "@/hooks/designing-stage/designing-leads-hooks";
import { DesignsDocument } from "@/types/designing-stage-types";
import { File } from "lucide-react";

const DesigningTab = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { leadId } = useDetails();

  const { data, error, isLoading } = useDesignsDoc(vendorId!, leadId);
  const designsDoc = data?.data.documents;

  console.log(data?.data.documents);

  return (
    <div className="p-4">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading lead data.</p>}
      {designsDoc?.length ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {designsDoc.map((doc: DesignsDocument) => {
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

                  <div className="flex flex-col items-center w-full">
                    <div className="flex items-center justify-center w-full h-40 bg-muted rounded border border-border mb-2">
                      {doc.doc_og_name.toLowerCase().endsWith(".pytha") ? (
                        <img
                          src="/pythaLogo.png" // ✅ apne logo ka path
                          alt="Pytha Logo"
                          className="max-h-40 /object-contain"
                        />
                      ) : (
                        <File size={50} />
                      )}
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
          No designsDoc available.
        </p>
      )}
    </div>
  );
};

export default DesigningTab;
