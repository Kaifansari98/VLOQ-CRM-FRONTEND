"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import axios from "axios";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { fetchNotifications } from "@/api/notifications"
import { useAppSelector } from "@/redux/store"
import { useDispatch } from "react-redux"
import {
  addNotification,
  setNotifications,
} from "@/redux/slices/notificationsSlice"
import { NotificationItem } from "@/types/notifications"

const POLL_INTERVAL_MS = 30000

const getUnreadIds = (items: NotificationItem[]) =>
  items.filter((item) => !item.is_read).map((item) => item.id)

export const useNotifications = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useAppSelector((state) => state.auth.user)
  const notifications = useAppSelector((state) => state.notifications.items)
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount)
  const [isLoading, setIsLoading] = useState(false)

  const hasInitializedRef = useRef(false)
  const previousUnreadRef = useRef<Set<number>>(new Set())
  const notificationsRef = useRef<NotificationItem[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const refresh = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!user?.id || !user?.vendor_id) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      if (!options.silent) {
        setIsLoading(true)
      }

      try {
        const { notifications, unreadCount } = await fetchNotifications(
          user.vendor_id,
          user.id,
          { signal: abortController.signal }
        )
        const sortedItems = [...notifications].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        dispatch(
          setNotifications({
            items: sortedItems,
            unreadCount,
          })
        )
        queryClient.invalidateQueries({ queryKey: ["broadcasts"] });

        if (typeof window !== "undefined") {
          const nextUnreadIds = new Set(getUnreadIds(sortedItems))
          const shouldNotify =
            hasInitializedRef.current &&
            "Notification" in window &&
            Notification.permission === "granted"

          if (shouldNotify) {
            sortedItems
              .filter(
                (item) =>
                  !item.is_read && !previousUnreadRef.current.has(item.id)
              )
              .forEach((item) => {
                toastManager.add({ title: item.title || "New notification", type: "info" })
              })
          }

          previousUnreadRef.current = nextUnreadIds
          hasInitializedRef.current = true
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return
        }
        if (!options.silent) {
          toastManager.add({ title: "Failed to load notifications", type: "error" })
        }
        console.error(error)
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsLoading(false)
        }
      }
    },
    [dispatch, user?.id, user?.vendor_id]
  )

  useEffect(() => {
    if (!user?.id || !user?.vendor_id) return
    refresh()
    const intervalId = window.setInterval(
      () => refresh({ silent: true }),
      POLL_INTERVAL_MS
    )
    return () => window.clearInterval(intervalId)
  }, [refresh, user?.id, user?.vendor_id])

  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!user?.id || !user?.vendor_id) return

    let unsubscribe: (() => void) | undefined

    const setupForegroundListener = async () => {
      try {
        const { onMessage } = await import("firebase/messaging")
        const { getFirebaseMessaging } = await import("@/utils/firebase")
        const messaging = await getFirebaseMessaging()
        if (!messaging) return

        unsubscribe = onMessage(messaging, (payload) => {
          const notificationId = Number(payload.data?.notification_id)
          const nextId = Number.isFinite(notificationId)
            ? notificationId
            : Date.now()

          const nextItem: NotificationItem = {
            id: nextId,
            title:
              payload.data?.title ??
              payload.notification?.title ??
              "Notification",
            message:
              payload.data?.body ??
              payload.notification?.body ??
              "",
            type: payload.data?.type as NotificationItem["type"],
            created_at: new Date().toISOString(),
            is_read: false,
            redirect_url: payload.data?.redirect_url ?? null,
          }

          const exists = notificationsRef.current.some(
            (item) => item.id === nextItem.id
          )
          if (exists) return

          dispatch(addNotification(nextItem))
          toastManager.add({ title: nextItem.title || "New notification", type: "info" })

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const browserNotification = new Notification(
              nextItem.title || "Notification",
              {
                body: nextItem.message,
                data: {
                  redirect_url: nextItem.redirect_url ?? "",
                },
              }
            )
            browserNotification.onclick = () => {
              const redirectUrl =
                (browserNotification as Notification).data?.redirect_url
              if (!redirectUrl) return
              if (/^https?:\/\//i.test(redirectUrl)) {
                window.location.assign(redirectUrl)
                return
              }
              window.location.assign(redirectUrl)
            }
          }
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message.toLowerCase() : ""
        const name = error instanceof Error ? error.name : ""

        if (
          name === "AbortError" ||
          message.includes("push service not available") ||
          message.includes("messaging is not supported")
        ) {
          return
        }

        console.error("Failed to setup notifications listener", error)
      }
    }

    setupForegroundListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [dispatch, user?.id, user?.vendor_id])

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
  }
}
