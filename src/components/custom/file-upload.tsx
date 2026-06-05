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

interface FileUploadFieldProps {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  isUploadDeniedAndSelectEnabled?: boolean;
  onSelectEnabledClick?: () => void;
}

export function FileUploadField({
  value,
  onChange,
  accept,
  multiple = true,
  disabled,
  maxFiles,
  isUploadDeniedAndSelectEnabled = false,
  onSelectEnabledClick,
}: FileUploadFieldProps) {
  const finalAccept = accept ?? "*/*";
  const finalMaxFiles = maxFiles ?? (multiple ? 20 : 1);

  // Upload simulation
  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      try {
        const uploadPromises = files.map(async (file) => {
          try {
            const totalChunks = 10;
            let uploadedChunks = 0;

            for (let i = 0; i < totalChunks; i++) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.random() * 200 + 100)
              );

              uploadedChunks++;
              const progress = (uploadedChunks / totalChunks) * 100;
              onProgress(file, progress);
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
            onSuccess(file);
          } catch (error) {
            onError(
              file,
              error instanceof Error ? error : new Error("Upload failed")
            );
          }
        });

        await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Unexpected error during upload:", error);
      }
    },
    []
  );

  // Handle value change (multiple / single)
  const handleValueChange = React.useCallback(
    (files: File[]) => {
      if (!multiple && files.length > 1) {
        toastManager.add({ title: "Only 1 file is allowed", type: "error" });
        onChange([files[files.length - 1]]);
      } else {
        onChange(files);
      }
    },
    [multiple, onChange]
  );

  const onFileReject = React.useCallback(
    (file: File, message: string) => {
      console.log("Reject reason:", message);

      if (!multiple && message.toLowerCase().includes("max")) {
        toastManager.add({ title: "Only 1 file is allowed", type: "error" });
      } else if (
        message.toLowerCase().includes("type") &&
        finalAccept !== "*/*"
      ) {
        toastManager.add({ title: "This file type is not allowed", type: "error" });
      } else if (message) {
        toastManager.add({ title: message, type: "error" }); // fallback
      }
    },
    [multiple, finalAccept]
  );

  const readableAccept = React.useMemo(() => {
    if (!finalAccept || finalAccept === "*/*") return "any file type";

    return finalAccept
      .split(",")
      .map((type) => {
        type = type.trim();
        if (type === "image/*") return "Images";
        if (type === "video/*") return "Videos";
        if (type === "audio/*") return "Audio Files";
        if (type.startsWith(".")) return type.toUpperCase().replace(".", "");
        return type;
      })
      .join(", ");
  }, [finalAccept]);

  return (
    <FileUpload
      value={value}
      onValueChange={handleValueChange}
      onUpload={onUpload}
      onFileReject={onFileReject} // ✅ correct type
      maxFiles={finalMaxFiles}
      className={`w-full ${disabled && "opacity-50" } `}
      multiple={multiple}
      accept={finalAccept}
      disabled={disabled}

    >
      <FileUploadDropzone
        onClick={
          isUploadDeniedAndSelectEnabled
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
        onDrop={
          isUploadDeniedAndSelectEnabled
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
        onPaste={
          isUploadDeniedAndSelectEnabled
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
        onKeyDown={
          isUploadDeniedAndSelectEnabled
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                }
              }
            : undefined
        }
      >
        <div className="flex flex-col items-center gap-1 text-center ">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">
            {isUploadDeniedAndSelectEnabled
              ? `Select and Upload ${multiple ? "files" : "file"} here`
              : `Drag & drop ${multiple ? "files" : "file"} here`}
          </p>
          <p className="text-muted-foreground text-xs">
            {isUploadDeniedAndSelectEnabled
              ? "select the documents by clicking of the select documents button."
              : multiple
                ? `On click to browse (max ${finalMaxFiles} files allowed)`
                : `On click to browse (only 1 file allowed)`}
          </p>
        </div>
        <FileUploadTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-fit"
            onClick={
              isUploadDeniedAndSelectEnabled
                ? (event) => {
                    event.preventDefault();
                    onSelectEnabledClick?.();
                  }
                : undefined
            }
          >
            {multiple ? "Select files" : "Select file"}
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>

      <FileUploadList>
        {value?.map((file, index) => (
          <FileUploadItem key={index} value={file} className="flex-col">
            <div className="flex w-full items-center gap-2">
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button variant="ghost" size="icon" className="size-7">
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
