"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  BarController,
} from "chart.js";
import { Separator } from "@/components/ui/separator";

ChartJS.register(
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MachineUtilizationChartProps {
  data: any;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export default function MachineUtilizationChart({
  data,
}: MachineUtilizationChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const mutedFg = cssVar("--muted-foreground");
    const fgColor = cssVar("--foreground");
    const borderColor = cssVar("--border");
    const popover = cssVar("--popover");

    const gridColor = darkMode
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.05)";

    const options: ChartOptions<"bar"> = {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false,
      },

      animation: {
        duration: 700,
        easing: "easeOutQuart",
      },

      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: fgColor,
            padding: 20,
            font: { size: 11, weight: 500 },
            usePointStyle: true,
          },
        },

        tooltip: {
          backgroundColor: popover,
          titleColor: fgColor,
          bodyColor: mutedFg,
          borderColor: borderColor,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            label: (c: any) =>
              ` ${c.dataset.label}: ${c.parsed.y.toFixed(1)}%`,
          },
        },
      },

      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          border: { display: false },
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          ticks: {
            color: mutedFg,
            font: { size: 11 },
            padding: 10,
            callback: (v: any) => v + "%",
          },
        },

        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: mutedFg,
            font: { size: 10 },
            padding: 8,
            autoSkip: false,
            maxRotation: 40,
            minRotation: 40,
          },
        },
      },
    };

    chartInstance.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        ...data,
        datasets: data.datasets.map((ds: any) => ({
          ...ds,

          backgroundColor: darkMode
            ? "rgba(255,255,255,0.85)"
            : "rgba(0,0,0,0.85)",

          hoverBackgroundColor: darkMode
            ? "rgba(255,255,255,1)"
            : "rgba(0,0,0,1)",

          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,

          barPercentage: 0.6,
          categoryPercentage: 0.7,
        })),
      },
      options,
    });

    return () => chartInstance.current?.destroy();
  }, [data, darkMode]);

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
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

      <div className="p-5 pt-4">
        <div className="relative h-[280px] w-full">
          <canvas ref={chartRef} />
        </div>
      </div>
    </div>
  );
}