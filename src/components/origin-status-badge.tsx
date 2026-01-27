import { Badge } from "./ui/badge";

interface BadgeProps {
  title: string;
}

export default function CustomeStatusBadge({ title }: BadgeProps) {
  // 1. Replace hyphen with space
  let formatted = title.replace(/-/g, " ");

  // 2. Capitalize each word
  formatted = formatted.replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Badge className="bg-muted text-black dark:text-white border-border  rounded-md font-semibold px-3 py-1.5 text-xs whitespace-nowrap">
      {formatted}
    </Badge>
  );
}
