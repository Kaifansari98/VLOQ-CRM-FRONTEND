"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyEditCompanyVendorPage() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/inventory/master/company-vendor/edit/${id}`);
    }
  }, [id, router]);

  return (
    <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground animate-pulse">
      Redirecting to Inventory Management Master...
    </div>
  );
}
