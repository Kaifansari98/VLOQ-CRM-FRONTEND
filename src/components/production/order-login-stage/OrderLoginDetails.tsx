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

  // 🧩 Handle submit for both create + update
  const handleSubmitAll = async () => {
    const formatted = Object.entries(breakups)
      .filter(([_, val]) => val.item_desc?.trim()) // only filled
      .map(([title, val]) => {
        const existing = orderLoginData?.find(
          (item: any) => item.item_type === title
        );
        return {
          id: existing?.id || null,
          item_type: title,
          item_desc: val.item_desc || "N/A",
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

    // Split into Create + Update (only changed updates)
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

    try {
      if (updates.length > 0) await updateMultiple(updates);
      if (newRecords.length > 0) await uploadMultiple(newRecords);

      toast.success("Order login records processed successfully ✅");
      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
    } catch (err: any) {
      console.error("❌ Error processing order login:", err);
      toast.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className=" space-y-6 overflow-y-scroll h-full">
      <SmoothTab
        defaultTabId="approved-docs"
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
          
                    <Button size="sm" onClick={handleSubmitAll} disabled={isPending}>
                      {isPending ? "Processing..." : "Save Order Login"}
                    </Button>
                  </div>
                </div>
          
                <div className="grid grid-cols-1 gap-4">
                  {defaultCards.map(({ title }) => (
                    <FileBreakUpField
                      key={`default-${title}`}
                      title={title}
                      users={users}
                      value={
                        breakups[title] || { item_desc: "", company_vendor_id: null }
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
