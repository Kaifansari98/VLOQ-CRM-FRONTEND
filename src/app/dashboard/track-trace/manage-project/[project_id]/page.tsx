"use client";





import React, { useMemo, useState } from "react";
import {
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCutListColumns } from "@/components/custom/cutlist-columns";
import { useCutListMachine, useProjectCutList } from "@/hooks/track-trace/useProjectCutList";
import { useAppSelector } from "@/redux/store";
import { useParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "react-aria-components";
import CutListTable from "@/components/custom/CutListTable";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";
import { updateLeadActivityStatus } from "@/api/activityStatus";
import { CutListSavePayload,generateQRLabels } from "@/api/track-trace/track-trace-cutlist.api";


export type CutListRow = Record<string, any>;

// In your page component
export default function CutListPage() {
    // alert(1)
    const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
    const { project_id } = useParams();
// alert(project_id);
    const {
        data: response,
        isLoading,
        isError,
        refetch, // ✅ Add refetch to refresh data after assignment
    } = useProjectCutList(Number(vendorId), String(project_id));

    const data = response?.data ?? [];
    const machineColumns = response?.machineColumns ?? [];



    // ✅ Handler for machine assignment
    const handleMachineAssign = async (
        cutListIds: number[],
        machineId: number,
        machineName: string,
        assigned: boolean
    ) => {
        try {

            const payload: CutListSavePayload = {
                project_id: String(project_id),
                vendor_id: Number(vendorId),
                cutListIds: String(cutListIds),
                machine_id: machineId,
                machine_name: machineName,
                assigned: assigned
            };
            const reponse = await useCutListMachine(payload);
            

            console.log("reponse",reponse);

            // if (!response.ok) {
            //     throw new Error(result.message || 'Failed to assign machine');
            // }

            // ✅ Refresh data after successful assignment
            await refetch();

            // toast.success(result.message);
            
        } catch (error) {
            console.error('Error assigning machine:', error);
            toast.error('Failed to update machine assignment');
            throw error;
        }
    };

    const handleDownloadLabels = async (cutListIds?: number[]) => {
    try {
      const pdfUrl = await generateQRLabels(
        Number(vendorId), 
        String(project_id),
        cutListIds
      );
      
      return pdfUrl;
    } catch (error) {
      console.error('Error generating labels:', error);
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
                <BreadcrumbLink href="/dashboard">
                  Master
                </BreadcrumbLink>
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
                        onMachineAssign={handleMachineAssign}
                        onDownloadLabels={handleDownloadLabels} // ✅ Pass the handler
                    />
                )}
            </main>
        </>
    );
}