"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Plus,
  Eye,
  Package,
  Calendar,
  FileText,
  CheckCircle2,
  File,
  Wrench,
  User,
  Currency,
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
  MiscellaneousEntry,
  CreateMiscellaneousPayload,
  useUpdateMiscERD,
  useMarkMiscellaneousTaskReady,
  useUpdateMiscApproval,
  useUpdateMiscRequiredDeliveryDate,
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

interface InstallationMiscellaneousProps {
  vendorId: number;
  leadId: number;
  accountId: number;
  initialTaskId?: number;
}

export default function InstallationMiscellaneous({
  vendorId,
  leadId,
  accountId,
  initialTaskId,
}: InstallationMiscellaneousProps) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const { data: miscTypes = [], isLoading: loadingTypes } =
    useMiscTypes(vendorId);
  const { data: miscTeams = [], isLoading: loadingTeams } =
    useMiscTeams(vendorId);

  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    misc_type_id: undefined as number | undefined,
    selected_instance_id: undefined as number | undefined,
    problem_description: "",
    reorder_material_details: "",
    quantity: undefined as number | undefined,
    cost: undefined as number | undefined,
    supervisor_remark: "",
    expected_ready_date: undefined as string | undefined,
    selectedTeams: [] as Option[],
  });
  const [files, setFiles] = useState<File[]>([]);

  const resolveMisc = useResolveMiscellaneousEntry();

  // ✅ Sirf id store karo — data entries se derive hoga (hamesha fresh)
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    id: number | null;
  }>({ open: false, id: null });

  const createMutation = useCreateMiscellaneousEntry();
  const { data: entries, refetch } = useMiscellaneousEntries(vendorId, leadId);
  const updateERDMutation = useUpdateMiscERD();
  const markReadyMutation = useMarkMiscellaneousTaskReady();
  const updateApprovalMutation = useUpdateMiscApproval();
  const updateRequiredDeliveryMutation = useUpdateMiscRequiredDeliveryDate();
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  // ✅ Live derived data — entries update hote hi ye bhi update ho jaayega
  const viewModalData = useMemo(
    () => entries?.find((e) => e.id === viewModal.id) ?? null,
    [entries, viewModal.id],
  );

  const [selectedERD, setSelectedERD] = useState<string | undefined>(undefined);
  const [selectedRequiredDelivery, setSelectedRequiredDelivery] = useState<
    string | undefined
  >(undefined);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReadyConfirm, setShowReadyConfirm] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [openDeliveryTaskModal, setOpenDeliveryTaskModal] = useState(false);

  const canDoERDDate = canDoERDMiscellaneousDate(userType, leadStatus);
  const canDoMarkAsResolved = canMiscellaneousMarkAsResolved(
    userType,
    leadStatus,
  );
  const canMarkAsReady =
    userType === "factory" ||
    userType === "admin" ||
    userType === "super-admin";

  const isTaskReady = viewModalData?.task?.status === "completed";

  const { data: orderLoginSummary = [], isLoading: loadingSummary } =
    useOrderLoginSummary(vendorId, leadId);
  const { data: instancesResponse } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );
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
      label:
        instance?.title ||
        `Instance ${instance?.quantity_index ?? instance?.id}`,
    }));
  }, [instances]);

  const filteredOrderLoginSummary = useMemo(() => {
    if (!formData.selected_instance_id) return [];
    return orderLoginSummary.filter(
      (item: any) =>
        Number(item?.instance_id) === Number(formData.selected_instance_id),
    );
  }, [orderLoginSummary, formData.selected_instance_id]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      reorder_material_details: "",
    }));
  }, [formData.selected_instance_id]);

  const [initialModalHandled, setInitialModalHandled] = useState(false);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;

    deleteDocument(
      {
        vendorId,
        deleted_by: userId!,
        documentId: confirmDelete,
      },
      {
        onSuccess: () => {
          // ✅ Query invalidate karo — viewModalData automatically update ho jaayega
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
      // ✅ Sirf id set karo
      setViewModal({ open: true, id: matched.id });
      setInitialModalHandled(true);
    }
  }, [initialTaskId, entries, initialModalHandled]);

  const handleCreateEntry = () => {
    if (!formData.misc_type_id) {
      toastManager.add({ title: "Please select an issue type", type: "error" });
      return;
    }
    if (!formData.selected_instance_id) {
      toastManager.add({ title: "Please select an instance", type: "error" });
      return;
    }

    if (files.length === 0) {
      toastManager.add({ title: "Please upload at least one document", type: "error" });
      return;
    }

    const selectedInstanceTitle = formData.selected_instance_id
      ? instanceTitleById.get(Number(formData.selected_instance_id)) || ""
      : "";
    const formattedReorderMaterial =
      selectedInstanceTitle && formData.reorder_material_details
        ? `${selectedInstanceTitle} - ${formData.reorder_material_details}`
        : formData.reorder_material_details;

    const payload: CreateMiscellaneousPayload = {
      vendorId,
      leadId,
      account_id: accountId,
      misc_type_id: formData.misc_type_id,
      problem_description: formData.problem_description.trim() || undefined,
      reorder_material_details: formattedReorderMaterial.trim() || undefined,
      quantity: formData.quantity,
      cost: formData.cost,
      supervisor_remark: formData.supervisor_remark.trim() || undefined,
      expected_ready_date: formData.expected_ready_date,
      is_resolved: false,
      teams:
        formData.selectedTeams.length > 0
          ? formData.selectedTeams.map((t) => Number(t.value))
          : undefined,
      created_by: userId!,
      files,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["miscellaneousEntries"],
        });
        setIsAddModalOpen(false);
        resetForm();
        refetch();
      },
    });
  };

  const resetForm = () => {
    setFormData({
      misc_type_id: undefined,
      selected_instance_id: undefined,
      problem_description: "",
      reorder_material_details: "",
      quantity: undefined,
      cost: undefined,
      supervisor_remark: "",
      expected_ready_date: undefined,
      selectedTeams: [],
    });
    setFiles([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    return imageExts.includes(ext) ? (
      <File className="w-5 h-5 text-blue-500" />
    ) : (
      <File className="w-5 h-5 text-orange-500" />
    );
  };

  const isImageFile = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  };

  const teamOptions: Option[] = miscTeams.map((team) => ({
    value: String(team.id),
    label: team.name,
  }));

  const typeSelectData = miscTypes.map((type) => ({
    id: type.id,
    label: type.name,
  }));

  const canWork = canViewAndWorkUnderInstallationStage(userType, leadStatus);

  // ✅ Saare derived values ab viewModalData se aayenge
  const entry = viewModalData;
  const miscApproved = viewModalData?.misc_approved;
  const isRejected = miscApproved === false;
  const isApproved = miscApproved === true;
  const isReady = viewModalData?.task?.status === "completed";
  const hasCompletionDocs = Boolean(
    viewModalData?.documents?.some((d) => d.doc_type_tag === "Type 37"),
  );
  const canResolveRole = ["admin", "super-admin", "site-supervisor"].includes(
    userType || "",
  );
  const canApproveReject =
    userType === "factory" ||
    userType === "admin" ||
    userType === "super-admin";
  const showApprovalActions = canApproveReject && miscApproved == null;
  const canUpdateERD = canDoERDDate && !isTaskReady && isApproved;
  const canUpdateRequiredDelivery =
    ["admin", "super-admin", "site-supervisor"].includes(userType || "") &&
    isApproved &&
    isReady &&
    !viewModalData?.is_resolved;
  const canManageDeliveryTask = ["factory", "admin", "super-admin"].includes(
    userType || "",
  );

  return (
    <div className="px-2 bg-white dark:bg-[#0a0a0a]">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Miscellaneous Issues</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage installation issues, material reorders, and other
            miscellaneous items
          </p>
        </div>

        <div className="w-full sm:w-auto flex justify-end">
          {canWork && (
            <Button onClick={() => setIsAddModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Miscellaneous
            </Button>
          )}
        </div>
      </div>

      {/* Table View */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px] text-sm font-medium text-foreground/80">
                Miscellaneous Type
              </TableHead>
              <TableHead className="w-[200px] text-sm font-medium text-foreground/80">
                ERD Date
              </TableHead>
              <TableHead className="w-[200px] text-sm font-medium text-foreground/80">
                Responsible Teams
              </TableHead>
              <TableHead className="w-[100px] text-center text-sm font-medium text-foreground/80">
                Documents
              </TableHead>
              <TableHead className="w-[100px] text-center text-sm font-medium text-foreground/80">
                Status
              </TableHead>
              <TableHead className="w-[140px] text-center text-sm font-medium text-foreground/80">
                Marked As Ready
              </TableHead>
              <TableHead className="w-[200px] text-sm font-medium text-foreground/80">
                Problem Description
              </TableHead>
              <TableHead className="w-[100px] text-sm font-medium text-foreground/80">
                Quantity
              </TableHead>
              <TableHead className="w-[120px] text-sm font-medium text-foreground/80">
                Cost
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!entries || entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-muted/40 rounded-full shadow-inner mb-2">
                      <Wrench className="w-7 h-7 opacity-50" />
                    </div>
                    <p className="font-medium text-sm">
                      No issues reported yet
                    </p>
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
                  className="
              cursor-pointer 
              hover:bg-muted/30 
              transition-all 
              border-b last:border-0
            "
                  // ✅ Sirf id set karo
                  onClick={() => setViewModal({ open: true, id: entry.id })}
                >
                  {/* TYPE */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-md ${
                          entry.is_resolved
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-orange-100 dark:bg-orange-900"
                        }`}
                      >
                        {entry.is_resolved ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-300" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-sm">
                          {entry.type.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* ERD COLUMN */}
                  <TableCell className="py-3">
                    {entry.expected_ready_date ? (
                      <span className="text-sm font-medium">
                        {formatDate(entry.expected_ready_date)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* TEAMS */}
                  <TableCell className="py-3">
                    {entry.teams.length ? (
                      <div className="flex flex-wrap gap-1">
                        {entry.teams.slice(0, 2).map((team) => (
                          <Badge
                            key={team.team_id}
                            variant="secondary"
                            className="text-xs px-2"
                          >
                            {team.team_name}
                          </Badge>
                        ))}
                        {entry.teams.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-2">
                            +{entry.teams.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* DOCUMENTS */}
                  <TableCell className="py-3 text-center">
                    <Badge variant="outline" className="text-xs px-2">
                      <FileText className="w-3 h-3 mr-1" />
                      {entry.documents.length}
                    </Badge>
                  </TableCell>

                  {/* STATUS */}
                  <TableCell className="py-3 text-center">
                    <Badge
                      variant={
                        entry.misc_approved === false
                          ? "destructive"
                          : entry.is_resolved
                            ? "default"
                            : "secondary"
                      }
                      className={`
                  text-xs px-2 text-yellow-600 bg-yellow-100
                  ${
                    entry.misc_approved === false
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      : entry.is_resolved
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : ""
                  }
                `}
                    >
                      {entry.misc_approved === false
                        ? "Rejected"
                        : entry.is_resolved
                          ? "Resolved"
                          : entry.misc_approved === true
                            ? "Pending"
                            : "Awaiting Approval"}
                    </Badge>
                  </TableCell>

                  {/* MARKED AS READY */}
                  <TableCell className="py-3 text-center">
                    <Badge
                      variant={
                        entry.misc_approved === false
                          ? "destructive"
                          : entry.task?.status === "completed"
                            ? "default"
                            : "secondary"
                      }
                      className={`
                        text-xs px-2
                        ${
                          entry.misc_approved === false
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : entry.task?.status === "completed"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        }
                      `}
                    >
                      {entry.misc_approved === false
                        ? "Rejected"
                        : entry.task?.status === "completed"
                          ? "Completed"
                          : "Pending"}
                    </Badge>
                  </TableCell>

                  {/* DESCRIPTION */}
                  <TableCell className="py-3">
                    <RemarkTooltip
                      remark={
                        entry.problem_description
                          ? entry.problem_description.length > 40
                            ? entry.problem_description.slice(0, 40) + "..."
                            : entry.problem_description
                          : "-"
                      }
                      remarkFull={entry.problem_description || "-"}
                    />
                  </TableCell>

                  {/* QTY */}
                  <TableCell className="py-3">
                    {entry.quantity ? (
                      <span className="text-sm font-medium">
                        {entry.quantity}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* COST */}
                  <TableCell className="py-3">
                    {entry.cost ? (
                      <span className="text-sm font-medium">
                        ₹{entry.cost.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Modal */}
      <BaseModal
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) resetForm();
        }}
        title="Add Miscellaneous Issue"
        description="Log a miscellaneous issue with required details, supporting proofs, and material information."
        size="lg"
      >
        <div className="space-y-4 py-4 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Miscellaneous Type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Miscellaneous Type *
              </label>
              <AssignToPicker
                data={typeSelectData}
                value={formData.misc_type_id}
                onChange={(id) =>
                  setFormData((prev) => ({
                    ...prev,
                    misc_type_id: id || undefined,
                  }))
                }
                placeholder="Select issue type"
                emptyLabel="Select issue type"
                disabled={loadingTypes}
              />
            </div>

            {/* Team Responsible */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Team Responsible *</label>
              <MultipleSelector
                value={formData.selectedTeams}
                onChange={(options) =>
                  setFormData((prev) => ({
                    ...prev,
                    selectedTeams: options,
                  }))
                }
                defaultOptions={teamOptions}
                placeholder="Select teams..."
                emptyIndicator={
                  <p className="text-center text-sm text-muted-foreground">
                    No teams found
                  </p>
                }
                disabled={loadingTeams}
              />
            </div>
          </div>

          {/* Problem Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Problem Description *</label>
            <TextAreaInput
              value={formData.problem_description}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  problem_description: value,
                }))
              }
              placeholder="Describe the issue in detail..."
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Select Instance */}
            <div className="flex flex-col gap-2">
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
                }}
                placeholder={
                  instances.length === 0
                    ? "No instances available"
                    : "Select instance..."
                }
                emptyLabel="Select instance"
                disabled={instances.length === 0}
              />
            </div>

            {/* Reorder Material Type */}
            <div className="flex flex-col gap-2">
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
                onChange={(selectedText) =>
                  setFormData((prev) => ({
                    ...prev,
                    reorder_material_details: selectedText,
                  }))
                }
                placeholder={
                  loadingSummary
                    ? "Loading materials..."
                    : "Select material details..."
                }
                emptyLabel="Select material details"
                disabled={loadingSummary}
              />
            </div>
          </div>

          {/* Reorder Material Details */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Reorder Material Details *
            </label>
            <TextAreaInput
              value={formData.supervisor_remark}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  supervisor_remark: value,
                }))
              }
              placeholder="Any remarks from supervisor..."
              maxLength={1000}
            />
          </div>

          {/* Supporting Proofs */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Supporting Proofs *</label>
            <FileUploadField
              value={files}
              onChange={setFiles}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
              multiple
            />
            <p className="text-xs text-muted-foreground">
              Max 10 files. Supported: Images, PDFs, Documents
            </p>
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

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={handleCreateEntry}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Creating..."
                : "Create Miscellaneous"}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* View Modal */}
      <BaseModal
        open={viewModal.open}
        // ✅ Close pe id bhi null karo
        onOpenChange={(open) =>
          setViewModal({ open, id: open ? viewModal.id : null })
        }
        size="lg"
        title={viewModalData?.type.name}
        icon={
          <div
            className={`
            p-2.5 rounded-lg border transition-colors
            ${
              viewModalData?.is_resolved
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:red-blue-800"
            }
          `}
          >
            {viewModalData?.is_resolved ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:red-blue-400" />
            )}
          </div>
        }
        description="Detailed information and supporting documents for this miscellaneous entry."
      >
        {/* ----------- BODY ----------- */}
        <div className="p-5">
          <div className="flex-1 overflow-y-auto py-2 space-y-6 px-1">
            {/* Quick Stats Row */}
            {(viewModalData?.quantity ||
              viewModalData?.cost ||
              viewModalData?.expected_ready_date ||
              viewModalData?.created_user?.user_name ||
              viewModalData?.created_at) && (
              <div className="grid grid-cols-2 gap-3">
                {viewModalData?.created_at && (
                  <Card className="border border-border bg-muted/30 dark:bg-neutral-900/50 hover:bg-muted/50 dark:hover:bg-neutral-900/70 transition-colors">
                    <CardContent className="px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background dark:bg-neutral-800 border border-border">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {viewModalData?.created_user?.user_name}
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {viewModalData && formatDate(viewModalData.created_at)}
                          </p>
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
                          <p className="text-xs text-muted-foreground">
                            Quantity
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {viewModalData.quantity}
                          </p>
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
                          <p className="text-base font-semibold text-foreground">
                            ₹{viewModalData.cost.toLocaleString()}
                          </p>
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
                          <p className="text-xs text-muted-foreground">
                            Expected Ready
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatDate(viewModalData.expected_ready_date)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ---- DETAILS SECTION ---- */}

            {isRejected && (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-muted-foreground">
                  This miscellaneous request has been rejected.
                </p>
                <div className="border border-border rounded-lg bg-red-50/60 dark:bg-red-950/20 px-4 py-2">
                  <p className="text-xs leading-relaxed text-red-600">
                    {viewModalData?.exp_of_rejection || "-"}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Problem Description */}
              {viewModalData?.problem_description && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">
                    Problem Description
                  </p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {viewModalData.problem_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Reorder Material Details */}
              {viewModalData?.reorder_material_details && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">
                    Reorder Material Details
                  </p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {viewModalData.reorder_material_details}
                    </p>
                  </div>
                </div>
              )}

              {/* Supervisor Remark */}
              {viewModalData?.supervisor_remark && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">
                    Supervisor Remark
                  </p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {viewModalData.supervisor_remark}
                    </p>
                  </div>
                </div>
              )}

              {/* Teams */}
              {viewModalData?.teams && viewModalData.teams.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground">
                    Team Responsible
                  </p>
                  <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                    <div className="flex flex-wrap gap-2">
                      {viewModalData.teams.map((team) => (
                        <Badge
                          key={team.team_id}
                          variant="outline"
                          className="px-3 py-1 bg-background dark:bg-neutral-800"
                        >
                          {team.team_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            {entry?.documents &&
              entry.documents.length > 0 &&
              (() => {
                const completionDocs = entry.documents.filter(
                  (d) => d.doc_type_tag === "Type 37",
                );
                const miscDocs = entry.documents.filter(
                  (d) => d.doc_type_tag !== "Type 37",
                );

                const renderDocs = (docs: typeof entry.documents) => (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {docs.map((doc) => {
                      const isImage = isImageFile(doc.original_name);

                      if (isImage) {
                        return (
                          <ImageComponent
                            key={doc.document_id}
                            doc={{
                              id: doc.document_id,
                              doc_og_name: doc.original_name,
                              signedUrl: doc.signed_url,
                              created_at: doc.uploaded_at,
                            }}
                            canDelete={canWork}
                            onDelete={(id) => setConfirmDelete(Number(id))}
                          />
                        );
                      }

                      return (
                        <DocumentCard
                          key={doc.document_id}
                          doc={{
                            id: doc.document_id,
                            originalName: doc.original_name,
                            signedUrl: doc.signed_url,
                            created_at: doc.uploaded_at,
                          }}
                          canDelete={canWork}
                          onDelete={(id) => setConfirmDelete(Number(id))}
                        />
                      );
                    })}
                  </div>
                );

                return (
                  <div className="space-y-6">
                    {miscDocs.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            Supporting Documents
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-xs px-2.5 py-0.5 bg-muted/30 dark:bg-neutral-900/50"
                          >
                            {miscDocs.length}{" "}
                            {miscDocs.length === 1 ? "file" : "files"}
                          </Badge>
                        </div>
                        {renderDocs(miscDocs)}
                      </div>
                    )}

                    {completionDocs.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-1 h-4 bg-green-500 rounded-full" />
                            Completion Documents
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-xs px-2.5 py-0.5 bg-muted/30 dark:bg-neutral-900/50"
                          >
                            {completionDocs.length}{" "}
                            {completionDocs.length === 1 ? "file" : "files"}
                          </Badge>
                        </div>
                        {renderDocs(completionDocs)}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* -------- ACTIONS -------- */}
            <div className="mt-2 rounded-xl border bg-muted/30 dark:bg-neutral-900/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Actions & Scheduling
                </h4>
                <Badge variant="outline" className="text-xs">
                  {isApproved
                    ? "Approved"
                    : isRejected
                      ? "Rejected"
                      : "Pending"}
                </Badge>
              </div>

              <DialogFooter className="flex-row items-start justify-between gap-4">
                {/* Approval Actions */}
                {showApprovalActions && (
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="default"
                      disabled={updateApprovalMutation.isPending}
                      onClick={() => {
                        if (!viewModalData) return;
                        updateApprovalMutation.mutate(
                          {
                            vendorId,
                            miscId: viewModalData.id,
                            misc_approved: true,
                            updated_by: userId!,
                          },
                          {
                            onSuccess: () => {
                              // ✅ Sirf invalidate — viewModalData khud update ho jaayega
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "miscellaneousEntries",
                                  vendorId,
                                  leadId,
                                ],
                              });
                            },
                          },
                        );
                      }}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {updateApprovalMutation.isPending
                        ? "Approving..."
                        : "Approve"}
                    </Button>

                    <Button
                      variant="destructive"
                      disabled={updateApprovalMutation.isPending}
                      onClick={() => setShowRejectModal(true)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {/* Scheduling */}
                {isApproved ? (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-end justify-between gap-2">
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Expected Ready Date (ERD)
                            </span>
                          </div>
                          <CustomeDatePicker
                            key={viewModalData?.id}
                            value={
                              viewModalData?.expected_ready_date || undefined
                            }
                            restriction="futureOnly"
                            disabledReason={
                              viewModalData?.is_resolved
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
                              if (!canUpdateERD || !newDate) return;
                              setSelectedERD(newDate);
                              setShowConfirm(true);
                            }}
                          />
                        </div>
                        {viewModalData?.expected_ready_date &&
                          canMarkAsReady &&
                          isApproved &&
                          !viewModalData?.is_resolved && (
                            <Button
                              variant="default"
                              size="default"
                              disabled={
                                markReadyMutation.isPending || isTaskReady
                              }
                              onClick={() =>
                                !isTaskReady && setShowReadyConfirm(true)
                              }
                              className="gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {isTaskReady
                                ? "Marked as Ready"
                                : markReadyMutation.isPending
                                  ? "Marking..."
                                  : "Mark as Ready"}
                            </Button>
                          )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Required Delivery Date
                        </span>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="w-full">
                          <CustomeDatePicker
                            key={`${viewModalData?.id}-delivery`}
                            value={
                              viewModalData?.required_delivery_date || undefined
                            }
                            restriction="futureOnly"
                            disabledReason={
                              viewModalData?.is_resolved
                                ? "Resolved. Delivery date cannot be updated."
                                : !isReady
                                  ? "Mark as ready to set delivery date."
                                  : !canUpdateRequiredDelivery
                                    ? "Only admin, super-admin or site supervisor can update."
                                    : undefined
                            }
                            onChange={(newDate) => {
                              if (!canUpdateRequiredDelivery || !newDate)
                                return;
                              setSelectedRequiredDelivery(newDate);
                              setShowDeliveryConfirm(true);
                            }}
                          />
                        </div>
                        <div className="flex gap-2 ">
                          {viewModalData?.required_delivery_date &&
                            viewModalData?.delivery_task?.id &&
                            !hasCompletionDocs &&
                            canManageDeliveryTask && (
                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="outline"
                                  size="md"
                                  onClick={() => setOpenDeliveryTaskModal(true)}
                                >
                                  Manage Delivery Task
                                </Button>
                              </div>
                            )}
                          {viewModalData?.expected_ready_date &&
                            canDoMarkAsResolved &&
                            canResolveRole &&
                            isApproved &&
                            isReady &&
                            hasCompletionDocs &&
                            !viewModalData?.is_resolved && (
                              <div className="flex justify-end">
                                <Button
                                  variant="default"
                                  size="default"
                                  disabled={resolveMisc.isPending}
                                  onClick={() =>
                                    resolveMisc.mutate(
                                      {
                                        vendorId,
                                        leadId,
                                        miscId: viewModalData?.id || 0,
                                        resolved_by: userId!,
                                      },
                                      {
                                        onSuccess: () => {
                                          // ✅ Sirf invalidate — viewModalData khud update ho jaayega
                                          queryClient.invalidateQueries({
                                            queryKey: [
                                              "miscellaneousEntries",
                                              vendorId,
                                              leadId,
                                            ],
                                          });
                                        },
                                      },
                                    )
                                  }
                                  className="gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {resolveMisc.isPending
                                    ? "Resolving..."
                                    : "Mark as Resolved"}
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Status Actions */}
                <div className="flex items-end gap-2"></div>
              </DialogFooter>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Reject Modal */}
      <BaseModal
        open={showRejectModal}
        onOpenChange={(open) => {
          setShowRejectModal(open);
          if (!open) setRejectReason("");
        }}
        size="md"
        title="Reject Miscellaneous"
        description="Please provide a reason for rejecting this miscellaneous request."
      >
        <div className="space-y-4 py-4 px-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Reason *</label>
            <TextAreaInput
              value={rejectReason}
              onChange={(value) => setRejectReason(value)}
              placeholder="Enter rejection reason..."
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}
              disabled={updateApprovalMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (!viewModalData) return;
                if (!rejectReason.trim()) {
                  toastManager.add({ title: "Please enter a rejection reason", type: "error" });
                  return;
                }

                updateApprovalMutation.mutate(
                  {
                    vendorId,
                    miscId: viewModalData.id,
                    misc_approved: false,
                    exp_of_rejection: rejectReason.trim(),
                    updated_by: userId!,
                  },
                  {
                    onSuccess: () => {
                      // ✅ Sirf invalidate — viewModalData khud update ho jaayega
                      queryClient.invalidateQueries({
                        queryKey: [
                          "miscellaneousEntries",
                          vendorId,
                          leadId,
                        ],
                      });
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

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set ERD Date?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set the Expected Ready Date?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (!viewModalData || !selectedERD) return;

                updateERDMutation.mutate(
                  {
                    vendorId,
                    miscId: viewModalData.id,
                    expected_ready_date: selectedERD,
                    updated_by: userId!,
                  },
                  {
                    onSuccess: () => {
                      // ✅ Sirf invalidate — viewModalData khud update ho jaayega
                      queryClient.invalidateQueries({
                        queryKey: ["miscellaneousEntries", vendorId, leadId],
                      });
                      setShowConfirm(false);
                    },
                  },
                );
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeliveryConfirm}
        onOpenChange={setShowDeliveryConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Required Delivery Date?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set the required delivery date?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeliveryConfirm(false)}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (!viewModalData || !selectedRequiredDelivery) return;

                updateRequiredDeliveryMutation.mutate(
                  {
                    vendorId,
                    miscId: viewModalData.id,
                    required_delivery_date: selectedRequiredDelivery,
                    updated_by: userId!,
                  },
                  {
                    onSuccess: () => {
                      // ✅ Sirf invalidate — viewModalData khud update ho jaayega
                      queryClient.invalidateQueries({
                        queryKey: ["miscellaneousEntries", vendorId, leadId],
                      });
                      setShowDeliveryConfirm(false);
                    },
                  },
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
            <AlertDialogDescription>
              Are you sure you want to mark this task as ready?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReadyConfirm(false)}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (!viewModalData) return;

                markReadyMutation.mutate(
                  {
                    vendorId,
                    leadId,
                    miscId: viewModalData.id,
                    ready_by: userId!,
                  },
                  {
                    onSuccess: () => {
                      // ✅ Sirf invalidate — viewModalData khud update ho jaayega
                      queryClient.invalidateQueries({
                        queryKey: ["miscellaneousEntries", vendorId, leadId],
                      });
                      setShowReadyConfirm(false);
                    },
                  },
                );
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
              permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
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
              }
            : undefined
        }
      />
    </div>
  );
}