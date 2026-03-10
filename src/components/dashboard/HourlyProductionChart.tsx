// HourlyProductionChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, ChartOptions, LineController, Filler,
} from 'chart.js';
import { Separator } from '@/components/ui/separator';

ChartJS.register(LineController, Filler, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function isDark() {
  return typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
}

export default function HourlyProductionChart({ data }: { data: any }) {
  const chartRef      = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const dark = isDark();

    const fg         = dark ? '#e4e4e7' : '#18181b';
    const mutedFg    = dark ? '#71717a' : '#9ca3af';
    const borderClr  = dark ? '#3f3f46' : '#e4e4e7';
    const popoverBg  = dark ? '#18181b' : '#ffffff';
    const gridColor  = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.00)');

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color:           mutedFg,
            padding:         20,
            font:            { size: 11 },
            usePointStyle:   false,
            boxWidth:        12,
            boxHeight:       2,
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
            label: (c: any) => ` ${c.dataset.label}: ${c.parsed.y}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          border: { dash: [4, 4], display: false },
          grid:   { color: gridColor, drawTicks: false },
          ticks:  { color: mutedFg, font: { size: 11 }, padding: 10 },
        },
        x: {
          border: { display: false },
          grid:   { display: false },
          ticks:  { color: mutedFg, font: { size: 11 }, padding: 8, maxRotation: 0 },
        },
      },
    };

    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        ...data,
        datasets: data.datasets.map((ds: any, i: number) => {
          const isTarget = ds.label?.toLowerCase().includes('target');
          return {
            ...ds,
            borderColor:           i === 0 ? fg : mutedFg,
            borderWidth:           isTarget ? 1.5 : 2,
            borderDash:            isTarget ? [5, 4] : [],
            fill:                  i === 0,
            backgroundColor:       i === 0 ? gradient : 'transparent',
            tension:               0.4,
            pointBackgroundColor:  i === 0 ? fg : mutedFg,
            pointBorderColor:      popoverBg,
            pointBorderWidth:      2,
            pointRadius:           isTarget ? 0 : 3,
            pointHoverRadius:      5,
            pointHoverBorderWidth: 2,
          };
        }),
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
            Hourly Production Rate
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Items processed per hour
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
          Trend
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