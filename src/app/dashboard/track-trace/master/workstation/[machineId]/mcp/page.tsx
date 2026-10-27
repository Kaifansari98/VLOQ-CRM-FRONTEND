"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useMachinesByVendor } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { useAppSelector } from "@/redux/store";
import { MachineWorksheet } from "@/components/track-trace/MachineWorksheet";

const workstationPath = "/dashboard/track-trace/master/workstation";

export default function ManageMCPPage() {
  const { machineId } = useParams<{ machineId: string }>();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: machines = [], isLoading, error, refetch } = useMachinesByVendor(vendorId ?? 0);
  const machine = machines.find((item) => String(item.id) === machineId);

  return (
    <div className="flex h-svh min-h-0 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb className="hidden md:block"><BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/dashboard/track-trace">Track & Trace</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href={workstationPath}>Workstations</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Manage MCP</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList></Breadcrumb>
        </div>
        <div className="flex items-center gap-2"><NotificationBell /><AnimatedThemeToggler /></div>
      </header>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
        {isLoading || !vendorId ? <div role="status" className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading workstation…</div> : error ? (
          <div role="alert" className="space-y-3 rounded-xl border p-6"><p>Unable to load this workstation.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>
        ) : !machine ? <div className="rounded-xl border p-6 text-sm text-muted-foreground">Workstation not found. Select a workstation from the workstation list.</div> : (
          <>
            <section className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4" aria-label="Workstation details">
              <div><p className="mb-1 text-xs text-muted-foreground">Workstation</p><h2 className="font-semibold capitalize">{machine.machine_name}</h2>{machine.description && <p className="mt-1 text-xs text-muted-foreground">{machine.description}</p>}</div>
              <div className="flex flex-wrap gap-6 text-sm"><div><p className="mb-1 text-xs text-muted-foreground">Code</p><span className="font-mono">{machine.machine_code}</span></div><div><p className="mb-1 text-xs text-muted-foreground">Type</p><span>{machine.machine_type || "—"}</span></div><div><p className="mb-1 text-xs text-muted-foreground">Status</p><Badge variant="outline">{machine.status}</Badge></div></div>
            </section>
            <MachineWorksheet vendorId={vendorId} machineId={machineId} />
          </>
        )}
      </main>
    </div>
  );
}
