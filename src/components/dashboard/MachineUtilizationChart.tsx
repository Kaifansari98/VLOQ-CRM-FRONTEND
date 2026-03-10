// MachineUtilizationChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend, ChartOptions, BarController,
} from 'chart.js';
import { Separator } from '@/components/ui/separator';

ChartJS.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function isDark() {
  return typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
}

export default function MachineUtilizationChart({ data }: { data: any }) {
  const chartRef      = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const dark = isDark();

    const fg        = dark ? '#e4e4e7' : '#18181b';
    const mutedFg   = dark ? '#71717a' : '#9ca3af';
    const borderClr = dark ? '#3f3f46' : '#e4e4e7';
    const popoverBg = dark ? '#18181b' : '#ffffff';
    const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const barPrimary   = dark ? 'rgba(228,228,231,0.85)' : 'rgba(24,24,27,0.80)';
    const barSecondary = dark ? 'rgba(228,228,231,0.25)' : 'rgba(24,24,27,0.20)';
    const barHoverP    = dark ? 'rgba(228,228,231,0.95)' : 'rgba(24,24,27,0.90)';
    const barHoverS    = dark ? 'rgba(228,228,231,0.35)' : 'rgba(24,24,27,0.30)';

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color:         mutedFg,
            padding:       20,
            font:          { size: 11 },
            usePointStyle: false,
            boxWidth:      12,
            boxHeight:     8,
          },
        },
        tooltip: {
          backgroundColor: popoverBg,
          titleColor:      fg,
          bodyColor:       mutedFg,
          borderColor:     borderClr,
          borderWidth:     1,
          padding:         12,
          cornerRadius:    10,
          displayColors:   true,
          boxWidth:        8,
          boxHeight:       8,
          boxPadding:      4,
          callbacks: {
            label: (c: any) => ` ${c.dataset.label}: ${c.parsed.y}%`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          border: { dash: [4, 4], display: false },
          grid:   { color: gridColor, drawTicks: false },
          ticks:  {
            color: mutedFg, font: { size: 11 }, padding: 10,
            callback: (v: any) => v + '%',
          },
        },
        x: {
          border: { display: false },
          grid:   { display: false },
          ticks:  {
            color:         mutedFg,
            font:          { size: 10 },
            padding:       8,
            maxRotation:   35,
            minRotation:   35,
            autoSkip:      true,
            maxTicksLimit: 12,
          },
        },
      },
    };

    chartInstance.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        ...data,
        datasets: data.datasets.map((ds: any, i: number) => ({
          ...ds,
          backgroundColor:      i === 0 ? barPrimary   : barSecondary,
          hoverBackgroundColor: i === 0 ? barHoverP    : barHoverS,
          borderWidth:          0,
          borderRadius:         { topLeft: 4, topRight: 4 },
          borderSkipped:        false,
          maxBarThickness:      32,
        })),
      },
      options,
    });

    return () => { chartInstance.current?.destroy(); };
  }, [data]);

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col min-w-0">
      <div className="flex items-center justify-between gap-4 px-5 py-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground tracking-tight leading-none">
            Machine Utilization Rate
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Average utilization by machine type
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
          Compare
        </span>
      </div>
      <Separator />
      <div className="p-5 pt-4 min-w-0">
        <div className="h-64 w-full">
          <canvas ref={chartRef} />
        </div>
      </div>
    </div>
  );
}