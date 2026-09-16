"use client";

import { useMemo, useState } from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import TextAreaInput from "@/components/origin-text-area";

interface StructureQuantityItem {
  id: string;
  label: string;
  key: string;
  index: number;
  title: string;
  desc: string;
}

interface StructureQuantityCardsProps {
  items: StructureQuantityItem[];
  className?: string;
  onRemove?: (index: number) => void;
  onSave?: (index: number, details: { title: string; desc: string }) => void;
}

export default function StructureQuantityCards({
  items,
  className,
  onRemove,
  onSave,
}: StructureQuantityCardsProps) {
  if (!items.length) return null;

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [titleError, setTitleError] = useState("");

  const activeItem = useMemo(
    () => items.find((item) => item.key === activeKey),
    [activeKey, items]
  );

  const handleOpen = (item: StructureQuantityItem) => {
    setActiveKey(item.key);
    setDraftTitle(item.title || item.label);
    setDraftDesc(item.desc || "");
    setTitleError("");
  };

  const handleClose = () => {
    setActiveKey(null);
    setDraftTitle("");
    setDraftDesc("");
    setTitleError("");
  };

  const handleSave = () => {
    if (!activeItem) return;
    if (!draftTitle.trim()) {
      setTitleError("Title is required.");
      return;
    }
    onSave?.(activeItem.index, {
      title: draftTitle.trim() || activeItem.label,
      desc: draftDesc.trim(),
    });
    handleClose();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Selected Products
        </p>
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="w-fit max-w-full cursor-pointer rounded-lg border bg-gradient-to-br from-muted/40 to-muted/10 px-3 py-1.5 text-sm transition-shadow hover:shadow-sm"
            onClick={() => handleOpen(item)}
          >
            <div className="flex w-fit max-w-full items-center gap-2">
              <div className="w-fit max-w-full">
                <div className="flex items-center gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  <p className="text-[13px] font-semibold text-foreground">
                    {item.title || item.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex size-5 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove?.(item.index);
                }}
                aria-label="Remove"
              >
                <XIcon size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={Boolean(activeItem)} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={draftTitle}
                onChange={(event) => {
                  setDraftTitle(event.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder="Enter title"
                className="mt-1"
              />
              {titleError && (
                <p className="mt-1 text-xs text-red-500">{titleError}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description (optional)
              </label>
              <TextAreaInput
                value={draftDesc}
                onChange={setDraftDesc}
                placeholder="Add description..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
