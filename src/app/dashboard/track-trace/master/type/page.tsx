"use client";
import { useAppSelector } from "@/redux/store";
import { Tag } from "lucide-react";
import { SimpleMasterPage } from "@/components/track-trace/SimpleMasterPage";
import { useTypes, useCreateType, useUpdateType, useToggleTypeStatus, useDeleteType } from "@/hooks/track-trace/useMasters";

export default function TypeMasterPage() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId   = useAppSelector((s) => s.auth.user?.id);
  const { data: items = [], isLoading, isError } = useTypes(vendorId);
  const createMutation = useCreateType(vendorId);
  const updateMutation = useUpdateType(vendorId);
  const toggleMutation = useToggleTypeStatus(vendorId);
  const deleteMutation = useDeleteType(vendorId);

  return (
    <SimpleMasterPage
      title="Type"
      description="Manage product types (e.g. Modular, Semi-Modular, Custom)"
      nameKey="type_name"
      namePlaceholder="e.g. Modular"
      icon={Tag}
      items={items}
      isLoading={isLoading}
      isError={isError}
      createMutation={createMutation}
      updateMutation={updateMutation}
      toggleMutation={toggleMutation}
      deleteMutation={deleteMutation}
      vendorId={vendorId ?? 0}
      userId={userId ?? 0}
    />
  );
}
