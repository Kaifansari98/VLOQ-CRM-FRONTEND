"use client";

import React from "react";
import { Filter, ChevronsUpDown, XCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

const TASK_TYPE_MAP: Record<string, string[]> = {
  factory: [
    "Pending Work",
    "Pending Materials",
    "Production Items",
    "Miscelleneous Items",
    "Production Ready",
    "Post Dispatch Photos",
  ],
  "sales-executive": ["Follow Up", "Pending Work"],
  "installation-team": ["Pending Work", "Pending Materials", "Follow Up"],
  admin: [
    "Pending Work",
    "Pending Materials",
    "Follow Up",
    "Post Dispatch Photos",
    "Production Items",
    "Miscelleneous Items",
    "Production Ready",
  ],
};

interface TaskTypeFilterProps {
  selected: string[];
  onChange: (value: string[]) => void;
  userType: string; // 👈 added
}

export default function TaskTypeFilter({
  selected,
  onChange,
  userType,
}: TaskTypeFilterProps) {
  const availableTypes = TASK_TYPE_MAP[userType] || [];

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          className="h-8 hidden lg:flex gap-2 border-dashed"
        >
          {selected.length === 0 ? (
            <Filter size={16} />
          ) : (
            <XCircle
              size={16}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="cursor-pointer"
            />
          )}
          Task Type
          {selected.length > 0 && (
            <div className="space-x-1">
              {selected.length > 2 ? (
                <Badge variant="secondary">{selected.length} selected</Badge>
              ) : (
                selected.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-60 p-0">
        <Command>
          <CommandInput placeholder="Search task types..." />

          <CommandList>
            <CommandEmpty>No task type found.</CommandEmpty>

            <CommandGroup>
              {availableTypes.map((type) => (
                <CommandItem
                  key={type}
                  onSelect={() => toggleItem(type)}
                  className="flex items-center gap-3 cursor-pointer py-2 px-2"
                >
                  <Checkbox
                    checked={selected.includes(type)}
                    onCheckedChange={() => toggleItem(type)}
                  />
                  <span className="truncate">{type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
