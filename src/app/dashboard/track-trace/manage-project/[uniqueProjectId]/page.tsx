"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
    AlertCircle,
    Boxes,
    CheckCircle2,
    Hammer,
    ImageIcon,
    Layers,
    Lock,
    RefreshCw,
    ScanLine,
    Wrench,
} from "lucide-react";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    useCutListMachine,
    useProjectCutList,
} from "@/hooks/track-trace/useProjectCutList";
import { useAppSelector } from "@/redux/store";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import CutListTable, { type Fabrication } from "@/components/custom/CutListTable";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
    CutListSavePayload,
    generateQRLabels,
    downloadCutListExcel,
    downloadCutListBasicExcel,
} from "@/api/track-trace/track-trace-cutlist.api";

export type CutListRow = Record<string, any>;

const FABRICATIONS: Record<Fabrication, { label: string; icon: typeof Wrench; projectsUrl: string }> = {
    WOODWORK: { label: "Woodwork", icon: Hammer, projectsUrl: "/dashboard/track-trace/manage-project" },
    METALWORK: { label: "Metalwork", icon: Wrench, projectsUrl: "/dashboard/track-trace/metalwork-projects" },
};

const rowFabrication = (row: CutListRow): Fabrication =>
    row.fabrication === "METALWORK" ? "METALWORK" : "WOODWORK";

