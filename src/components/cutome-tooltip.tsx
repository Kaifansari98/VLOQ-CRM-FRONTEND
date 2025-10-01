import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomeTooltipProps {
  truncateValue: React.ReactNode;
  value: string;
}

export default function CustomeTooltip({
  truncateValue,
  value,
}: CustomeTooltipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            className="border-0 shadow-none p-0 font-normal text-inherit bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
          >
            {truncateValue}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="dark px-2 py-1 text-xs">
          {value}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
