"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Plus,
  Eye,
  Download,
  Package,
  Users,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  File,
  Wrench,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "react-toastify";
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
} from "@/api/installation/useUnderInstallationStageLeads";
import { useAppSelector } from "@/redux/store";
import TextSelectPicker from "@/components/TextSelectPicker";
import { useOrderLoginSummary } from "@/api/installation/useDispatchStageLeads";
import RemarkTooltip from "@/components/origin-tooltip";
import {
  canDoERDMiscellaneousDate,
  canViewAndWorkUnderInstallationStage,
} from "@/components/utils/privileges";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import CustomeTooltip from "@/components/cutome-tooltip";
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
interface InstallationMiscellaneousProps {
  vendorId: number;
  leadId: number;
  accountId: number;
}

export default function InstallationMiscellaneous({
  vendorId,
  leadId,
  accountId,
}: InstallationMiscellaneousProps) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const { data: miscTypes = [], isLoading: loadingTypes } =
    useMiscTypes(vendorId);
  const { data: miscTeams = [], isLoading: loadingTeams } =
    useMiscTeams(vendorId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    misc_type_id: undefined as number | undefined,
    problem_description: "",
    reorder_material_details: "",
    quantity: undefined as number | undefined,
    cost: undefined as number | undefined,
    supervisor_remark: "",
    expected_ready_date: undefined as string | undefined,
    selectedTeams: [] as Option[],
  });
  const [files, setFiles] = useState<File[]>([]);

  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: MiscellaneousEntry | null;
  }>({ open: false, data: null });

  const createMutation = useCreateMiscellaneousEntry();
  const { data: entries, refetch } = useMiscellaneousEntries(vendorId, leadId);
  const updateERDMutation = useUpdateMiscERD();
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const [selectedERD, setSelectedERD] = useState<string | undefined>(undefined);
  const [showConfirm, setShowConfirm] = useState(false); // confirmation modal toggle
  const canDoERDDate = canDoERDMiscellaneousDate(userType, leadStatus);
  const { data: orderLoginSummary = [], isLoading: loadingSummary } =
    useOrderLoginSummary(vendorId, leadId);

  const handleCreateEntry = () => {
    if (!formData.misc_type_id) {
      toast.error("Please select an issue type");
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    const payload: CreateMiscellaneousPayload = {
      vendorId,
      leadId,
      account_id: accountId,
      misc_type_id: formData.misc_type_id,
      problem_description: formData.problem_description.trim() || undefined,
      reorder_material_details:
        formData.reorder_material_details.trim() || undefined,
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
        setIsAddModalOpen(false);
        resetForm();
        refetch();
      },
    });
  };

  const resetForm = () => {
    setFormData({
      misc_type_id: undefined,
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

  return (
    <div className="mt-2 px-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Miscellaneous Issues</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage installation issues, material reorders, and other
            miscellaneous items
          </p>
        </div>

        {canWork && (
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Miscellaneous
          </Button>
        )}
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
                Problem Description
              </TableHead>
              <TableHead className="w-[140px] text-sm font-medium text-foreground/80">
                ERD Date
              </TableHead>
              <TableHead className="w-[100px] text-sm font-medium text-foreground/80">
                Quantity
              </TableHead>
              <TableHead className="w-[120px] text-sm font-medium text-foreground/80">
                Cost
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
              <TableHead className="w-[50px]" />
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
                  onClick={() => setViewModal({ open: true, data: entry })}
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

                  {/* ⭐ NEW ERD COLUMN */}
                  <TableCell className="py-3">
                    {entry.expected_ready_date ? (
                      <span className="text-sm font-medium">
                        {formatDate(entry.expected_ready_date)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
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
                      variant={entry.is_resolved ? "default" : "secondary"}
                      className={`
                  text-xs px-2 text-yellow-600 bg-yellow-100
                  ${
                    entry.is_resolved
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : ""
                  }
                `}
                    >
                      {entry.is_resolved ? "Resolved" : "Pending"}
                    </Badge>
                  </TableCell>

                  {/* ACTION */}
                  <TableCell className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-70 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewModal({ open: true, data: entry });
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Miscellaneous Issue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Team Responsible *
                </label>
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Problem Description *
              </label>
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Reorder Material Type *
              </label>
              <TextSelectPicker
                options={
                  orderLoginSummary.map(
                    (item: any) =>
                      item.item_desc || item.item_type || "Untitled Item"
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Supporting Proofs *</label>
              <FileUploadField
                value={files}
                onChange={setFiles}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                multiple={true}
              />
              <p className="text-xs text-muted-foreground">
                Max 10 files. Supported: Images, PDFs, Documents
              </p>
            </div>

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
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, data: null })}
      >
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  viewModal.data?.is_resolved
                    ? "bg-green-50 dark:bg-green-950"
                    : "bg-orange-50 dark:bg-orange-950"
                }`}
              >
                {viewModal.data?.is_resolved ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="text-lg">
                    {viewModal.data?.type.name}
                  </DialogTitle>
                  <Badge
                    variant={
                      viewModal.data?.is_resolved ? "default" : "secondary"
                    }
                    className={`flex-shrink-0 ${
                      viewModal.data?.is_resolved
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0"
                        : ""
                    }`}
                  >
                    {viewModal.data?.is_resolved ? "Resolved" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {viewModal.data && formatDate(viewModal.data.created_at)}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {viewModal.data?.created_user.user_name}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {(viewModal.data?.quantity ||
              viewModal.data?.cost ||
              viewModal.data?.expected_ready_date) && (
              <div className="grid grid-cols-3 gap-3">
                {viewModal.data?.quantity && (
                  <Card className="border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Quantity
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {viewModal.data.quantity}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModal.data?.cost && (
                  <Card className="border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Cost</p>
                          <p className="text-sm font-semibold mt-0.5">
                            ₹{viewModal.data.cost.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModal.data?.expected_ready_date && (
                  <Card className="border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Expected Date
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {formatDate(viewModal.data.expected_ready_date)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {viewModal.data?.problem_description && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Problem Description
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {viewModal.data.problem_description}
                </p>
              </div>
            )}

            {viewModal.data?.reorder_material_details && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Reorder Material Details
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {viewModal.data.reorder_material_details}
                </p>
              </div>
            )}

            {viewModal.data?.supervisor_remark && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Supervisor Remark
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {viewModal.data.supervisor_remark}
                </p>
              </div>
            )}

            {viewModal.data?.teams && viewModal.data.teams.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Team Responsible
                </h4>
                <div className="flex flex-wrap gap-2 pl-6">
                  {viewModal.data.teams.map((team) => (
                    <Badge key={team.team_id} variant="secondary">
                      {team.team_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {viewModal.data?.documents &&
              viewModal.data.documents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Supporting Proofs
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {viewModal.data.documents.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pl-6">
                    {viewModal.data.documents.map((doc) => (
                      <Card
                        key={doc.document_id}
                        className="group border hover:shadow-sm transition-all"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="p-1.5 bg-muted rounded">
                              {getFileIcon(doc.original_name)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {doc.original_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatDate(doc.uploaded_at)}
                              </p>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={doc.signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  title="View"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </a>
                              <a
                                href={doc.signed_url}
                                download={doc.original_name}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </a>
                            </div>
                          </div>

                          {isImageFile(doc.original_name) && (
                            <div className="relative aspect-video w-full overflow-hidden rounded border">
                              <img
                                src={doc.signed_url}
                                alt={doc.original_name}
                                className="object-cover w-full h-full hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <Separator />

          <DialogFooter>
            {!viewModal.data?.is_resolved && (
              <div className="flex w-3/5 gap-3">
                {/* ⭐ FULL-WIDTH DATE PICKER */}
                <div className="flex-1">
                  <CustomeDatePicker
                    key={viewModal.data?.id}
                    value={viewModal.data?.expected_ready_date || undefined}
                    restriction="futureOnly"
                    disabledReason={
                      !canDoERDDate
                        ? userType === "factory"
                          ? "This lead has moved ahead. Changes aren’t allowed."
                          : "Your role cannot perform this action."
                        : undefined
                    }
                    onChange={(newDate) => {
                      if (!canDoERDDate) return;
                      if (!newDate) return;

                      setSelectedERD(newDate);
                      setShowConfirm(true);
                    }}
                  />
                </div>

                {/* ⭐ RESOLVE BUTTON */}
                <CustomeTooltip
                  value={
                    !canDoERDDate
                      ? userType === "factory"
                        ? "This lead has moved ahead. Changes aren’t allowed."
                        : "Your role can’t perform this action."
                      : ""
                  }
                  truncateValue={
                    <div
                      className={
                        !canDoERDDate ? "pointer-events-none opacity-60" : ""
                      }
                    >
                      <Button
                        variant="default"
                        size="sm"
                        disabled={!canDoERDDate}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Resolved
                      </Button>
                    </div>
                  }
                />
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setViewModal({ open: false, data: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update ERD Date?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the Expected Ready Date?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (!viewModal.data || !selectedERD) return;

                updateERDMutation.mutate({
                  vendorId,
                  miscId: viewModal.data.id,
                  expected_ready_date: selectedERD,
                  updated_by: userId!,
                });

                setShowConfirm(false);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
