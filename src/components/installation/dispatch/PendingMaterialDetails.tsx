"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import CustomeDatePicker from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, FileText, PlusCircle, Loader2, Package } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import {
  useCreatePendingMaterialTask,
  useOrderLoginSummary,
} from "@/api/installation/useDispatchStageLeads";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import TextSelectPicker from "@/components/TextSelectPicker";
import { Checkbox } from "@/components/ui/checkbox";
import CustomeTooltip from "@/components/custom-tooltip";

interface PendingMaterialDetailsProps {
  leadId: number;
  accountId: number;
  disabled: boolean;
}

export default function PendingMaterialDetails({
  leadId,
  accountId,
  disabled,
}: PendingMaterialDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const queryClient = useQueryClient();
  const [allowForm, setAllowForm] = useState(false);

  if (!vendorId || !userId) {
    return <p className="text-red-500 p-4">Missing vendor/user info.</p>;
  }

  const { mutateAsync: createPendingTask, isPending } =
    useCreatePendingMaterialTask();

  const { data: orderLoginSummary = [], isLoading: loadingSummary } =
    useOrderLoginSummary(vendorId, leadId);

  // Form State
  const [title, setTitle] = useState("");
  const [remark, setRemark] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !dueDate) {
      toast.error("Please fill all required fields.");
      return;
    }

    const combinedRemark = `${title.trim()} — ${remark.trim()}`;

    try {
      await createPendingTask({
        vendorId,
        leadId,
        payload: {
          account_id: accountId,
          created_by: userId,
          due_date: dueDate,
          remark: combinedRemark,
        },
      });

      toast.success("Pending Material added successfully!");
      queryClient.invalidateQueries({
        queryKey: ["pendingMaterialTasks", vendorId, leadId],
      });

      setTitle("");
      setRemark("");
      setDueDate(null);
    } catch (err) {
      toast.error("Failed to add Pending Material.");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border rounded-lg bg-background h-full flex flex-col overflow-hidden">
        {/* ---------- HEADER ---------- */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {disabled ? (
                  // ✔ Normal interactive checkbox
                  <Checkbox
                    checked={allowForm}
                    onCheckedChange={(checked) =>
                      setAllowForm(checked === true)
                    } 
                    disabled={false}
                  />
                ) : (
                  // ✔ Tooltip + disabled checkbox when disabled = false
                  <CustomeTooltip
                    truncateValue={
                      <Checkbox
                        checked={allowForm}
                        disabled={true}
                        className="cursor-not-allowed"
                      />
                    }
                    value="Only Factory Users Can Access This Action"
                  />
                )}

                <h2 className="text-lg font-semibold tracking-tight">
                  Add Pending Material
                </h2>
              </div>

             
            </div>
            <div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track materials that are pending for dispatch
              </p>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            form="pending-material-form"
            disabled={!allowForm || isPending || !title.trim() || !dueDate}
            className="w-full md:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Material
              </>
            )}
          </Button>
        </div>

        {/* ---------- CONTENT ---------- */}
        <div
          className={`p-6 transition-all ${
            allowForm ? "" : "opacity-50 pointer-events-none"
          }`}
        >
          <form
            id="pending-material-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Material Title <span className="text-red-500">*</span>
                </Label>

                <TextSelectPicker
                  options={
                    orderLoginSummary?.map(
                      (item: any) => item.item_type || "Untitled Item"
                    ) ?? []
                  }
                  value={title}
                  onChange={(t) => setTitle(t)}
                  placeholder={
                    loadingSummary
                      ? "Loading materials..."
                      : "Select material..."
                  }
                  emptyLabel="Select Material"
                  disabled={loadingSummary}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due Date <span className="text-red-500">*</span>
                </Label>

                <CustomeDatePicker
                  value={dueDate || ""}
                  onChange={(v) => setDueDate(v || null)}
                  restriction="futureOnly"
                />
              </div>
            </div>

            {/* Remark */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Description / Notes
              </Label>

              <Textarea
                placeholder="Add additional details about the material..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
