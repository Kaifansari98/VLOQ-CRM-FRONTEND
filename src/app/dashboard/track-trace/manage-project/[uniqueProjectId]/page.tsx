"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Separator } from "@/components/ui/separator";
import { type Fabrication } from "@/components/custom/CutListTable";
import { Button } from "@/components/ui/button";
import {
    CutlistHero,
    CutlistKpis,
    FABRICATION_THEMES as FABRICATIONS,
    MachinePipeline,
    computeCutlistStats,
} from "@/components/track-trace/cutlist-overview";
import ProjectCutlistTable, { useProjectCutlistView } from "@/components/track-trace/ProjectCutlistTable";

export default function CutListPage() {
    const { uniqueProjectId } = useParams();
    const searchParams = useSearchParams();
    const fabrication: Fabrication = searchParams.get("fabrication") === "METALWORK" ? "METALWORK" : "WOODWORK";
    const { label: fabricationLabel, projectsUrl } = FABRICATIONS[fabrication];

    const {
        data,
        allRows,
        counts,
        machineColumns,
        project,
        isLoading,
        isSuperAdmin,
        isProjectStarted,
    } = useProjectCutlistView(String(uniqueProjectId), fabrication);

    const stats = useMemo(() => computeCutlistStats(data, machineColumns), [data, machineColumns]);
    const otherFabrication: Fabrication = fabrication === "METALWORK" ? "WOODWORK" : "METALWORK";

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

                <ProjectCutlistTable
                    uniqueProjectId={String(uniqueProjectId)}
                    fabrication={fabrication}
                    emptyAction={
                        counts[otherFabrication] > 0 ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`?fabrication=${otherFabrication}`} scroll={false}>
                                    View {otherFabrication === "METALWORK" ? "metalwork" : "woodwork"} cutlist
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />
            </main>
        </>
    );
}
