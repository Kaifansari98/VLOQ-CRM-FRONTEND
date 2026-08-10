"use client";
import { useAppSelector } from "@/redux/store";
import { Star } from "lucide-react";
import { SimpleMasterPage } from "@/components/track-trace/SimpleMasterPage";
import { useGrades, useCreateGrade, useUpdateGrade, useToggleGradeStatus, useDeleteGrade } from "@/hooks/track-trace/useMasters";

export default function GradeMasterPage() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId   = useAppSelector((s) => s.auth.user?.id);
  const { data: items = [], isLoading, isError } = useGrades(vendorId);
  const createMutation = useCreateGrade(vendorId);
  const updateMutation = useUpdateGrade(vendorId);
  const toggleMutation = useToggleGradeStatus(vendorId);
  const deleteMutation = useDeleteGrade(vendorId);

  return (
    <SimpleMasterPage
      title="Grade"
      description="Manage material grades for products (e.g. MDF, Ply 18mm)"
      nameKey="grade_name"
      namePlaceholder="e.g. MDF 18mm"
      icon={Star}
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
