"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

interface VendorChangeRemarkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (remark: string) => void;
}

export default function VendorChangeRemarkModal({ open, onClose, onSubmit }: VendorChangeRemarkModalProps) {
  const [remark, setRemark] = useState("");

  const handleSave = () => {
    if (!remark.trim()) return;
    onSubmit(remark);
    setRemark("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vendor Change Remark</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Please describe why this vendor change is being made..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className="min-h-[120px]"
        />
        <DialogFooter className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!remark.trim()}>
            Submit Remark
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
