"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Download,
  User2,
  Calendar,
  IndianRupee,
  Image,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useClientApprovalDetails } from "@/api/client-approval";
import { useAppSelector } from "@/redux/store";

interface Props {
  leadId: number;
}

export default function ClientApprovalDetails({ leadId }: Props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data, isLoading, isError, refetch } = useClientApprovalDetails(
    vendorId,
    leadId
  );

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format currency helper
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return "N/A";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN").format(numAmount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading Client Approval Details...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <p className="text-sm text-destructive font-medium">
            Failed to load client approval details.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { screenshots, paymentInfo, paymentFile } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 w-full mx-auto"
    >
      {/* Payment Information */}
      {paymentInfo && (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Payment Details</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Transaction information and proof
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Row 1: Amount + Date + Proof */}
            <div className="flex w-full flex-col lg:flex-row gap-6 justify-between">
              {/* Amount & Date */}
              <div className="w-full">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Amount Received
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{formatCurrency(paymentInfo.amount)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Payment Date
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDate(paymentInfo.payment_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Remark */}
              <div className="w-full">
                {paymentInfo.payment_text && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Remark
                      </p>
                      <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg border">
                        {paymentInfo.payment_text}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <Separator />
            {/* Payment Proof */}
            {paymentFile && (
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Payment Proof
                </p>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {paymentFile.doc_original_name || "Payment Document"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Payment documentation
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        window.open(
                          paymentFile.signedUrl || paymentFile.doc_sys_name,
                          "_blank"
                        )
                      }
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href =
                          paymentFile.signedUrl || paymentFile.doc_sys_name;
                        link.download =
                          paymentFile.doc_original_name || "payment-proof";
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Screenshots */}
      {screenshots && screenshots.length > 0 && (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Approval Screenshots
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {screenshots.length} file{screenshots.length > 1 ? "s" : ""}{" "}
                    uploaded
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {screenshots.map((s: any) => {
                const imageUrl = s.signedUrl || s.doc_sys_name;
                return (
                  <motion.div
                    key={s.id}
                    whileHover={{ scale: 1.03 }}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-lg bg-muted"
                    onClick={() => window.open(imageUrl, "_blank")}
                  >
                    <img
                      src={imageUrl}
                      alt={s.doc_original_name || "Approval Screenshot"}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement("div");
                          fallback.className =
                            "w-full h-full flex flex-col items-center justify-center bg-muted";
                          fallback.innerHTML = `
                            <svg class="w-12 h-12 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span class="text-xs text-muted-foreground">Image</span>
                          `;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium truncate">
                          {s.doc_original_name || "Screenshot"}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Eye className="w-3 h-3 text-white" />
                          <span className="text-[10px] text-white/80">
                            Click to view
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
