"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useProductionFiles,
  useUploadProductionFiles,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import { format } from "date-fns";
import {
  FileText,
  ExternalLink,
  FolderOpen,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

interface ProductionFilesSectionProps {
  leadId: number;
  accountId: number | null;
}

export default function ProductionFilesSection({
  leadId,
  accountId,
}: ProductionFilesSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  const { data: productionFiles, isLoading } = useProductionFiles(
    vendorId,
    leadId
  );
  const { mutateAsync: uploadFiles, isPending } = useUploadProductionFiles(
    vendorId,
    leadId
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasFiles = Array.isArray(productionFiles) && productionFiles.length > 0;

  // ✅ Handle Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadFiles(formData);
      toast.success("Production files uploaded successfully!");
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["productionFiles", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload files.");
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Production Files</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload and manage production files related to this lead.
        </p>
      </div>

      {/* Upload Section */}
      <div className="p-6 border-b space-y-4">
        <FileUploadField
          value={selectedFiles}
          onChange={setSelectedFiles}
          accept=".pdf,.pyo,.pytha,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip"
          multiple
        />

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={isPending || selectedFiles.length === 0}
            className="flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin size-4" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload Files
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Files List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Files
          </h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {productionFiles.length} file
              {productionFiles.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading files...
          </div>
        ) : !hasFiles ? (
          <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No production files uploaded yet.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] mt-2 pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productionFiles.map((doc: any) => (
                <div
                  key={doc.id}
                  className="group border rounded-lg p-3 flex flex-col justify-between bg-card shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText
                        size={20}
                        className="text-primary shrink-0 group-hover:scale-110 transition-transform"
                      />
                      <p className="font-medium text-sm line-clamp-2">
                        {doc.doc_og_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Uploaded on{" "}
                    {format(new Date(doc.created_at), "dd MMM yyyy")}
                  </p>

                  <a
                    href={doc.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 mt-2 font-medium"
                  >
                    <ExternalLink size={14} /> View / Download
                  </a>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
