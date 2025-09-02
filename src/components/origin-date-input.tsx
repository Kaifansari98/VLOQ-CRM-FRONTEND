"use client";

import { Calendar } from "lucide-react";

interface DateInputPickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  label?: string;
}

export default function DateInputPicker({
  value,
  onChange,
  label,
}: DateInputPickerProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          type="date"
          className="border rounded px-2 py-1 w-full"
          value={value ? value.toISOString().split("T")[0] : ""}
          onChange={(e) => {
            onChange?.(e.target.value ? new Date(e.target.value) : undefined);
          }}
        />
        <Calendar
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
    </div>
  );
}
