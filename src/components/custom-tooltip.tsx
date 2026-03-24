import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomeTooltipProps {
  truncateValue: React.ReactNode;
  value?: string;

  /** 🔧 Control tooltip width / styling */
  contentClassName?: string;

  /** 🔧 Optional positioning */
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";

  /** 🔧 Delay control (default = instant) */
  delayDuration?: number;
}

export default function CustomeTooltip({
  truncateValue,
  value,
  contentClassName = "",
  side = "top",
  align = "center",
  delayDuration = 0,
}: CustomeTooltipProps) {
  // Skip tooltip if no value
  if (!value?.trim()) {
    return <>{truncateValue}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="border-0 w-full shadow-none p-0 font-normal text-inherit bg-transparent cursor-default">
            {truncateValue}
          </span>
        </TooltipTrigger>

        <TooltipContent
          side={side}
          align={align}
          className={`
            dark text-xs leading-snug wrap-break-word
            ${contentClassName}
          `}
        >
          {value}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
