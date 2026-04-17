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

const normalize = (value: string) => value.trim().toLowerCase();

export default function ClientDocsSelectionMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: ClientDocsSelectionMultiSelectProps) {
  const selectedOptions = React.useMemo(() => {
    const optionMap = new Map(
      options.map((option) => [normalize(option.label), option]),
    );

    return value
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => optionMap.get(normalize(item)) || { value: item, label: item });
  }, [options, value]);

  return (
    <MultipleSelector
      value={selectedOptions}
      onChange={(selected) => onChange(selected.map((item) => item.label))}
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
