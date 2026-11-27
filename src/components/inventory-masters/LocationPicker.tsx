"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toLocationOptions, useInventoryLocations } from "@/api/inventory-locations";
import { LevelBadge } from "@/components/inventory-masters/LocationsMaster";

/** Searchable location dropdown: each option shows the location and its full path. */
export function LocationPicker({
  vendorId,
  value,
  onChange,
  className,
}: {
  vendorId?: number;
  value?: number | null;
  onChange: (id: number | null) => void;
  className?: string;
}) {
  const { data, isLoading } = useInventoryLocations(vendorId);
  const options = useMemo(() => toLocationOptions((data ?? []).filter((l) => l.is_active || l.id === value)), [data, value]);
  const selected = options.find((o) => o.id === value);
  const [open, setOpen] = useState(false);

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full min-w-0 justify-between bg-background px-3 font-normal hover:bg-background",
            className
          )}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="shrink-0 font-medium text-foreground">{selected.label}</span>
              {selected.path.length > 0 && (
                <span className="truncate text-xs text-muted-foreground">· {selected.path.join(" › ")}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{isLoading ? "Loading…" : "Select location"}</span>
          )}
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {selected && (
              <span
                role="button"
                tabIndex={-1}
                title="Clear location"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[340px] p-0">
        <Command
          filter={(itemValue, search) => {
            // Every word must match somewhere in the location or its path.
            const words = search.toLowerCase().split(/\s+/).filter(Boolean);
            return words.every((w) => itemValue.includes(w)) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search factory, rack, shelf, position…" />
          <CommandList className="max-h-80">
            <CommandEmpty>
              {options.length === 0 ? "No locations yet. Add them in Inventory Masters → Locations." : "No location found."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.id} ${[...o.path, o.label].join(" ")}`.toLowerCase()}
                  onSelect={() => {
                    onChange(o.id === value ? null : o.id);
                    setOpen(false);
                  }}
                  className="items-start gap-2 py-2"
                >
                  <LevelBadge level={o.level} className="mt-0.5 w-[62px] justify-center" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{o.label}</p>
                    {o.path.length > 0 && (
                      <p className="flex flex-wrap items-center gap-0.5 text-[11px] text-muted-foreground">
                        {o.path.map((p, i) => (
                          <span key={i} className="flex items-center gap-0.5">
                            {i > 0 && <ChevronRight className="size-3 opacity-60" />}
                            {p}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  {o.id === value && <Check className="mt-0.5 size-4 shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
