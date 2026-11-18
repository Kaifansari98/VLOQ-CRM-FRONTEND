import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

// Shared pieces for the complaint workflow dialogs.

// Vendor sidebar colours with a zinc fallback; pair with useVendorBrandStyle().
export const BRAND_BUTTON =
  "bg-[var(--brand-bg,var(--color-zinc-900))] text-[var(--brand-text,var(--color-white))] hover:bg-[var(--brand-bg,var(--color-zinc-900))] hover:opacity-90 dark:bg-[var(--brand-bg,var(--color-zinc-800))] dark:hover:bg-[var(--brand-bg,var(--color-zinc-800))]";

export const workflowError = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ?? "Something went wrong. Please try again.";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

export const rupees = (value: number | string) =>
  `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
