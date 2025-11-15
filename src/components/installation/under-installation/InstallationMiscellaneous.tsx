"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Plus,
  Eye,
  Download,
  ExternalLink,
  Package,
  Users,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Image,
  File,
  Wrench,
  ChevronRight,
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

  // Fetch misc types and teams
  const { data: miscTypes = [], isLoading: loadingTypes } =
    useMiscTypes(vendorId);
  const { data: miscTeams = [], isLoading: loadingTeams } =
    useMiscTeams(vendorId);

  // State for Add Modal
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

  // State for View Modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: MiscellaneousEntry | null;
  }>({ open: false, data: null });

  // API hooks
  const createMutation = useCreateMiscellaneousEntry();
  const { data: entries, refetch } = useMiscellaneousEntries(vendorId, leadId);
  const updateERDMutation = useUpdateMiscERD();

  const { data: orderLoginSummary = [], isLoading: loadingSummary } =
    useOrderLoginSummary(vendorId, leadId);

  const handleCreateEntry = () => {
    // Validation
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
      <Image className="w-5 h-5 text-blue-500" />
    ) : (
      <File className="w-5 h-5 text-orange-500" />
    );
  };

  const isImageFile = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  };

  // Convert teams to Options for MultipleSelector
  const teamOptions: Option[] = miscTeams.map((team) => ({
    value: String(team.id),
    label: team.name,
  }));

  // Convert types to SelectData for AssignToPicker
  const typeSelectData = miscTypes.map((type) => ({
    id: type.id,
    label: type.name,
  }));

  return (
    <div className="mt-4 px-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Miscellaneous Issues</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage installation issues, material reorders, and other
            miscellaneous items
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Issue
        </Button>
      </div>

      {/* Entry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries?.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-muted/50 rounded-full">
                <Wrench className="w-10 h-10 opacity-50" />
              </div>
              <div>
                <p className="font-medium">No issues reported yet</p>
                <p className="text-xs mt-1">
                  Add your first miscellaneous issue or material reorder
                </p>
              </div>
            </div>
          </div>
        )}

        {entries?.map((entry) => (
          <Card
            key={entry.id}
            className="group relative overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => setViewModal({ open: true, data: entry })}
          >
            {/* Status Indicator Strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                entry.is_resolved
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : "bg-gradient-to-r from-orange-500 to-amber-500"
              }`}
            />

            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-lg ${
                      entry.is_resolved
                        ? "bg-green-500/10"
                        : "bg-orange-500/10"
                    }`}
                  >
                    {entry.is_resolved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1 truncate">
                      {entry.type.name}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={entry.is_resolved ? "default" : "secondary"}
                  className={
                    entry.is_resolved
                      ? "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20"
                      : ""
                  }
                >
                  {entry.is_resolved ? "Resolved" : "Pending"}
                </Badge>
              </div>

              {/* Problem Description */}
              {entry.problem_description && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {entry.problem_description}
                  </p>
                </div>
              )}

              <Separator className="my-4" />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {entry.quantity && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="p-1.5 bg-blue-500/10 rounded">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{entry.quantity}</p>
                    </div>
                  </div>
                )}
                {entry.cost && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="p-1.5 bg-green-500/10 rounded">
                      <DollarSign className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cost</p>
                      <p className="font-medium">
                        ₹{entry.cost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {entry.teams.length > 0 && (
                  <div className="flex items-center gap-2 text-xs col-span-2">
                    <div className="p-1.5 bg-purple-500/10 rounded">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground">Teams</p>
                      <p className="font-medium truncate">
                        {entry.teams.map((t) => t.team_name).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    <FileText className="w-3 h-3 mr-1" />
                    {entry.documents.length}
                  </Badge>
                </div>
                <div className="flex items-center text-xs font-medium text-primary group-hover:gap-1 transition-all">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Issue Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Miscellaneous Issue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Issue Type */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Issue Type *</label>
                <AssignToPicker
                  data={typeSelectData}
                  value={formData.misc_type_id}
                  onChange={(id) =>
                    setFormData((prev) => ({
                      ...prev,
                      misc_type_id: id || undefined,
                    }))
                  }
                  placeholder="Search issue type..."
                  emptyLabel="Select issue type"
                  disabled={loadingTypes}
                />
              </div>

              {/* Assign Teams */}
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

            {/* Problem Description */}
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

            {/* Reorder Material Details */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Reorder Material Details *
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

            {/* File Upload */}
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

            {/* Quantity & Cost */}
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

            {/* Supervisor Remark */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Supervisor Remark</label>
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
              {createMutation.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, data: null })}
      >
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={`p-3 rounded-xl ${
                    viewModal.data?.is_resolved
                      ? "bg-green-500/10"
                      : "bg-orange-500/10"
                  }`}
                >
                  {viewModal.data?.is_resolved ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl mb-2">
                    {viewModal.data?.type.name}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {viewModal.data && formatDate(viewModal.data.created_at)}
                    </div>
                    <span className="text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {viewModal.data?.created_user.user_name}
                    </div>
                  </div>
                </div>
              </div>
              {viewModal.data?.is_resolved ? (
                <Badge className="bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Resolved
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Pending
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* Info Cards Grid */}
            {(viewModal.data?.quantity ||
              viewModal.data?.cost ||
              viewModal.data?.expected_ready_date ||
              viewModal.data?.resolved_at) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {viewModal.data?.quantity && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Quantity
                          </p>
                          <p className="text-sm font-semibold">
                            {viewModal.data.quantity}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModal.data?.cost && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Cost
                          </p>
                          <p className="text-sm font-semibold">
                            ₹{viewModal.data.cost.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModal.data?.expected_ready_date && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <Calendar className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Expected Date
                          </p>
                          <p className="text-sm font-semibold">
                            {formatDate(viewModal.data.expected_ready_date)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {viewModal.data?.resolved_at && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Resolved At
                          </p>
                          <p className="text-sm font-semibold">
                            {formatDate(viewModal.data.resolved_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Problem Description */}
            {viewModal.data?.problem_description && (
              <Card className="border-orange-200/50 bg-orange-50/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg mt-0.5">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-2 text-orange-900">
                        Problem Description
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {viewModal.data.problem_description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reorder Material Details */}
            {viewModal.data?.reorder_material_details && (
              <Card className="border-blue-200/50 bg-blue-50/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg mt-0.5">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-2 text-blue-900">
                        Reorder Material Details
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {viewModal.data.reorder_material_details}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Supervisor Remark */}
            {viewModal.data?.supervisor_remark && (
              <Card className="border-purple-200/50 bg-purple-50/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg mt-0.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-2 text-purple-900">
                        Supervisor Remark
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {viewModal.data.supervisor_remark}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assigned Teams */}
            {viewModal.data?.teams && viewModal.data.teams.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-3">
                        Team Responsible
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {viewModal.data.teams.map((team) => (
                          <Badge
                            key={team.team_id}
                            variant="secondary"
                            className="px-3 py-1"
                          >
                            {team.team_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {viewModal.data?.documents &&
              viewModal.data.documents.length > 0 && (
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="text-sm font-semibold">
                          Supporting Proofs
                        </h4>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {viewModal.data.documents.length} file(s)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {viewModal.data.documents.map((doc) => (
                        <Card
                          key={doc.document_id}
                          className="group border-border/50 hover:border-primary/30 hover:shadow-sm transition-all"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
                                {getFileIcon(doc.original_name)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate mb-1">
                                  {doc.original_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
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
                                    className="h-8 w-8"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
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
                                    className="h-8 w-8"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </a>
                              </div>
                            </div>

                            {isImageFile(doc.original_name) && (
                              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted border border-border/50">
                                <img
                                  src={doc.signed_url}
                                  alt={doc.original_name}
                                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          <Separator />

          <DialogFooter className="pt-4 flex-row justify-between items-center gap-3">
            {/* Left side actions */}
            <div className="flex items-center gap-3">
              {/* Update Expected Ready Date */}
              {!viewModal.data?.is_resolved && (
                <>
                  <CustomeDatePicker
                    key={viewModal.data?.id}
                    value={
                      viewModal.data?.expected_ready_date
                        ? viewModal.data.expected_ready_date
                        : undefined
                    }
                    onChange={(newDate) => {
                      setViewModal((prev): any => {
                        if (!prev.data) return prev;
                        return {
                          ...prev,
                          data: {
                            ...prev.data,
                            expected_ready_date: newDate ?? undefined,
                          },
                        };
                      });
                    }}
                    restriction="futureOnly"
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!viewModal.data) return;

                      updateERDMutation.mutate({
                        vendorId,
                        miscId: viewModal.data.id,
                        expected_ready_date:
                          viewModal.data.expected_ready_date ?? undefined,
                        updated_by: userId!,
                      });
                    }}
                  >
                    Save ERD
                  </Button>
                </>
              )}

              {/* Mark Resolved */}
              {!viewModal.data?.is_resolved && (
                <Button variant="default" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setViewModal({ open: false, data: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}