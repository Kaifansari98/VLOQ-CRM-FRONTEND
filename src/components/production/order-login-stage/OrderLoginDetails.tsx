"use client";

import React, { useMemo } from "react";
import {
  useCompanyVendors,
  useOrderLoginByLead,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import FileBreakUpField from "./FileBreakUpField";
import AddSectionModal from "./AddSectionModal";
import ApprovedDocsModal from "./ApprovedDocsModal";
import { useQueryClient } from "@tanstack/react-query";

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
  const { data: companyVendors } = useCompanyVendors(vendorId);
  const { data: orderLoginData } = useOrderLoginByLead(vendorId, leadId);
  const queryClient = useQueryClient();

  const users =
    companyVendors?.map((vendor: any) => ({
      id: vendor.id,
      label: vendor.company_name,
    })) || [];

  // ✅ Mandatory + Default titles
  const mandatoryTitles = ["Carcass", "Shutter", "Stock Hardware"];
  const defaultTitles = [
    ...mandatoryTitles,
    "Special Hardware",
    "Profile Shutter",
    "Outsourced Shutter",
    "Glass Material",
  ];

  // ✅ Build lists: always the 7 default first, then API-only extras
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

  return (
    <div className="py-4 px-2 space-y-6 overflow-y-scroll h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Order login</h2>
        </div>

        <div className="flex items-center justify-end gap-2">
          <ApprovedDocsModal leadId={leadId} />

          {/* Add More Section → on success just refetch */}
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

      {/* Cards: 7 defaults always, then API extras */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4">
        {/* 7 defaults (always rendered) */}
        {defaultCards.map(({ title, existingData }) => (
          <FileBreakUpField
            key={`default-${title}`}
            title={title}
            users={users}
            leadId={leadId}
            accountId={accountId}
            existingData={existingData}
            isMandatory={mandatoryTitles.includes(title)}
          />
        ))}

        {/* Extra cards that only come from API */}
        {extraFromApi.map((item: any) => (
          <FileBreakUpField
            key={`extra-${item.id ?? item.item_type}`}
            title={item.item_type}
            users={users}
            leadId={leadId}
            accountId={accountId}
            existingData={item}
            isMandatory={false}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderLoginDetails;
