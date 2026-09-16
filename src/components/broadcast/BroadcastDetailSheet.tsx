"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BroadcastItem } from "@/types/broadcast";
import { BroadcastDetailView } from "./BroadcastDetailView";

interface BroadcastDetailSheetProps {
  item: BroadcastItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleBookmark?: (id: string) => void;
  isSuperAdmin?: boolean;
}

export const BroadcastDetailSheet: React.FC<BroadcastDetailSheetProps> = ({
  item,
  open,
  onOpenChange,
  onToggleBookmark,
  isSuperAdmin = false,
}) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[96vw] max-h-[94vh] h-[94vh] p-6 overflow-y-auto rounded-3xl sm:max-w-[96vw]">
        <DialogTitle className="sr-only">{item.title || "Broadcast Details"}</DialogTitle>
        <DialogDescription className="sr-only">Full page view of broadcast announcement</DialogDescription>
        <BroadcastDetailView
          item={item}
          onBack={() => onOpenChange(false)}
          onToggleBookmark={onToggleBookmark}
          isSuperAdmin={isSuperAdmin}
        />
      </DialogContent>
    </Dialog>
  );
};
