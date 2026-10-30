import { GRNStatus } from "@/api/grn/grn";
import { cn } from "@/lib/utils";
import { STATUS_META } from "./statusUtils";

export function GRNStatusBadge({
  status,
  size = "sm",
}: {
  status: GRNStatus;
  size?: "xs" | "sm";
}) {
  const meta = STATUS_META[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
    dotClassName: "bg-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        meta.className,
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </span>
  );
}