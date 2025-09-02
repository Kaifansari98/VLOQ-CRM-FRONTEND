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

interface PdfUploadFieldProps {
  value: File[]; // will always hold 0 or 1 file
  onChange: (files: File[]) => void;
}

export function PdfUploadField({ value, onChange }: PdfUploadFieldProps) {
  // Upload simulation
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

  // File reject toast
  const onFileReject = React.useCallback(
    (file: File, message: string) => {
      const fileName =
        file.name.length > 20 ? file.name.slice(0, 20) + "..." : file.name;
      if (value.length >= 1) {
        toast.error(`Only 1 PDF is allowed. "${fileName}" cannot be added.`);
      } else {
        toast.error(`${message}: "${fileName}" has been rejected`);
      }
    },
    [value]
  );

  return (
    <FileUpload
      value={value}
      onValueChange={onChange}
      onUpload={onUpload}
      onFileReject={onFileReject}
      maxFiles={1} // only 1 file
      multiple={false} // single file only
      accept=".pdf" // strictly PDF
      className="w-full"
    >
      <FileUploadDropzone>
        <Upload className="size-7 text-blue-500" />
        <p className="font-medium text-sm">Upload PDF Document</p>
        <p className="text-muted-foreground text-xs">
          Only 1 PDF allowed. Drag & drop here or click button below.
        </p>
        <FileUploadTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2">
            Select PDF
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
