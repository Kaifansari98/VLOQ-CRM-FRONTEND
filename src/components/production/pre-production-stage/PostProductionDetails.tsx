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
import { toastManager } from "@/components/ui/toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Hammer, Wrench, Camera, PackagePlus, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import CustomeTooltip from "@/components/custom-tooltip";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import {
  useGetNoOfBoxes,
  useUpdateNoOfBoxes,
} from "@/api/production/production-api";
import { useInstanceStage, useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";
import WoodworkPackingDetailsSection from "../post-production-stage/WoodworkPackingDetailsSection";
import HardwarePackingDetailsSection from "../post-production-stage/HardwarePackingDetailsSection";
import PostProductionQcPhotosSection from "../post-production-stage/PostProductionQcPhotosSection";
import ClientRequiredDeliveryDateBanner from "@/components/shared/ClientRequiredDeliveryDateBanner";

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
  instanceId?: number | null;
}

export default function PostProductionDetails({
  leadId,
  accountId,
  instanceId,
}: PostProductionDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const customPrivilegeCodes = useAppSelector(
    (s) => s.customPrivileges.codes,
  );
  const effectiveUserType =
    userType === "admin" || userType === "head-site-supervisor"
      ? "sales-executive"
      : userType;
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

    const { data, isLoading: instanceLoading } = useInstanceStage(
    vendorId,
    leadId,
    instanceId!,
  );
  const leadStatusIns = data?.derived_stage;

  const { data: boxesData, isLoading } = useGetNoOfBoxes(
    vendorId,
    leadId,
    instanceId ?? undefined
  );
  const noOfBoxesValue = boxesData?.data?.no_of_boxes || null;

  const [open, setOpen] = useState(false);

  // 🧩 API hook for update
  const { mutateAsync: updateNoBoxes, isPending } = useUpdateNoOfBoxes(
    vendorId,
    leadId,
    instanceId ?? undefined
  );

  // ✅ Form setup with live validation
  const form = useForm<BoxFormValues>({
    resolver: zodResolver(boxSchema),
    defaultValues: { noOfBoxes: "" },
    mode: "onChange", // 🔥 ensures validation messages show immediately
  });

  const canViewAndWork = canViewAndWorkProductionStage(effectiveUserType ?? "", leadStatusIns ?? leadStatus);
  const canEditBoxes =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.set_no_of_boxes.update_edit",
        )
      : canViewAndWork &&
        userType?.toLowerCase() !== "pre-prod";
  const canViewWoodwork =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.post_production_woodwork.view",
        )
      : true;
  const canViewHardware =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.post_production_hardware.view",
        )
      : true;
  const canViewQcPhotos =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.post_production_qc_photos.view",
        )
      : true;

  // ✅ Submit handler (fully validated)
  const onSubmit = async (values: BoxFormValues) => {
    try {
      const formData = new FormData();
      formData.append("user_id", String(userId || 0));
      formData.append("account_id", String(accountId || 0));
      formData.append("no_of_boxes", values.noOfBoxes);
      if (instanceId != null) {
        formData.append("instance_id", String(instanceId));
      }

      await updateNoBoxes(formData);

      toastManager.add({ title: "No. of Boxes updated successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["noOfBoxes"] });

      queryClient.invalidateQueries({ queryKey: ["lead-product-structure-instances"],exact: false }); // Invalidate related queries to reflect changes across the board
      form.reset();
      setOpen(false);
    } catch (err: any) {
      toastManager.add({ title: err?.response?.data?.message || "Failed to update No. of Boxes", type: "error" });
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
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !canViewWoodwork,
      disabledReason: "You don’t have permission to access Woodwork.",
      cardContent: (
        <WoodworkPackingDetailsSection
          leadId={leadId}
          accountId={accountId ?? null}
          instanceId={instanceId}
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
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !canViewHardware,
      disabledReason: "You don’t have permission to access Hardware.",
      cardContent: (
        <HardwarePackingDetailsSection
          leadId={leadId}
          accountId={accountId ?? null}
          instanceId={instanceId}
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
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !canViewQcPhotos,
      disabledReason: "You don’t have permission to access QC Photos.",
      cardContent: (
        <PostProductionQcPhotosSection
          leadId={leadId}
          accountId={accountId ?? null}
          instanceId={instanceId}
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
    <div className="w-full relative  bg-[#fff] dark:bg-[#0a0a0a]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-4 mb-3"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3  md:flex-row md:items-center md:justify-between"
        >
          <ClientRequiredDeliveryDateBanner
            leadId={leadId}
            className="flex-1 border-0 bg-transparent px-0 py-0 shadow-none dark:bg-transparent"
          />
          <div className="flex items-center justify-center md:justify-end">
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
                  flex min-w-[230px] items-center gap-4 rounded-2xl bg-background px-4 py-2
                  transition-all duration-300 hover:border-primary/40
                  ${!canEditBoxes ? "opacity-70" : ""}
                `}
                  >
                    <CardContent className="flex items-center gap-4 p-0">
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          No. of Boxes
                        </span>
                        <span className="text-sm font-semibold text-foreground sm:text-base">
                          {noOfBoxesValue} Box{noOfBoxesValue > 1 ? "es" : ""}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          form.setValue("noOfBoxes", String(noOfBoxesValue));
                          setOpen(true);
                        }}
                        disabled={!canEditBoxes}
                        className="
                      rounded-full 
                      hover:bg-primary/10 
                      transition-colors duration-200
                    "
                      >
                        <Pencil
                          size={18}
                          className={`${
                            !canEditBoxes
                              ? "text-muted-foreground"
                              : "text-primary"
                          }`}
                        />
                      </Button>
                    </CardContent>
                  </Card>
                }
                value={
                  userType?.toLowerCase() === "pre-prod"
                    ? "You cannot edit the number of boxes."
                    : !canEditBoxes
                    ? "You do not have access to edit the number of boxes."
                    : "Click to edit the number of boxes for this order."
                }
              />
            ) : (
              <CustomeTooltip
                truncateValue={
                  <div
                    className={`
                  ${!canEditBoxes ? "opacity-70 pointer-events-none" : ""}
                `}
                  >
                    <Button
                      onClick={() => setOpen(true)}
                      disabled={!canEditBoxes}
                      className="
                    flex items-center gap-2 
                    px-4 py-2.5 
                    rounded-lg 
                    bg-gradient-to-r from-zinc-700 to-zinc-800
                    text-white font-medium 
                    shadow-sm
                    hover:shadow-md hover:brightness-105
                    transition-all duration-300
                  "
                    >
                      <PackagePlus className="h-4 w-4" />
                      <span>Set No. Of Boxes</span>
                    </Button>
                  </div>
                }
                value={
                  userType?.toLowerCase() === "pre-prod"
                    ? "You cannot set the number of boxes."
                    : !canEditBoxes
                    ? "You do not have access to set the number of boxes."
                    : "Click to set the number of boxes for this order."
                }
              />
            )}
          </div>
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
