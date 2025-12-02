"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  type FileUploadProps,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Upload, X } from "lucide-react";
import { toast } from "react-toastify";

interface DocumentsFieldProps {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string; // e.g. ".pdf,.docx,.xlsx"
}

export function DocumentsUploader({
  value,
  onChange,
  accept,
}: DocumentsFieldProps) {
  const description =
    "You can upload up to 10 files (PDF or any supported formats). Drag & drop or click below to select files.";

  // Simulated upload handler
  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      try {
        for (const file of files) {
          try {
            const totalChunks = 10;
            for (let i = 1; i <= totalChunks; i++) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.random() * 200 + 100)
              );
              onProgress(file, (i / totalChunks) * 100);
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
            onSuccess(file);
          } catch (err) {
            onError(
              file,
              err instanceof Error ? err : new Error("Upload failed")
            );
          }
        }
      } catch (err) {
        console.error("Unexpected error during upload:", err);
      }
    },
    []
  );

  // Reject handler
  const onFileReject = React.useCallback((file: File, message: string) => {
    const fileName =
      file.name.length > 20 ? file.name.slice(0, 20) + "..." : file.name;
    toast.error(`${message}: "${fileName}" has been rejected`);
  }, []);

  return (
    <FileUpload
      value={value}
      onValueChange={onChange}
      onFileReject={onFileReject}
      onUpload={onUpload}
      multiple
      accept={
        accept ??
        ".pdf,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct"
      }
      className="w-full"
    >
      <FileUploadDropzone>
        <Upload className="size-7 text-blue-500" />
        <p className="font-medium text-sm">Upload Documents</p>
        <p className="text-muted-foreground text-xs text-center max-w-sm">
          {description}
        </p>
        <FileUploadTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2">
            Select Files
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>

      <FileUploadList>
        {value.map((file, index) => (
          <FileUploadItem key={index} value={file} className="flex-col mt-2">
            <div className="flex w-full items-center gap-2">
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button variant="ghost" size="icon">
                  <X />
                </Button>
              </FileUploadItemDelete>
            </div>
            <FileUploadItemProgress />
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}
