"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  Building2,
  CheckCircle2,
  Clock,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import OrderLoginModal from "./OrderLoginModal";
import { cn } from "@/lib/utils";
import { useParams, useSearchParams } from "next/navigation";

interface OrderLoginCardProps {
  title: string;
  orderLoginId: number;
  desc: string;
  companyVendorName?: string;
  companyVendorContact?: string;
  vendorId: number;
  leadId: number;
  factory_user_vendor_selection_remark?: string;
  estimated_completion_date?: string;
  markedAsCompletedDate?: string;
}

export default function OrderLoginCard({
  title,
  desc,
  orderLoginId,
  companyVendorName,
  companyVendorContact,
  vendorId,
  leadId,
  factory_user_vendor_selection_remark,
  estimated_completion_date,
  markedAsCompletedDate,
}: OrderLoginCardProps) {
  const [open, setOpen] = useState(false);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const searchParams = useSearchParams();
  const remark = searchParams.get("remark") || "";

  console.log("Remark from URL:", remark);

  function hyphenToSpace(text: string = ""): string {
    return text.replace(/-/g, " ").trim();
  }

  function normalizeString(str: string) {
    return str.toLowerCase().trim();
  }

  const hasVendorInfo =
    (companyVendorName && companyVendorName.trim() !== "") ||
    (companyVendorContact && companyVendorContact.trim() !== "");

  const initial =
    companyVendorName && companyVendorName.length > 0
      ? companyVendorName.charAt(0).toUpperCase()
      : "";

  const isCompleted = Boolean(
    markedAsCompletedDate && markedAsCompletedDate.trim() !== ""
  );

  const formattedDate = estimated_completion_date
    ? new Date(estimated_completion_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  // ✅ Subtle Shadcn-like badge component
  const StatusBadge = () => (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",

        // 🌑 Dark Mode → Keep exactly same
        isCompleted
          ? "dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
          : "dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",

        // ☀️ Light Mode → New premium styles
        isCompleted
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-[#fcf5dc] text-amber-700 border-amber-200"
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <Clock className="w-3.5 h-3.5" />
      )}
      <span>{isCompleted ? "Completed" : "Pending"}</span>
    </div>
  );

  useEffect(() => {
    if (!remark) return;

    const cleanedRemark = hyphenToSpace(remark); // Outsourced-Shutter → Outsourced Shutter
    const normalizedRemark = normalizeString(cleanedRemark);
    const normalizedTitle = normalizeString(title);

    if (normalizedRemark === normalizedTitle) {
      setOpen(true); // 🔥 Auto-open modal
    }
  }, [remark, title]);


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        whileHover={{ y: -4 }}
        onClick={() => setOpen(true)}
      >
        <Card
          className={cn(
            "group relative h-full justify-between overflow-hidden border bg-card transition-all duration-300 cursor-pointer"
          )}
        >
          <div className="relative z-10">
            <CardHeader className="pb-2">
              {/* 🔹 Title + Arrow */}
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-200">
                  {title}
                </CardTitle>
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                </motion.div>
              </div>

              {/* 🔹 Status + Date row */}
              <div className="flex items-center justify-between mt-2">
                <StatusBadge />
                {formattedDate && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5 opacity-70" />
                    <span className="text-foreground/90">{formattedDate}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            {/* 🔹 Description */}
            {desc && (
              <CardContent className="pt-1 pb-2">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {desc}
                </p>
              </CardContent>
            )}

          </div>
          {/* 🔹 Vendor Info (optional) */}
          {hasVendorInfo && (
            <CardContent className="pt-4 border-t border-border/50 flex items-center gap-3">
              {companyVendorName && (
                <div className="relative">
                  <div
                    className="
    w-10 h-10 rounded-full 
    bg-muted 
    dark:bg-neutral-800 
    border border-border/70 
    flex items-center justify-center 
  "
                  >
                    <span className="font-semibold text-sm text-foreground">
                      {initial}
                    </span>
                  </div>

                  {isCompleted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {companyVendorName}
                </p>
                {companyVendorContact && (
                  <p className="text-xs text-muted-foreground truncate">
                    {companyVendorContact}
                  </p>
                )}
              </div>
              <Building2 className="w-4 h-4 text-muted-foreground opacity-60 flex-shrink-0" />
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Modal */}
      <OrderLoginModal
        open={open}
        onOpenChange={setOpen}
        title={title}
        desc={desc}
        companyVendorName={companyVendorName}
        companyVendorContact={companyVendorContact}
        leadId={leadId}
        vendorId={vendorId}
        orderLoginId={orderLoginId}
        userId={userId || 0}
        changedVendorRemark={factory_user_vendor_selection_remark}
        productionDate={estimated_completion_date}
        markedAsCompletedDate={markedAsCompletedDate}
      />
    </>
  );
}
