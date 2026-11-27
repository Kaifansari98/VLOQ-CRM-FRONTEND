"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Factory, Loader2, Sheet } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useMachinesByVendor } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { useAppSelector } from "@/redux/store";

import { MachineWorksheet } from "@/components/track-trace/MachineWorksheet";

const workstationPath = "/dashboard/track-trace/master/workstation";

function LoadingDetails() {
  return (
    <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Loading workstation details...
    </div>
  );
}

function WorkstationDetailsContent() {
  const searchParams = useSearchParams();
  const machineId = Number(searchParams.get("id"));
  const validId = Number.isSafeInteger(machineId) && machineId > 0;
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: machines, isLoading, error, refetch } = useMachinesByVendor(vendorId ?? 0);
  const machine = machines?.find((item) => item.id === machineId);

  const fields = machine ? [
    ["Workstation Name", machine.machine_name],
    ["Workstation Code", machine.machine_code],
    ["Machine Type", (machine.fabrication ?? "WOODWORK") === "METALWORK" ? "Metalwork" : "Woodwork"],
    ["Workstation Type", machine.machine_type],
    ["Status", machine.status],
    ["Scan Type", String(machine.scan_type) === "PAAS" ? "PASS" : machine.scan_type],
    ["Sequence Number", machine.sequence_no],
    ["Purchased At", machine.purchased_at?.slice(0, 10)],
  ] : [];

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard/track-trace">Track &amp; Trace</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href={workstationPath}>Workstations</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Workstation Details</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 space-y-6 bg-muted/20 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Workstation Details</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">View workstation configuration and information.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={workstationPath}><ArrowLeft className="size-4" />Back to Workstations</Link>
          </Button>
        </div>

        {!validId ? (
          <p role="alert" className="rounded-xl border p-6 text-sm text-muted-foreground">Select a valid workstation from the workstation list.</p>
        ) : !vendorId || isLoading ? (
          <LoadingDetails />
        ) : error ? (
          <div role="alert" className="space-y-3 rounded-xl border p-6">
            <p className="text-sm text-destructive">Failed to load workstation details.</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : !machine ? (
          <p role="status" className="rounded-xl border p-6 text-sm text-muted-foreground">Workstation not found.</p>
        ) : (
          <div className="space-y-6">
            <section className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/50">
                {machine.image_path ? (
                  <Image
                    src={machine.image_path}
                    alt={machine.machine_name || "Workstation"}
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-contain p-1"
                  />
                ) : (
                  <Factory className="size-7 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workstation</p>
                <h2 className="break-words text-xl font-semibold tracking-tight">{machine.machine_name}</h2>
                <p className="break-words font-mono text-xs text-muted-foreground">{machine.machine_code}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                machine.status === "ACTIVE"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border-border bg-muted text-muted-foreground"
              }`}>
                <span className="size-1.5 rounded-full bg-current" />
                {machine.status}
              </span>
            </section>

            <Tabs defaultValue="details" className="gap-5">
              <TabsList aria-label="Workstation information" className="h-11 rounded-lg border bg-background p-1">
                <TabsTrigger value="details" className="gap-2 px-5 data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:border-zinc-700 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-white">
                  <ClipboardList className="size-4" />Details
                </TabsTrigger>
                <TabsTrigger value="mcp" className="gap-2 px-5 data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:border-zinc-700 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-white">
                  <Sheet className="size-4" />MCP Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="w-full">
                <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
                  <div className="border-b px-5 py-4 sm:px-6">
                    <h3 className="text-sm font-semibold">Workstation information</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Configuration and operational details</p>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                    {fields.map(([label, value]) => (
                      <div key={label} className="min-w-0 space-y-2">
                        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                        <dd className="break-words text-sm font-medium leading-relaxed">{value === undefined || value === null || value === "" ? "—" : value}</dd>
                      </div>
                    ))}
                    <div className="space-y-2 border-t pt-5 sm:col-span-2 xl:col-span-3">
                      <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                      <dd className="whitespace-pre-wrap break-words text-sm leading-7">{machine.description || "No description provided."}</dd>
                    </div>
                  </dl>
                </section>

              </TabsContent>
              <TabsContent value="mcp" className="min-w-0">
                <div className="flex h-[650px] min-h-[400px] min-w-0 flex-col gap-5">
                  <MachineWorksheet key={machine.id} vendorId={vendorId} machineId={String(machine.id)} readOnly />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </>
  );
}

export default function WorkstationDetailsPage() {
  return <Suspense fallback={<LoadingDetails />}><WorkstationDetailsContent /></Suspense>;
}
