"use client";

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed bg-muted/20 px-6 py-16 text-center text-muted-foreground">
      <Icon size={34} className="mb-3 opacity-30" />
      <p className="text-sm font-bold text-foreground">{title}</p>
      {subtitle && <p className="mt-1 text-xs">{subtitle}</p>}
    </div>
  );
}