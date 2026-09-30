"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/custom/file-upload";
import { PhoneInput } from "@/components/ui/phone-input";
import CustomeDatePicker from "@/components/date-picker";
import {
  Calendar,
  Upload,
  Truck,
  User,
  Phone,
  Clock,
  FileText,
  Loader2,
  CheckCircle2,
  Package,
  Pencil,
  CalendarDays,
  ArrowUpDown,
  UserRound,
} from "lucide-react";
import {
  useRequiredDateForDispatch,
  useDispatchDetails,
  useAddDispatchDetails,
  useDispatchDocuments,
  useUploadDispatchDocuments,
  usePendingMaterialTasks,
} from "@/api/installation/useDispatchStageLeads";
import { useDispatchPlanningInfo } from "@/api/installation/useDispatchPlanning";
import { useAppSelector } from "@/redux/store";
import {
  updateNoOfBoxes,
  useUpdateNoOfBoxes,
} from "@/api/production/production-api";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";
import { z } from "zod";
import PendingMaterialDetails from "./PendingMaterialDetails";
import VehicleNumberInput from "@/components/custom/VehicleNumberInput";
import { useDeleteDocument } from "@/api/leads";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import {
  canUploadDispatchDocument,
  canViewAndWorkDispatchStage,
} from "@/components/utils/privileges";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import UploadDispatchDocument from "./UploadDispatchDocument";
import { Card, CardContent } from "@/components/ui/card";
import RemarkTooltip from "@/components/origin-tooltip";
import FollowUpModal from "@/components/follow-up-modal";
import CustomeTooltip from "@/components/custom-tooltip";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useLeadById } from "@/hooks/useLeadsQueries";

const DispatchDetailsSchema = z.object({
  dispatch_date: z.string().nonempty("Dispatch date is required"),
  vehicle_no: z.string().min(2, "Vehicle number is required"),
  driver_name: z.string().optional(),
  driver_number: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const digits = val.replace(/\D/g, "");
      const isRepeated =
        /^(\d)\1{9}$/.test(digits) ||
        (digits.length === 12 && /^(\d)\1{9}$/.test(digits.slice(2)));
      if (isRepeated) return false;
      if (digits.length === 10) return true;
      if (digits.length === 12 && digits.startsWith("91")) return true;
      return false;
    }),
  dispatch_remark: z.string().optional(),
  updated_by: z.number(),
});

type DispatchDetailsForm = z.infer<typeof DispatchDetailsSchema>;

interface DispatchStageDetailsProps {
  leadId: number;
  accountId: number;
  name?: string;
}

