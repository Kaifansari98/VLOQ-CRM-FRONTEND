"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type as string | undefined,
  );
  const normalizedUserType = userType
    ?.trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  const isMasterAdmin = normalizedUserType === "master-admin";

  useEffect(() => {
    if (isMasterAdmin) return;

    toastManager.add({
      title: "You do not have access to the Vendors page.",
      type: "error",
    });

    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/dashboard");
    }
  }, [isMasterAdmin, router]);

  if (!isMasterAdmin) return null;

  return <>{children}</>;
}
