"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  LineController,
  Filler,
} from "chart.js";
import { Separator } from "@/components/ui/separator";

ChartJS.register(
  LineController,
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HourlyProductionChartProps {
  data: any;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export default function HourlyProductionChart({
  data,
}: HourlyProductionChartProps) {
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
    const card = cssVar("--card");

    const gridColor = darkMode
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.05)";

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(
      0,
      darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
    );
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    const options: ChartOptions<"line"> = {
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
              ` ${c.dataset.label}: ${c.parsed.y.toFixed(0)}`,
          },
        },
      },

      scales: {
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          ticks: {
            color: mutedFg,
            font: { size: 11 },
            padding: 10,
          },
        },

        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: mutedFg,
            font: { size: 11 },
            padding: 8,
            maxRotation: 0,
          },
        },
      },
    };

    chartInstance.current = new ChartJS(ctx, {
      type: "line",
      data: {
        ...data,
        datasets: data.datasets.map((ds: any, i: number) => {
          const isTarget = ds.label === "Target SQFT";

          return {
            ...ds,

            borderWidth: isTarget ? 2 : 2.5,

            // opposite colors
            borderColor: isTarget ? mutedFg : fgColor,

            fill: !isTarget,
            backgroundColor: !isTarget ? gradient : "transparent",

            tension: 0.35,

            pointBackgroundColor: isTarget ? mutedFg : fgColor,
            pointBorderColor: card,
            pointBorderWidth: 1,

            pointRadius: isTarget ? 2 : 3.5,
            pointHoverRadius: 6,

            hoverBorderWidth: 3,
          };
        }),
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
            Hourly Production Rate
          </h2>

          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Items processed per hour
          </p>
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
          Trend
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