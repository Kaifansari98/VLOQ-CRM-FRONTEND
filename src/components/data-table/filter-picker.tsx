"use client";

import { useId, useState, useMemo } from "react";
import { CheckIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "../ui/scroll-area";

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

export default function FilterPickerInline({
  data = [],
  value = [],
  onChange,
  placeholder = "Search...",
  emptyLabel = "Select options",
  disabled = false,
  multiple = false,
}: Props) {
  const uid = useId();
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [data, search]);

  const isItemEqual = (a: IDType, b: IDType) => String(a) === String(b);

  const handleSelect = (itemId: IDType) => {
    if (!multiple) {
      onChange?.([itemId]);
      return;
    }

    const exists = value.some((v) => isItemEqual(v, itemId));
    const updated = exists
      ? value.filter((v) => !isItemEqual(v, itemId))
      : [...value, itemId];

    onChange?.(updated);
  };

  return (
    <div
      id={uid}
      className={cn("w-full p-2", disabled && "opacity-60 pointer-events-none")}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative mb-2">
        <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <ScrollArea className="h-[140px] pr-1">
        {filteredData.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            No options found.
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredData.map((item) => {
              const isSelected = value.some((v) => isItemEqual(v, item.id));

              return (
                <div
                  key={String(item.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(item.id);
                  }}
                  className={cn(
                    "flex items-center rounded-sm px-2 py-1.5 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground select-none",
                    isSelected && "bg-primary/10 font-medium text-primary"
                  )}
                >
                  {multiple && (
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      <CheckIcon
                        size={12}
                        className={cn(isSelected ? "opacity-100" : "opacity-0")}
                      />
                    </div>
                  )}

                  <span className="flex-1 truncate">{item.label}</span>

                  {!multiple && isSelected && (
                    <CheckIcon size={14} className="ml-auto text-primary" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
