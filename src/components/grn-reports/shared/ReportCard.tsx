"use client";

import { cn } from "@/lib/utils";
import { toneClass } from "./reportUtils";

type Tone = keyof typeof toneClass;

export function ReportCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "slate",
  large,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  large?: boolean;
}) {
  const t = toneClass[tone];

  return (
    <div
      className={cn(
        "rounded-[24px] border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        large && "p-5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-2xl p-2.5", t.bg)}>
          <Icon size={large ? 21 : 17} className={t.text} />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div
            className={cn(
              "mt-1 font-black tabular-nums",
              large ? "text-3xl" : "text-xl",
              t.text
            )}
          >
            {value}
          </div>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  );
}