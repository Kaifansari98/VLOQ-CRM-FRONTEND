"use client";

import { ProductMasterFormPage } from "@/components/inventory/ProductMasterFormPage";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();

  return <ProductMasterFormPage mode="edit" productId={Number(id)} />;
}