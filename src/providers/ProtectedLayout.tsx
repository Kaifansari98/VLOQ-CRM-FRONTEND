"use client";

import { validateSessionApi } from "@/api/auth";
import { forceClientLogout } from "@/lib/sessionCleanup";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/redux/store";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setIsReady(true);
      return;
    }

    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.replace("/login");
      setIsReady(false);
      return;
    }

    let cancelled = false;

    const checkSession = async () => {
      try {
        await validateSessionApi();
        if (!cancelled) {
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          setIsReady(false);
          forceClientLogout(dispatch);
        }
      }
    };

    setIsReady(false);
    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [dispatch, pathname, router]);

  if (!isReady) return null;

  return <>{children}</>;
}
