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
import { useUploadFileBreakup } from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";

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
  const [sectionData, setSectionData] = useState({
    company_vendor_id: null,
    item_desc: "",
  });

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Initialize mutation
  const { mutateAsync: uploadFileBreakup, isPending } =
    useUploadFileBreakup(vendorId);

  const handleFieldChange = (title: string, field: string, value: any) => {
    setSectionData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSectionCreated = async () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    if (!sectionData.item_desc?.trim()) {
      toast.error("Please add a description before saving");
      return;
    }

    try {
      const payload = {
        lead_id: leadId,
        account_id: accountId,
        item_type: newTitle.trim(),
        item_desc: sectionData.item_desc,
        company_vendor_id: sectionData.company_vendor_id,
        created_by: userId,
      };

      // 🚀 Call the API
      await uploadFileBreakup(payload);

      toast.success(`${newTitle} section added successfully ✅`);

      // 🔁 Notify parent to refresh sections
      onSectionAdded({ title: newTitle });

      // Reset state
      setOpen(false);
      setNewTitle("");
      setSectionData({ company_vendor_id: null, item_desc: "" });
    } catch (err: any) {
      console.error("❌ Error uploading file breakup:", err);
      toast.error(
        err?.response?.data?.message || "Failed to add file breakup section"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Click Here
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
          {newTitle.trim() !== "" && (
            <FileBreakUpField
              title={newTitle}
              users={users}
              value={sectionData}
              onChange={handleFieldChange}
              disable={false}
            />
          )}

          <Button
            onClick={handleSectionCreated}
            disabled={!newTitle.trim() || isPending}
          >
            {isPending ? "Saving..." : "Save Section"}
          </Button>
        </div>

        <DialogDescription className="text-muted-foreground text-xs">
          Create an additional file breakup section for this lead. You can
          define a new category (e.g., Metal Accessories or Custom Hardware),
          assign a vendor, and add a short description before submitting.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionModal;