const DispatchStageDetails: React.FC<DispatchStageDetailsProps> = ({
  leadId,
  accountId,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth.user?.id) || 0;
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [openPlanningRemarkModal, setOpenPlanningRemarkModal] = useState(false);

  const form = useForm<DispatchDetailsForm>({
    resolver: zodResolver(DispatchDetailsSchema),
    defaultValues: {
      dispatch_date: "",
      driver_name: "",
      driver_number: "",
      vehicle_no: "",
      dispatch_remark: "",
      updated_by: userId,
    },
  });

  console.log("parent", Number(accountId));

  // ── API Hooks ──────────────────────────────────────────────────────────────
  const { data: requiredDateData, isLoading: loadingRequiredDate } =
    useRequiredDateForDispatch(vendorId, leadId);
  const { data: dispatchDetails, isLoading: loadingDispatchDetails } =
    useDispatchDetails(vendorId, leadId);
  const { data: dispatchPlanningInfo } = useDispatchPlanningInfo(vendorId, leadId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { data: tasks = [], isLoading } = usePendingMaterialTasks(
    vendorId,
    leadId,
  );
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;
  const addDispatchMutation = useAddDispatchDetails();

  // ── Lead block access control ──────────────────────────────────────────────
  const { data: leadResponse } = useLeadById(leadId, vendorId, userId);
  const lead = leadResponse?.data?.lead;
  const { blockedTooltip, shouldDisableBlockedActions } = useLeadAccessControl({
    leadId,
    userType,
    lead,
  });

  // ── Edit No. of Boxes Modal state ──────────────────────────────────────────
  const [openBoxesModal, setOpenBoxesModal] = useState(false);
  const [noOfBoxesInput, setNoOfBoxesInput] = useState(
    requiredDateData?.no_of_boxes?.toString() || "",
  );
  const [instanceBoxes, setInstanceBoxes] = useState<
    { id: number; title: string; value: string }[]
  >([]);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  const queryClient = useQueryClient();
  const { mutateAsync: updateNoBoxes, isPending: updatingBoxes } =
    useUpdateNoOfBoxes(vendorId, leadId);

  const { data: instancesResponse } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );

  React.useEffect(() => {
    if (dispatchDetails) {
      form.reset({
        dispatch_date: dispatchDetails.dispatch_date
          ? format(new Date(dispatchDetails.dispatch_date), "yyyy-MM-dd")
          : "",
        driver_name: dispatchDetails.driver_name || "",
        driver_number: dispatchDetails.driver_number || "",
        vehicle_no: dispatchDetails.vehicle_no || "",
        dispatch_remark: dispatchDetails.dispatch_remark || "",
        updated_by: userId,
      });
    }
  }, [dispatchDetails]);

  console.log("dispatch details data>>>>>: ", requiredDateData);

  React.useEffect(() => {
    const instances = Array.isArray(instancesResponse?.data)
      ? instancesResponse?.data
      : instancesResponse?.data?.data || [];

    if (instances.length > 0) {
      setInstanceBoxes(
        instances.map((instance: any) => ({
          id: Number(instance.id),
          title: instance.title || `Instance ${instance.id}`,
          value:
            instance.no_of_boxes != null ? String(instance.no_of_boxes) : "",
        })),
      );
    }
  }, [instancesResponse]);

  const onSubmit = form.handleSubmit((values) => {
    addDispatchMutation.mutate({ vendorId, leadId, payload: values });
  });

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      setConfirmDelete(null);
    }
  };

  if (loadingRequiredDate && loadingDispatchDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isCustomUser = userType === "custom";
  const canEditDispatchSnapshotBoxes = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.dispatch.dispatch_snapshot.view_edit_no_of_boxes",
    )
    : canViewAndWorkDispatchStage(userType, leadStatus);
  const canManageDispatchDetails = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.dispatch.dispatch_details.enable_disable_action",
    )
    : canViewAndWorkDispatchStage(userType, leadStatus);
  const canViewDispatchDocuments = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.dispatch.dispatch_documents.view",
    )
    : true;
  const canUploadDispatchDocuments = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.dispatch.dispatch_documents.upload",
    )
    : canUploadDispatchDocument(userType, leadStatus);
  const canManagePendingMaterial = isCustomUser
    ? customPrivilegeCodes.includes(
      "installation.dispatch.add_pending_material.enable_disable_action",
    )
    : canViewAndWorkDispatchStage(userType, leadStatus);

  const leadLevelBoxes = Number(requiredDateData?.no_of_boxes || 0);
  const useLeadLevelBoxes = leadLevelBoxes > 0;
  const totalInstanceBoxes = instanceBoxes.reduce((sum, item) => {
    const val = Number(item.value || 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);

  // ✅ Effective permission flags — blocked overrides all
  const effectiveCanManageDispatchDetails =
    canManageDispatchDetails && !shouldDisableBlockedActions;
  const effectiveCanEditBoxes =
    canEditDispatchSnapshotBoxes && !shouldDisableBlockedActions;
  const effectiveCanManagePendingMaterial =
    canManagePendingMaterial && !shouldDisableBlockedActions;
  const dispatchPlanningRemark =
    dispatchPlanningInfo?.dispatch_planning_remark?.trim() || "";

  return (
    <div className="space-y-4 sm:space-y-6 bg-[#fff] dark:bg-[#0a0a0a] p-2 sm:p-4 md:p-0">

      {/* ── Dispatch Snapshot ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-muted/20 p-3 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold tracking-tight leading-none">
                Dispatch Snapshot
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Key delivery and site details at a glance
              </p>
            </div>
          </div>
          {dispatchPlanningRemark && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenPlanningRemarkModal(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Remark
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

          {/* Required Delivery Date Card */}
          <div className="relative overflow-hidden rounded-xl border bg-background hover:bg-muted/30 transition-colors duration-200">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase leading-none">
                  Delivery Date
                </p>
              </div>
              {loadingRequiredDate ? (
                <div className="space-y-1.5 mt-1">
                  <div className="h-5 w-36 bg-muted animate-pulse rounded-md" />
                  <div className="h-3.5 w-24 bg-muted/60 animate-pulse rounded-md" />
                </div>
              ) : requiredDateData?.required_date_for_dispatch ? (
                <div>
                  <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                    {format(
                      new Date(requiredDateData.required_date_for_dispatch),
                      "dd MMM yyyy",
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    {format(
                      new Date(requiredDateData.required_date_for_dispatch),
                      "EEEE",
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground/60 italic">
                    Not set
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Number of Boxes Card ── */}
          <div className="relative overflow-hidden rounded-xl border bg-background hover:bg-muted/30 transition-colors duration-200">
            <div className="p-3 sm:p-4">
              {/* ✅ FIX: flex row stays intact — pencil stays right side always */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase leading-none">
                    No. of Boxes
                  </p>
                </div>

                {/* ✅ Pencil — always on right, tooltip only when blocked */}
                {canEditDispatchSnapshotBoxes && !loadingRequiredDate && (
                  <div className="shrink-0 w-fit">
                    <CustomeTooltip
                      value={shouldDisableBlockedActions ? blockedTooltip : ""}
                      truncateValue={
                        // ✅ inline-block prevents layout shift
                        <span className="inline-block">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 p-0 rounded-lg hover:bg-accent transition-colors disabled:cursor-not-allowed"
                            disabled={shouldDisableBlockedActions}
                            onClick={
                              shouldDisableBlockedActions
                                ? undefined
                                : () => {
                                  setNoOfBoxesInput(
                                    requiredDateData?.no_of_boxes?.toString() || "",
                                  );
                                  setOpenBoxesModal(true);
                                }
                            }
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </span>
                      }
                    />
                  </div>
                )}
              </div>

              {loadingRequiredDate ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded-md mt-1" />
              ) : (
                <div className="flex items-end gap-1.5">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">
                    {useLeadLevelBoxes
                      ? requiredDateData?.no_of_boxes || 0
                      : totalInstanceBoxes}
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-0.5 font-medium">
                    boxes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* OnSite Contact Person Card */}
          <div className="relative overflow-hidden rounded-xl border bg-background hover:bg-muted/30 transition-colors duration-200">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <UserRound className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase leading-none">
                  Site Contact
                </p>
              </div>
              {loadingRequiredDate ? (
                <div className="space-y-1.5 mt-1">
                  <div className="h-5 w-28 bg-muted animate-pulse rounded-md" />
                  <div className="h-3.5 w-20 bg-muted/60 animate-pulse rounded-md" />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-bold text-foreground capitalize leading-tight truncate">
                    {requiredDateData?.onsite_contact_person_name || (
                      <span className="text-muted-foreground/60 font-normal italic text-sm">
                        No name
                      </span>
                    )}
                  </p>
                  {requiredDateData?.onsite_contact_person_number ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <p className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                        {requiredDateData.onsite_contact_person_number}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/60 italic">
                        No contact
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Material Lift & Vehicle Approachability Card */}
          {(() => {
            const isAvailable =
              requiredDateData?.material_lift_availability === true ||
              requiredDateData?.material_lift_availability === "true";
            const isUnavailable =
              requiredDateData?.material_lift_availability === false ||
              requiredDateData?.material_lift_availability === "false";
            const liftSet = isAvailable || isUnavailable;
            const approachability =
              requiredDateData?.vehicle_approachability_for_dispatch;
            const approachabilityLabel =
              approachability === true
                ? "Yes"
                : approachability === false
                  ? "No"
                  : "-";

            return (
              <div className="relative overflow-hidden rounded-xl border bg-background hover:bg-muted/30 transition-colors duration-200">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase leading-none">
                      Site Access
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[11px] text-muted-foreground font-medium leading-none">
                        Material Lift
                      </p>
                      {loadingRequiredDate ? (
                        <div className="h-3.5 w-16 bg-muted animate-pulse rounded" />
                      ) : liftSet ? (
                        <p className={`text-[11px] font-semibold leading-none ${isAvailable ? "text-foreground" : "text-destructive"}`}>
                          {isAvailable ? `Available ${requiredDateData?.material_lift_size ? `(${requiredDateData.material_lift_size} ft)` : ""}` : "Not Available"}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/50 italic leading-none">—</p>
                      )}
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[11px] text-muted-foreground font-medium leading-none">
                        Vehicle Approachability
                      </p>
                      {loadingRequiredDate ? (
                        <div className="h-3.5 w-8 bg-muted animate-pulse rounded" />
                      ) : (
                        <p className={`text-[11px] font-semibold leading-none ${approachabilityLabel === "Yes" ? "text-foreground" : approachabilityLabel === "No" ? "text-destructive" : "text-muted-foreground/50 italic"}`}>
                          {approachabilityLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <Dialog
        open={openPlanningRemarkModal}
        onOpenChange={setOpenPlanningRemarkModal}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispatch Planning Remark</DialogTitle>
            <DialogDescription>
              Additional remarks added during dispatch planning.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
            {dispatchPlanningRemark}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setOpenPlanningRemarkModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dispatch Details Form ──────────────────────────────────────────────── */}
      <div className="border rounded-lg bg-background overflow-hidden">
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                Dispatch Details
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-6 sm:ml-7">
              Enter vehicle, driver & dispatch related information.
            </p>
          </div>

          {/* ✅ Save button desktop — inline-block fixes alignment */}
          {canManageDispatchDetails && (
            <div className="shrink-0 w-fit">
              <CustomeTooltip
                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                truncateValue={
                  <span className="inline-block">
                    <Button
                      type="submit"
                      form="dispatch-form"
                      disabled={addDispatchMutation.isPending || shouldDisableBlockedActions}
                      className="hidden sm:flex"
                      size="sm"
                    >
                      {addDispatchMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>Save Dispatch Details</>
                      )}
                    </Button>
                  </span>
                }
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {loadingDispatchDetails ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Form {...form}>
              <form
                id="dispatch-form"
                onSubmit={
                  shouldDisableBlockedActions
                    ? (e) => e.preventDefault()
                    : onSubmit
                }
                className="space-y-4 sm:space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                  {/* Dispatch Date */}
                  <FormField
                    control={form.control}
                    name="dispatch_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Dispatch Date</FormLabel>
                        {/* ✅ Tooltip on hover when blocked */}
                        <CustomeTooltip
                          value={shouldDisableBlockedActions ? blockedTooltip : ""}
                          truncateValue={
                            <span className="block">
                              <div className={!effectiveCanManageDispatchDetails ? "opacity-50 pointer-events-none" : ""}>
                                <FormControl>
                                  <CustomeDatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    restriction="futureOnly"
                                  />
                                </FormControl>
                              </div>
                            </span>
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vehicle Number */}
                  <FormField
                    control={form.control}
                    name="vehicle_no"
                    render={({ field }) => (
                      <FormItem>
                        {/* ✅ Tooltip on hover when blocked */}
                        <CustomeTooltip
                          value={shouldDisableBlockedActions ? blockedTooltip : ""}
                          truncateValue={
                            <span className="block">
                              <div className={!effectiveCanManageDispatchDetails ? "opacity-50 pointer-events-none" : ""}>
                                <FormControl>
                                  <VehicleNumberInput
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                            </span>
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Driver Name */}
                  <FormField
                    control={form.control}
                    name="driver_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Driver Name</FormLabel>
                        {/* ✅ Tooltip on hover when blocked */}
                        <CustomeTooltip
                          value={shouldDisableBlockedActions ? blockedTooltip : ""}
                          truncateValue={
                            <span className="block">
                              <div className={!effectiveCanManageDispatchDetails ? "opacity-50 pointer-events-none" : ""}>
                                <FormControl>
                                  <Input
                                    placeholder="Enter driver name"
                                    {...field}
                                    className="text-sm"
                                  />
                                </FormControl>
                              </div>
                            </span>
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Driver Contact Number */}
                  <FormField
                    control={form.control}
                    name="driver_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Driver Contact Number</FormLabel>
                        {/* ✅ Tooltip on hover when blocked */}
                        <CustomeTooltip
                          value={shouldDisableBlockedActions ? blockedTooltip : ""}
                          truncateValue={
                            <span className="block">
                              <div className={!effectiveCanManageDispatchDetails ? "opacity-50 pointer-events-none" : ""}>
                                <FormControl>
                                  <PhoneInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    defaultCountry="IN"
                                    validateIndianNumber={true}
                                  />
                                </FormControl>
                              </div>
                            </span>
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dispatch Remark */}
                <FormField
                  control={form.control}
                  name="dispatch_remark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Dispatch Remark</FormLabel>
                      {/* ✅ Tooltip on hover when blocked */}
                      <CustomeTooltip
                        value={shouldDisableBlockedActions ? blockedTooltip : ""}
                        truncateValue={
                          <span className="block">
                            <FormControl>
                              <Textarea
                                placeholder="Add any remarks..."
                                rows={3}
                                {...field}
                                disabled={!effectiveCanManageDispatchDetails}
                                className="text-sm"
                              />
                            </FormControl>
                          </span>
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ✅ Save button mobile — inline-block fixes alignment */}
                <div className="flex justify-end">
                  {canManageDispatchDetails && (
                    <div className="shrink-0 w-fit">
                      <CustomeTooltip
                        value={shouldDisableBlockedActions ? blockedTooltip : ""}
                        truncateValue={
                          <span className="inline-block">
                            <Button
                              type="submit"
                              form="dispatch-form"
                              disabled={addDispatchMutation.isPending || shouldDisableBlockedActions}
                              className="sm:hidden"
                              size="sm"
                            >
                              {addDispatchMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>Save Dispatch Details</>
                              )}
                            </Button>
                          </span>
                        }
                      />
                    </div>
                  )}
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>

      {/* ── Upload + Pending Material side by side ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="h-full">
          {canViewDispatchDocuments && (
            // ✅ Tooltip wrapper for UploadDispatchDocument
            <CustomeTooltip
              value={shouldDisableBlockedActions ? blockedTooltip : ""}
              truncateValue={
                <span className="block h-full">
                  <UploadDispatchDocument
                    leadId={leadId}
                    accountId={accountId}
                    disabled={canUploadDispatchDocuments && !shouldDisableBlockedActions}
                  />
                </span>
              }
            />
          )}
        </div>
        <div className="h-full">
          {/* ✅ Tooltip wrapper for PendingMaterialDetails */}
          <CustomeTooltip
            value={shouldDisableBlockedActions ? blockedTooltip : ""}
            truncateValue={
              <span className="block h-full">
                <PendingMaterialDetails
                  leadId={leadId}
                  accountId={accountId}
                  disabled={effectiveCanManagePendingMaterial}
                />
              </span>
            }
          />
        </div>
      </div>

      {/* ── Pending Materials List ─────────────────────────────────────────────── */}
      <div className="border rounded-lg bg-background">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight">
                Pending Materials
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Materials awaiting dispatch
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Package className="h-3 w-3" />
            {tasks.length} {tasks.length === 1 ? "Item" : "Items"}
          </Badge>
        </div>

        <div className="p-3 sm:p-4 md:p-6">
          {tasks.length === 0 ? (
            <div className="border-2 border-dashed rounded-2xl p-12 text-center bg-muted/30">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-muted/60 rounded-full shadow-inner">
                  <Package className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No materials pending
                </p>
                <p className="text-xs text-muted-foreground">
                  Add tasks using the form above
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {tasks.map((task: any, idx: number) => {
                  const [taskTitle, ...descParts] = (task.remark || "").split("—");
                  const description = descParts.join("—").trim();
                  const isLong = description.length > 200;
                  const shortDesc = isLong
                    ? description.slice(0, 200) + "..."
                    : description;

                  const isCardClickable =
                    effectiveCanManagePendingMaterial &&
                    task.status !== "completed" &&
                    task.status !== "cancelled";

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                    >
                      {/* ✅ Block tooltip on pending material cards */}
                      <CustomeTooltip
                        value={
                          shouldDisableBlockedActions &&
                            task.status !== "completed" &&
                            task.status !== "cancelled"
                            ? blockedTooltip
                            : ""
                        }
                        truncateValue={
                          <Card
                            onClick={() => {
                              if (!isCardClickable) return;
                              setSelectedTask({
                                id: task.id,
                                leadId,
                                accountId,
                                remark: task.remark,
                                dueDate: task.due_date,
                              });
                              setOpenTaskModal(true);
                            }}
                            className={`group h-full rounded-xl border bg-background/80 hover:border-primary/40 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)] transition-all duration-300 ${isCardClickable
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-70"
                              }`}
                          >
                            <CardContent className="px-5 space-y-3 flex flex-col h-full justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="p-2.5 rounded-lg border bg-primary/10 border-primary/20">
                                    <Package className="h-4 w-4 text-primary" />
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] h-5 px-2 rounded-md ${getStatusColor(task.status)}`}
                                  >
                                    {task.status === "completed" && (
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                    )}
                                    {task.status}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-sm line-clamp-1 mt-4">
                                  {taskTitle || "Untitled Material"}
                                </h4>
                                {description && (
                                  <p className="w-full text-xs text-muted-foreground leading-relaxed mt-1">
                                    {isLong ? (
                                      <RemarkTooltip
                                        title="Additional Note"
                                        remark={
                                          <span className="block text-left line-clamp-3">
                                            {shortDesc}
                                          </span>
                                        }
                                        remarkFull={description}
                                      />
                                    ) : (
                                      <span className="block text-left line-clamp-3">
                                        {shortDesc}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  Due:{" "}
                                  {format(new Date(task.due_date), "dd MMM yyyy")}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        }
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit No. of Boxes Modal ────────────────────────────────────────────── */}
      <Dialog open={openBoxesModal} onOpenChange={setOpenBoxesModal}>
        <DialogContent className="sm:max-w-[420px] max-w-[calc(100%-2rem)] p-4 sm:p-6 rounded-2xl border shadow-lg bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Update Number of Boxes
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {useLeadLevelBoxes
                ? "Enter the total number of boxes ready for dispatch."
                : "Update boxes per instance to match the total."}
            </DialogDescription>
          </DialogHeader>

          {useLeadLevelBoxes ? (
            <div className="py-3 sm:py-4 space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Number of Boxes
              </Label>
              <Input
                type="number"
                min={1}
                value={noOfBoxesInput}
                onChange={(e) => setNoOfBoxesInput(e.target.value)}
                placeholder="e.g. 12"
                className="border rounded-md text-sm"
              />
            </div>
          ) : (
            <div className="py-3 sm:py-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">
                  Total No. of Boxes
                </Label>
                <Badge variant="secondary" className="text-xs">
                  {totalInstanceBoxes}
                </Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {instanceBoxes.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-1 text-sm text-muted-foreground">
                      {item.title}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.value}
                      onChange={(e) =>
                        setInstanceBoxes((prev) =>
                          prev.map((box) =>
                            box.id === item.id
                              ? { ...box, value: e.target.value }
                              : box,
                          ),
                        )
                      }
                      placeholder="e.g. 12"
                      className="w-24 border rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setOpenBoxesModal(false)}
              disabled={updatingBoxes}
              className="w-full sm:w-auto"
              size="sm"
            >
              Cancel
            </Button>

            {/* ✅ Save Changes — inline-block fixes layout, tooltip when blocked */}
            <CustomeTooltip
              value={shouldDisableBlockedActions ? blockedTooltip : ""}
              truncateValue={
                <span className="inline-block w-full sm:w-auto">
                  <Button
                    onClick={
                      shouldDisableBlockedActions
                        ? undefined
                        : async () => {
                          try {
                            if (useLeadLevelBoxes) {
                              if (!noOfBoxesInput || Number(noOfBoxesInput) <= 0) {
                                toastManager.add({
                                  title: "Please enter a valid positive number",
                                  type: "error",
                                });
                                return;
                              }
                              const formData = new FormData();
                              formData.append("user_id", String(userId || 0));
                              formData.append("account_id", String(accountId || 0));
                              formData.append("no_of_boxes", String(noOfBoxesInput));
                              await updateNoBoxes(formData);
                            } else {
                              const invalid = instanceBoxes.find(
                                (item) => !item.value || Number(item.value) <= 0,
                              );
                              if (invalid) {
                                toastManager.add({
                                  title: "Please enter boxes for all instances",
                                  type: "error",
                                });
                                return;
                              }
                              for (const item of instanceBoxes) {
                                const formData = new FormData();
                                formData.append("user_id", String(userId || 0));
                                formData.append("account_id", String(accountId || 0));
                                formData.append("no_of_boxes", String(item.value));
                                await updateNoOfBoxes(vendorId, leadId, formData, item.id);
                              }
                            }
                            toastManager.add({
                              title: "No. of Boxes updated successfully!",
                              type: "success",
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["requiredDateForDispatch"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["lead-product-structure-instances", leadId, vendorId],
                            });
                            setOpenBoxesModal(false);
                          } catch (err: any) {
                            toastManager.add({
                              title:
                                err?.response?.data?.message ||
                                "Failed to update No. of Boxes",
                              type: "error",
                            });
                          }
                        }
                    }
                    disabled={updatingBoxes || shouldDisableBlockedActions}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    {updatingBoxes ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </span>
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. The selected document will be
              permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedTask && (
        <FollowUpModal
          open={openTaskModal}
          onOpenChange={setOpenTaskModal}
          variant="Pending Work"
          data={{
            id: selectedTask.leadId,
            accountId: selectedTask.accountId,
            taskId: selectedTask.id,
            remark: selectedTask.remark,
            dueDate: selectedTask.dueDate,
          }}
        />
      )}
    </div>
  );
};

export default DispatchStageDetails;
