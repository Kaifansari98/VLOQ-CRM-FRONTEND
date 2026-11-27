"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Flag, Paperclip, UploadCloud, X } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { submitEmployeeComplaint } from "@/api/hrms-complaints";

const COMPLAINT_CATEGORIES = [
  "Attendance / Biometric Issue",
  "Leave / Time-off Dispute",
  "Salary & Compensation",
  "Workplace Harassment / Bullying",
  "Workplace Safety & Health",
  "Equipment / Facility Problem",
  "Manager / Peer Behavior",
  "Other HR Concern",
];

interface ReportComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportComplaintModal({
  open,
  onOpenChange,
}: ReportComplaintModalProps) {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setSubject("");
    setCategory(COMPLAINT_CATEGORIES[0]);
    setDescription("");
    setAttachment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastManager.add({
        title: "Attachment too large. Maximum allowed size is 5MB.",
        type: "error",
      });
      return;
    }

    // Validate type (images, pdfs, docs)
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      toastManager.add({
        title: "Unsupported format. Please upload JPG, PNG, WEBP, or PDF.",
        type: "error",
      });
      return;
    }

    setAttachment(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toastManager.add({
        title: "Please enter a complaint subject",
        type: "error",
      });
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      toastManager.add({
        title: "Description must be at least 5 characters long",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("subject", subject.trim());
      formData.append("category", category);
      formData.append("description", description.trim());
      if (attachment) {
        formData.append("attachment", attachment);
      }

      await submitEmployeeComplaint(formData);

      toastManager.add({
        title: "Complaint submitted successfully",
        description: "Super Admin has been notified and will review your concern.",
        type: "success",
      });

      // Invalidate relevant queries if any
      queryClient.invalidateQueries({ queryKey: ["hrms-complaints"] });

      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toastManager.add({
        title:
          err?.response?.data?.message ||
          "Could not submit complaint. Please retry.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
              <Flag className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Report an Issue / Complaint
              </DialogTitle>
              <DialogDescription className="text-xs">
                Your report will be sent directly to Super Admin for investigation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Employee Auto Details Card */}
        <div className="rounded-xl border bg-muted/30 p-3 text-xs">
          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
            Reporting As
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium text-foreground">
                {user?.user_name || "Employee"}
              </span>
            </div>
            <div className="text-muted-foreground">
              {user?.vendor?.vendor_name || user?.vendor?.company_name || "Company"}
              {(user as any)?.franchise?.franchise_name &&
                ` · ${(user as any).franchise.franchise_name}`}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="complaint-subject" className="text-xs">
              Complaint Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="complaint-subject"
              placeholder="e.g. Issue with attendance punch machine"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
              required
              disabled={submitting}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complaint-category" className="text-xs">
              Complaint Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={submitting}
            >
              <SelectTrigger id="complaint-category" className="h-9 text-xs">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="complaint-desc" className="text-xs">
                Description <span className="text-destructive">*</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {description.length} / 2000
              </span>
            </div>
            <Textarea
              id="complaint-desc"
              rows={4}
              placeholder="Provide specific details about what happened, dates, people involved, or any relevant context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              required
              disabled={submitting}
              className="resize-none text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Attachment (optional)</Label>
            {!attachment ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors hover:bg-muted/30">
                <UploadCloud className="size-6 text-muted-foreground" />
                <span className="mt-1 text-xs font-medium text-foreground">
                  Click to upload screenshot or document
                </span>
                <span className="text-[10px] text-muted-foreground">
                  PNG, JPG, WEBP, or PDF up to 5MB
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={submitting}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">{attachment.name}</span>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    ({(attachment.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => setAttachment(null)}
                  disabled={submitting}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !subject.trim() || description.trim().length < 5}
              className="gap-1.5"
            >
              {submitting ? (
                "Submitting…"
              ) : (
                <>
                  <Flag className="size-3.5" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ReportComplaintModal;