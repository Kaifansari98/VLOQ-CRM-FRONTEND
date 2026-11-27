"use client";

import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toastManager } from "@/components/ui/toast";

/**
 * Re-upload for an approved document of a small order lead (super-admin only;
 * the caller decides whether to show it). The new file replaces the old one.
 */
export function ReuploadDocumentButton({
  vendorId,
  leadId,
  requestDocumentId,
  fileName,
}: {
  vendorId: number;
  leadId: number;
  /** SmallOrderRequestDocument id */
  requestDocumentId: number;
  fileName: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      await apiClient.post(
        `/leads/small-order-requests/vendor/${vendorId}/lead/${leadId}/documents/${requestDocumentId}/reupload`,
        body,
        { headers: { "Content-Type": "multipart/form-data" }, timeout: 180_000 },
      );
      toastManager.add({ title: `“${fileName}” replaced with “${file.name}”`, type: "success" });
      await queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toastManager.add({
        title: typeof message === "string" && message ? message : "Couldn't re-upload the document.",
        type: "error",
      });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        title={`Re-upload ${fileName}`}
        aria-label="Re-upload document"
        className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-800/40 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        <span>{busy ? "Uploading…" : "Re-upload"}</span>
      </button>
    </>
  );
}
