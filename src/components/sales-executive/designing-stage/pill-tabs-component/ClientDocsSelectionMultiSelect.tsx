"use client";

import React from "react";
import MultipleSelector, { Option } from "@/components/ui/multiselect";

export type ClientDocsSelectionOption = Option & {
  group?: string;
};

interface ClientDocsSelectionMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: ClientDocsSelectionOption[];
  placeholder: string;
  disabled?: boolean;
}

const normalize = (s: string) => s.trim().toLowerCase();

export default function ClientDocsSelectionMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: ClientDocsSelectionMultiSelectProps) {
  const selectedOptions = React.useMemo(() => {
    // value may contain option.value IDs (e.g. "carcass-5") OR legacy label strings
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
    />
  );
}
