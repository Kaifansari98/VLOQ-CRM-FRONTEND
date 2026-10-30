"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewPurchaseIntentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/inventory/purchase-intents?new=true");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </div>
  );
}