export default function CutListPage() {
    const user = useAppSelector((state) => state.auth.user);
    const vendorId = user?.vendor_id;
    const { uniqueProjectId } = useParams();
    const searchParams = useSearchParams();
    const fabrication: Fabrication = searchParams.get("fabrication") === "METALWORK" ? "METALWORK" : "WOODWORK";
    const { label: fabricationLabel, icon: FabricationIcon, projectsUrl } = FABRICATIONS[fabrication];

    const {
        data: response,
        isLoading,
        isError,
        isFetching,
        refetch,
    } = useProjectCutList(Number(vendorId), String(uniqueProjectId));

    const allRows: CutListRow[] = useMemo(() => response?.data ?? [], [response?.data]);
    const data = useMemo(
        () => allRows.filter((row) => rowFabrication(row) === fabrication),
        [allRows, fabrication],
    );
    const counts = useMemo(() => {
        const result: Record<Fabrication, number> = { WOODWORK: 0, METALWORK: 0 };
        allRows.forEach((row) => { result[rowFabrication(row)] += 1; });
        return result;
    }, [allRows]);
    const machineColumns: string[] = response?.machineColumns ?? [];
    const project = response?.project;

    const stats = useMemo(() => {
        const totalPieces = data.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
        const withMachines = data.filter((row) => machineColumns.some((machine) => row[machine]?.assigned)).length;
        const withImages = data.filter((row) => row.image_url).length;
        return { totalPieces, withMachines, withImages };
    }, [data, machineColumns]);

    const userRole = useMemo(() => {
        return (
            user?.user_type?.user_type ||
            user?.user_role ||
            ""
        );
    }, [user]);

    const isSuperAdmin = useMemo(() => {
        if (!user) return false;
        const roleName = userRole.toLowerCase().trim();
        return (
            roleName === "super-admin" ||
            roleName === "superadmin" ||
            roleName === "super admin" ||
            roleName === "super_admin"
        );
    }, [user, userRole]);

    const isProjectStarted = useMemo(() => {
        if (!response) return false;
        if (typeof response.is_project_started === "boolean") {
            return response.is_project_started;
        }
        if (typeof response.project?.is_started === "boolean") {
            return response.project.is_started;
        }
        if (typeof response.scanned_mapping_count === "number") {
            return response.scanned_mapping_count > 0;
        }
        return false;
    }, [response]);

    const isAssignmentDisabled = isProjectStarted && !isSuperAdmin;
    const scanCount: number = response?.scanned_mapping_count ?? project?.scanned_mapping_count ?? 0;

    const handleMachineAssign = async (
        cutListIds: number[],
        machineId: number,
        machineName: string,
        assigned: boolean,
    ) => {
        try {
            const payload: CutListSavePayload = {
                project_id: String(uniqueProjectId),
                vendor_id: Number(vendorId),
                cutListIds: String(cutListIds),
                machine_id: machineId,
                machine_name: machineName,
                assigned: assigned,
                user_role: userRole,
            };
            await useCutListMachine(payload);
            await refetch();
        } catch (error) {
            console.error("Error assigning machine:", error);
            toastManager.add({ title: "Failed to update machine assignment", type: "error" });
            throw error;
        }
    };

    // Without a selection, print labels for this fabrication's rows only.
    const handleDownloadLabels = (
        cutListIds?: number[],
        options?: {
            selectedMachines?: string[];
            includeMachineSequence?: boolean;
            targetMachine?: string;
        }
    ) =>
        generateQRLabels(
            Number(vendorId),
            String(uniqueProjectId),
            cutListIds ?? data.map((row) => row.id),
            options
        );

    const handleDownloadExcel = () =>
        downloadCutListExcel(Number(vendorId), String(uniqueProjectId));

    const handleDownloadBasicExcel = () =>
        downloadCutListBasicExcel(Number(vendorId), String(uniqueProjectId));

    const kpis = [
        { label: "Part rows", value: data.length, icon: Layers },
        { label: "Total pieces", value: stats.totalPieces, icon: Boxes },
        fabrication === "METALWORK"
            ? {
                label: "Part images",
                value: `${stats.withImages}/${data.length}`,
                hint: data.length ? `${Math.round((stats.withImages / data.length) * 100)}% have a shape` : undefined,
                icon: ImageIcon,
            }
            : {
                label: "Machine coverage",
                value: data.length ? `${Math.round((stats.withMachines / data.length) * 100)}%` : "—",
                hint: `${stats.withMachines} of ${data.length} rows routed`,
                icon: CheckCircle2,
            },
        { label: "Scan events", value: scanCount, hint: isProjectStarted ? "Production started" : "Not started", icon: ScanLine },
    ];

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <Breadcrumb className="hidden md:block">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={projectsUrl}>{fabricationLabel} Projects</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="max-w-[320px] truncate">
                                {project?.project_name ?? "Cutlist"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <main className="flex-1 space-y-5 overflow-x-hidden px-4 py-5">
                {/* Page heading */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-primary/10 text-primary">
                            <FabricationIcon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            {isLoading ? (
                                <Skeleton className="h-7 w-72" />
                            ) : (
                                <h1 className="truncate text-xl font-semibold tracking-tight" title={project?.project_name}>
                                    {project?.project_name ?? "Project cutlist"}
                                </h1>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-medium text-muted-foreground">{fabricationLabel} cutlist</span>
                                {project?.track_trace_status && (
                                    <StatusChip tone={isProjectStarted ? "info" : "neutral"}>
                                        {project.track_trace_status}
                                    </StatusChip>
                                )}
                                {project?.project_status && (
                                    <StatusChip tone="neutral">{project.project_status}</StatusChip>
                                )}
                                {isProjectStarted && (
                                    <StatusChip tone="warning">
                                        <Lock className="size-3" />
                                        {isSuperAdmin ? "Started · editable by you" : "Assignment locked"}
                                    </StatusChip>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <nav aria-label="Fabrication" className="inline-flex rounded-lg border bg-muted/50 p-1">
                            {(Object.keys(FABRICATIONS) as Fabrication[]).map((key) => {
                                const { label, icon: Icon } = FABRICATIONS[key];
                                const active = key === fabrication;
                                return (
                                    <Link
                                        key={key}
                                        href={`?fabrication=${key}`}
                                        scroll={false}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                            active
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        <Icon className="size-4" />
                                        {label}
                                        <span
                                            className={cn(
                                                "rounded-full px-1.5 text-xs tabular-nums",
                                                active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                                            )}
                                        >
                                            {isLoading ? "–" : counts[key]}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            title="Refresh"
                            aria-label="Refresh cutlist"
                        >
                            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {kpis.map(({ label, value, hint, icon: Icon }) => (
                        <div key={label} className="rounded-xl border bg-card p-4">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-medium">{label}</span>
                                <Icon className="size-4" />
                            </div>
                            {isLoading ? (
                                <Skeleton className="mt-2 h-7 w-16" />
                            ) : (
                                <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
                            )}
                            {hint && !isLoading && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
                        </div>
                    ))}
                </div>

                {isAssignmentDisabled && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        <Lock className="mt-0.5 size-4 shrink-0" />
                        <p>
                            <span className="font-medium">Production has started.</span>{" "}
                            Machine assignment is locked — only a Super Admin can change it. Exports and labels are still available.
                        </p>
                    </div>
                )}

                {/* Cutlist */}
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="flex justify-between gap-3">
                            <Skeleton className="h-9 w-72" />
                            <Skeleton className="h-9 w-80" />
                        </div>
                        <div className="space-y-px overflow-hidden rounded-lg border">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <Skeleton key={index} className="h-11 rounded-none" />
                            ))}
                        </div>
                    </div>
                ) : isError ? (
                    <StateCard
                        icon={<AlertCircle className="size-5 text-destructive" />}
                        title="Couldn't load this cutlist"
                        description="Check your connection and try again."
                        action={
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                                <RefreshCw className="size-4" />
                                Try again
                            </Button>
                        }
                    />
                ) : data.length === 0 ? (
                    <StateCard
                        icon={<FabricationIcon className="size-5 text-muted-foreground" />}
                        title={`No ${fabricationLabel.toLowerCase()} parts yet`}
                        description={
                            fabrication === "METALWORK"
                                ? "Upload a metal nesting PDF from Pre-Production Files → Metal Cutlist to add parts to this project."
                                : "Upload the woodwork cutlist to add parts to this project."
                        }
                        action={
                            counts[fabrication === "METALWORK" ? "WOODWORK" : "METALWORK"] > 0 ? (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`?fabrication=${fabrication === "METALWORK" ? "WOODWORK" : "METALWORK"}`} scroll={false}>
                                        View {fabrication === "METALWORK" ? "woodwork" : "metalwork"} cutlist
                                    </Link>
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <CutListTable
                        key={fabrication}
                        data={data}
                        machineColumns={machineColumns}
                        fabrication={fabrication}
                        isAssignmentDisabled={isAssignmentDisabled}
                        onMachineAssign={handleMachineAssign}
                        onDownloadLabels={handleDownloadLabels}
                        onDownloadExcel={handleDownloadExcel}
                        onDownloadBasicExcel={handleDownloadBasicExcel}
                    />
                )}
            </main>
        </>
    );
}

function StatusChip({
    tone,
    children,
}: {
    tone: "neutral" | "info" | "warning";
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
                tone === "neutral" && "border-border bg-muted text-muted-foreground",
                tone === "info" && "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
                tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
            )}
        >
            {children}
        </span>
    );
}

function StateCard({
    icon,
    title,
    description,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">{icon}</div>
            <h2 className="mt-4 text-sm font-semibold">{title}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
