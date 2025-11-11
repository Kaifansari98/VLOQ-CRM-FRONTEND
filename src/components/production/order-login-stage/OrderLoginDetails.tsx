"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useCompanyVendors,
  useOrderLoginByLead,
  useUpdateMultipleOrderLogins,
  useUploadMultipleFileBreakupsByLead,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import FileBreakUpField from "./FileBreakUpField";
import AddSectionModal from "./AddSectionModal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import ProductionFilesSection from "./ProductionFilesModal";
import ApprovedDocsSection from "./ApprovedDocsModal";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useClientRequiredCompletionDate } from "@/api/tech-check";

interface OrderLoginDetailsProps {
  leadId: number;
  accountId: number;
  name?: string;
}

const OrderLoginDetails: React.FC<OrderLoginDetailsProps> = ({
  leadId,
  accountId,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: companyVendors } = useCompanyVendors(vendorId);
  const { data: orderLoginData } = useOrderLoginByLead(vendorId, leadId);

  const queryClient = useQueryClient();

  // 🧩 Local state for editable breakup fields
  const [breakups, setBreakups] = useState<
    Record<string, { item_desc: string; company_vendor_id: number | null }>
  >({});

  const [activeTab, setActiveTab] = useState("order-login");

  // 🧩 Handlers
  const handleFieldChange = (title: string, field: string, value: any) => {
    setBreakups((prev) => ({
      ...prev,
      [title]: {
        ...prev[title],
        [field]: value,
      },
    }));
  };

  // 🧩 Mutations
  const { mutateAsync: updateMultiple } = useUpdateMultipleOrderLogins(
    vendorId,
    leadId
  );
  const { mutateAsync: uploadMultiple, isPending } =
    useUploadMultipleFileBreakupsByLead(vendorId, leadId, accountId);

  const { data, isLoading } = useClientRequiredCompletionDate(vendorId, leadId);

  // 🧩 Vendors for dropdowns
  const users =
    companyVendors?.map((vendor: any) => ({
      id: vendor.id,
      label: vendor.company_name,
    })) || [];

  // 🧩 Mandatory + Default Titles
  const mandatoryTitles = ["Carcass", "Shutter", "Stock Hardware"];
  const defaultTitles = [
    ...mandatoryTitles,
    "Special Hardware",
    "Profile Shutter",
    "Outsourced Shutter",
    "Glass Material",
  ];

  // 🧩 Default and Extra Cards
  const defaultCards = useMemo(
    () =>
      defaultTitles.map((title) => ({
        title,
        existingData: orderLoginData?.find((i: any) => i.item_type === title),
      })),
    [orderLoginData]
  );

  const extraFromApi = useMemo(
    () =>
      (orderLoginData || []).filter(
        (i: any) => !defaultTitles.includes(i.item_type)
      ),
    [orderLoginData]
  );

  // 🧩 Pre-fill from API data
  useEffect(() => {
    if (orderLoginData && orderLoginData.length > 0) {
      const prefilled = orderLoginData.reduce((acc: any, item: any) => {
        acc[item.item_type] = {
          item_desc: item.item_desc || "",
          company_vendor_id: item.company_vendor_id || null,
        };
        return acc;
      }, {});
      setBreakups(prefilled);
    }
  }, [orderLoginData]);

  const handleSubmitAll = async () => {
    try {
      const clearedItems = Object.entries(breakups).filter(([title, val]) => {
        const existing = orderLoginData?.find(
          (item: any) => item.item_type === title
        );

        return existing && (!val.item_desc || val.item_desc.trim() === "");
      });

      if (clearedItems.length > 0) {
        const names = clearedItems.map(([title]) => title).join(", ");
        toast.error(`Description cannot be empty for: ${names}`);
        return;
      }

      const formatted = Object.entries(breakups)
        .filter(([_, val]) => val.item_desc?.trim())
        .map(([title, val]) => {
          const existing = orderLoginData?.find(
            (item: any) => item.item_type === title
          );
          return {
            id: existing?.id || null,
            item_type: title,
            item_desc: val.item_desc.trim(),
            company_vendor_id: val.company_vendor_id,
            created_by: userId,
            updated_by: userId,
          };
        });

      if (formatted.length === 0) {
        toast.info(
          "Please fill at least one order login field before submitting."
        );
        return;
      }

      const newRecords = formatted.filter((r) => !r.id);
      const updates = formatted.filter((r) => {
        const existing = orderLoginData?.find((i: any) => i.id === r.id);
        return (
          r.id &&
          (!existing ||
            existing.item_desc !== r.item_desc ||
            existing.company_vendor_id !== r.company_vendor_id)
        );
      });

      if (updates.length > 0) await updateMultiple(updates);
      if (newRecords.length > 0) await uploadMultiple(newRecords);

      toast.success("Order login records processed successfully ✅");

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
    } catch (err: any) {
      console.error("❌ Error processing order login:", err);
      toast.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
  };

  return (
    <div className="space-y-6 overflow-y-scroll h-full">
      <motion.div
        className=" w-full flex items-center justify-start gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Animated green circle */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full h-full space-y-8 overflow-y-scroll"
        >
          {/* 🔹 Client Required Completion Section */}
          <motion.div
            className="flex items-center gap-3 bg-muted/40 border border-border rounded-lg px-4 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ✅ Animated green status dot */}
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: "easeInOut",
              }}
            />

            {/* ✅ Text + Date */}
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground tracking-wide">
                Client required delivery date
              </p>
              <span className="text-sm font-medium text-foreground mt-0.5">
                {data?.client_required_order_login_complition_date
                  ? new Date(
                      data.client_required_order_login_complition_date
                    ).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Not specified"}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
      <SmoothTab
        defaultTabId="approved-docs"
        className="-mt-3"
        items={[
          {
            id: "approved-docs",
            title: "Approved Documents",
            color: "bg-blue-500 hover:bg-purple-600",
            cardContent: (
              <div>
                <ApprovedDocsSection leadId={leadId} />
              </div>
            ),
          },
          {
            id: "order-login",
            title: "Order Login",
            color: "bg-green-500 hover:bg-blue-600",
            cardContent: (
              <div className="h-[calc(100vh-200px)] overflow-y-auto space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Order Login</h2>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitAll}
                      disabled={isPending}
                    >
                      {isPending ? "Processing..." : "Save Order Login"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {defaultCards.map(({ title }) => (
                    <FileBreakUpField
                      key={`default-${title}`}
                      title={title}
                      users={users}
                      value={
                        breakups[title] || {
                          item_desc: "",
                          company_vendor_id: null,
                        }
                      }
                      onChange={handleFieldChange}
                      isMandatory={mandatoryTitles.includes(title)}
                    />
                  ))}

                  {extraFromApi.map((item: any) => (
                    <FileBreakUpField
                      key={`extra-${item.id ?? item.item_type}`}
                      title={item.item_type}
                      users={users}
                      value={
                        breakups[item.item_type] || {
                          item_desc: item.item_desc || "",
                          company_vendor_id: item.company_vendor_id || null,
                        }
                      }
                      onChange={handleFieldChange}
                      isMandatory={false}
                    />
                  ))}

                  {/* Add More Section Card */}
                  <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-3 min-h-[180px] cursor-pointer group">
                    <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm text-primary mb-1">
                        Add New Section
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create custom breakup category
                      </p>
                    </div>
                    <AddSectionModal
                      users={users}
                      leadId={leadId}
                      accountId={accountId}
                      onSectionAdded={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["orderLoginByLead", vendorId, leadId],
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "production-files",
            title: "Production Files",
            color: "bg-purple-500 hover:bg-emerald-600",
            cardContent: (
              <div>
                <ProductionFilesSection leadId={leadId} accountId={accountId} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default OrderLoginDetails;
