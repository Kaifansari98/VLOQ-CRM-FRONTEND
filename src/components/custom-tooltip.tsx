import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomeTooltipProps {
  truncateValue: React.ReactNode;
  value?: string; // made optional
}

export default function CustomeTooltip({
  truncateValue,
  value,
}: CustomeTooltipProps) {
  // 🔥 If value is empty, null, or undefined, skip tooltip entirely
  if (!value?.trim()) {
    return <>{truncateValue}</>;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="border-0 w-full shadow-none p-0 font-normal text-inherit bg-transparent 
                       hover:bg-transparent focus:bg-transparent active:bg-transparent"
          >
            {truncateValue}
          </span>
        </TooltipTrigger>
        <TooltipContent className="dark max-w-lg px-2 py-1 text-xs leading-snug break-words">
          {value}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
