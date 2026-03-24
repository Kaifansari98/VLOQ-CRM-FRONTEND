'use client';

import { Operator } from '@/types/track-trace';
import { Separator } from '@/components/ui/separator';

interface TopOperatorsProps {
  operators: Operator[];
}

export default function TopOperators({ operators }: TopOperatorsProps) {
  return (
    <div className="bg-card border border-border rounded-xl flex flex-col max-h-110">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 p-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground tracking-tight leading-none">
            Top Performing Operators
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Based on items processed
          </p>
        </div>
        <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
          {operators.length} operators
        </span>
      </div>

      <Separator />

      {/* ── Column Headers ─────────────────────────────────────────── */}
      <div className="grid grid-cols-[28px_1fr_44px_60px_72px] gap-2 px-5 py-2.5 bg-muted/50 border-b border-border shrink-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Sr</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Operator</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Items</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Avg</span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Effic.</span>
      </div>

      {/* ── Rows ───────────────────────────────────────────────────── */}
      <div
        className="divide-y divide-border max-h-110 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {operators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-muted-foreground text-lg">⊘</span>
            </div>
            <p className="text-sm font-medium text-foreground">No operators found</p>
            <p className="text-xs text-muted-foreground mt-1">Data will appear here</p>
          </div>
        )}

        {operators.map((operator, index) => {
          const efficiency = operator.efficiency ?? 0;

          return (
            <div
              key={operator.id}
              className="grid grid-cols-[28px_1fr_44px_60px_72px] gap-2 items-center px-5 py-3 hover:bg-muted/30 transition-colors duration-150"
            >
              {/* Rank */}
              <div className="w-5 h-5 rounded bg-foreground text-background flex items-center justify-center font-bold text-[9px] select-none shrink-0">
                {index + 1}
              </div>

              {/* Name + machine */}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-none truncate">
                  {operator.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-none truncate">
                  {operator.machine}
                </p>
              </div>

              {/* Items */}
              <div className="text-right">
                <p className="text-xs font-bold text-foreground tabular-nums leading-none">
                  {operator.itemsProcessed}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">items</p>
              </div>

              {/* Avg Time */}
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground tabular-nums leading-none">
                  {operator.avgTime}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">avg</p>
              </div>

              {/* Efficiency */}
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-xs font-bold text-foreground tabular-nums leading-none">
                  {efficiency}%
                </p>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(efficiency, 100)}%` }}
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