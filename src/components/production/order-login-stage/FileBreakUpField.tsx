"use client";

import React from "react";
import AssignToPicker from "@/components/assign-to-picker";
import TextAreaInput from "@/components/origin-text-area";

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
  // ✅ Simplified handler — no validation
  const handleFieldChange = (
    field: keyof FileBreakUpFieldProps["value"],
    val: any
  ) => {
    onChange(title, field, val);
  };

  return (
    <div className="rounded-xl border p-4 bg-card shadow-sm flex flex-col gap-3">
      {/* 🔹 Title & Vendor Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="font-medium text-sm flex items-center gap-1">
          {title}
          {isMandatory && <span className="text-red-500">*</span>}
        </p>

        <div className="w-full sm:w-1/2">
          <AssignToPicker
            data={users}
            value={value.company_vendor_id ?? undefined}
            onChange={(id) => handleFieldChange("company_vendor_id", id)}
            placeholder="Search vendor..."
            emptyLabel="Select a vendor"
          />
        </div>
      </div>

      {/* 🔹 Description Field */}
      <div>
        <TextAreaInput
          value={value.item_desc}
          onChange={(val) => handleFieldChange("item_desc", val)}
          placeholder={`Enter description for ${title}`}
        />
      </div>
    </div>
  );
};

export default FileBreakUpField;
