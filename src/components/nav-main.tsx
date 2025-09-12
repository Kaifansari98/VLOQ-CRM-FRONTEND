"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useLeadStats } from "@/hooks/useLeadStats"
import { CountBadge } from "./count-badge"
import { useAppSelector } from "@/redux/store"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
    showCount?: 'total_leads' | 'total_initial_site_measurement_leads' | 'total_designing_stage_leads'
  }[]
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  
  const { data: leadStats, isLoading } = useLeadStats(vendorId, userId);

  const getCountForItem = (showCount?: string) => {
    if (!leadStats?.data || !showCount) return undefined;
    
    switch (showCount) {
      case 'total_leads':
        return leadStats.data.total_leads;
      case 'total_initial_site_measurement_leads':
        return leadStats.data.total_initial_site_measurement_leads;
      case 'total_designing_stage_leads':
        return leadStats.data.total_designing_stage_leads;
      default:
        return undefined;
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.items ? (
              // Agar items hain to Collapsible banao
              <Collapsible asChild defaultOpen={item.isActive} className="group/collapsible">
                <div>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url} className="flex items-center justify-between w-full">
                              <span>{subItem.title}</span>
                              {subItem.showCount && (
                                <CountBadge 
                                  count={getCountForItem(subItem.showCount)}
                                  isLoading={isLoading}
                                  className="ml-2"
                                />
                              )}
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ) : (
              // Agar items nahi hain to simple clickable button
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url} className="flex items-center gap-2 w-full">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
