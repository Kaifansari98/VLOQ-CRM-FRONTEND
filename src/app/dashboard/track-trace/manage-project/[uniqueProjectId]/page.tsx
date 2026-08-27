"use client";

import React, { useMemo, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCutListColumns } from "@/components/custom/cutlist-columns";
import {
    useCutListMachine,
    useProjectCutList,
} from "@/hooks/track-trace/useProjectCutList";
import { useAppSelector } from "@/redux/store";
import { useParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "react-aria-components";
import CutListTable from "@/components/custom/CutListTable";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { apiClient } from "@/lib/apiClient";
import { updateLeadActivityStatus } from "@/api/activityStatus";
import {
    CutListSavePayload,
    generateQRLabels,
    downloadCutListExcel,
    downloadCutListBasicExcel,
} from "@/api/track-trace/track-trace-cutlist.api";


export type CutListRow = Record<string, any>;

// In your page component
export default function CutListPage() {
    const user = useAppSelector((state) => state.auth.user);
    const vendorId = user?.vendor_id;
    const { uniqueProjectId } = useParams();
    const {
        data: response,
        isLoading,
        isError,
        refetch,
    } = useProjectCutList(Number(vendorId), String(uniqueProjectId));

    const data = response?.data ?? [];
    const machineColumns = response?.machineColumns ?? [];
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
        return false;
    }, [response]);

    const isAssignmentDisabled = isProjectStarted && !isSuperAdmin;

    // ✅ Handler for machine assignment
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
            const reponse = await useCutListMachine(payload);

            console.log("reponse", reponse);

            await refetch();
        } catch (error) {
            console.error("Error assigning machine:", error);
            toastManager.add({ title: "Failed to update machine assignment", type: "error" });
            throw error;
        }
    };


    const handleDownloadLabels = async (cutListIds?: number[]) => {
        try {
            const pdfUrl = await generateQRLabels(
                Number(vendorId),
                String(uniqueProjectId),
                cutListIds
            );

            return pdfUrl;
        } catch (error) {
            console.error('Error generating labels:', error);
            throw error;
        }
    };


    // ✅ Advanced Excel download (existing API)
    const handleDownloadExcel = async (cutListIds?: number[]) => {
        try {
            const fileUrl = await downloadCutListExcel(
                Number(vendorId),
                String(uniqueProjectId),
            );

            return fileUrl;
        } catch (error) {
            console.error('Error generating advanced excel:', error);
            throw error;
        }
    };


    // ✅ Basic Excel download (new API)
    const handleDownloadBasicExcel = async (cutListIds?: number[]) => {
        try {
            const fileUrl = await downloadCutListBasicExcel(
                Number(vendorId),
                String(uniqueProjectId),
            );

            return fileUrl;
        } catch (error) {
            console.error('Error generating basic excel:', error);
            throw error;
        }
    };

    return (
        <>
            <header className="flex h-16 items-center justify-between gap-2 px-4 border-b">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-4" />

                    <Breadcrumb className="hidden md:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Manage Projects</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <main className="flex-1 overflow-x-hidden py-4">
                <div className="px-4">
                    <h1 className="text-lg font-semibold">
                        Manage Track & Trace Projects
                    </h1>
                </div>

                {isLoading && (
                    <div className="px-4 pt-6 text-sm text-muted-foreground">
                        Loading projects...
                    </div>
                )}

                {isError && (
                    <div className="px-4 pt-6 text-sm text-red-500">
                        Failed to load projects.
                    </div>
                )}
                {!isLoading && !isError && (

                    <CutListTable
                        data={data}
                        machineColumns={machineColumns}
                        className="pt-3 px-4"
                        isAssignmentDisabled={isAssignmentDisabled}
                        onMachineAssign={handleMachineAssign}
                        onDownloadLabels={handleDownloadLabels}
                        onDownloadExcel={handleDownloadExcel}
                        onDownloadBasicExcel={handleDownloadBasicExcel} // ✅ New prop
                    />
                )}
            </main>
        </>
    );
}