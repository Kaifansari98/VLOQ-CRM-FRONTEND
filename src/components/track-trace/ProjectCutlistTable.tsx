"use client";

import React, { useMemo } from "react";
import { AlertCircle, Lock, RefreshCw } from "lucide-react";

import {
    useCutListMachine,
    useProjectCutList,
    useUpdateCutListQty,
} from "@/hooks/track-trace/useProjectCutList";
import { useAppSelector } from "@/redux/store";
import { Skeleton } from "@/components/ui/skeleton";
import CutListTable, { type Fabrication } from "@/components/custom/CutListTable";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { FABRICATION_THEMES as FABRICATIONS } from "@/components/track-trace/cutlist-overview";
import {
    CutListSavePayload,
    generateQRLabels,
    downloadCutListExcel,
    downloadCutListBasicExcel,
} from "@/api/track-trace/track-trace-cutlist.api";

export type CutListRow = Record<string, any>;

const rowFabrication = (row: CutListRow): Fabrication =>
    row.fabrication === "METALWORK" ? "METALWORK" : "WOODWORK";

/** Cutlist rows and permissions for one fabrication of a Track & Trace project. */
export function useProjectCutlistView(uniqueProjectId: string, fabrication: Fabrication) {
    const user = useAppSelector((state) => state.auth.user);
    const vendorId = user?.vendor_id;

    const query = useProjectCutList(Number(vendorId), uniqueProjectId);
    const response = query.data;

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
    // Only show machines that belong to the current fabrication.
    const machineColumns: string[] = useMemo(() => {
        const columns: string[] = response?.machineColumns ?? [];
        const machineFabrication: Record<string, Fabrication> | undefined = response?.machineFabrication;
        if (!machineFabrication) return columns;
        return columns.filter((code) => (machineFabrication[code] ?? "WOODWORK") === fabrication);
    }, [response?.machineColumns, response?.machineFabrication, fabrication]);
    const project = response?.project;

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
        if (
            response.project?.track_trace_status &&
            response.project.track_trace_status.toLowerCase() !== "not started"
        ) {
            return true;
        }
        return false;
    }, [response]);

    const isProjectCompleted = useMemo(() => {
        const status = (
            response?.project?.project_status ||
            response?.project?.track_trace_status ||
            ""
        ).toLowerCase();
        return status === "completed" || status === "dispatched";
    }, [response]);

    return {
        ...query,
        vendorId,
        allRows,
        data,
        counts,
        machineColumns,
        project,
        userRole,
        isSuperAdmin,
        isProjectStarted,
        isAssignmentDisabled: isProjectCompleted,
        isQtyEditDisabled: isProjectStarted,
    };
}

export default function ProjectCutlistTable({
    uniqueProjectId,
    fabrication,
    emptyDescription,
    emptyAction,
}: {
    uniqueProjectId: string;
    fabrication: Fabrication;
    emptyDescription?: string;
    emptyAction?: React.ReactNode;
}) {
    const userId = useAppSelector((state) => state.auth.user?.id);
    const {
        vendorId,
        data,
        machineColumns,
        project,
        userRole,
        isLoading,
        isError,
        refetch,
        isAssignmentDisabled,
        isQtyEditDisabled,
    } = useProjectCutlistView(uniqueProjectId, fabrication);
    const { label: fabricationLabel, icon: FabricationIcon } = FABRICATIONS[fabrication];

    const updateQtyMutation = useUpdateCutListQty(uniqueProjectId);

    // ✅ Handler for editing cutlist item quantity or removing if 0
    const handleQtyUpdate = async (cutListId: number, newQty: number) => {
        if (newQty > 999) {
            toastManager.add({ title: "Quantity cannot exceed 999", type: "error" });
            return;
        }
        if (newQty < 0) {
            toastManager.add({ title: "Quantity must be 0 or greater", type: "error" });
            return;
        }
        try {
            const res = await updateQtyMutation.mutateAsync({
                vendor_id: Number(vendorId),
                project_id: uniqueProjectId,
                cut_list_id: cutListId,
                new_qty: newQty,
                user_role: userRole,
            });

            const msg =
                res?.message ||
                (newQty === 0
                    ? "Item removed successfully"
                    : "Quantity updated successfully");

            toastManager.add({ title: msg, type: "success" });
            await refetch();
        } catch (error: any) {
            console.error("Error updating quantity:", error);
            const errMsg =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update quantity";
            toastManager.add({ title: errMsg, type: "error" });
            throw error;
        }
    };

    const handleMachineAssign = async (
        cutListIds: number[],
        machineId: number,
        machineName: string,
        assigned: boolean,
    ) => {
        try {
            const payload: CutListSavePayload = {
                project_id: uniqueProjectId,
                vendor_id: Number(vendorId),
                cutListIds: String(cutListIds),
                machine_id: machineId,
                machine_name: machineName,
                assigned: assigned,
                user_role: userRole,
                user_id: userId,
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
            uniqueProjectId,
            cutListIds ?? data.map((row) => row.id),
            options
        );

    const handleDownloadExcel = () =>
        downloadCutListExcel(Number(vendorId), uniqueProjectId);

    const handleDownloadBasicExcel = () =>
        downloadCutListBasicExcel(Number(vendorId), uniqueProjectId);

    return (
        <>
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
                        emptyDescription ??
                        (fabrication === "METALWORK"
                            ? "Upload a metal nesting PDF from Pre-Production Files → Metal Cutlist to add parts to this project."
                            : "Upload the woodwork cutlist to add parts to this project.")
                    }
                    action={emptyAction}
                />
            ) : (
                <CutListTable
                    key={fabrication}
                    data={data}
                    machineColumns={machineColumns}
                    fabrication={fabrication}
                    isAssignmentDisabled={isAssignmentDisabled}
                    isQtyEditDisabled={isQtyEditDisabled}
                    onQtyUpdate={handleQtyUpdate}
                    onMachineAssign={handleMachineAssign}
                    onDownloadLabels={handleDownloadLabels}
                    onDownloadExcel={handleDownloadExcel}
                    onDownloadBasicExcel={handleDownloadBasicExcel}
                    projectPackingType={project?.packing_type}
                />
            )}
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
