"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Boxes,
    ChevronRight,
    Gauge,
    Hammer,
    ImageIcon,
    Layers,
    Lock,
    Route,
    Wrench,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Fabrication } from "@/components/custom/CutListTable";

export type CutListRow = Record<string, any>;

type Theme = {
    label: string;
    icon: typeof Wrench;
    projectsUrl: string;
    /** Icon tile + active switcher accents. */
    tile: string;
    glow: string;
    badge: string;
};

export const FABRICATION_THEMES: Record<Fabrication, Theme> = {
    WOODWORK: {
        label: "Woodwork",
        icon: Hammer,
        projectsUrl: "/dashboard/track-trace/manage-project",
        tile: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
        glow: "from-foreground/[0.09] via-foreground/[0.03]",
        badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    METALWORK: {
        label: "Metalwork",
        icon: Wrench,
        projectsUrl: "/dashboard/track-trace/metalwork-projects",
        tile: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
        glow: "from-foreground/[0.09] via-foreground/[0.03]",
        badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    },
};

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export type MachineStat = {
    name: string;
    step: number;
    routedRows: number;
    doneRows: number;
    totalPieces: number;
    scannedPieces: number;
};

export function computeCutlistStats(rows: CutListRow[], machineColumns: string[]) {
    let routedPieces = 0;
    let scannedPieces = 0;

    const isManualHardwareRow = (row: CutListRow) =>
        row.scan_pack_validate === false ||
        (row.scan_pack_validate == null && row.category?.scan_pack_validate === false);

    // Only panel rows participate in woodwork/metalwork machine routing & production piece counts.
    // Hardware items (scan_pack_validate = false) are manual accessories packed into boxes.
    const panelRows = rows.filter((r) => !isManualHardwareRow(r));
    const effectiveRows = panelRows.length > 0 ? panelRows : rows;

    const machines: MachineStat[] = machineColumns.map((name, index) => {
        const stat: MachineStat = { name, step: index + 1, routedRows: 0, doneRows: 0, totalPieces: 0, scannedPieces: 0 };
        const machineTypeId = rows.find((r) => r[name]?.machine_type_id != null)?.[name]?.machine_type_id;
        const isQcOrPackaging = machineTypeId === 17 || machineTypeId === 18;
        const targetRows = isQcOrPackaging ? rows : effectiveRows;

        targetRows.forEach((row) => {
            const cell = row[name];
            if (!cell?.assigned) return;
            const rowQty = Math.max(1, Number(row.qty) || 1);
            const total = Math.min(rowQty, cell.total ?? 0);
            const scanned = Math.min(total, cell.scanned ?? 0);
            stat.routedRows += 1;
            stat.totalPieces += total;
            stat.scannedPieces += scanned;
            if (total > 0 && scanned >= total) stat.doneRows += 1;
        });
        routedPieces += stat.totalPieces;
        scannedPieces += stat.scannedPieces;
        return stat;
    });

    return {
        totalPieces: rows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0),
        routedRows: rows.filter((row) => machineColumns.some((machine) => row[machine]?.assigned)).length,
        withImages: rows.filter((row) => row.image_url).length,
        panelRowCount: panelRows.length,
        routedPieces,
        scannedPieces,
        machines: machines.filter((machine) => machine.routedRows > 0),
    };
}

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/* ------------------------------------------------------------------ */
/* Motion helpers                                                      */
/* ------------------------------------------------------------------ */

