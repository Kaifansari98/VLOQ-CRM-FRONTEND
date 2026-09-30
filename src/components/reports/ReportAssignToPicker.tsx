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

interface SelectData {
  id: number | string;
  label: string;
  description?: string;
  avatarText?: string;
}

interface SelectGroup {
  label: string;
  items: SelectData[];
}

interface Props {
  data: SelectData[];
  groups?: SelectGroup[];
  value?: number | string;
  onChange?: (selectedId: number | string | null) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}

export default function ReportAssignToPicker({
  data,
  groups,
  value,
  onChange,
  placeholder = "Search user...",
  emptyLabel = "Select an option",
  disabled = false,
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

  const renderItemContent = (item: SelectData) => {
    const isSelected = value === item.id;

    if (!item.description && !item.avatarText) {
      return (
        <>
          {item.label}
          {isSelected && <CheckIcon size={16} className="ml-auto" />}
        </>
      );
    }

    return (
      <div className="flex w-full items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
          {item.avatarText ?? item.label.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {item.label}
          </div>
          {item.description && (
            <div className="truncate text-xs text-muted-foreground">
              {item.description}
            </div>
          )}
        </div>
        {isSelected && <CheckIcon size={16} className="shrink-0 text-foreground" />}
      </div>
    );
  };

  return (
    <div className="relative *:not-first:mt-2 group">
      <Popover modal={false} open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
              disabled &&
                "opacity-60 cursor-not-allowed relative after:content-[''] after:absolute after:inset-0 after:border-2 after:border-transparent after:rounded-md"
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
            className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder={placeholder} />
              <CommandList className="max-h-64 overflow-y-auto">
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                </CommandGroup>
                {groups && groups.length > 0 ? (
                  groups
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <CommandGroup key={group.label} heading={group.label}>
                        {group.items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.label} ${item.description ?? ""}`.toLowerCase()}
                            onSelect={() => {
                              setOpen(false);
                              onChange?.(value === item.id ? null : item.id);
                            }}
                          >
                            {renderItemContent(item)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))
                ) : (
                  <CommandGroup>
                    {data.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.label} ${item.description ?? ""}`.toLowerCase()}
                        onSelect={() => {
                          setOpen(false);
                          onChange?.(value === item.id ? null : item.id);
                        }}
                      >
                        {renderItemContent(item)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
