"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FileBreakUpField from "./FileBreakUpField";
import { toast } from "react-toastify";

interface AddSectionModalProps {
  users: { id: number; label: string }[];
  leadId: number;
  accountId: number;
  onSectionAdded: (section: { title: string }) => void;
}

const AddSectionModal: React.FC<AddSectionModalProps> = ({
  users,
  leadId,
  accountId,
  onSectionAdded,
}) => {
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleSectionCreated = () => {
    toast.success(`${newTitle} section added successfully`);
    onSectionAdded({ title: newTitle });
    setOpen(false);
    setNewTitle("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Add More Section
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add File BreakUp Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Section Title Input */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Section Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter section title (e.g., Metal Accessories)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Render FileBreakUpField only when title entered */}
          {/* {newTitle.trim() !== "" && (
            <FileBreakUpField
              title={newTitle}
              users={users}
              leadId={leadId}
              accountId={accountId}
              onSuccess={handleSectionCreated} // ✅ callback on success
            />
          )} */}
        </div>

        <DialogDescription className="text-muted-foreground text-xs">
            Create an additional file breakup section for this lead.  
            You can define a new category (e.g., Metal Accessories or Custom Hardware),  
            assign a vendor, and add a short description before submitting.
          </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionModal;
