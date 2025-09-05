"use client";
import { useState } from "react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/redux/store";
import { useEffect } from "react";
import { boolean } from "zod";
import { useVendorLeads, useVendorUserLeads } from "@/hooks/useLeadsQueries";
import EditLeadForm from "./lead-edit-form";

interface EditLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadData?: {
    id: number;
  };
}

export function EditLeadModal({ open, onOpenChange, leadData }: EditLeadModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-2xl p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()} // Overlay click disable
        onEscapeKeyDown={(e) => e.preventDefault()} // Escape close disable
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the details of this lead.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6">
            {leadData ? (
              <EditLeadForm
                leadData={leadData}
                onClose={() => onOpenChange(false)}
              />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}