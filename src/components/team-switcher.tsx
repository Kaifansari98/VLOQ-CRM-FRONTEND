"use client"

import Image from "next/image"
import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAppDispatch, useAppSelector } from "@/redux/store"
import { setFranchiseId } from "@/redux/slices/authSlice"
import TimeLoaderComponent from "@/components/utils/TimeLoaderComponent"

export function TeamSwitcher({
  teams,
  activeTeamId,
}: {
  teams: {
    id: number
    name: string
    logo: React.ElementType
    plan: string
  }[]
  activeTeamId?: number | null
}) {
  const { isMobile } = useSidebar()
  const dispatch = useAppDispatch()
  const userType = useAppSelector((state) => state.auth.user?.user_type?.user_type)
  const isSuperAdmin = userType?.toLowerCase() === "super-admin"
  const [activeTeam, setActiveTeam] = React.useState(teams[0])
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [pendingTeam, setPendingTeam] = React.useState<
    { id: number; name: string } | undefined
  >(undefined)
  const switchTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!teams.length) return
    setActiveTeam((prev) => {
      const preferred =
        activeTeamId != null
          ? teams.find((team) => team.id === activeTeamId)
          : undefined
      if (preferred) return preferred
      if (prev) {
        const stillExists = teams.find((team) => team.id === prev.id)
        if (stillExists) return stillExists
      }
      return teams[0]
    })
  }, [teams, activeTeamId])

  if (!activeTeam) {
    return null
  }

  const handleTeamClick = (team: { id: number; name: string }) => {
    if (team.id === activeTeam.id) return
    setPendingTeam(team)
    setIsSwitching(true)

    if (switchTimeoutRef.current) {
      window.clearTimeout(switchTimeoutRef.current)
    }

    switchTimeoutRef.current = window.setTimeout(() => {
      const nextTeam = teams.find((t) => t.id === team.id)
      if (nextTeam) {
        setActiveTeam(nextTeam)
        dispatch(setFranchiseId(nextTeam.id))
      }
      setIsSwitching(false)
      setPendingTeam(undefined)
      switchTimeoutRef.current = null
    }, 3000)
  }

  React.useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground relative aspect-square size-8 overflow-hidden rounded-lg border-none">
                  <Image
                    src="/logos/shambhala-short-logo.png"
                    alt="Shambhala"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeTeam.name}</span>
                  <span className="truncate text-xs">{activeTeam.plan}</span>
                </div>
                {isSuperAdmin && <ChevronsUpDown className="ml-auto" />}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            {isSuperAdmin && (
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Teams
                </DropdownMenuLabel>
                {teams.map((team, index) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => handleTeamClick(team)}
                    className={
                      team.id === activeTeam.id
                        ? "gap-2 p-2 bg-muted/50"
                        : "gap-2 p-2"
                    }
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <team.logo className="size-3.5 shrink-0" />
                    </div>
                    {team.name}
                    <DropdownMenuShortcut>
                      {team.id === activeTeam.id ? (
                        <span className="inline-flex items-center justify-end w-6">
                          <span className="size-2 rounded-full bg-green-500 mr-1.5" />
                        </span>
                      ) : (
                        `⌘${index + 1}`
                      )}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">Add team</div>
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <TimeLoaderComponent
        open={isSwitching}
        message={
          pendingTeam?.name
            ? `Switching to ${pendingTeam.name}...`
            : "Switching franchise..."
        }
      />
    </>
  )
}
