"use client";

import React, { useEffect, useState } from "react";
import AssignToPicker from "@/components/assign-to-picker";
import TextAreaInput from "@/components/origin-text-area";
import { Check, Pencil, Trash2, X } from "lucide-react";

interface FileBreakUpFieldProps {
  title: string;
  users: { id: number; label: string }[];
  isMandatory?: boolean;
  isTitleEditable?: boolean;
  canDelete?: boolean;
  onTitleSave?: (nextTitle: string) => Promise<boolean | void> | boolean | void;
  onDelete?: () => void;
  value: {
    company_vendor_id: number | null;
    item_desc: string;
  };
  onChange: (
    title: string,
    field: keyof FileBreakUpFieldProps["value"],
    val: any
  ) => void;
  disable?: boolean;
}

const FileBreakUpField: React.FC<FileBreakUpFieldProps> = ({
  title,
  users,
  isMandatory = false,
  isTitleEditable = false,
  canDelete = false,
  onTitleSave,
  onDelete,
  value,
  onChange,
  disable,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  // ✅ Simplified handler — no validation
  const handleFieldChange = (
    field: keyof FileBreakUpFieldProps["value"],
    val: any
  ) => {
    onChange(title, field, val);
  };

  const handleTitleCancel = () => {
    setTitleDraft(title);
    setIsEditingTitle(false);
  };

  const handleTitleSave = async () => {
    if (!onTitleSave) return;
    try {
      const result = await onTitleSave(titleDraft);
      if (result !== false) {
        setIsEditingTitle(false);
      }
    } catch (err) {
      console.error("Failed to update title", err);
    }
  };

  return (
    <div className="rounded-xl border p-4 bg-card shadow-sm flex flex-col gap-3">
      {/* 🔹 Title & Vendor Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="w-full max-w-[220px] border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={disable}
            />
          ) : (
            <p className="font-medium text-sm flex items-center gap-1">
              {title}
              {isMandatory && <span className="text-red-500">*</span>}
            </p>
          )}

          {(isTitleEditable || canDelete) && (
            <div className="flex items-center gap-1">
              {isTitleEditable && !isEditingTitle && (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  disabled={disable}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                  aria-label="Edit section title"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {isTitleEditable && isEditingTitle && (
                <>
                  <button
                    type="button"
                    onClick={handleTitleSave}
                    disabled={disable}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                    aria-label="Save section title"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleTitleCancel}
                    disabled={disable}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                    aria-label="Cancel title edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              {canDelete && !isEditingTitle && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={disable}
                  className="p-1 text-destructive/80 hover:text-destructive disabled:cursor-not-allowed"
                  aria-label="Delete section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="w-full sm:w-1/2">
          <AssignToPicker
            data={users}
            value={value.company_vendor_id ?? undefined}
            onChange={(id) => handleFieldChange("company_vendor_id", id)}
            placeholder="Search vendor..."
            emptyLabel="Select a vendor"
            disabled={disable}
          />
        </div>
      </div>

      {/* 🔹 Description Field */}
      <div>
        <TextAreaInput
          value={value.item_desc}
          onChange={(val) => handleFieldChange("item_desc", val)}
          placeholder={`Enter description for ${title} (optional)`}
          disabled={disable}
        />
      </div>
    </div>
  );
};

export default FileBreakUpField;
