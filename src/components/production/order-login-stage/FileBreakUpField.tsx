"use client";

import React from "react";
import AssignToPicker from "@/components/assign-to-picker";
import TextAreaInput from "@/components/origin-text-area";
import { z } from "zod";

const schema = z.object({
  item_desc: z.string().min(1, "Description is required."),
  company_vendor_id: z.number().nullable().optional(),
});

interface FileBreakUpFieldProps {
  title: string;
  users: { id: number; label: string }[];
  isMandatory?: boolean;
  value: {
    company_vendor_id: number | null;
    item_desc: string;
  };
  onChange: (
    title: string,
    field: keyof FileBreakUpFieldProps["value"],
    val: any
  ) => void;
}

const FileBreakUpField: React.FC<FileBreakUpFieldProps> = ({
  title,
  users,
  isMandatory = false,
  value,
  onChange,
}) => {
  return (
    <div className="rounded-xl border p-4 bg-card shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="font-medium text-sm flex items-center gap-1">
          {title}
          {isMandatory && <span className="text-red-500">*</span>}
        </p>

        <div className="w-full sm:w-1/4">
          <AssignToPicker
            data={users}
            value={value.company_vendor_id ?? undefined}
            onChange={(id) => onChange(title, "company_vendor_id", id)}
            placeholder="Search vendor..."
          />
        </div>
      </div>

      <TextAreaInput
        value={value.item_desc}
        onChange={(val) => onChange(title, "item_desc", val)}
        placeholder={`Enter description for ${title}`}
      />
    </div>
  );
};

export default FileBreakUpField;
