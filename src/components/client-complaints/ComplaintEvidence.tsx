"use client";

import { useState } from "react";
import { ExternalLink, FileText, ImageIcon, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ComplaintAttachment } from "@/types/complaint-details";
import { complaintDate, displayText } from "./complaint-details-format";

export function ComplaintEvidence({
  files,
  emptyText = "No evidence uploaded for this stage.",
}: {
  files: ComplaintAttachment[];
  emptyText?: string;
}) {
  const [preview, setPreview] = useState<ComplaintAttachment | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(
    () => new Set(),
  );
  if (!files.length)
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="min-w-0 overflow-hidden rounded-xl border bg-background"
          >
            <button
              type="button"
              disabled={!file.url}
              onClick={() => setPreview(file)}
              className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted/40 focus-visible:outline-ring disabled:opacity-60"
              aria-label={`Preview ${file.original_name}`}
            >
              {file.media_type === "PHOTO" &&
              file.url &&
              !failedImages.has(file.id) ? (
                // Storage URLs are signed and may expire; native images support their full dynamic URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.original_name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                  onError={() =>
                    setFailedImages((previous) =>
                      new Set(previous).add(file.id),
                    )
                  }
                />
              ) : file.media_type === "VIDEO" ? (
                <Play className="size-7 text-muted-foreground" />
              ) : file.media_type === "DOCUMENT" ? (
                <FileText className="size-7 text-muted-foreground" />
              ) : (
                <ImageIcon className="size-7 text-muted-foreground" />
              )}
            </button>
            <div className="space-y-1 p-3">
              <p
                className="truncate text-xs font-medium"
                title={file.original_name}
              >
                {file.original_name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {displayText(file.category)} ·{" "}
                {Math.max(1, Math.round(file.size_bytes / 1024))} KB
              </p>
              {!file.url || failedImages.has(file.id) ? (
                <p className="text-xs text-muted-foreground">
                  Preview unavailable. Refresh to retry.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="break-all pr-6">
              {preview?.original_name}
            </DialogTitle>
            <DialogDescription>
              {preview
                ? `${displayText(preview.category)} · ${complaintDate(preview.created_at, true)}`
                : "Evidence preview"}
            </DialogDescription>
          </DialogHeader>
          {preview?.url && (
            <>
              {preview.media_type === "PHOTO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={preview.original_name}
                  className="max-h-[65vh] w-full rounded-lg object-contain"
                />
              ) : preview.media_type === "VIDEO" ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={preview.url}
                  className="max-h-[65vh] w-full rounded-lg"
                />
              ) : (
                <div className="rounded-lg bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                  Open the original document to view its contents.
                </div>
              )}
              <Button asChild variant="outline" className="w-fit">
                <a href={preview.url} target="_blank" rel="noreferrer">
                  Open original <ExternalLink className="size-4" />
                </a>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
