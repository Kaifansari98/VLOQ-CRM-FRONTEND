"use client";

import { cn } from "@/lib/utils";

interface StructureQuantityItem {
  id: string;
  label: string;
  count: number;
}

interface StructureQuantityCardsProps {
  items: StructureQuantityItem[];
  className?: string;
}

export default function StructureQuantityCards({
  items,
  className,
}: StructureQuantityCardsProps) {
  if (!items.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Selected Products
        </p>
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-fit max-w-full rounded-lg border bg-gradient-to-br from-muted/40 to-muted/10 px-3 py-2 text-sm"
          >
            <div className="w-fit max-w-full">
              <div className="flex items-center gap-1.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                <p className="text-[13px] font-semibold text-foreground">
                  {item.label} <span className="font-normal ml-2">+{item.count}</span>
                </p>
              </div>
              {/* <div className="mt-0.5 text-xs text-muted-foreground">
                Qty <span className="text-foreground">{item.count}</span>
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
