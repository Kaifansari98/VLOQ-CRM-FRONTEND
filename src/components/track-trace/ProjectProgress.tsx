'use client';

import { Project } from "@/types/track-trace";
import { Separator } from "@/components/ui/separator";

interface ProjectProgressProps {
  projects: Project[];
}

export default function ProjectProgress({ projects }: ProjectProgressProps) {
  return (
    <div className="bg-card border border-border rounded-xl flex flex-col max-h-110">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 p-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground tracking-tight leading-none">
            Project Progress
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Items completion by project
          </p>
        </div>
        <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
          {projects.length} projects
        </span>
      </div>

      <Separator />

      {/* ── Column Headers ─────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_90px_90px_90px_100px] gap-2 px-5 py-2.5 bg-muted/50 border-b border-border shrink-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Project</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Total</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Done</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Pending</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Progress</span>
      </div>

      {/* ── Rows ───────────────────────────────────────────────────── */}
      <div
        className="divide-y divide-border overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-muted-foreground text-lg">⊘</span>
            </div>
            <p className="text-sm font-medium text-foreground">No projects found</p>
            <p className="text-xs text-muted-foreground mt-1">Project data will appear here</p>
          </div>
        )}

        {projects.map((project) => {
          const sqftProcessed = Number(project.sqft_processed) || 0;
          const sqftPending   = Number(project.sqft_pending)   || 0;
          const sqftTotal     = sqftProcessed + sqftPending;
          const progress      = Number(project.progress_sqft)  || 0;

          return (
            <div
              key={project.id}
              className="grid grid-cols-[1fr_90px_90px_90px_100px] gap-2 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors duration-150"
            >
              {/* Project name + lead code */}
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold text-foreground leading-snug">
                  {project.project_name}
                </p>
                <span className="inline-block mt-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {project.lead_code}
                </span>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground tabular-nums leading-none">
                  {sqftTotal.toFixed(1)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-0.5">sqft</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{project.total} items</p>
              </div>

              {/* Done */}
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground tabular-nums leading-none">
                  {sqftProcessed.toFixed(1)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-0.5">sqft</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{project.processed} items</p>
              </div>

              {/* Pending */}
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground tabular-nums leading-none">
                  {sqftPending.toFixed(1)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-0.5">sqft</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{project.pending} items</p>
              </div>

              {/* Progress */}
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-xs font-bold text-foreground tabular-nums leading-none">
                  {progress}%
                </p>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 80 ? 'bg-green-500' :
                      progress >= 40 ? 'bg-amber-400' :
                      progress >  0  ? 'bg-foreground' :
                      'bg-muted-foreground/20'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}