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

interface SinglePdfUploadFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export function SinglePdfUploadField({
  value,
  onChange,
}: SinglePdfUploadFieldProps) {
  // Upload simulation
  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      try {
        for (const file of files) {
          if (file.type !== "application/pdf") {
            toast.error("Only PDF file is allowed");
            onError(file, new Error("Invalid file type"));
            continue;
          }

          const totalChunks = 10;
          for (let i = 1; i <= totalChunks; i++) {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.random() * 200 + 100)
            );
            onProgress(file, (i / totalChunks) * 100);
          }
          
          await new Promise((resolve) => setTimeout(resolve, 300));
          onSuccess(file);
        }
      } catch (err) {
        console.error("Unexpected error during upload:", err);
      }
    },
    []
  );

  const onFileReject = React.useCallback((file: File, message: string) => {
    const fileName =
      file.name.length > 20 ? file.name.slice(0, 20) + "..." : file.name;
    toast.error(`${message}: "${fileName}" has been rejected`);
  }, []);

  // ✅ Handle value change properly
  const handleValueChange = React.useCallback(
    (files: File[]) => {
      onChange(files[0] ?? null);
    },
    [onChange]
  );

  return (
    <FileUpload
      value={value ? [value] : []}
      onValueChange={handleValueChange}
      onUpload={onUpload}
      onFileReject={onFileReject}
      multiple={false}
      maxFiles={1}
      accept=".pdf"
      className="w-full"
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">Upload PDF Document</p>
          <p className="text-muted-foreground text-xs">
            Only 1 PDF allowed. Drag & drop or click below.
          </p>
        </div>
        <FileUploadTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2 w-fit">
            Select PDF
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>

      {/* ✅ MUST wrap with FileUploadList */}
      <FileUploadList>
        {value && (
          <FileUploadItem value={value} className="flex-col">
            <div className="flex w-full items-center gap-2">
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onChange(null)}
                >
                  <X />
                </Button>
              </FileUploadItemDelete>
            </div>
            <FileUploadItemProgress />
          </FileUploadItem>
        )}
      </FileUploadList>
    </FileUpload>
  );
} 