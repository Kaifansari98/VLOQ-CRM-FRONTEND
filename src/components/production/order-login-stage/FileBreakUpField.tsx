"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AssignToPicker from "@/components/assign-to-picker";
import TextAreaInput from "@/components/origin-text-area";
import { useAppSelector } from "@/redux/store";
import {
  useUploadFileBreakup,
  useUpdateOrderLogin,
} from "@/api/production/order-login";
import { z } from "zod";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  item_desc: z.string().min(1, "Description is required."),
  company_vendor_id: z.number().nullable().optional(),
});

interface FileBreakUpFieldProps {
  title: string;
  users: { id: number; label: string }[];
  isMandatory?: boolean;
  leadId?: number;
  accountId?: number;
  existingData?: any; // ← fetched from parent (if any)
  onSuccess?: () => void;
}

const FileBreakUpField: React.FC<FileBreakUpFieldProps> = ({
  title,
  users,
  isMandatory = false,
  leadId,
  accountId,
  existingData,
  onSuccess,
}) => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [desc, setDesc] = useState("");
  const [orderLoginId, setOrderLoginId] = useState<number | null>(null);

  const createMutation = useUploadFileBreakup(vendorId);
  const updateMutation = useUpdateOrderLogin(vendorId);

  const queryClient = useQueryClient();

  const refetchKey = ["orderLoginByLead", vendorId, leadId];
  const refetchKey2 = ["leadProductionReadiness", vendorId, leadId];

  // 🧩 Prefill data from existing order login (if available)
  useEffect(() => {
    if (existingData) {
      setOrderLoginId(existingData.id);
      setDesc(existingData.item_desc || "");
      setSelectedVendor(existingData.company_vendor_id || null);
    }
  }, [existingData]);

  const handleSubmit = async () => {
    const validation = schema.safeParse({
      item_desc: desc,
      company_vendor_id: selectedVendor,
    });

    if (!validation.success) {
      const firstError = validation.error.issues?.[0]?.message;
      toast.error(firstError || "Validation failed");
      return;
    }

    const payload = {
      lead_id: leadId,
      account_id: accountId,
      item_type: title,
      item_desc: desc || "N/A",
      company_vendor_id: selectedVendor,
      updated_by: userId,
      created_by: userId,
    };

    if (orderLoginId) {
      // ✅ Update existing
      updateMutation.mutate(
        { orderLoginId, payload },
        {
          onSuccess: () => {
            toast.success(`${title} updated successfully`);
            queryClient.invalidateQueries({ queryKey: refetchKey });
            queryClient.invalidateQueries({ queryKey: refetchKey2 });
            onSuccess?.(); // trigger parent callback if passed
          },
          onError: (err: any) =>
            toast.error(err?.response?.data?.message || "Update failed"),
        }
      );
    } else {
      // ✅ Create new
      createMutation.mutate(payload, {
        onSuccess: (res: any) => {
          toast.success(`${title} created successfully`);
          setOrderLoginId(res.data?.id);

          queryClient.invalidateQueries({
            queryKey: ["orderLoginByLead", vendorId, leadId],
          });

          queryClient.invalidateQueries({ queryKey: refetchKey2 });

          onSuccess?.(); // trigger parent callback
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Create failed"),
      });
    }
  };

  const handleRefresh = () => {
    setSelectedVendor(null);
    setDesc("");
  };

  return (
    <div className="rounded-xl border p-4 bg-card shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="font-medium text-sm flex items-center gap-1">
          {title}
          {isMandatory && <span className="text-red-500">*</span>}
        </p>

        <div className="w-full sm:w-1/4">
          <AssignToPicker
            data={users}
            value={selectedVendor ?? undefined}
            onChange={(id) => setSelectedVendor(id)}
            placeholder="Search vendor..."
          />
        </div>
      </div>

      <TextAreaInput
        value={desc}
        onChange={(val) => setDesc(val)}
        placeholder={`Enter description for ${title}`}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {orderLoginId
            ? updateMutation.isPending
              ? "Updating..."
              : "Update"
            : createMutation.isPending
            ? "Submitting..."
            : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default FileBreakUpField;
