import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Plus,
  Package,
  Calendar,
  FileText,
  CheckCircle2,
  Wrench,
  User,
  Currency,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toastManager } from "@/components/ui/toast";
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import AssignToPicker from "@/components/assign-to-picker";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import TextAreaInput from "@/components/origin-text-area";
import CurrencyInput from "@/components/custom/CurrencyInput";
import {
  useCreateMiscellaneousEntry,
  useMiscellaneousEntries,
  useMiscTypes,
  useMiscTeams,
  CreateMiscellaneousPayload,
  useUpdateMiscERD,
  useMarkMiscellaneousTaskReady,
  useUpdateMiscApproval,
  useUpdateMiscRequiredDeliveryDate,
  useUploadMiscellaneousDocuments,
} from "@/api/installation/useUnderInstallationStageLeads";
import { useAppSelector } from "@/redux/store";
import TextSelectPicker from "@/components/TextSelectPicker";
import { useOrderLoginSummary } from "@/api/installation/useDispatchStageLeads";
import RemarkTooltip from "@/components/origin-tooltip";
import {
  canDoERDMiscellaneousDate,
  canMiscellaneousMarkAsResolved,
  canViewAndWorkUnderInstallationStage,
} from "@/components/utils/privileges";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
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
import { useResolveMiscellaneousEntry } from "@/api/installation/useUnderInstallationStageLeads";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { useQueryClient } from "@tanstack/react-query";
import BaseModal from "@/components/utils/baseModal";
import { useDeleteDocument } from "@/api/leads";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import MiscTaskModal from "@/components/misc-task-modal";
import VideoCard from "@/components/utils/VideoCard";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CustomeTooltip from "@/components/custom-tooltip";

const miscFormSchema = z.object({
  misc_type_id: z
    .number()
    .int()
    .positive()
    .optional()
    .refine((val): val is number => typeof val === "number" && val > 0, {
      message: "Please select an issue type",
    }),
  selected_instance_id: z
    .number()
    .int()
    .positive()
    .optional()
    .refine((val): val is number => typeof val === "number" && val > 0, {
      message: "Please select an instance",
    }),
  problem_description: z
    .string()
    .min(5, "Problem description must be at least 5 characters"),
  reorder_material_details: z
    .string()
    .min(3, "Reorder material details must be at least 3 characters"),
  supervisor_remark: z
    .string()
    .min(3, "Supervisor remark must be at least 3 characters"),
  selectedTeams: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        disable: z.boolean().optional(),
        fixed: z.boolean().optional(),
      }),
    )
    .min(1, "Please select at least one team"),
  files: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one document"),
  quantity: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  expected_ready_date: z.string().optional(),
});

type MiscFormValues = z.infer<typeof miscFormSchema>;

interface InstallationMiscellaneousProps {
  vendorId: number;
  leadId: number;
  accountId: number;
  initialTaskId?: number;
  hideAddButton?: boolean;
}

interface UploadCardProps {
  onClick: () => void;
  disabled?: boolean;
}

export const UploadCard = ({ onClick, disabled }: UploadCardProps) => {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        flex flex-col items-center justify-center 
        border border-dashed rounded-xl 
        min-h-30 h-full
        cursor-pointer 
        transition-all duration-200
        hover:bg-muted/40 hover:border-primary
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
      <p className="text-xs text-muted-foreground text-center px-2">
        Upload Documents
      </p>
    </div>
  );
};

