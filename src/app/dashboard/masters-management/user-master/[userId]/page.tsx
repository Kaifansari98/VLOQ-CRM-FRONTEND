"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function UserMasterIdRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const userIdParam = params?.userId;
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
  const vendorId = searchParams.get("vendor_id");

  useEffect(() => {
    if (userId) {
      router.replace(
        `/dashboard/masters-management/user-master/${userId}/privileges${
          vendorId ? `?vendor_id=${vendorId}` : ""
        }`
      );
    } else {
      router.replace("/dashboard/masters-management/user-master");
    }
  }, [userId, vendorId, router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      Redirecting to User Privileges...
    </div>
  );
}

