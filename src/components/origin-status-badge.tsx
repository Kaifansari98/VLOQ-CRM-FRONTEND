import { Badge } from "./ui/badge";

interface BadgeProps {
  title: string;
}
export default function CustomeStatusBadge({ title }: BadgeProps) {
  // 1. Replace hyphen with space
  let formatted = title.replace(/-/g, " ");

  // 2. Capitalize each word
  formatted = formatted.replace(/\b\w/g, (char) => char.toUpperCase());
  return <Badge>{formatted}</Badge>;
}
