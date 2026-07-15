"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import ComingSoon from "@/components/generics/ComingSoon";

export default function SpecsMasterPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Masters Management</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Specs Master</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Specs Master
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage carcass, shutter, hardware and other specification masters
            for large-scale project leads from one place.
          </p>
        </div>

        <SmoothTab
          defaultTabId="carcass"
          items={[
            {
              id: "carcass",
              title: "Carcass",
              color: "bg-black hover:bg-black",
              cardContent: (
                <ComingSoon
                  heading="Carcass Master"
                  description="Carcass type, material and finish masters will show up here."
                />
              ),
            },
            {
              id: "shutter",
              title: "Shutter",
              color: "bg-black hover:bg-black",
              cardContent: (
                <ComingSoon
                  heading="Shutter Master"
                  description="Shutter type, material and finish masters will show up here."
                />
              ),
            },
            {
              id: "hardware",
              title: "Hardware",
              color: "bg-black hover:bg-black",
              cardContent: (
                <ComingSoon
                  heading="Hardware Master"
                  description="Carcass legs, skirting and color masters will show up here."
                />
              ),
            },
            {
              id: "others",
              title: "Others",
              color: "bg-black hover:bg-black",
              cardContent: (
                <ComingSoon
                  heading="Others Master"
                  description="Lights, stone, appliances, sinks and faucet masters will show up here."
                />
              ),
            },
          ]}
          contentHeightClass="min-h-[240px]"
          pinTabsToBottom={false}
        />
      </div>
    </>
  );
}
