"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Building2, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import OrderLoginModal from "./OrderLoginModal";
import { useHandleOrderLoginCompletion } from "@/api/production/production-api";
import { useAppSelector } from "@/redux/store";

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

  const initial =
    companyVendorName && companyVendorName.length > 0
      ? companyVendorName.charAt(0).toUpperCase()
      : "";

  const hasVendorInfo =
    (companyVendorName && companyVendorName.trim() !== "") ||
    (companyVendorContact && companyVendorContact.trim() !== "");

  // Determine status based on markedAsCompletedDate
  const isCompleted =
    markedAsCompletedDate && markedAsCompletedDate.trim() !== "";

  return (
    <>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -4 }}
        onClick={() => setOpen(true)}
      >
        <Card className="group h-full relative overflow-hidden border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-950 shadow-sm hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 cursor-pointer">
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10">
            <CardHeader className="">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {title}
                </CardTitle>
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                  </div>
                </motion.div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {isCompleted ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </div>
                )}
              </motion.div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                {desc || "No description available."}
              </p>

              {/* Vendor Info */}
              {hasVendorInfo && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  {companyVendorName && (
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-sm">
                          {initial}
                        </span>
                      </div>
                      {isCompleted && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-950 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {companyVendorName}
                    </p>
                    {companyVendorContact && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {companyVendorContact}
                      </p>
                    )}
                  </div>
                  <Building2 className="w-4 h-4 text-gray-300 dark:text-gray-700 flex-shrink-0" />
                </div>
              )}
            </CardContent>
          </div>
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
