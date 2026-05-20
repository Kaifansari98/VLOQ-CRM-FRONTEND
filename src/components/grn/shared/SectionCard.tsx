import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card shadow-sm overflow-hidden",
        className
      )}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b bg-muted/20 px-4 py-3">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="mt-0.5 rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40">
                {icon}
              </div>
            )}

            <div>
              {title && <h3 className="text-sm font-black">{title}</h3>}
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          {action}
        </div>
      )}

      <div className="p-4">{children}</div>
    </section>
  );
}