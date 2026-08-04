"use client";

import React from "react";
import MultipleSelector, { Option } from "@/components/ui/multiselect";

import { cn } from "@/lib/utils";

export type ClientDocsSelectionOption = Option & {
  group?: string;
};

interface ClientDocsSelectionMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: ClientDocsSelectionOption[];
  placeholder: string;
  disabled?: boolean;
  isError?: boolean;
  className?: string;
}

const normalize = (s: string | null | undefined): string =>
  s == null ? "" : s.trim().toLowerCase();

export default function ClientDocsSelectionMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  isError = false,
  className,
}: ClientDocsSelectionMultiSelectProps) {
  const selectedOptions = React.useMemo(() => {
    // value may contain option.value IDs (e.g. "carcass-5") OR legacy label strings
    const nullLabelOptions = options.filter((o) => o.label == null);
    if (nullLabelOptions.length > 0) {
      console.warn("[ClientDocsSelectionMultiSelect] options with null/undefined label", {
        placeholder,
        nullLabelValues: nullLabelOptions.map((o) => o.value),
      });
    }
    const byValue = new Map(options.map((o) => [o.value, o]));
    const byLabel = new Map(options.map((o) => [normalize(o.label), o]));

    return value
      .map((item) => item.trim())
      .filter(Boolean)
      .map(
        (item) =>
          byValue.get(item) ||
          byLabel.get(normalize(item)) || { value: item, label: item },
      );
  }, [options, value]);

  return (
    <MultipleSelector
      value={selectedOptions}
      onChange={(selected) => onChange(selected.map((item) => item.value))}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      hidePlaceholderWhenSelected
      showSelectedOptionsInDropdown
      showSelectedCheckIcon
      groupBy="group"
      className={cn(
        isError && "border-red-500 ring-1 ring-red-500/20",
        className
      )}
    />
  );
}
