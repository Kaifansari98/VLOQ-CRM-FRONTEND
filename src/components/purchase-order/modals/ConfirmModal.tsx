"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  loading,
  withRemarks,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading: boolean;
  withRemarks?: boolean;
  onConfirm: (remarks?: string) => void;
  onClose: () => void;
}) {
  const [remarks, setRemarks] = useState("");

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "rounded-2xl p-3",
              danger ? "bg-red-100" : "bg-indigo-100"
            )}
          >
            {danger ? (
              <AlertTriangle size={20} className="text-red-600" />
            ) : (
              <CheckCircle2 size={20} className="text-indigo-600" />
            )}
          </div>

          <div>
            <p className="text-base font-black">{title}</p>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
        </div>

        {withRemarks && (
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Remarks optional..."
            className="mb-4 w-full resize-none rounded-2xl border bg-muted/30 p-3 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
          />
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={() => onConfirm(remarks || undefined)}
            disabled={loading}
            className={cn(
              "gap-1.5",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}