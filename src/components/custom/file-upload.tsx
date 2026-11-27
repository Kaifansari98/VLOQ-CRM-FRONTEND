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
import { Download, ExternalLink, Eye, Upload, X } from "lucide-react";
import { toastManager } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FileUploadFieldProps {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Max number of files allowed (default: unlimited for multiple, 1 for single) */
  maxFiles?: number;
  /** Max file size per file in MB (default: no client-side limit) */
  maxSizeMB?: number;
  isUploadDeniedAndSelectEnabled?: boolean;
  onSelectEnabledClick?: () => void;
  invalid?: boolean;
  previewUrl?: string | null;
  showPreview?: boolean;
}

export function FileUploadField({
  value,
  onChange,
  accept,
  multiple = true,
  disabled,
  maxFiles,
  maxSizeMB,
  isUploadDeniedAndSelectEnabled = false,
  onSelectEnabledClick,
  invalid,
  previewUrl,
  showPreview = false,
}: FileUploadFieldProps) {
  const finalAccept = accept ?? "*/*";

  // For single-file mode, maxFiles is always 1. For multiple, use the prop if provided.
  const finalMaxFiles = !multiple ? 1 : maxFiles ?? undefined;

  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    const file = value?.[0];
    if (
      file &&
      file instanceof File &&
      (file.type.startsWith("image/") || finalAccept.includes("image"))
    ) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      setImageError(false);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setObjectUrl(null);
  }, [value, finalAccept]);

  const activePreviewUrl =
    objectUrl ||
    (previewUrl && typeof previewUrl === "string" && previewUrl.trim() !== ""
      ? previewUrl.trim()
      : null);

  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [activePreviewUrl]);

  const handleDownload = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!activePreviewUrl) return;

      const fileName =
        value?.[0]?.name ||
        activePreviewUrl.split("/").pop()?.split("?")[0] ||
        "download-image";

      try {
        const res = await fetch(activePreviewUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        const a = document.createElement("a");
        a.href = activePreviewUrl;
        a.download = fileName;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    [activePreviewUrl, value]
  );

  // Immediately mark files as successfully staged (no fake upload simulation)
  // The actual upload happens on form submit via FormData.
  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onSuccess }) => {
      files.forEach((file) => onSuccess(file));
    },
    []
  );

  // Handle value change with client-side guards (file count + file size)
  const handleValueChange = React.useCallback(
    (incomingFiles: File[]) => {
      if (!multiple) {
        // Single-file mode: always keep only the last picked file
        if (incomingFiles.length > 1) {
          toastManager.add({ title: "Only 1 file is allowed", type: "error" });
        }
        const file = incomingFiles[incomingFiles.length - 1];
        if (!file) return;

        if (maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024) {
          toastManager.add({
            title: `File size limit exceeded. Maximum allowed size is ${maxSizeMB}MB.`,
            type: "error",
          });
          return; // reject the file
        }
        onChange([file]);
        return;
      }

      // Multiple-file mode: filter out oversized files, then check count
      const oversized: string[] = [];
      const valid = incomingFiles.filter((file) => {
        if (maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024) {
          oversized.push(file.name);
          return false;
        }
        return true;
      });

      if (oversized.length > 0) {
        toastManager.add({
          title: `File size limit exceeded. Maximum allowed size is ${maxSizeMB}MB. (${oversized.join(", ")})`,
          type: "error",
        });
      }

      if (finalMaxFiles !== undefined && valid.length > finalMaxFiles) {
        toastManager.add({
          title: `Maximum files upload limit of ${finalMaxFiles} reached.`,
          type: "error",
        });
        onChange(valid.slice(0, finalMaxFiles));
        return;
      }

      onChange(valid);
    },
    [multiple, onChange, maxSizeMB, finalMaxFiles]
  );

  // Keep track of the last time we showed a max files toast to avoid spam
  const lastMaxFilesToast = React.useRef<number>(0);

  const onFileReject = React.useCallback(
    (file: File, message: string) => {
      const lower = message.toLowerCase();

      if (lower.includes("max")) {
        const now = Date.now();
        if (now - lastMaxFilesToast.current > 1000) {
          if (!multiple) {
            toastManager.add({ title: "Only 1 file is allowed", type: "error" });
          } else {
            toastManager.add({
              title: `Maximum files upload limit of ${finalMaxFiles} reached.`,
              type: "error",
            });
          }
          lastMaxFilesToast.current = now;
        }
      } else if (lower.includes("type") && finalAccept !== "*/*") {
        toastManager.add({ title: "This file type is not allowed", type: "error" });
      } else if (lower.includes("size") || lower.includes("large")) {
        toastManager.add({
          title: maxSizeMB
            ? `File size limit exceeded. Maximum allowed size is ${maxSizeMB}MB.`
            : "File is too large.",
          type: "error",
        });
      } else if (message) {
        toastManager.add({ title: message, type: "error" });
      }
    },
    [multiple, finalAccept, maxSizeMB, finalMaxFiles]
  );

  // Build human-readable accept hint
  const readableAccept = React.useMemo(() => {
    if (!finalAccept || finalAccept === "*/*") return null;
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

  // Build the limit hint text shown inside the dropzone
  const limitHint = React.useMemo(() => {
    const parts: string[] = [];
    if (!multiple) {
      parts.push("Only 1 file allowed");
    } else {
      if (finalMaxFiles !== undefined) parts.push(`Up to ${finalMaxFiles} files`);
      else parts.push("Multiple files");
    }
    if (maxSizeMB !== undefined) parts.push(`max ${maxSizeMB}MB each`);
    if (readableAccept) parts.push(readableAccept);
    return parts.join(" · ");
  }, [multiple, finalMaxFiles, maxSizeMB, readableAccept]);

  return (
    <FileUpload
      value={value}
      onValueChange={handleValueChange}
      onUpload={onUpload}
      onFileReject={onFileReject}
      maxFiles={finalMaxFiles}
      className={`w-full ${disabled && "opacity-50"}`}
      multiple={multiple}
      accept={finalAccept}
      disabled={disabled}
      invalid={invalid}
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
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">
            {isUploadDeniedAndSelectEnabled
              ? `Select the final ${multiple ? "files" : "file"} here`
              : `Drag & drop ${multiple ? "files" : "file"} here`}
          </p>
          <p className="text-muted-foreground text-xs">
            {isUploadDeniedAndSelectEnabled
              ? "Select the documents by clicking of the select documents button."
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

        {(showPreview || previewUrl) && activePreviewUrl && !imageError && (
          <div
            className="mt-3 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePreviewUrl}
              alt="Preview"
              onError={() => setImageError(true)}
              onClick={() => setIsPreviewOpen(true)}
              className="max-h-24 max-w-full cursor-pointer rounded-md border bg-background object-contain p-1 shadow-xs transition-opacity hover:opacity-90"
              title="Click to preview"
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPreviewOpen(true);
                }}
              >
                <Eye className="size-3.5" />
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs hover:bg-accent"
                onClick={handleDownload}
              >
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>
        )}
      </FileUploadDropzone>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="flex max-w-3xl flex-col items-center justify-center gap-3 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="flex w-full flex-col gap-1 text-left">
            <DialogTitle className="text-base font-semibold">Image Preview</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              View full size image preview
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex max-h-[70vh] w-full items-center justify-center overflow-auto rounded-lg border bg-muted/30 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePreviewUrl ?? undefined}
              alt="Full size preview"
              className="max-h-[65vh] max-w-full rounded-md object-contain shadow-sm"
            />
          </div>
          <DialogFooter className="flex w-full items-center justify-end gap-2 border-t pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleDownload}
            >
              <Download className="size-3.5" />
              Download
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                if (activePreviewUrl) {
                  window.open(activePreviewUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <ExternalLink className="size-3.5" />
              Open in new tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
