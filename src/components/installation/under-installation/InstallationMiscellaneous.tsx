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

  return (
    <div className="mt-4 px-2">
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
          Add Miscellaneous
        </Button>
      </div>

      {/* Table View */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Miscellaneous Type</TableHead>
              <TableHead className="w-[300px]">Problem Description</TableHead>
              <TableHead className="w-[100px]">Quantity</TableHead>
              <TableHead className="w-[120px]">Cost</TableHead>
              <TableHead className="w-[200px]">Responsible Teams</TableHead>
              <TableHead className="w-[100px] text-center">Documents</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!entries || entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-muted/50 rounded-full">
                      <Wrench className="w-8 h-8 opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        No issues reported yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add your first miscellaneous issue or material reorder
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setViewModal({ open: true, data: entry })}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded ${
                          entry.is_resolved
                            ? "bg-green-50 dark:bg-green-950"
                            : "bg-orange-50 dark:bg-orange-950"
                        }`}
                      >
                        {entry.is_resolved ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {entry.type.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <RemarkTooltip
                      remark={
                        entry.problem_description
                          ? entry.problem_description.length > 60
                            ? entry.problem_description.slice(0, 60) + "..."
                            : entry.problem_description
                          : "-"
                      }
                      remarkFull={entry.problem_description || "-"}
                    />
                  </TableCell>

                  <TableCell>
                    {entry.quantity ? (
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-sm font-medium">
                          {entry.quantity}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.cost ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          ₹{entry.cost.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.teams.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {entry.teams.slice(0, 2).map((team) => (
                          <Badge
                            key={team.team_id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {team.team_name}
                          </Badge>
                        ))}
                        {entry.teams.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{entry.teams.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      {entry.documents.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={entry.is_resolved ? "default" : "secondary"}
                      className={`text-xs ${
                        entry.is_resolved
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0"
                          : ""
                      }`}
                    >
                      {entry.is_resolved ? "Resolved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
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

          <DialogFooter className="flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
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

                  <Button variant="default" size="sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </>
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
