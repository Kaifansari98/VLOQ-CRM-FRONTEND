"use client";

import { useState, useId } from "react";
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

interface TextSelectPickerProps {
  options: string[];
  value?: string;
  onChange?: (selected: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}

export default function TextSelectPicker({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyLabel = "Select an option",
  disabled = false,
}: TextSelectPickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (selectedText: string) => {
    onChange?.(selectedText);
    setSearch("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      handleSelect(filtered[0]);
    }
  };

  return (
    <div className="relative">
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
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "truncate",
                !value && "text-muted-foreground"
              )}
            >
              {value || emptyLabel}
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
              <CommandInput
                placeholder={placeholder}
                value={search}
                onValueChange={setSearch}
                onKeyDown={handleKeyDown}
              />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((text) => (
                    <CommandItem
                      key={text}
                      value={text.toLowerCase()}
                      onSelect={() => handleSelect(text)}
                    >
                      {text}
                      {value === text && (
                        <CheckIcon size={16} className="ml-auto" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
