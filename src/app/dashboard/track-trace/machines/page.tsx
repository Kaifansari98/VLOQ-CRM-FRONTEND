"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAppSelector } from "@/redux/store";
import { useActiveMachines } from "@/hooks/track-trace/useActiveMachines";

const MachineCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="space-y-2 border-t p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  </div>
);

export default function ActiveMachinesPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: machines = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useActiveMachines(vendorId);

  const hasValidVendor = Number.isInteger(vendorId) && Number(vendorId) > 0;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track &amp; Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Machines</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Active Machines
                </h1>
                {hasValidVendor && !isLoading && !isError && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <Activity className="size-3" />
                    {machines.length} active
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Machines currently available for your organization.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-2"
              onClick={() => refetch()}
              disabled={!hasValidVendor || isFetching}
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {!hasValidVendor && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
              <AlertCircle className="mb-3 size-9 text-destructive" />
              <h2 className="font-semibold">Vendor information unavailable</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Sign in again so the machines for your organization can be loaded.
              </p>
            </div>
          )}

          {hasValidVendor && isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <MachineCardSkeleton key={index} />
              ))}
            </div>
          )}

          {hasValidVendor && isError && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
              <AlertCircle className="mb-3 size-9 text-destructive" />
              <h2 className="font-semibold">Unable to load machines</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please check your connection and try again.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </div>
          )}

          {hasValidVendor && !isLoading && !isError && machines.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
              <Cpu className="mb-3 size-10 text-muted-foreground" />
              <h2 className="font-semibold">No active machines found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Active machines configured for this vendor will appear here.
              </p>
            </div>
          )}

          {hasValidVendor && !isLoading && !isError && machines.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {machines.map((machine) => (
                <Link
                  key={machine.id}
                  href={
                    machine.machine_type_id === 18
                      ? `/dashboard/track-trace/machines/${machine.id}/projects`
                      : `/dashboard/track-trace/machines/${machine.id}`
                  }
                  className="group overflow-hidden rounded-xl border bg-card shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={
                    machine.machine_type_id === 18
                      ? `Select a project for ${machine.machine_name}`
                      : `Open scanner for ${machine.machine_name}`
                  }
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
                    {machine.image_path ? (
                      <Image
                        src={machine.image_path}
                        alt={machine.machine_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Cpu className="size-12 opacity-45" />
                        <span className="text-xs font-medium">No image available</span>
                      </div>
                    )}
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
                      <span className="size-1.5 rounded-full bg-white" />
                      Active
                    </span>
                  </div>

                  <div className="border-t p-4">
                    <h2
                      className="truncate text-base font-semibold capitalize"
                      title={machine.machine_name}
                    >
                      {machine.machine_name}
                    </h2>
                    <p
                      className="mt-1 truncate font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      title={machine.machine_code}
                    >
                      {machine.machine_code}
                    </p>
                    {machine.machine_type_id === 18 && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        Select project to start packaging
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
