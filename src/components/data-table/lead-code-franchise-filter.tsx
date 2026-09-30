"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";
import { CheckIcon, Search } from "lucide-react";

import { LeadColumn } from "../utils/column/column-type";
import { useAppSelector } from "@/redux/store";
import { useFranchisesByVendorId } from "@/api/franchise";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";

type IDType = string | number;

type FranchiseOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

export default function LeadCodeFranchiseFilter({ column }: Props) {
  const leadCodeFranchiseFilter = ((column as any).table?.options?.meta as any)
    ?.leadCodeFranchiseFilter as
    | {
        value: IDType[];
        onChange: (values: IDType[]) => void;
      }
    | undefined;

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: franchises = [], isLoading } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );
  const [search, setSearch] = React.useState("");

  const options = useMemo(
    () =>
      franchises.map((franchise) => ({
        id: franchise.id,
        label:
          franchise.franchise_name ||
          franchise.franchise_code ||
          `Franchise ${franchise.id}`,
      })),
    [franchises],
  );
  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedSearch),
    );
  }, [options, search]);

  const selectedValues = (leadCodeFranchiseFilter?.value as IDType[]) ?? [];
  const handleChange = (values: IDType[]) => {
    leadCodeFranchiseFilter?.onChange(values);
    column.setFilterValue(values);
  };
  const toggleValue = (value: IDType) => {
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];
    handleChange(nextValues);
  };

  return (
    <div className="w-full min-w-[220px] max-w-[220px]">
      <div className="border-b px-3 py-2 text-xs text-muted-foreground">
        No franchise selected = All
      </div>
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isLoading ? "Loading franchises..." : "Search franchise..."}
            className="h-9 pl-9"
            disabled={isLoading}
          />
        </div>
      </div>
      <ScrollArea className="h-[180px]">
        <div className="p-2">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No franchises found.
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option.id);

              return (
                <div
                  key={option.id}
                  role="button"
                  tabIndex={0}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleValue(option.id);
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    e.stopPropagation();
                    toggleValue(option.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                    isSelected && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background",
                    )}
                  >
                    <CheckIcon
                      className={cn("size-3", isSelected ? "opacity-100" : "opacity-0")}
                    />
                  </span>
                  <span className="flex-1">{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