function prefersReducedMotion() {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Animates a number from its previous value to the next one. */
function useCountUp(value: number, duration = 700) {
    const [display, setDisplay] = useState(value);
    const from = useRef(0);

    useEffect(() => {
        if (prefersReducedMotion()) {
            setDisplay(value);
            from.current = value;
            return;
        }
        const start = performance.now();
        const initial = from.current;
        let frame = 0;
        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(initial + (value - initial) * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
            else from.current = value;
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value, duration]);

    return display;
}

function CountUp({ value, suffix }: { value: number; suffix?: string }) {
    const display = useCountUp(value);
    return (
        <>
            {display.toLocaleString()}
            {suffix}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function CutlistHero({
    fabrication,
    project,
    counts,
    isLoading,
    isProjectStarted,
    isSuperAdmin,
}: {
    fabrication: Fabrication;
    project?: { project_name?: string; track_trace_status?: string; project_status?: string };
    counts: Record<Fabrication, number>;
    isLoading: boolean;
    isProjectStarted: boolean;
    isSuperAdmin: boolean;
}) {
    const theme = FABRICATION_THEMES[fabrication];
    const Icon = theme.icon;

    return (
        <section className="relative overflow-hidden rounded-2xl border bg-card p-5 animate-in fade-in slide-in-from-bottom-2 duration-500">

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl ring-1", theme.tile)}>
                        <Icon className="size-6" />
                    </div>
                    <div className="min-w-0">
                        {isLoading ? (
                            <Skeleton className="h-7 w-72" />
                        ) : (
                            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl" title={project?.project_name}>
                                {project?.project_name ?? "Project cutlist"}
                            </h1>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className={cn("rounded-full px-2.5 py-0.5 font-semibold", theme.badge)}>
                                {theme.label} cutlist
                            </span>
                            {project?.track_trace_status && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-2.5 py-0.5 font-medium">
                                    <span className="relative flex size-2">
                                        {isProjectStarted && (
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        )}
                                        <span className={cn("relative inline-flex size-2 rounded-full", isProjectStarted ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                                    </span>
                                    {project.track_trace_status}
                                </span>
                            )}
                            {project?.project_status && (
                                <span className="rounded-full border bg-background/70 px-2.5 py-0.5 font-medium text-muted-foreground">
                                    {project.project_status}
                                </span>
                            )}
                            {isProjectStarted && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                    <Lock className="size-3" />
                                    {isSuperAdmin ? "Started · editable by you" : "Assignment locked"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <nav aria-label="Fabrication" className="inline-flex rounded-xl border bg-background/70 p-1 backdrop-blur">
                        {(Object.keys(FABRICATION_THEMES) as Fabrication[]).map((key) => {
                            const { label, icon: TabIcon, tile } = FABRICATION_THEMES[key];
                            const active = key === fabrication;
                            return (
                                <Link
                                    key={key}
                                    href={`?fabrication=${key}`}
                                    scroll={false}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                                        active ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                    )}
                                >
                                    <span className={cn("flex size-6 items-center justify-center rounded-md", active ? tile : "")}>
                                        <TabIcon className="size-3.5" />
                                    </span>
                                    {label}
                                    <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                                        {isLoading ? "–" : counts[key]}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* KPI cards                                                           */
/* ------------------------------------------------------------------ */

function ProgressRing({ value, className }: { value: number; className?: string }) {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    return (
        <svg viewBox="0 0 56 56" className={cn("size-14 -rotate-90", className)} aria-hidden>
            <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
            <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - value / 100)}
                className={cn(
                    "transition-[stroke-dashoffset] duration-700 ease-out",
                    value >= 100 ? "stroke-emerald-500" : value > 0 ? "stroke-amber-500" : "stroke-muted-foreground/30",
                )}
            />
        </svg>
    );
}

function Bar({ value, className }: { value: number; className: string }) {
    return (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", className)} style={{ width: `${value}%` }} />
        </div>
    );
}

function KpiCard({
    icon: Icon,
    label,
    accent,
    index,
    children,
    aside,
}: {
    icon: typeof Wrench;
    label: string;
    accent: string;
    index: number;
    children: React.ReactNode;
    aside?: React.ReactNode;
}) {
    return (
        <div
            className="group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-0.5 hover:shadow-md fill-mode-both"
            style={{ animationDelay: `${80 + index * 70}ms`, animationDuration: "500ms" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className={cn("flex size-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110", accent)}>
                            <Icon className="size-4" />
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    </div>
                    <div className="mt-3">{children}</div>
                </div>
                {aside}
            </div>
        </div>
    );
}

export function CutlistKpis({
    fabrication,
    rows,
    allRowCount,
    stats,
    isLoading,
}: {
    fabrication: Fabrication;
    rows: CutListRow[];
    allRowCount: number;
    stats: ReturnType<typeof computeCutlistStats>;
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-[118px] rounded-2xl" />
                ))}
            </div>
        );
    }

    const shareOfProject = percent(rows.length, allRowCount);
    const totalRoutableRows = rows.length;
    const avgPieces = totalRoutableRows ? stats.totalPieces / totalRoutableRows : 0;
    const coverage = fabrication === "METALWORK"
        ? { label: "Part images", icon: ImageIcon, part: stats.withImages, unit: "have a shape" }
        : { label: "Machine coverage", icon: Route, part: stats.routedRows, unit: "rows routed" };
    const coveragePercent = percent(coverage.part, totalRoutableRows);
    const progress = percent(stats.scannedPieces, stats.routedPieces);

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard index={0} icon={Layers} label="Part rows" accent="bg-violet-500/15 text-violet-600 dark:text-violet-300">
                <p className="text-3xl font-semibold tracking-tight tabular-nums"><CountUp value={rows.length} /></p>
                <div className="mt-2 space-y-1.5">
                    <Bar value={shareOfProject} className="bg-violet-500" />
                    <p className="text-xs text-muted-foreground">{shareOfProject}% of {allRowCount.toLocaleString()} rows in this project</p>
                </div>
            </KpiCard>

            <KpiCard index={1} icon={Boxes} label="Total pieces" accent="bg-sky-500/15 text-sky-600 dark:text-sky-300">
                <p className="text-3xl font-semibold tracking-tight tabular-nums"><CountUp value={stats.totalPieces} /></p>
                <p className="mt-2 text-xs text-muted-foreground">
                    ≈ <span className="font-medium text-foreground tabular-nums">{avgPieces.toFixed(1)}</span> pieces per part
                </p>
            </KpiCard>

            <KpiCard index={2} icon={coverage.icon} label={coverage.label} accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    <CountUp value={coveragePercent} suffix="%" />
                </p>
                <div className="mt-2 space-y-1.5">
                    <Bar value={coveragePercent} className="bg-emerald-500" />
                    <p className="text-xs text-muted-foreground tabular-nums">{coverage.part} of {totalRoutableRows} {coverage.unit}</p>
                </div>
            </KpiCard>

            <KpiCard
                index={3}
                icon={Gauge}
                label="Production progress"
                accent="bg-amber-500/15 text-amber-600 dark:text-amber-300"
                aside={
                    <div className="relative flex items-center justify-center">
                        <ProgressRing value={progress} />
                        <span className="absolute text-[11px] font-semibold tabular-nums">{progress}%</span>
                    </div>
                }
            >
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    <CountUp value={stats.scannedPieces} />
                    <span className="text-base font-medium text-muted-foreground"> / {stats.routedPieces.toLocaleString()}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    {stats.routedPieces ? "machine scans completed" : "No machine routing yet"}
                </p>
            </KpiCard>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Machine pipeline                                                    */
/* ------------------------------------------------------------------ */

export function MachinePipeline({ machines }: { machines: MachineStat[] }) {
    if (machines.length === 0) return null;

    return (
        <section
            className="rounded-2xl border bg-card p-4 animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
            style={{ animationDelay: "380ms", animationDuration: "500ms" }}
        >
            <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Route className="size-4 text-muted-foreground" />
                    Production flow
                </h2>
                <span className="text-xs text-muted-foreground">Pieces scanned at each machine</span>
            </div>
            <ol className="flex items-stretch gap-1 overflow-x-auto pb-1">
                {machines.map((machine, index) => {
                    const value = percent(machine.scannedPieces, machine.totalPieces);
                    const state = value >= 100 ? "done" : value > 0 ? "active" : "idle";
                    return (
                        <li key={machine.name} className="flex min-w-[190px] flex-1 items-center gap-1">
                            <div
                                className={cn(
                                    "flex-1 rounded-xl border p-3 transition-colors",
                                    state === "done" && "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30",
                                    state === "active" && "border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30",
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "relative flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                                            state === "done" && "bg-emerald-500 text-white",
                                            state === "active" && "bg-amber-500 text-white",
                                            state === "idle" && "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {state === "active" && (
                                            <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/60" />
                                        )}
                                        <span className="relative">{machine.step}</span>
                                    </span>
                                    <span className="truncate text-sm font-medium" title={machine.name}>{machine.name}</span>
                                </div>
                                <div className="mt-2.5 space-y-1.5">
                                    <Bar
                                        value={value}
                                        className={state === "done" ? "bg-emerald-500" : "bg-amber-500"}
                                    />
                                    <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                                        <span>{machine.scannedPieces}/{machine.totalPieces} pcs</span>
                                        <span className="font-medium text-foreground">{value}%</span>
                                    </div>
                                </div>
                            </div>
                            {index < machines.length - 1 && (
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
