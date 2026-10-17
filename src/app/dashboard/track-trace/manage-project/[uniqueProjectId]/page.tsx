"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AlertCircle, Lock, RefreshCw } from "lucide-react";

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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import CutListTable, { type Fabrication } from "@/components/custom/CutListTable";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import {
    CutlistHero,
    CutlistKpis,
    FABRICATION_THEMES as FABRICATIONS,
    MachinePipeline,
    computeCutlistStats,
} from "@/components/track-trace/cutlist-overview";
import {
    CutListSavePayload,
    generateQRLabels,
    downloadCutListExcel,
    downloadCutListBasicExcel,
} from "@/api/track-trace/track-trace-cutlist.api";

export type CutListRow = Record<string, any>;

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

    const stats = useMemo(() => computeCutlistStats(data, machineColumns), [data, machineColumns]);

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
                <div className="ml-auto flex items-center gap-2">
                    <AnimatedThemeToggler />
                </div>
            </header>

            <main className="flex-1 space-y-5 overflow-x-hidden px-4 py-5">
                <CutlistHero
                    fabrication={fabrication}
                    project={project}
                    counts={counts}
                    isLoading={isLoading}
                    isProjectStarted={isProjectStarted}
                    isSuperAdmin={isSuperAdmin}
                />

                <CutlistKpis
                    fabrication={fabrication}
                    rows={data}
                    allRowCount={allRows.length}
                    stats={stats}
                    isLoading={isLoading}
                />

                {!isLoading && <MachinePipeline machines={stats.machines} />}

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
