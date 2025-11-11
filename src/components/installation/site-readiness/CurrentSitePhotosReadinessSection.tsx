"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  FolderOpen,
  Upload,
  FileImage,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toast } from "react-toastify";

import {
  useCurrentSitePhotosAtSiteReadiness,
  useUploadCurrentSitePhotosAtSiteReadiness,
} from "@/api/installation/useSiteReadinessLeads";

interface CurrentSitePhotosReadinessSectionProps {
  leadId: number;
  accountId: number | null;
}

export default function CurrentSitePhotosReadinessSection({
  leadId,
  accountId,
}: CurrentSitePhotosReadinessSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  // 🔹 Fetch existing site photos
  const { data: sitePhotos, isLoading } = useCurrentSitePhotosAtSiteReadiness(
    vendorId,
    leadId
  );

  // 🔹 Upload mutation
  const { mutateAsync: uploadPhotos, isPending } =
    useUploadCurrentSitePhotosAtSiteReadiness();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasFiles = Array.isArray(sitePhotos) && sitePhotos.length > 0;

  // 🔹 Handle Upload
  const handleUpload = async () => {
    if (!vendorId || !userId || !leadId) {
      toast.error("Missing required IDs.");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo to upload.");
      return;
    }

    try {
      await uploadPhotos({
        vendorId,
        leadId,
        accountId: accountId || 0,
        createdBy: userId,
        files: selectedFiles,
      });

      toast.success("Current Site Photos uploaded successfully!");
      setSelectedFiles([]);

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["currentSitePhotosAtSiteReadiness", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["checkSiteReadinessCompletion", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload Current Site Photos."
      );
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          <h2 className="text-lg font-semibold">
            Current Site Photos (Site Readiness)
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload and manage current site photos.
        </p>
      </div>

      {/* Upload Section */}
      <div className="p-6 border-b space-y-4">
        <FileUploadField
          value={selectedFiles}
          onChange={setSelectedFiles}
          accept=".jpg,.jpeg,.png,.pdf,.zip"
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
                Upload Photos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Files List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Photos
          </h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {sitePhotos.length} photo{sitePhotos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading current site photos...
          </div>
        ) : !hasFiles ? (
          <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No photos uploaded yet.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] mt-2 pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sitePhotos.map((photo: any) => (
                <div
                  key={photo.id}
                  className="group border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <img
                    src={photo.signed_url}
                    alt={photo.doc_og_name}
                    className="object-cover w-full h-32 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">
                      {photo.doc_og_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(photo.created_at), "dd MMM yyyy")}
                    </p>
                    <a
                      href={photo.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink size={12} /> View / Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
