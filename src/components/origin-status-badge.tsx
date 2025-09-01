import { Badge } from "@/components/ui/badge";

interface BadgeProps {
  title: string;
}
export default function CustomeStatusBadge({ title }: BadgeProps) {
  return <Badge>{title}</Badge>;
}