export default function InstallationMiscellaneous({
  vendorId,
  leadId,
  accountId,
  initialTaskId,
  hideAddButton,
}: InstallationMiscellaneousProps) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const customPrivilegeCodes = useAppSelector((s) => s.customPrivileges.codes);

  const { data: miscTypes = [], isLoading: loadingTypes } = useMiscTypes(vendorId);
  const { data: miscTeams = [], isLoading: loadingTeams } = useMiscTeams(vendorId);
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const form = useForm<MiscFormValues>({
    resolver: zodResolver(miscFormSchema),
    mode: "onBlur",
    defaultValues: {
      misc_type_id: undefined,
      selected_instance_id: undefined,
      problem_description: "",
      reorder_material_details: "",
      supervisor_remark: "",
      selectedTeams: [],
      files: [],
      quantity: undefined,
      cost: undefined,
      expected_ready_date: undefined,
    },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const formData = form.watch();
  const setFormData = (
    updater:
      | Partial<MiscFormValues>
      | ((prev: MiscFormValues) => Partial<MiscFormValues> | MiscFormValues),
  ) => {
    const currentValues = form.getValues();
    const nextValues =
      typeof updater === "function" ? updater(currentValues) : updater;

    Object.entries(nextValues).forEach(([key, value]) => {
      form.setValue(key as keyof MiscFormValues, value as never, {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };
  const resetForm = () => {
    form.reset();
    setFiles([]);
    setFormErrors({});
  };
  const watchedInstanceId = form.watch("selected_instance_id");

  const resolveMisc = useResolveMiscellaneousEntry();
  const [viewModal, setViewModal] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });

  const createMutation = useCreateMiscellaneousEntry();
  const { data: entries, refetch } = useMiscellaneousEntries(vendorId, leadId);
  const updateERDMutation = useUpdateMiscERD();
  const markReadyMutation = useMarkMiscellaneousTaskReady();
  const updateApprovalMutation = useUpdateMiscApproval();
  const updateRequiredDeliveryMutation = useUpdateMiscRequiredDeliveryDate();
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const viewModalData = useMemo(
    () => entries?.find((e) => e.id === viewModal.id) ?? null,
    [entries, viewModal.id],
  );

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { mutate: uploadDocs, isPending } = useUploadMiscellaneousDocuments();

  const [selectedERD, setSelectedERD] = useState<string | undefined>(undefined);
  const [selectedRequiredDelivery, setSelectedRequiredDelivery] = useState<string | undefined>(undefined);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReadyConfirm, setShowReadyConfirm] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [openDeliveryTaskModal, setOpenDeliveryTaskModal] = useState(false);

  const canDoERDDate = canDoERDMiscellaneousDate(userType, leadStatus);
  const canDoMarkAsResolved = canMiscellaneousMarkAsResolved(userType, leadStatus);
  const canMarkAsReady = userType === "factory" || userType === "super-admin";
  const canAddMiscellaneous =
    userType === "custom"
      ? customPrivilegeCodes.includes(
        "installation.under_installation.miscellaneous_section.enable_disable_action",
      )
      : true;

  const isTaskReady = viewModalData?.task?.status === "completed";

  const { data: orderLoginSummary = [], isLoading: loadingSummary } =
    useOrderLoginSummary(vendorId, leadId);
  const { data: instancesResponse } = useLeadProductStructureInstances(leadId, vendorId);

  // ✅ Lead block access control
  const { isLeadBlocked, blockedTooltip, shouldDisableBlockedActions } =
    useLeadAccessControl({ leadId, userType });

  const instances = Array.isArray(instancesResponse?.data)
    ? instancesResponse?.data
    : instancesResponse?.data?.data || [];

  const instanceTitleById = useMemo(() => {
    const map = new Map<number, string>();
    instances.forEach((instance: any) => {
      if (instance?.id) {
        map.set(instance.id, instance?.title || `Instance ${instance.id}`);
      }
    });
    return map;
  }, [instances]);

  const instanceOptions = useMemo<{ value: string; label: string }[]>(() => {
    return instances.map((instance: any) => ({
      value: String(instance.id),
      label: instance?.title || `Instance ${instance?.quantity_index ?? instance?.id}`,
    }));
  }, [instances]);

  const filteredOrderLoginSummary = useMemo(() => {
    if (!watchedInstanceId) return [];
    return orderLoginSummary.filter(
      (item: any) => Number(item?.instance_id) === Number(watchedInstanceId),
    );
  }, [orderLoginSummary, watchedInstanceId]);

  useEffect(() => {
    form.setValue("reorder_material_details", "", { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedInstanceId]);

  const [initialModalHandled, setInitialModalHandled] = useState(false);
  const { mutate: deleteDocument, isPending: deleting } = useDeleteDocument(leadId);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [pendingDeleteAfterUpload, setPendingDeleteAfterUpload] = useState<null | number>(null);

  const handleDeleteRequest = (docId: number, totalDocsInSection: number) => {
    if (totalDocsInSection <= 1) {
      setPendingDeleteAfterUpload(docId);
      setUploadModalOpen(true);
    } else {
      setConfirmDelete(docId);
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteDocument(
      { vendorId, deleted_by: userId!, documentId: confirmDelete },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["miscellaneousEntries", vendorId, leadId],
          });
          setConfirmDelete(null);
        },
      },
    );
  };

  useEffect(() => {
    setInitialModalHandled(false);
  }, [initialTaskId]);

  useEffect(() => {
    if (!initialTaskId || initialModalHandled || !entries?.length) return;
    const matched = entries.find((item) => item.task?.id === initialTaskId);
    if (matched) {
      setViewModal({ open: true, id: matched.id });
      setInitialModalHandled(true);
    }
  }, [initialTaskId, entries, initialModalHandled]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.misc_type_id) {
      errors.misc_type_id = "Please select an issue type";
    }
    if (!formData.selectedTeams || formData.selectedTeams.length === 0) {
      errors.selectedTeams = "Please select at least one responsible team";
    }
    if (!formData.problem_description || !formData.problem_description.trim()) {
      errors.problem_description = "Problem description is required";
    }
    if (!formData.selected_instance_id) {
      errors.selected_instance_id = "Please select an instance";
    }
    if (!formData.reorder_material_details || !formData.reorder_material_details.trim()) {
      errors.reorder_material_details = "Please select a material type";
    }
    if (!formData.supervisor_remark || !formData.supervisor_remark.trim()) {
      errors.supervisor_remark = "Material details are required";
    }
    if (files.length === 0) {
      errors.files = "Please upload at least one document";
    }
    setFormErrors(errors);
    return errors;
  };

  const handleCreateEntry = () => {
    const values = form.getValues();
    const errors = validateForm();
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const el = document.querySelector(`[data-name="${firstErrorKey}"]`);
      if (el) {
        const isHidden = el.getBoundingClientRect().height === 0;
        const targetScrollEl = isHidden ? (el.parentElement || el) : el;
        
        const scrollContainer = targetScrollEl.closest("[data-radix-scroll-area-viewport]") || targetScrollEl.closest(".space-y-4");
        if (scrollContainer instanceof HTMLElement) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elRect = targetScrollEl.getBoundingClientRect();
          const scrollOffset = elRect.top - containerRect.top + scrollContainer.scrollTop - (containerRect.height / 2) + (elRect.height / 2);
          scrollContainer.scrollTo({
            top: scrollOffset,
            behavior: "smooth",
          });
        } else {
          targetScrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        const focusable = el.querySelector("input, select, textarea, button");
        if (focusable instanceof HTMLElement) {
          focusable.focus({ preventScroll: true });
        }
      }
      return;
    }

    const selectedInstanceTitle = formData.selected_instance_id
      ? instanceTitleById.get(Number(formData.selected_instance_id)) || ""
      : "";
    const formattedReorderMaterial =
      selectedInstanceTitle && values.reorder_material_details
        ? `${selectedInstanceTitle} - ${values.reorder_material_details}`
        : values.reorder_material_details;

    const payload: CreateMiscellaneousPayload = {
      vendorId,
      leadId,
      account_id: accountId,
      misc_type_id: formData.misc_type_id!,
      problem_description: formData.problem_description.trim() || undefined,
      reorder_material_details: formattedReorderMaterial.trim() || undefined,
      quantity: values.quantity,
      cost: values.cost,
      supervisor_remark: values.supervisor_remark.trim() || undefined,
      expected_ready_date: values.expected_ready_date,
      is_resolved: false,
      teams:
        values.selectedTeams.length > 0
          ? values.selectedTeams.map((t) => Number(t.value))
          : undefined,
      created_by: userId!,
      files: files,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["miscellaneousEntries"] });
        setIsAddModalOpen(false);
        resetForm();
        refetch();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create miscellaneous entry.";
        toastManager.add({ title: errorMessage, type: "error" });
      },
    });
    setFiles([]);
    setFormErrors({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const separateImageAndDocs = (docs: any[]) => {
    const imageExtensions = ["jpg", "jpeg", "png", "webp"];
    const videoExtensions = ["mp4", "mov", "webm", "avi"];
    const images = docs.filter((d) => {
      const ext = (d.doc_og_name || d.original_name)?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    });
    const videos = docs.filter((d) => {
      const ext = (d.doc_og_name || d.original_name)?.split(".").pop()?.toLowerCase();
      return videoExtensions.includes(ext || "");
    });
    const nonImages = docs.filter((d) => {
      const ext = (d.doc_og_name || d.original_name)?.split(".").pop()?.toLowerCase();
      return !imageExtensions.includes(ext || "") && !videoExtensions.includes(ext || "");
    });
    return { images, videos, nonImages };
  };

  const teamOptions: Option[] = miscTeams.map((team) => ({
    value: String(team.id),
    label: team.name,
  }));

  const typeSelectData = miscTypes.map((type) => ({ id: type.id, label: type.name }));

  const canWork =
    userType === "custom"
      ? customPrivilegeCodes.includes(
        "installation.under_installation.miscellaneous_section.enable_disable_action",
      )
      : canViewAndWorkUnderInstallationStage(userType, leadStatus);

  const entry = viewModalData;
  const miscApproved = viewModalData?.misc_approved;
  const isRejected = miscApproved === false;
  const isApproved = miscApproved === true;
  const isReady = viewModalData?.task?.status === "completed";
  const canResolveRole = ["super-admin", "site-supervisor"].includes(userType || "");
  const canApproveReject = userType === "factory" || userType === "super-admin";
  const showApprovalActions = canApproveReject && miscApproved == null;
  const canUpdateERD = canDoERDDate && !isTaskReady && isApproved;
  const isDeliveryTaskCompleted = viewModalData?.delivery_task?.status === "completed";
  const canUpdateRequiredDelivery =
    ["super-admin", "site-supervisor"].includes(userType || "") &&
    isApproved &&
    isReady &&
    !isDeliveryTaskCompleted &&
    !viewModalData?.is_resolved;
  const canManageDeliveryTask = ["factory", "super-admin"].includes(userType || "");

  // ✅ Effective action flags — blocked overrides all
  const effectiveCanWork = canWork && !shouldDisableBlockedActions;
  const effectiveCanApproveReject = canApproveReject && !shouldDisableBlockedActions;
  const effectiveShowApprovalActions = showApprovalActions;
  const effectiveCanUpdateERD = canUpdateERD && !shouldDisableBlockedActions;
  const effectiveCanMarkAsReady = canMarkAsReady && !shouldDisableBlockedActions;
  const effectiveCanUpdateRequiredDelivery = canUpdateRequiredDelivery && !shouldDisableBlockedActions;
  const effectiveCanManageDeliveryTask = canManageDeliveryTask && !shouldDisableBlockedActions;
  const effectiveCanResolve = canDoMarkAsResolved && canResolveRole && !shouldDisableBlockedActions;

  const handleUpload = () => {
    if (!entry) return;
    uploadDocs(
      { vendorId, leadId, miscId: entry.id, created_by: userId!, files },
      {
        onSuccess: () => {
          setUploadModalOpen(false);
          setFiles([]);
          if (pendingDeleteAfterUpload !== null) {
            const docIdToDelete = pendingDeleteAfterUpload;
            setPendingDeleteAfterUpload(null);
            deleteDocument(
              { vendorId, deleted_by: userId!, documentId: docIdToDelete },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: ["miscellaneousEntries", vendorId, leadId],
                  });
                },
              },
            );
          } else {
            queryClient.invalidateQueries({
              queryKey: ["miscellaneousEntries", vendorId, leadId],
            });
          }
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Failed to upload documents.";
          toastManager.add({ title: errorMessage, type: "error" });
        },
      },
    );
  };

  return (
    <div className="px-2 bg-white dark:bg-[#0a0a0a]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Miscellaneous Issues</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage installation issues, material reorders, and other
            miscellaneous items
          </p>
        </div>

        <div className="w-full sm:w-auto flex justify-end">
          {canWork && canAddMiscellaneous && !hideAddButton && (
            // ✅ Add Miscellaneous button — blocked tooltip
            <CustomeTooltip
              value={shouldDisableBlockedActions ? blockedTooltip : ""}
              truncateValue={
                <span className="inline-block">
                  <Button
                    disabled={shouldDisableBlockedActions}
                    onClick={() => {
                      if (shouldDisableBlockedActions) return;
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Miscellaneous
                  </Button>
                </span>
              }
            />
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-50 text-sm font-medium text-foreground/80">Miscellaneous Type</TableHead>
              <TableHead className="w-50 text-sm font-medium text-foreground/80">ERD Date</TableHead>
              <TableHead className="w-50 text-sm font-medium text-foreground/80">Responsible Teams</TableHead>
              <TableHead className="w-25 text-center text-sm font-medium text-foreground/80">Documents</TableHead>
              <TableHead className="w-35 text-center text-sm font-medium text-foreground/80">Status</TableHead>
              <TableHead className="w-50 text-sm font-medium text-foreground/80">Problem Description</TableHead>
              <TableHead className="w-25 text-sm font-medium text-foreground/80">Quantity</TableHead>
              <TableHead className="w-30 text-sm font-medium text-foreground/80">Cost</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!entries || entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-muted/40 rounded-full shadow-inner mb-2">
                      <Wrench className="w-7 h-7 opacity-50" />
                    </div>
                    <p className="font-medium text-sm">No issues reported yet</p>
                    <p className="text-xs text-muted-foreground">
                      Add your first miscellaneous issue or material reorder
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer hover:bg-muted/30 transition-all border-b last:border-0"
                  onClick={() => setViewModal({ open: true, id: entry.id })}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${entry.is_resolved ? "bg-green-100 dark:bg-green-900" : "bg-orange-100 dark:bg-orange-900"}`}>
                        {entry.is_resolved ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-300" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{entry.type.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {entry.expected_ready_date ? (
                      <span className="text-sm font-medium">{formatDate(entry.expected_ready_date)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {entry.teams.length ? (
                      <div className="flex flex-wrap gap-1">
                        {entry.teams.slice(0, 2).map((team) => (
                          <Badge key={team.team_id} variant="secondary" className="text-xs px-2">
                            {team.team_name}
                          </Badge>
                        ))}
                        {entry.teams.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-2">+{entry.teams.length - 2}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Badge variant="outline" className="text-xs px-2">
                      <FileText className="w-3 h-3 mr-1" />
                      {entry.documents.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    {(() => {
                      const hasDispatchDocs = entry.delivery_task?.status === "completed";
                      let label: string;
                      let className: string;
                      if (entry.misc_approved === false) { label = "REJECTED"; className = "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"; }
                      else if (entry.is_resolved) { label = "RESOLVED"; className = "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"; }
                      else if (hasDispatchDocs) { label = "DISPATCHED"; className = "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"; }
                      else if (entry.required_delivery_date) { label = "DISPATCH SCHEDULED"; className = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"; }
                      else if (entry.task?.status === "completed") { label = "RTD"; className = "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"; }
                      else if (entry.misc_approved === true && entry.expected_ready_date) { label = "UNDER PROCESS"; className = "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"; }
                      else if (entry.misc_approved === true) { label = "MISCL APPROVED"; className = "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"; }
                      else { label = "AWAITING APPROVAL"; className = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"; }
                      return (
                        <Badge variant="outline" className={`text-xs px-2 border-0 font-medium ${className}`}>{label}</Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="py-3">
                    <RemarkTooltip
                      remark={entry.problem_description ? entry.problem_description.length > 40 ? entry.problem_description.slice(0, 40) + "..." : entry.problem_description : "-"}
                      remarkFull={entry.problem_description || "-"}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    {entry.quantity ? <span className="text-sm font-medium">{entry.quantity}</span> : <span className="text-sm text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="py-3">
                    {entry.cost ? <span className="text-sm font-medium">₹{entry.cost.toLocaleString()}</span> : <span className="text-sm text-muted-foreground">-</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Add Modal ───────────────────────────────────────────────────────── */}
      <BaseModal
        open={isAddModalOpen}
        onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) resetForm(); }}
        title="Add Miscellaneous Issue"
        description="Log a miscellaneous issue with required details, supporting proofs, and material information."
        size="lg"
      >
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateEntry();
            }}
            className="space-y-4 py-4 px-6"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Miscellaneous Type */}
            <div className={cn("flex flex-col gap-2", formErrors.misc_type_id && "text-destructive [&_button]:border-destructive")} data-name="misc_type_id">
              <label className="text-sm font-medium">
                Miscellaneous Type *
              </label>
              <AssignToPicker
                data={typeSelectData}
                value={formData.misc_type_id}
                onChange={(id) => {
                  setFormData((prev) => ({
                    ...prev,
                    misc_type_id: id || undefined,
                  }));
                  setFormErrors((prev) => ({ ...prev, misc_type_id: "" }));
                }}
                placeholder="Select issue type"
                emptyLabel="Select issue type"
                disabled={loadingTypes}
              />
              {formErrors.misc_type_id && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {formErrors.misc_type_id}
                </p>
              )}
            </div>

            {/* Team Responsible */}
            <div className={cn("flex flex-col gap-2", formErrors.selectedTeams && "text-destructive")} data-name="selectedTeams">
              <label className="text-sm font-medium">Team Responsible *</label>
              <MultipleSelector
                value={formData.selectedTeams}
                onChange={(options) => {
                  setFormData((prev) => ({
                    ...prev,
                    selectedTeams: options,
                  }));
                  setFormErrors((prev) => ({ ...prev, selectedTeams: "" }));
                }}
                defaultOptions={teamOptions}
                placeholder="Select teams..."
                emptyIndicator={
                  <p className="text-center text-sm text-muted-foreground">
                    No teams found
                  </p>
                }
                disabled={loadingTeams}
                className={cn(formErrors.selectedTeams && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20")}
              />
              {formErrors.selectedTeams && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {formErrors.selectedTeams}
                </p>
              )}
            </div>
          </div>

          {/* Problem Description */}
          <div className={cn("flex flex-col gap-2", formErrors.problem_description && "text-destructive")} data-name="problem_description">
            <label className="text-sm font-medium">Problem Description *</label>
            <TextAreaInput
              value={formData.problem_description}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  problem_description: value,
                }));
                if (value.trim()) {
                  setFormErrors((prev) => ({ ...prev, problem_description: "" }));
                }
              }}
              placeholder="Describe the issue in detail..."
              maxLength={1000}
              className={cn(formErrors.problem_description && "border-destructive focus-visible:ring-destructive")}
            />
            {formErrors.problem_description && (
              <p className="text-xs font-medium text-destructive mt-1">
                {formErrors.problem_description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Select Instance */}
            <div className={cn("flex flex-col gap-2", formErrors.selected_instance_id && "text-destructive [&_button]:border-destructive")} data-name="selected_instance_id">
              <label className="text-sm font-medium">Select Instance *</label>
              <TextSelectPicker
                options={instanceOptions.map((opt) => opt.label)}
                value={
                  instanceOptions.find(
                    (opt) =>
                      Number(opt.value) === formData.selected_instance_id,
                  )?.label || ""
                }
                onChange={(selectedText) => {
                  const match = instanceOptions.find(
                    (opt) => opt.label === selectedText,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    selected_instance_id: match
                      ? Number(match.value)
                      : undefined,
                  }));
                  setFormErrors((prev) => ({ ...prev, selected_instance_id: "" }));
                }}
                placeholder={
                  instances.length === 0
                    ? "No instances available"
                    : "Select instance..."
                }
                emptyLabel="Select instance"
                disabled={instances.length === 0}
              />
              {formErrors.selected_instance_id && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {formErrors.selected_instance_id}
                </p>
              )}
            </div>

            {/* Reorder Material Type */}
            <div className={cn("flex flex-col gap-2", formErrors.reorder_material_details && "text-destructive [&_button]:border-destructive")} data-name="reorder_material_details">
              <label className="text-sm font-medium">
                Reorder Material Type *
              </label>
              <TextSelectPicker
                options={
                  filteredOrderLoginSummary.map(
                    (item: any) =>
                      item.item_desc || item.item_type || "Untitled Item",
                  ) || []
                }
                value={formData.reorder_material_details}
                onChange={(selectedText) => {
                  setFormData((prev) => ({
                    ...prev,
                    reorder_material_details: selectedText,
                  }));
                  if (selectedText.trim()) {
                    setFormErrors((prev) => ({ ...prev, reorder_material_details: "" }));
                  }
                }}
                placeholder={
                  loadingSummary
                    ? "Loading materials..."
                    : "Select material details..."
                }
                emptyLabel="Select material details"
                disabled={loadingSummary}
              />
              {formErrors.reorder_material_details && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {formErrors.reorder_material_details}
                </p>
              )}
            </div>
          </div>

          {/* Reorder Material Details */}
          <div className={cn("flex flex-col gap-2", formErrors.supervisor_remark && "text-destructive")} data-name="supervisor_remark">
            <label className="text-sm font-medium">
              Reorder Material Details *
            </label>
            <TextAreaInput
              value={formData.supervisor_remark}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  supervisor_remark: value,
                }));
                if (value.trim()) {
                  setFormErrors((prev) => ({ ...prev, supervisor_remark: "" }));
                }
              }}
              placeholder="Any remarks from supervisor..."
              maxLength={1000}
              className={cn(formErrors.supervisor_remark && "border-destructive focus-visible:ring-destructive")}
            />
            {formErrors.supervisor_remark && (
              <p className="text-xs font-medium text-destructive mt-1">
                {formErrors.supervisor_remark}
              </p>
            )}
          </div>

          {/* Supporting Proofs */}
          <div className={cn("flex flex-col gap-2", formErrors.files && "text-destructive")} data-name="files">
            <label className="text-sm font-medium">Supporting Proofs *</label>
            <FileUploadField
              value={files}
              onChange={(nextFiles) => {
                setFiles(nextFiles);
                if (nextFiles.length > 0) {
                  setFormErrors((prev) => ({ ...prev, files: "" }));
                }
              }}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.mp4,.mov,.avi,"
              multiple
              invalid={Boolean(formErrors.files)}
            />
            <p className="text-xs text-muted-foreground">
              Max 10 files. Supported: Images, PDFs, Documents
            </p>
            {formErrors.files && (
              <p className="text-xs font-medium text-destructive mt-1">
                {formErrors.files}
              </p>
            )}
          </div>

          {/* Quantity + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                value={formData.quantity || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Enter quantity"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Cost (₹)</label>
              <CurrencyInput
                value={formData.cost}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, cost: value }))
                }
                placeholder="Enter cost"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 pb-6 border-t mt-6">
            <Button type="button" size="sm" variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm(); }} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Miscellaneous"}
            </Button>
          </div>
          </form>
        </Form>
      </BaseModal>

      {/* ── View Modal ──────────────────────────────────────────────────────── */}
      <BaseModal
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, id: open ? viewModal.id : null })}
        size="lg"
        title={viewModalData?.type.name}
        icon={
          <div className={`p-2.5 rounded-lg border transition-colors ${viewModalData?.is_resolved ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:red-blue-800"}`}>
            {viewModalData?.is_resolved ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:red-blue-400" />
            )}
          </div>
        }
        description="Detailed information and supporting documents for this miscellaneous entry."
      >
        <div className="p-5">
          <div className="flex-1 overflow-y-auto py-2 space-y-6 px-1">

            {/* Quick Stats */}
            {(viewModalData?.quantity || viewModalData?.cost || viewModalData?.expected_ready_date || viewModalData?.created_user?.user_name || viewModalData?.created_at) && (
              <div className="grid grid-cols-2 gap-3">
                {viewModalData?.created_at && (
                  <Card className="border border-border bg-muted/30 dark:bg-neutral-900/50 hover:bg-muted/50 dark:hover:bg-neutral-900/70 transition-colors">
                    <CardContent className="px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background dark:bg-neutral-800 border border-border">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{viewModalData?.created_user?.user_name}</p>
                          <p className="text-base font-semibold text-foreground">{viewModalData && formatDate(viewModalData.created_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModalData?.quantity && (
                  <Card className="border border-border bg-muted/30 dark:bg-neutral-900/50 hover:bg-muted/50 dark:hover:bg-neutral-900/70 transition-colors">
                    <CardContent className="px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background dark:bg-neutral-800 border border-border">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="text-base font-semibold text-foreground">{viewModalData.quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModalData?.cost && (
                  <Card className="border border-border bg-muted/30 dark:bg-neutral-900/50 hover:bg-muted/50 dark:hover:bg-neutral-900/70 transition-colors">
                    <CardContent className="px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background dark:bg-neutral-800 border border-border">
                          <Currency className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Cost</p>
                          <p className="text-base font-semibold text-foreground">₹{viewModalData.cost.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModalData?.expected_ready_date && (
                  <Card className="border border-border bg-muted/30 dark:bg-neutral-900/50 hover:bg-muted/50 dark:hover:bg-neutral-900/70 transition-colors">
                    <CardContent className="px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background dark:bg-neutral-800 border border-border">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Ready</p>
                          <p className="text-sm font-semibold text-foreground">{formatDate(viewModalData.expected_ready_date)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {isRejected && (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-muted-foreground">This miscellaneous request has been rejected.</p>
                <div className="border border-border rounded-lg bg-red-50/60 dark:bg-red-950/20 px-4 py-2">
                  <p className="text-xs leading-relaxed text-red-600">{viewModalData?.exp_of_rejection || "-"}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {viewModalData?.problem_description && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">Problem Description</p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <p className="text-sm text-foreground leading-relaxed">{viewModalData.problem_description}</p>
                  </div>
                </div>
              )}
              {viewModalData?.reorder_material_details && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">Reorder Material Details</p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <p className="text-sm text-foreground leading-relaxed">{viewModalData.reorder_material_details}</p>
                  </div>
                </div>
              )}
              {viewModalData?.supervisor_remark && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">Supervisor Remark</p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <p className="text-sm text-foreground leading-relaxed">{viewModalData.supervisor_remark}</p>
                  </div>
                </div>
              )}
              {viewModalData?.teams && viewModalData.teams.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">Team Responsible</p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <div className="flex flex-wrap gap-2">
                      {viewModalData.teams.map((team) => (
                        <Badge key={team.team_id} variant="outline" className="px-3 py-1 bg-background dark:bg-neutral-800">
                          {team.team_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            {entry?.documents && entry.documents.length > 0 && (() => {
              const completionDocs = entry.documents.filter((d) => d.doc_type_tag === "Type 37");
              const miscDocs = entry.documents.filter((d) => d.doc_type_tag !== "Type 37");

              const renderDocs = (docs: typeof entry.documents, showupload?: boolean) => {
                const { images, videos, nonImages } = separateImageAndDocs(docs);
                const totalInSection = docs.length;
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {images.map((doc) => (
                        <ImageComponent
                          key={doc.document_id}
                          doc={{ id: doc.document_id, doc_og_name: doc.original_name, signedUrl: doc.signed_url, created_at: doc.uploaded_at }}
                          // ✅ delete disabled when blocked
                          canDelete={effectiveCanWork}
                          onDelete={(id) => handleDeleteRequest(Number(id), totalInSection)}
                        />
                      ))}
                      {nonImages.map((doc) => (
                        <DocumentCard
                          key={doc.document_id}
                          doc={{ id: doc.document_id, originalName: doc.original_name, signedUrl: doc.signed_url, created_at: doc.uploaded_at }}
                          canDelete={effectiveCanWork}
                          onDelete={(id) => handleDeleteRequest(Number(id), totalInSection)}
                        />
                      ))}
                      {videos.map((doc) => (
                        <VideoCard
                          key={doc.document_id}
                          doc={{ id: doc.document_id, originalName: doc.original_name, signedUrl: doc.signed_url, created_at: doc.uploaded_at }}
                          canDelete={effectiveCanWork}
                          onDelete={(id) => handleDeleteRequest(Number(id), totalInSection)}
                        />
                      ))}
                      {/* ✅ UploadCard — tooltip when blocked */}
                      {canWork && showupload && (
                        <CustomeTooltip
                          value={shouldDisableBlockedActions ? blockedTooltip : ""}
                          truncateValue={
                            <span className="block h-full">
                              <UploadCard
                                onClick={() => {
                                  if (shouldDisableBlockedActions) return;
                                  setUploadModalOpen(true);
                                }}
                                disabled={isPending || shouldDisableBlockedActions}
                              />
                            </span>
                          }
                        />
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-6">
                  {miscDocs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <div className="w-1 h-4 bg-primary rounded-full" />
                          Supporting Documents
                        </h4>
                        <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-muted/30 dark:bg-neutral-900/50">
                          {miscDocs.length} {miscDocs.length === 1 ? "file" : "files"}
                        </Badge>
                      </div>
                      {renderDocs(miscDocs, true)}
                    </div>
                  )}
                  {completionDocs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <div className="w-1 h-4 bg-green-500 rounded-full" />
                          Completion Documents
                        </h4>
                        <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-muted/30 dark:bg-neutral-900/50">
                          {completionDocs.length} {completionDocs.length === 1 ? "file" : "files"}
                        </Badge>
                      </div>
                      {renderDocs(completionDocs, false)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Actions & Scheduling */}
            <div className="mt-2 rounded-xl border bg-muted/30 dark:bg-neutral-900/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Actions & Scheduling</h4>
                <Badge variant="outline" className="text-xs">
                  {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                </Badge>
              </div>

              <DialogFooter className="flex-row items-start justify-between gap-4">

                {/* ✅ Approve / Reject — blocked tooltip */}
                {effectiveShowApprovalActions && (
                  <div className="flex items-center gap-3 flex-1">
                    <CustomeTooltip
                      value={shouldDisableBlockedActions ? blockedTooltip : ""}
                      truncateValue={
                        <span className="inline-block">
                          <Button
                            variant="default"
                            disabled={updateApprovalMutation.isPending || shouldDisableBlockedActions}
                            onClick={() => {
                              if (!viewModalData || shouldDisableBlockedActions) return;
                              updateApprovalMutation.mutate(
                                { vendorId, miscId: viewModalData.id, misc_approved: true, updated_by: userId! },
                                {
                                  onSuccess: () => {
                                    queryClient.invalidateQueries({ queryKey: ["miscellaneousEntries", vendorId, leadId] });
                                  },
                                },
                              );
                            }}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {updateApprovalMutation.isPending ? "Approving..." : "Approve"}
                          </Button>
                        </span>
                      }
                    />

                    <CustomeTooltip
                      value={shouldDisableBlockedActions ? blockedTooltip : ""}
                      truncateValue={
                        <span className="inline-block">
                          <Button
                            variant="destructive"
                            disabled={updateApprovalMutation.isPending || shouldDisableBlockedActions}
                            onClick={() => {
                              if (shouldDisableBlockedActions) return;
                              setShowRejectModal(true);
                            }}
                          >
                            Reject
                          </Button>
                        </span>
                      }
                    />


                  </div>

                )}


                {/* Scheduling */}
                {isApproved ? (
                  <div className="flex-1 space-y-4">
                    {/* ERD Date */}
                    <div className="space-y-1">
                      <div className="flex items-end justify-between gap-2">
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Expected Ready Date (ERD)</span>
                          </div>
                          {/* ✅ ERD date picker — tooltip when blocked */}
                          <CustomeTooltip
                            value={shouldDisableBlockedActions ? blockedTooltip : ""}
                            truncateValue={
                              <span className="block">
                                <CustomeDatePicker
                                  key={viewModalData?.id}
                                  value={viewModalData?.expected_ready_date || undefined}
                                  restriction="futureOnly"
                                  disabledReason={
                                    shouldDisableBlockedActions
                                      ? blockedTooltip
                                      : viewModalData?.is_resolved
                                        ? "Resolved. ERD cannot be updated."
                                        : !canDoERDDate
                                          ? userType === "factory"
                                            ? "This lead has moved ahead."
                                            : "Only factory user can do this."
                                          : isTaskReady
                                            ? "Marked as ready. ERD cannot be updated."
                                            : undefined
                                  }
                                  onChange={(newDate) => {
                                    if (!effectiveCanUpdateERD || !newDate) return;
                                    setSelectedERD(newDate);
                                    setShowConfirm(true);
                                  }}
                                />
                              </span>
                            }
                          />
                        </div>

                        {/* ✅ Mark as Ready button — tooltip when blocked */}
                        {viewModalData?.expected_ready_date && canMarkAsReady && isApproved && !viewModalData?.is_resolved && (
                          <CustomeTooltip
                            value={shouldDisableBlockedActions ? blockedTooltip : ""}
                            truncateValue={
                              <span className="inline-block">
                                <Button
                                  variant="default"
                                  size="default"
                                  disabled={markReadyMutation.isPending || isTaskReady || shouldDisableBlockedActions}
                                  onClick={() => {
                                    if (shouldDisableBlockedActions) return;
                                    !isTaskReady && setShowReadyConfirm(true);
                                  }}
                                  className="gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {isTaskReady ? "Marked as Ready" : markReadyMutation.isPending ? "Marking..." : "Mark as Ready"}
                                </Button>
                              </span>
                            }
                          />
                        )}
                      </div>
                    </div>

                    {/* Required Delivery Date */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Required Delivery Date</span>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="w-full">
                          {/* ✅ Required delivery date — tooltip when blocked */}
                          <CustomeTooltip
                            value={shouldDisableBlockedActions ? blockedTooltip : ""}
                            truncateValue={
                              <span className="block">
                                <CustomeDatePicker
                                  key={`${viewModalData?.id}-delivery`}
                                  value={viewModalData?.required_delivery_date || undefined}
                                  restriction="futureOnly"
                                  disabledReason={
                                    shouldDisableBlockedActions
                                      ? blockedTooltip
                                      : viewModalData?.is_resolved
                                        ? "Resolved. Delivery date cannot be updated."
                                        : !isReady
                                          ? "Mark as ready to set delivery date."
                                          : !canUpdateRequiredDelivery
                                            ? "Only admin, super-admin or site supervisor can update."
                                            : undefined
                                  }
                                  onChange={(newDate) => {
                                    if (!effectiveCanUpdateRequiredDelivery || !newDate) return;
                                    setSelectedRequiredDelivery(newDate);
                                    setShowDeliveryConfirm(true);
                                  }}
                                />
                              </span>
                            }
                          />
                        </div>

                        <div className="flex gap-2">
                          {/* ✅ Manage Delivery Task — tooltip when blocked */}
                          {viewModalData?.required_delivery_date && viewModalData?.delivery_task?.id && !isDeliveryTaskCompleted && canManageDeliveryTask && (
                            <div className="flex justify-end pt-2">
                              <CustomeTooltip
                                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                                truncateValue={
                                  <span className="inline-block">
                                    <Button
                                      variant="outline"
                                      size="md"
                                      disabled={shouldDisableBlockedActions}
                                      onClick={() => {
                                        if (shouldDisableBlockedActions) return;
                                        setOpenDeliveryTaskModal(true);
                                      }}
                                    >
                                      Manage Delivery Task
                                    </Button>
                                  </span>
                                }
                              />
                            </div>
                          )}

                          {/* ✅ Mark as Resolved — tooltip when blocked */}
                          {viewModalData?.expected_ready_date && canDoMarkAsResolved && canResolveRole && isApproved && isReady && isDeliveryTaskCompleted && !viewModalData?.is_resolved && (
                            <div className="flex justify-end">
                              <CustomeTooltip
                                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                                truncateValue={
                                  <span className="inline-block">
                                    <Button
                                      variant="default"
                                      size="default"
                                      disabled={resolveMisc.isPending || shouldDisableBlockedActions}
                                      onClick={() => {
                                        if (shouldDisableBlockedActions) return;
                                        resolveMisc.mutate(
                                          { vendorId, leadId, miscId: viewModalData?.id || 0, resolved_by: userId! },
                                          {
                                            onSuccess: () => {
                                              queryClient.invalidateQueries({ queryKey: ["miscellaneousEntries", vendorId, leadId] });
                                            },
                                          },
                                        );
                                      }}
                                      className="gap-2"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      {resolveMisc.isPending ? "Resolving..." : "Mark as Resolved"}
                                    </Button>
                                  </span>
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                <div className="flex items-end gap-2"></div>
              </DialogFooter>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* ── Reject Modal ────────────────────────────────────────────────────── */}
      <BaseModal
        open={showRejectModal}
        onOpenChange={(open) => { setShowRejectModal(open); if (!open) setRejectReason(""); }}
        size="md"
        title="Reject Miscellaneous"
        description="Please provide a reason for rejecting this miscellaneous request."
      >
        <div className="space-y-4 py-4 px-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Reason *</label>
            <TextAreaInput value={rejectReason} onChange={(value) => setRejectReason(value)} placeholder="Enter rejection reason..." maxLength={1000} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowRejectModal(false); setRejectReason(""); }} disabled={updateApprovalMutation.isPending}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!viewModalData) return;
                if (!rejectReason.trim()) {
                  toastManager.add({ title: "Please enter a rejection reason", type: "error" });
                  return;
                }
                updateApprovalMutation.mutate(
                  { vendorId, miscId: viewModalData.id, misc_approved: false, exp_of_rejection: rejectReason.trim(), updated_by: userId! },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["miscellaneousEntries", vendorId, leadId] });
                      setShowRejectModal(false);
                      setRejectReason("");
                    },
                  },
                );
              }}
              disabled={updateApprovalMutation.isPending}
            >
              {updateApprovalMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* ── Alert Dialogs ───────────────────────────────────────────────────── */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set ERD Date?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to set the Expected Ready Date?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!viewModalData || !selectedERD) return;
                updateERDMutation.mutate(
                  { vendorId, miscId: viewModalData.id, expected_ready_date: selectedERD, updated_by: userId! },
                  { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["miscellaneousEntries", vendorId, leadId] }); setShowConfirm(false); } },
                );
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeliveryConfirm} onOpenChange={setShowDeliveryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Required Delivery Date?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to set the required delivery date?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeliveryConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!viewModalData || !selectedRequiredDelivery) return;
                updateRequiredDeliveryMutation.mutate(
                  { vendorId, miscId: viewModalData.id, required_delivery_date: selectedRequiredDelivery, updated_by: userId! },
                  { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["miscellaneousEntries", vendorId, leadId] }); setShowDeliveryConfirm(false); } },
                );
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReadyConfirm} onOpenChange={setShowReadyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark task as ready?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to mark this task as ready?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReadyConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!viewModalData) return;
                markReadyMutation.mutate(
                  { vendorId, leadId, miscId: viewModalData.id, ready_by: userId! },
                  { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["miscellaneousEntries", vendorId, leadId] }); setShowReadyConfirm(false); } },
                );
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The selected document will be permanently removed from the system.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MiscTaskModal
        open={openDeliveryTaskModal}
        onOpenChange={setOpenDeliveryTaskModal}
        data={
          viewModalData?.delivery_task?.id
            ? {
              leadId,
              accountId,
              taskId: viewModalData.delivery_task.id,
              dueDate: viewModalData.delivery_task.due_date || undefined,
              remark: viewModalData.delivery_task.remark || undefined,
              taskStatus: viewModalData.delivery_task.status || undefined,
            }
            : undefined
        }
      />

      {/* ── Upload Modal ─────────────────────────────────────────────────────── */}
      <BaseModal
        open={uploadModalOpen}
        onOpenChange={(open) => { setUploadModalOpen(open); if (!open) setPendingDeleteAfterUpload(null); }}
        title={pendingDeleteAfterUpload !== null ? "Upload Before Delete" : "Upload Documents"}
        description={
          pendingDeleteAfterUpload !== null
            ? "Pehle ek naya document upload karo. Upload hone ke baad purana document automatically delete ho jaayega."
            : "Add new documents to this miscellaneous entry"
        }
        size="md"
      >
        <div className="p-4 space-y-4 flex flex-col items-end">
          <FileUploadField
            value={files}
            onChange={setFiles}
            multiple
            disabled={shouldDisableBlockedActions}
          />
          {/* ✅ Upload button in modal — tooltip when blocked */}
          <CustomeTooltip
            value={shouldDisableBlockedActions ? blockedTooltip : ""}
            truncateValue={
              <span className="inline-block">
                {isPending ? (
                  <Button disabled={true}>Uploading...</Button>
                ) : (
                  <Button
                    disabled={!files.length || shouldDisableBlockedActions}
                    onClick={() => {
                      if (shouldDisableBlockedActions) return;
                      handleUpload();
                    }}
                  >
                    {pendingDeleteAfterUpload !== null ? "Upload & Delete Old" : "Upload Documents"}
                  </Button>
                )}
              </span>
            }
          />
        </div>
      </BaseModal>
    </div>
  );
}
