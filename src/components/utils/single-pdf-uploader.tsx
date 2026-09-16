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
import { toastManager } from "@/components/ui/toast";

interface SinglePdfUploadFieldProps {
  value: File | File[] | null;
  onChange: (file: File | File[] | null) => void;
  allowedMimeTypes?: string[];
  accept?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  multiple?: boolean;
  maxFiles?: number;
  invalid?: boolean;
}

export function SinglePdfUploadField({
  value,
  onChange,
  allowedMimeTypes = ["application/pdf"],
  accept = ".pdf",
  title = "Upload PDF Document",
  description = "Only 1 PDF allowed. Drag & drop or click below.",
  buttonLabel = "Select PDF",
  multiple = false,
  maxFiles = 1,
  invalid,
}: SinglePdfUploadFieldProps) {
  const shouldValidateMimeTypes = (allowedMimeTypes?.length ?? 0) > 0;

  // Upload simulation
  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      try {
        for (const file of files) {
          if (shouldValidateMimeTypes && !allowedMimeTypes.includes(file.type)) {
            toastManager.add({ title: "Only supported document types are allowed", type: "error" });
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
    [allowedMimeTypes, shouldValidateMimeTypes]
  );

  const onFileReject = React.useCallback((file: File, message: string) => {
    const fileName =
      file.name.length > 20 ? file.name.slice(0, 20) + "..." : file.name;
    toastManager.add({ title: `${message}: "${fileName}" has been rejected`, type: "error" });
  }, []);

  // ✅ Handle value change properly
  const handleValueChange = React.useCallback(
    (files: File[]) => {
      if (multiple) {
        onChange(files);
        return;
      }
      onChange(files[0] ?? null);
    },
    [multiple, onChange]
  );

  const selectedFiles = React.useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }, [value]);

  return (
    <FileUpload
      value={selectedFiles}
      onValueChange={handleValueChange}
      onUpload={onUpload}
      onFileReject={onFileReject}
      multiple={multiple}
      maxFiles={maxFiles}
      accept={accept}
      className="w-full"
      invalid={invalid}
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <FileUploadTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2 w-fit">
            {buttonLabel}
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>

      {/* ✅ MUST wrap with FileUploadList */}
      <FileUploadList>
        {selectedFiles.map((file) => (
          <FileUploadItem key={`${file.name}-${file.size}-${file.lastModified}`} value={file} className="flex-col">
            <div className="flex w-full items-center gap-2">
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => {
                    if (multiple) {
                      onChange(selectedFiles.filter((selected) => selected !== file));
                      return;
                    }
                    onChange(null);
                  }}
                >
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
