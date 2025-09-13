import { Badge } from "@/components/ui/badge";

interface CustomeBadgeProps {
  title: string;
  bgColor: string;
}

export default function CustomeBadge({ title, bgColor }: CustomeBadgeProps) {
  return (
    <Badge appearance="outline" className="gap-1.5">
      <span
        className={`size-1.5 rounded-full ${bgColor}`}
        aria-hidden="true"
      ></span>
      {title}
    </Badge>
  );
}