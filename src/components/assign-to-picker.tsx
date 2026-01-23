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
  id: number;
  label: string;
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
}

export default function AssignToPicker({
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
              // ✅ Adds red border on hover when disabled
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
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="clear-selection"
                    onSelect={() => {
                      setOpen(false);
                      onChange?.(null);
                    }}
                  >
                    Clear selection
                  </CommandItem>
                </CommandGroup>
                {groups && groups.length > 0 ? (
                  groups
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <CommandGroup key={group.label} heading={group.label}>
                        {group.items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.label.toLowerCase()}
                            onSelect={() => {
                              setOpen(false);
                              onChange?.(value === item.id ? null : item.id);
                            }}
                          >
                            {item.label}
                            {value === item.id && (
                              <CheckIcon size={16} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))
                ) : (
                  <CommandGroup>
                    {data.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.label.toLowerCase()}
                        onSelect={() => {
                          setOpen(false);
                          onChange?.(value === item.id ? null : item.id);
                        }}
                      >
                        {item.label}
                        {value === item.id && (
                          <CheckIcon size={16} className="ml-auto" />
                        )}
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
