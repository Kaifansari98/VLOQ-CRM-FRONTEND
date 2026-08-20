"use client";

import React, { useState, useRef } from "react";
import { useAppSelector } from "@/redux/store";
import { apiClient } from "@/lib/apiClient";
import { toastManager } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FailedRow {
  rowNumber: number;
  name: string;
  error: string;
  type?: string;
}

interface UploadResult {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  invalidCount: number;
  failedCount: number;
  failedRows: FailedRow[];
  duplicateRows: FailedRow[];
  invalidRows: FailedRow[];
}

export function BulkUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: BulkUploadModalProps) {
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id;

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toastManager.add({ title: "Please select an Excel or CSV file.", type: "error" });
      return;
    }

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendor_id", String(vendorId));
    formData.append("created_by", String(user?.id));

    try {
      const res = await apiClient.post("/online-leads/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        const uploadResult: UploadResult = res.data.data;
        setResult(uploadResult);
        toastManager.add({
          title: `Bulk upload completed. Imported ${uploadResult.successCount} leads, skipped ${uploadResult.duplicateCount} duplicates.`,
          type: uploadResult.failedCount > 0 || uploadResult.invalidCount > 0 ? "info" : "success",
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toastManager.add({
          title: res.data?.error || "Failed to process bulk upload.",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      toastManager.add({
        title: err.response?.data?.error || "Error occurred during file upload.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Combine row errors and skips for easy viewing
  const allFailures = result
    ? [
        ...(result.invalidRows || []).map((r) => ({ ...r, type: "Invalid" })),
        ...(result.duplicateRows || []).map((r) => ({ ...r, type: "Duplicate" })),
        ...(result.failedRows || []).map((r) => ({ ...r, type: "Failed" })),
      ].sort((a, b) => a.rowNumber - b.rowNumber)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-background border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-slate-900 dark:text-white" />
            Bulk Upload Leads
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls) or CSV (.csv) file to import multiple store walk-in leads into the Lead Pool at once.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Inner Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* File Upload Drop Area */}
          {!result && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition duration-150 hover:border-slate-400 dark:hover:border-slate-700 ${
                file
                  ? "border-emerald-400 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10"
                  : "border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <Upload
                className={`w-10 h-10 mb-3 ${
                  file ? "text-emerald-500 animate-pulse" : "text-slate-400"
                }`}
              />
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Selected File: {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB — Click to change file
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Click to browse and select file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports Excel (.xlsx, .xls) and CSV (.csv) files
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upload Results Panel */}
          {result && (
            <div className="border border-slate-200 dark:border-slate-850 rounded-lg p-5 bg-slate-50 dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5 border-b pb-2 dark:border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Upload Result Summary
              </h3>

              {/* 5-Metric Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="bg-background border dark:border-slate-800 rounded-lg p-2 shadow-xs flex flex-col justify-center">
                  <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">Processed</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">{result.totalRows}</span>
                </div>
                <div className="bg-background border dark:border-slate-800 rounded-lg p-2 shadow-xs border-emerald-100 dark:border-emerald-950 flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold uppercase tracking-wider">Added</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{result.successCount}</span>
                </div>
                <div className="bg-background border dark:border-slate-800 rounded-lg p-2 shadow-xs border-amber-100 dark:border-amber-950 flex flex-col justify-center">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold uppercase tracking-wider">Duplicates</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{result.duplicateCount}</span>
                </div>
                <div className="bg-background border dark:border-slate-800 rounded-lg p-2 shadow-xs border-orange-100 dark:border-orange-950 flex flex-col justify-center">
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 block font-semibold uppercase tracking-wider">Invalid</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-0.5">{result.invalidCount}</span>
                </div>
                <div className="bg-background border dark:border-slate-800 rounded-lg p-2 shadow-xs border-rose-100 dark:border-rose-950 flex flex-col justify-center">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold uppercase tracking-wider">Failed</span>
                  <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">{result.failedCount}</span>
                </div>
              </div>

              {/* Categorized Failures List */}
              {allFailures.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> List of Row Failures/Skips:
                  </Label>
                  <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1.5">
                    {allFailures.map((fail, index) => {
                      const badgeColor =
                        fail.type === "Duplicate"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/30"
                          : fail.type === "Invalid"
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/30"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/30";

                      return (
                        <div
                          key={index}
                          className="text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 p-2 bg-background border dark:border-slate-850 rounded shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${badgeColor}`}>
                              {fail.type}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Row {fail.rowNumber}: {fail.name}
                            </span>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {fail.error}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  size="sm"
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Upload Another File
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t p-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Close
          </Button>

          {!result && (
            <Button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold flex items-center gap-2 transition duration-200"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Start Import
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
