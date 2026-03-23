"use client";

import { useId } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { ScrollArea } from "../ui/scroll-area";

/* ================================
   FLEXIBLE TYPES (NUMBER + STRING)
================================ */

type IDType = number | string;

interface SelectData {
  id: IDType;
  label: string;
}

interface Props {
  data: SelectData[];
  value?: IDType[];
  onChange?: (selectedIds: IDType[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  multiple?: boolean;
}

/* ================================
   COMPONENT
================================ */

export default function FilterPickerInline({
  data,
  value = [],
  onChange,
  placeholder = "Search...",
  emptyLabel = "Select options",
  disabled = false,
  multiple = false,
}: Props) {
  const uid = useId();

  const handleSelect = (itemId: IDType) => {
    if (!multiple) {
      onChange?.([itemId]);
      return;
    }

    const updated = value.includes(itemId)
      ? value.filter((id) => id !== itemId)
      : [...value, itemId];

    onChange?.(updated);
  };

  return (
    <div
      id={uid}
      className={cn("w-full", disabled && "opacity-60 pointer-events-none")}
    >
      <Command className="border-none">
        <CommandInput placeholder={placeholder} className="h-9 text-sm" />

        <CommandList>
          <ScrollArea className="h-[120px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No options found.
            </CommandEmpty>

            <CommandGroup>
              {data.map((item) => {
                const isSelected = value.includes(item.id);

                return (
                  <CommandItem
                    key={String(item.id)}
                    value={item.label.toLowerCase()}
                    onSelect={() => handleSelect(item.id)}
                    className={cn(
                      "cursor-pointer",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    {multiple && (
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        <CheckIcon
                          size={12}
                          className={cn(
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                    )}

                    <span className="flex-1 text-xs">{item.label}</span>

                    {!multiple && isSelected && (
                      <CheckIcon size={16} className="ml-auto text-primary" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </ScrollArea>
        </CommandList>
      </Command>
    </div>
  );
}
