"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loadSession } from "@/redux/slices/authSlice"
import { loadCustomPrivileges } from "@/redux/slices/customPrivilegesSlice"
import { loadThemeFromStorage } from "@/redux/slices/themeSlice"

import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { updateFavicon } from "@/utils/favicon"
import { fetchVendorBySubdomain } from "@/api/vendors"

export function SessionLoader() {
  const dispatch = useDispatch()
  const vendorIconUrl = useSelector(
    (state: RootState) => state.auth.user?.vendor?.iconUrl || state.auth.user?.iconUrl
  )

  useEffect(() => {
    dispatch(loadSession())
    dispatch(loadCustomPrivileges())
    dispatch(loadThemeFromStorage())
  }, [dispatch])

  useEffect(() => {
    const resolveAndSetFavicon = async () => {
      console.log("SessionLoader: Resolved vendorIconUrl from Redux = ", vendorIconUrl);
      if (vendorIconUrl) {
        updateFavicon(vendorIconUrl);
        return;
      }

      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const urlParams = new URLSearchParams(window.location.search);
        let subdomain = urlParams.get("subdomain") || urlParams.get("vendor");
        
        if (!subdomain && hostname) {
          const hostParts = hostname.split(".");
          if (hostParts.length > 2) {
            subdomain = hostParts[0];
          } else if (hostname.includes("localhost") && hostParts.length > 1) {
            subdomain = hostParts[0];
          } else if (hostname.includes("vloq.com")) {
            subdomain = "vloq";
          }
        }

        if (subdomain === "localhost") {
          subdomain = null;
        }

        const applyHardcodedFallback = (sub: string) => {
          if (sub.includes("frankvin")) {
            updateFavicon(null);
            return true;
          }
          if (sub.includes("shambhala")) {
            updateFavicon("/logos/shambhala-short-logo.png");
            return true;
          }
          if (sub.includes("vloq")) {
            updateFavicon(null);
            return true;
          }
          return false;
        };

        if (subdomain || hostname.includes("localhost")) {
          try {
            const res = await fetchVendorBySubdomain("vloq");
            if (res.success && res.data?.iconUrl) {
              updateFavicon(res.data.iconUrl);
              return;
            }
          } catch (error) {
            console.error("Failed to fetch custom vendor branding for favicon:", error);
          }

          if (applyHardcodedFallback(subdomain)) {
            return;
          }
        }
      }

      updateFavicon("/logos/furnix-logo-dark.png");
    };

    resolveAndSetFavicon();
  }, [vendorIconUrl])

  return null
}
