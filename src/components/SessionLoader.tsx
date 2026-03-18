"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loadSession } from "@/redux/slices/authSlice"

export function SessionLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadSession())
  }, [dispatch])

  return null
}