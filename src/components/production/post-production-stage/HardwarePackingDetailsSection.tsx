"use client";

import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  FileText,
  ExternalLink,
  Upload,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";

import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";

// 🔹 API hooks (replace with your actual API hook names)
import {
  useGetHardwarePackingDetails,
  useUploadHardwarePackingDetails,
} from "@/api/production/production-api";

interface HardwarePackingDetailsSectionProps {
  leadId: number;
  accountId: number | null;
}

export default function HardwarePackingDetailsSection({
  leadId,
  accountId,
}: HardwarePackingDetailsSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  const { data: packingDetails, isLoading } = useGetHardwarePackingDetails(
    vendorId,
    leadId
  );
  const { mutateAsync: uploadPackingDetails, isPending } =
    useUploadHardwarePackingDetails(vendorId, leadId);

  console.log(packingDetails);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [remark, setRemark] = useState(packingDetails?.remark || "");

  useEffect(() => {
    if (packingDetails?.remark) setRemark(packingDetails.remark);
  }, [packingDetails?.remark]);

  const hasFiles =
    Array.isArray(packingDetails?.data) && packingDetails.data.length > 0;

  // ✅ Handle Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0 && remark.trim() === "") {
      toast.error("Please add a remark or select at least one file.");
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      if (remark.trim() !== "") formData.append("remark", remark);
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadPackingDetails(formData);
      toast.success("Hardware Packing Details uploaded successfully!");

      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["hardwarePackingDetails", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload hardware packing details."
      );
    }
  };

  const handleRemarkUpdate = async () => {
    if (!remark.trim()) {
      toast.error("Please enter a remark before saving.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("remark", remark);
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadPackingDetails(formData);
      toast.success("Remark updated successfully!");

      queryClient.invalidateQueries({
        queryKey: ["hardwarePackingDetails", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update remark.");
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Hardware Packing Details</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload related hardware packing documents or remarks.
        </p>
      </div>

      {/* Upload Section */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload Column */}
          <div>
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".pdf,.jpg,.jpeg,.png,.zip"
              multiple
            />
            {/* Upload Button */}
            <div className="flex justify-end mt-4">
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

          {/* Remark Column */}
          <div>
            <p className="capitalize text-sm mb-2 font-semibold">hardware packing details remark</p>
            <TextAreaInput
              value={remark}
              onChange={setRemark}
              maxLength={500}
              placeholder="Add a remark about the hardware packing details..."
              className="h-[130px] bg-muted/20 rounded-lg"
            />
            <div className="flex justify-end mt-4">
              <Button
                size="sm"
                onClick={handleRemarkUpdate}
                disabled={!remark.trim()}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {packingDetails?.remark ? "Update Remark" : "Add Remark"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Documents
          </h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {packingDetails.data.length} file
              {packingDetails.data.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading documents...
          </div>
        ) : !hasFiles ? (
          <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No hardware packing details uploaded yet.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] mt-2 pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packingDetails.data.map((doc: any) => (
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
