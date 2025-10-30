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
  label: string; // e.g., user_name
}

interface Props {
  data: SelectData[];
  value?: number;
  onChange?: (selectedId: number | null) => void;
  placeholder?: string; // for search input
  emptyLabel?: string; // ✅ NEW — text shown when nothing is selected
}

export default function AssignToPicker({
  data,
  value,
  onChange,
  placeholder = "Search user...", // default for search bar
  emptyLabel = "Select an option", // ✅ default for dropdown display
}: Props) {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);

  const stringValue =
    value !== undefined && value !== null ? String(value) : "";
  const selectedItem = data.find((item) => item.id === value);

  return (
    <div className="*:not-first:mt-2">
      <Popover modal={false} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
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

        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {data.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label.toLowerCase()}
                    onSelect={() => {
                      setOpen(false);
                      onChange?.(item.id);
                    }}
                  >
                    {item.label}
                    {value === item.id && (
                      <CheckIcon size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
