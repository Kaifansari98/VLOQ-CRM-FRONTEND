"use client";

import { validateSessionApi } from "@/api/auth";
import { forceClientLogout } from "@/lib/sessionCleanup";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";

const PUBLIC_PATHS = ["/login", "/privacy-policy", "/terms", "/data-deletion"];

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const authToken = useAppSelector((state) => state.auth.token);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const [isReady, setIsReady] = useState(isPublicPath);
  const hasReduxSession = Boolean(authUser && authToken);

  useEffect(() => {
    if (isPublicPath) {
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
  }, [dispatch, pathname, router, isPublicPath]);

  if (!isPublicPath && !hasReduxSession) {
    return null;
  }

  if (!isReady) return null;

  return <>{children}</>;
}
