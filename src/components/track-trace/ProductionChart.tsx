'use client';

import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ChartOptions, LineController, BarController } from 'chart.js';

ChartJS.register(LineController,BarController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);


interface ProductionChartProps {
  data: any;
  type: 'line' | 'bar';
  title: string;
  subtitle: string;
}

export default function ProductionChart({ data, type, title, subtitle }: ProductionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const commonOptions: ChartOptions<any> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#374151',
            padding: 15,
            font: {
              size: 12,
              family: 'Inter',
            },
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#E5E7EB',
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 11,
              family: 'Inter',
            },
          },
        },
        x: {
          grid: {
            display: type === 'line' ? false : true,
            color: '#E5E7EB',
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 11,
              family: 'Inter',
            },
          },
        },
      },
    };

    const config: any = {
      type,
      data: {
        ...data,
        datasets: data.datasets.map((dataset: any, index: number) => ({
          ...dataset,
          borderWidth: type === 'line' ? 2 : 0,
          fill: type === 'line' ? index === 0 : false,
          tension: type === 'line' ? 0.4 : 0,
          pointBackgroundColor: type === 'line' ? dataset.borderColor : undefined,
          pointBorderColor: type === 'line' ? '#fff' : undefined,
          pointBorderWidth: type === 'line' ? 2 : 0,
          pointRadius: type === 'line' ? 4 : 0,
          pointHoverRadius: type === 'line' ? 6 : 0,
          borderDash: dataset.label === 'Target' ? [5, 5] : [],
          borderRadius: type === 'bar' ? 4 : 0,
        })),
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales?.y,
            max: type === 'bar' ? 100 : undefined,
            ticks: {
              ...commonOptions.scales?.y?.ticks,
              callback: function (value: any) {
                return type === 'bar' ? value + '%' : value;
              },
            },
          },
        },
      },
    };

    chartInstance.current = new ChartJS(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="border-b border-gray-200 p-6 pb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="p-6">
        <div className="h-[250px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
