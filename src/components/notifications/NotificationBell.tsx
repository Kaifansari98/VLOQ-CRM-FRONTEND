"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CountBadge } from "@/components/count-badge"
import { useNotifications } from "@/hooks/useNotifications"
import { useAppSelector } from "@/redux/store"
import { markNotificationRead } from "@/redux/slices/notificationsSlice"
import { markNotificationRead as markReadApi } from "@/api/notifications"
import { NotificationItem } from "@/types/notifications"
import { NotificationDropdownList } from "@/components/notifications/NotificationDropdownList"

interface NotificationBellProps {
  linkTo?: string
}

export const NotificationBell = ({ linkTo }: NotificationBellProps) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const { notifications, unreadCount, isLoading, refresh } = useNotifications()
  const [open, setOpen] = useState(false)
  const latestNotifications = notifications.slice(0, 5)

  if (linkTo) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => router.push(linkTo)}
      >
        <Bell />
        <CountBadge count={unreadCount} className="absolute -right-1 -top-1" />
        <span className="sr-only">Notifications</span>
      </Button>
    )
  }

  const handleNavigate = (redirectUrl: string) => {
    if (/^https?:\/\//i.test(redirectUrl)) {
      window.location.assign(redirectUrl)
      return
    }
    router.push(redirectUrl)
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    setOpen(false)

    if (user?.id && !notification.is_read) {
      dispatch(markNotificationRead(notification.id))
      try {
        await markReadApi(notification.id, user.id)
      } catch {
        refresh({ silent: true })
      }
    }

    if (notification.redirect_url) {
      handleNavigate(notification.redirect_url)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          <CountBadge
            count={unreadCount}
            className="absolute -right-1 -top-1"
          />
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-lg p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          <Link
            href="/dashboard/notifications"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <DropdownMenuSeparator />
        <NotificationDropdownList
          notifications={latestNotifications}
          isLoading={isLoading}
          onNotificationClick={handleNotificationClick}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
