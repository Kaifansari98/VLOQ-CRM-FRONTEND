"use client";
import { useAppSelector } from "@/redux/store";
import { Paintbrush } from "lucide-react";
import { SimpleMasterPage } from "@/components/track-trace/SimpleMasterPage";
import { useFinishes, useCreateFinish, useUpdateFinish, useToggleFinishStatus, useDeleteFinish } from "@/hooks/track-trace/useMasters";

export default function FinishMasterPage() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId   = useAppSelector((s) => s.auth.user?.id);
  const { data: items = [], isLoading, isError } = useFinishes(vendorId);
  const createMutation = useCreateFinish(vendorId);
  const updateMutation = useUpdateFinish(vendorId);
  const toggleMutation = useToggleFinishStatus(vendorId);
  const deleteMutation = useDeleteFinish(vendorId);

  return (
    <SimpleMasterPage
      title="Finish"
      description="Manage surface finishes for products (e.g. Matte, Glossy, Woodgrain)"
      nameKey="finish_name"
      namePlaceholder="e.g. Matte Finish"
      icon={Paintbrush}
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
