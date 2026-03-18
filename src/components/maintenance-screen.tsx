"use client";

import { cn } from "@/lib/utils";

interface MaintenanceScreenProps {
  className?: string;
}

export default function MaintenanceScreen({
  className,
}: MaintenanceScreenProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ef] text-[#1f1a17]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-[#e6d7c7] opacity-60 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-80px] h-80 w-80 animate-pulse rounded-full bg-[#f2c7a6] opacity-50 blur-3xl [animation-delay:1000ms]" />
        <div className="absolute right-[-120px] top-[15%] h-72 w-72 animate-pulse rounded-full bg-[#ead0b7] opacity-55 blur-3xl [animation-delay:500ms]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-16 text-center">
        <div className="group inline-flex rounded-full border border-[#d7c2ad] bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6e55] shadow-sm backdrop-blur-sm transition-all hover:border-[#c4ab92] hover:shadow-md items-center">
          <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#8b6e55]"></span>
          Scheduled Maintenance
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          We're fine-tuning the workshop.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-[#6b5a4d] sm:text-lg">
          Furnix CRM is temporarily unavailable while we ship improvements. We'll be back shortly. Thank you for your patience.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:support@furnixcrm.com"
            className="group inline-flex items-center gap-2 rounded-full border border-[#d7c2ad] bg-white/80 px-5 py-2.5 text-sm font-semibold text-[#5f4a3f] backdrop-blur-sm transition-all hover:border-[#c4ab92] hover:bg-white hover:shadow-md"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            support@furnixcrm.com
          </a>
        </div>
      </div>
    </div>
  );
}