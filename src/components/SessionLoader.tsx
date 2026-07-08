"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loadSession } from "@/redux/slices/authSlice"
import { loadCustomPrivileges } from "@/redux/slices/customPrivilegesSlice"
import { loadThemeFromStorage } from "@/redux/slices/themeSlice"

import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { updateFavicon } from "@/utils/favicon"

export function SessionLoader() {
  const dispatch = useDispatch()
  const vendorIconUrl = useSelector(
    (state: RootState) => state.auth.user?.vendor?.iconUrl || state.auth.user?.iconUrl
  )

  const isShambhala =
    typeof window !== "undefined" &&
    window.location.hostname.includes("shambhala");

  useEffect(() => {
    dispatch(loadSession())
    dispatch(loadCustomPrivileges())
    dispatch(loadThemeFromStorage())
  }, [dispatch])

  useEffect(() => {
    console.log("SessionLoader: Resolved vendorIconUrl from Redux = ", vendorIconUrl);
    if (vendorIconUrl) {
      updateFavicon(vendorIconUrl);
    } else if (isShambhala) {
      updateFavicon("/logos/shambhala-short-logo.png");
    } else {
      updateFavicon(null);
    }
  }, [vendorIconUrl, isShambhala])

  return null
}
