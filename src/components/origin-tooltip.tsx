import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RemarkTooltipProps {
  remark: string;
  remarkFull: string;
}

export default function RemarkTooltip({
  remark,
  remarkFull,
}: RemarkTooltipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-0 shadow-none p-0 font-normal text-inherit bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
          >
            {remark}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="py-3 w-[300px] ">
          <div className="space-y-1">
            <p className="text-[13px] font-medium">Design Remark</p>
            <p className="text-muted-foreground text-xs">
              {remarkFull}
              <code>trigger</code> prop to <code>click</code>.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
