'use client';

import { BottleneckData } from '@/types/track-trace';
import { Separator } from '@/components/ui/separator';

interface BottleneckAnalysisProps {
  bottlenecks: BottleneckData[];
}

const SEVERITY_CONFIG = {
  high:   { bar: 'bg-red-500',   pill: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-500',   label: 'Critical' },
  medium: { bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Warning'  },
  low:    { bar: 'bg-green-500', pill: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Normal'   },
} as const;

export default function BottleneckAnalysis({ bottlenecks }: BottleneckAnalysisProps) {
  const sorted = [...bottlenecks].sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 };
    return (rank[b.severity as keyof typeof rank] ?? 0) - (rank[a.severity as keyof typeof rank] ?? 0);
  });

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground tracking-tight leading-none">
            Bottleneck Analysis
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Ranked by severity · queue load
          </p>
        </div>
        <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
          {bottlenecks.length} machines
        </span>
      </div>

      <Separator />

      {/* ── Rows ───────────────────────────────────────────────────── */}
      <div
        className="divide-y divide-border overflow-y-auto max-h-95 min-h-40
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-muted-foreground text-lg">⊘</span>
            </div>
            <p className="text-sm font-medium text-foreground">No bottlenecks detected</p>
            <p className="text-xs text-muted-foreground mt-1">All machines are running smoothly</p>
          </div>
        ) : (
          sorted.map((bottleneck, index) => {
            const cfg = SEVERITY_CONFIG[bottleneck.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;

            return (
              <div
                key={index}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors duration-150"
              >
                {/* Rank */}
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                  {index + 1}
                </div>

                {/* Machine + bar */}
                <div className="flex-1 min-w-0">

                  {/* Row 1: machine + operator + queue + avg */}
                  <div className="flex items-center gap-2 mb-1.5 min-w-0">
                    <div className="min-w-0 shrink-0 max-w-30">
                      <p className="text-xs font-semibold text-foreground leading-none truncate">
                        {bottleneck.machine}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-none truncate">
                        {bottleneck.operator || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-border text-[9px]">·</span>
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Queue</span>
                      <span className="text-[10px] font-semibold text-foreground tabular-nums leading-none">{bottleneck.queueCount}</span>
                      <span className="text-border text-[9px]">·</span>
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Avg</span>
                      <span className="text-[10px] font-semibold text-foreground tabular-nums leading-none">{bottleneck.avgWait}</span>
                    </div>
                  </div>

                  {/* Row 2: load bar + % */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                        style={{ width: `${Math.min(bottleneck.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums shrink-0 w-7 text-right">
                      {bottleneck.percentage}%
                    </span>
                  </div>

                </div>

                {/* Severity pill */}
                <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold ${cfg.pill}`}>
                  <span className={`w-1 h-1 rounded-full shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}