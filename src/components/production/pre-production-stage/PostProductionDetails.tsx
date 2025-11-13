"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Hammer, Wrench, Camera, PackagePlus, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import CustomeTooltip from "@/components/cutome-tooltip";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import {
  useGetNoOfBoxes,
  useUpdateNoOfBoxes,
} from "@/api/production/production-api";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";
import WoodworkPackingDetailsSection from "../post-production-stage/WoodworkPackingDetailsSection";
import HardwarePackingDetailsSection from "../post-production-stage/HardwarePackingDetailsSection";
import PostProductionQcPhotosSection from "../post-production-stage/PostProductionQcPhotosSection";

// ✅ Define Zod Schema
const boxSchema = z.object({
  noOfBoxes: z
    .string()
    .nonempty("Number of boxes is required.")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Please enter a valid positive number.",
    }),
});

type BoxFormValues = z.infer<typeof boxSchema>;

interface PostProductionDetailsProps {
  leadId: number;
  accountId?: number;
}

export default function PostProductionDetails({
  leadId,
  accountId,
}: PostProductionDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { data: boxesData, isLoading } = useGetNoOfBoxes(vendorId, leadId);
  const noOfBoxesValue = boxesData?.data?.no_of_boxes || null;

  const [open, setOpen] = useState(false);

  // 🧩 API hook for update
  const { mutateAsync: updateNoBoxes, isPending } = useUpdateNoOfBoxes(
    vendorId,
    leadId
  );

  // ✅ Form setup with live validation
  const form = useForm<BoxFormValues>({
    resolver: zodResolver(boxSchema),
    defaultValues: { noOfBoxes: "" },
    mode: "onChange", // 🔥 ensures validation messages show immediately
  });

  const { data: clientRequiredCompletionDateData } =
    useClientRequiredCompletionDate(vendorId, leadId);

  const canViewAndWork = canViewAndWorkProductionStage(userType, leadStatus);

  // ✅ Submit handler (fully validated)
  const onSubmit = async (values: BoxFormValues) => {
    try {
      const formData = new FormData();
      formData.append("user_id", String(userId || 0));
      formData.append("account_id", String(accountId || 0));
      formData.append("no_of_boxes", values.noOfBoxes);

      await updateNoBoxes(formData);

      toast.success("No. of Boxes updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["noOfBoxes"] });
      form.reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update No. of Boxes"
      );
    }
  };

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

  if (!leadId) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
  };

  return (
    <div className="h-full w-full relative overflow-scroll">
      <motion.div
        className="w-full flex items-center justify-start gap-2 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full h-full space-y-8 overflow-y-scroll"
        >
          {/* 🔹 Header Section */}
          <motion.div
            className="
    flex items-center justify-between 
    bg-muted/50 border border-border/60
    rounded-xl px-6 py-3 shadow-sm
    hover:shadow-md transition-all duration-300
  "
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 🔹 Left: Delivery Date */}
            <div className="flex items-center gap-3">
              {/* Animated Status Dot */}
              <motion.div
                className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
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

              {/* Delivery Info */}
              <div className="flex flex-col justify-center">
                <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Client Required Delivery Date
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

            

            {/* 🔹 Right: Boxes Info */}
            <div className="flex items-center justify-center">
              {isLoading ? (
                <Badge
                  variant="secondary"
                  className="text-sm py-2 px-5 rounded-md bg-muted/60"
                >
                  Loading...
                </Badge>
              ) : noOfBoxesValue ? (
                <CustomeTooltip
                  truncateValue={
                    <Card
                      className={`
              flex items-center gap-3 px-4 py-2 border rounded-lg shadow-sm
              transition-all duration-300
              hover:shadow-md hover:border-primary/40
              ${!canViewAndWork ? "opacity-70" : ""}
            `}
                    >
                      <CardContent className="flex items-center gap-3 p-0">
                        <div className="flex flex-col justify-center">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            No. of Boxes
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {noOfBoxesValue} Box
                            {Number(noOfBoxesValue) > 1 ? "es" : ""}
                          </span>
                        </div>

                        <div
                          className={`${
                            !canViewAndWork ? "pointer-events-none" : ""
                          }`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              form.setValue(
                                "noOfBoxes",
                                String(noOfBoxesValue)
                              );
                              setOpen(true);
                            }}
                            disabled={!canViewAndWork}
                            className="rounded-full hover:bg-primary/10 transition-colors"
                          >
                            <Pencil
                              size={18}
                              className={`transition-transform ${
                                !canViewAndWork
                                  ? "text-muted-foreground"
                                  : "text-primary hover:scale-110"
                              }`}
                            />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  }
                  value={
                    !canViewAndWork && userType === "factory"
                      ? "This lead stage has progressed. Factory users cannot modify this section."
                      : !canViewAndWork
                      ? "You do not have access to edit the number of boxes."
                      : "Click to edit the number of boxes for this order."
                  }
                />
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <div
                      className={`${
                        !canViewAndWork ? "opacity-70 pointer-events-none" : ""
                      }`}
                    >
                      <Button
                        onClick={() => setOpen(true)}
                        disabled={!canViewAndWork}
                        className="
                flex items-center gap-2 rounded-lg px-4 py-2.5
                bg-gradient-to-r from-blue-500 to-blue-600
                text-white font-medium shadow-sm
                hover:shadow-md hover:brightness-[1.07]
                transition-all duration-300
              "
                      >
                        <PackagePlus className="h-4 w-4" />
                        <span>Set No Of Boxes</span>
                      </Button>
                    </div>
                  }
                  value={
                    !canViewAndWork && userType === "factory"
                      ? "This lead stage has progressed. Factory users cannot modify this section."
                      : !canViewAndWork
                      ? "You do not have access to set the number of boxes."
                      : "Click to set the number of boxes for this order."
                  }
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ✅ Tabs */}
      <SmoothTab
        items={allTabs}
        defaultTabId="woodwork"
        activeColor="bg-primary"
      />

      {/* ✅ Dialog (Zod + React Hook Form Integrated) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set Number of Boxes</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-1"
            >
              <FormField
                control={form.control}
                name="noOfBoxes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      Enter number of boxes packed
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage /> {/* ✅ Shows Zod error automatically */}
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Submit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
