"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token && !user) {
      router.replace("/login"); // redirect to login
      console.log();
    }
  }, [router]);
  return <>{children}</>;
}
