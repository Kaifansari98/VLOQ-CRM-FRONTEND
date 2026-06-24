"use client";

import { useId, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SelectData {
  id: number;
  label: string;
  disabled?: boolean;
  tooltip?: string;
}

interface SelectGroup {
  label: string;
  items: SelectData[];
}

interface Props {
  data: SelectData[];
  groups?: SelectGroup[];
  value?: number;
  onChange?: (selectedId: number | null) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string; // ✅ ADDED
}

export default function AssignToPicker({
  data,
  groups,
  value,
  onChange,
  placeholder = "Search user...",
  emptyLabel = "Select an option",
  disabled = false,
  className, // ✅ ADDED
}: Props) {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);

  const groupedData =
    groups && groups.length > 0
      ? groups.reduce<SelectData[]>(
          (acc, group) => acc.concat(group.items),
          []
        )
      : data;

  const stringValue =
    value !== undefined && value !== null ? String(value) : "";
  const selectedItem = groupedData.find((item) => item.id === value);

  const renderItem = (item: SelectData) => {
    const itemNode = (
      <CommandItem
        key={item.id}
        value={item.label.toLowerCase()}
        disabled={item.disabled}
        className="min-w-0"
        onSelect={() => {
          if (item.disabled) return;
          setOpen(false);
          onChange?.(value === item.id ? null : item.id);
        }}
      >
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {value === item.id && <CheckIcon size={16} className="ml-auto" />}
      </CommandItem>
    );

    if (!item.disabled || !item.tooltip) {
      return itemNode;
    }

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <div>{itemNode}</div>
        </TooltipTrigger>
        <TooltipContent>{item.tooltip}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="relative w-full min-w-0 *:not-first:mt-2 group">
      <Popover modal={true} open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "bg-background hover:bg-background border-input w-full min-w-0 justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
              disabled &&
                "opacity-60 cursor-not-allowed relative after:content-[''] after:absolute after:inset-0 after:border-2 after:border-transparent after:rounded-md",
              className // ✅ Apply className here
            )}
          >
            <span
              className={cn(
                "truncate",
                !stringValue && "text-muted-foreground"
              )}
            >
              {selectedItem ? selectedItem.label : emptyLabel}
            </span>
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>

        {!disabled && (
          <PopoverContent
            className="border-input w-[var(--radix-popper-anchor-width)] min-w-0 max-w-[var(--radix-popper-anchor-width)] overflow-hidden p-0"
            align="start"
          >
            <TooltipProvider>
              <Command className="max-h-[320px] overflow-hidden">
                <CommandInput placeholder={placeholder} />
                <CommandList className="max-h-64 overflow-y-auto overscroll-contain">
                  <CommandEmpty>No options found.</CommandEmpty>
                  <CommandGroup></CommandGroup>
                  {groups && groups.length > 0 ? (
                    groups
                      .filter((group) => group.items.length > 0)
                      .map((group) => (
                        <CommandGroup key={group.label} heading={group.label}>
                          {group.items.map(renderItem)}
                        </CommandGroup>
                      ))
                  ) : (
                    <CommandGroup>{data.map(renderItem)}</CommandGroup>
                  )}
                </CommandList>
              </Command>
            </TooltipProvider>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
