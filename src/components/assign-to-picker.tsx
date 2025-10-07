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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SelectData {
  id: number;
  label: string; // yaha aap user_name bhejoge
}

interface Props {
  data: SelectData[];
  value?: number;
  onChange?: (selectedId: number | null) => void;
}

export default function AssignToPicker({ data, value, onChange }: Props) {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);

  // Convert value to string for comparison
  const stringValue =
    value !== undefined && value !== null ? String(value) : "";
  const selectedItem = data.find((item) => item.id === value);

  return (
    <div className="*:not-first:mt-2">
      <Popover open={open} onOpenChange={setOpen}>
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
              {selectedItem ? selectedItem.label : "Select user"}
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
            <CommandInput placeholder="Search user..." />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {data.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label.toLowerCase()} // ✅ use label for searching
                    onSelect={() => {
                      setOpen(false);
                      onChange?.(item.id); // ✅ still return id
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
