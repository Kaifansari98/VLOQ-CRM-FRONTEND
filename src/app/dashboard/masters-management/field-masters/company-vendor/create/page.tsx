"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCreateCompanyVendorPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/inventory/master/company-vendor/create");
  }, [router]);

  return (
    <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground animate-pulse">
      Redirecting to Inventory Management Master...
    </div>
  );
}
