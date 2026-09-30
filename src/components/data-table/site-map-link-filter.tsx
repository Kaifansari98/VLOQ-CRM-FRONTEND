"use client";

import { Column } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  column: Column<any, unknown>;
}

const options = [
  { label: "Has Site Map", value: true },
  { label: "No Site Map", value: false },
];

export default function SiteMapLinkFilter({ column }: Props) {
  const currentValue = column.getFilterValue() as boolean | undefined;

  const handleChange = (value: boolean) => {
    if (currentValue === value) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(value);
    }
  };

  return (
    <div className="p-3 space-y-2">
      {options.map((opt) => (
        <div
          key={opt.label}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleChange(opt.value)}
        >
          <Checkbox checked={currentValue === opt.value} />
          <span className="text-sm">{opt.label}</span>
        </div>
      ))}
    </div>
  );
}
