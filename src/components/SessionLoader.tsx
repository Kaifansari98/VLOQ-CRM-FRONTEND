"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loadSession } from "@/redux/slices/authSlice"
import { loadThemeFromStorage } from "@/redux/slices/themeSlice"

export function SessionLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadSession())
    dispatch(loadThemeFromStorage())
  }, [dispatch])

  return null
}