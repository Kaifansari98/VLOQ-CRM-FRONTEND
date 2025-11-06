"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Hammer, Wrench, Camera, PackagePlus, Pencil } from "lucide-react";
import SmoothTab from "@/components/kokonutui/smooth-tab";

import HardwarePackingDetailsSection from "../post-production-stage/HardwarePackingDetailsSection";
import PostProductionQcPhotosSection from "../post-production-stage/PostProductionQcPhotosSection";
import WoodworkPackingDetailsSection from "../post-production-stage/WoodworkPackingDetailsSection";

import {
  useGetNoOfBoxes,
  useUpdateNoOfBoxes,
} from "@/api/production/production-api";
import { motion } from "framer-motion";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PostProductionDetailsProps {
  leadId?: number;
  accountId?: number;
}

export default function PostProductionDetails({
  leadId,
  accountId,
}: PostProductionDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  const {
    data: boxesData,
    isLoading,
    refetch,
  } = useGetNoOfBoxes(vendorId, leadId);
  const noOfBoxesValue = boxesData?.data?.no_of_boxes || null;

  if (!leadId) return null;

  // 🔢 Manage modal + input state
  const [open, setOpen] = useState(false);
  const [noOfBoxes, setNoOfBoxes] = useState("");

  // 🧩 API hooks
  const { mutateAsync: updateNoBoxes, isPending } = useUpdateNoOfBoxes(
    vendorId,
    leadId
  );

  // ✅ Tabs Setup
  const allTabs = [
    {
      id: "woodwork",
      title: (
        <div className="flex items-center gap-1">
          <Hammer size={14} /> Woodwork
        </div>
      ),
      color: "bg-amber-500 hover:bg-amber-600",
      cardContent: (
        <WoodworkPackingDetailsSection
          leadId={leadId}
          accountId={accountId ?? null}
        />
      ),
    },
    {
      id: "hardware",
      title: (
        <div className="flex items-center gap-1">
          <Wrench size={14} /> Hardware
        </div>
      ),
      color: "bg-blue-500 hover:bg-blue-600",
      cardContent: (
        <HardwarePackingDetailsSection
          leadId={leadId}
          accountId={accountId ?? null}
        />
      ),
    },
    {
      id: "qc",
      title: (
        <div className="flex items-center gap-1">
          <Camera size={14} /> QC Photos
        </div>
      ),
      color: "bg-emerald-500 hover:bg-emerald-600",
      cardContent: (
        <PostProductionQcPhotosSection
          leadId={leadId}
          accountId={accountId ?? null}
        />
      ),
    },
  ];

  // ✅ Submit handler
  const handleSubmit = async () => {
    if (!noOfBoxes || isNaN(Number(noOfBoxes)) || Number(noOfBoxes) <= 0) {
      toast.error("Please enter a valid positive number.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("user_id", String(userId || 0));
      formData.append("account_id", String(accountId || 0));
      formData.append("no_of_boxes", String(noOfBoxes));

      await updateNoBoxes(formData);
      toast.success("No. of Boxes updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["noOfBoxes"] });
      setOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update No. of Boxes"
      );
    }
  };

  const {
    data: clientRequiredCompletionDateData,
    isLoading: clientRequiredCompletionDateLoading,
  } = useClientRequiredCompletionDate(vendorId, leadId);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
  };

  return (
    <div className="h-full w-full relative">
      <motion.div
        className=" w-full flex items-center justify-start gap-2 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Animated green circle */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full h-full space-y-8 overflow-y-scroll"
        >
          {/* 🔹 Client Required Completion Section */}
          {/* 🔹 Client Required Completion Section + No. of Boxes */}
          <motion.div
            className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-4 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Left: Client Completion Date */}
            <div className="flex items-center gap-3">
              <motion.div
                className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
              />

              <div className="flex flex-col">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide">
                Client required delivery date
                </p>
                <span className="text-sm font-medium text-foreground mt-0.5">
                  {clientRequiredCompletionDateData?.client_required_order_login_complition_date
                    ? new Date(
                        clientRequiredCompletionDateData.client_required_order_login_complition_date
                      ).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Not specified"}
                </span>
              </div>
            </div>

            {/* Right: No. of Boxes */}
            <div>
              {isLoading ? (
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  Loading...
                </Badge>
              ) : noOfBoxesValue ? (
                <Card className="flex items-center gap-3 px-3 py-1 shadow-sm border">
                  <CardContent className="flex items-center gap-2 p-0">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        No. of Boxes
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {noOfBoxesValue} Boxes
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setNoOfBoxes(noOfBoxesValue);
                        setOpen(true);
                      }}
                    >
                      <Pencil
                        size={16}
                        className="text-muted-foreground hover:text-foreground"
                      />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setOpen(true)}
                >
                  <PackagePlus size={16} />
                  Set No Of Boxes
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <SmoothTab
        items={allTabs}
        defaultTabId="woodwork"
        activeColor="bg-primary"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set Number of Boxes</DialogTitle>
          </DialogHeader>

          <div className="py-1 space-y-2">
            <label className="text-sm font-medium text-muted-foreground mb-2">
              Enter number of boxes packed
            </label>
            <Input
              type="number"
              min={1}
              value={noOfBoxes}
              onChange={(e) => setNoOfBoxes(e.target.value)}
              placeholder="e.g. 12"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
