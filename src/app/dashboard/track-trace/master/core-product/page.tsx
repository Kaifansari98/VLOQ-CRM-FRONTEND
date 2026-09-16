"use client";
import { useAppSelector } from "@/redux/store";
import { Drill } from "lucide-react";
import { SimpleMasterPage } from "@/components/track-trace/SimpleMasterPage";
import {
  useCoreProducts,
  useCreateCoreProduct,
  useUpdateCoreProduct,
  useToggleCoreProductStatus,
  useDeleteCoreProduct,
} from "@/hooks/track-trace/useMasters";

export default function CoreProductMasterPage() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId   = useAppSelector((s) => s.auth.user?.id);
  const { data: items = [], isLoading, isError } = useCoreProducts(vendorId);
  const createMutation = useCreateCoreProduct(vendorId);
  const updateMutation = useUpdateCoreProduct(vendorId);
  const toggleMutation = useToggleCoreProductStatus(vendorId);
  const deleteMutation = useDeleteCoreProduct(vendorId);

  return (
    <SimpleMasterPage
      title="Core Product"
      description="Manage core products (e.g. carcass structure types, items)"
      nameKey="core_product_name"
      namePlaceholder="e.g. Carcass"
      icon={Drill}
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
