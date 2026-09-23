"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Upload, Loader2, CheckCircle2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import {
  usePreProductionFiles,
  useUploadPreProductionFiles,
  useMarkPreProdDone,
} from "@/api/production/production-api";
import { updateLeadProductStructureInstance } from "@/api/leads";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useDeleteDocument } from "@/api/leads";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import {
  useInstanceStage,
  useLeadStatus,
} from "@/hooks/designing-stage/designing-leads-hooks";
import ClientRequiredDeliveryDateBanner from "@/components/shared/ClientRequiredDeliveryDateBanner";
import TextAreaInput from "@/components/origin-text-area";
import { PackingType } from "@/types/track-trace";
import { useCreateTrackTraceProject } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";

interface PreProductionFilesSectionProps {
  leadId: number;
  accountId: number | null;
  instanceId?: number | null;
}

export default function PreProductionFilesSection({
  leadId,
  accountId,
  instanceId,
}: PreProductionFilesSectionProps) {
  const searchParams = useSearchParams();
  const instanceFromUrl = searchParams.get("instance_id");
  const instanceIdFromUrl = instanceFromUrl ? Number(instanceFromUrl) : null;
  const effectiveInstanceId =
    typeof instanceId !== "undefined"
      ? instanceId
      : instanceIdFromUrl && !Number.isNaN(instanceIdFromUrl)
        ? instanceIdFromUrl
        : null;

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const customPrivilegeCodes = useAppSelector(
    (s) => s.customPrivileges.codes,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (s) => s.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isInventoryEnabled = useAppSelector(
    (s) => s.auth.user?.vendor?.is_inventory_enabled === true,
  );
  const isTrackTraceUploadFlow =
    handlesLargeScaleProjects && isInventoryEnabled;

  const queryClient = useQueryClient();

  const { data: files, isLoading } = usePreProductionFiles(
    vendorId,
    leadId,
    effectiveInstanceId ?? undefined,
  );
  const { mutateAsync: uploadFiles, isPending } = useUploadPreProductionFiles(
    vendorId,
    leadId,
    effectiveInstanceId ?? undefined,
  );

  const { mutateAsync: markPreProdDone, isPending: markingDone } =
    useMarkPreProdDone(vendorId, leadId);

  const { mutateAsync: createTrackTraceProject, isPending: isCreatingProject } =
    useCreateTrackTraceProject();

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const { data } = useInstanceStage(vendorId, leadId, instanceId!);
  const leadStatusIns = data?.derived_stage;
  const leadStatus = leadData?.status;

  const { data: instancesResponse } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );
  const instances = Array.isArray(instancesResponse?.data)
    ? instancesResponse?.data
    : instancesResponse?.data?.data || [];
  const currentInstance = instances.find(
    (inst: any) => Number(inst.id) === effectiveInstanceId,
  );
  const isPreProdDone = currentInstance?.is_pre_prod_done === true;
  const normalizedRemark = currentInstance?.pre_prod_remark ?? "";

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [remark, setRemark] = useState(normalizedRemark);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [packingType, setPackingType] = useState<PackingType>(
    PackingType.DEFAULT,
  );
  const [noOfBoxes, setNoOfBoxes] = useState(0);
  const [isMultiLocation, setIsMultiLocation] = useState(false);

  const isCustomGroupPacking = packingType === PackingType.CUSTOM_GROUP;
  const isDefaultPacking = packingType === PackingType.DEFAULT;
  const isGroupwiseWithConfiguredBoxes =
    packingType === PackingType.GROUPWISE && noOfBoxes > 0;
  const showNoOfBoxes = !isCustomGroupPacking;
  const showMultiLocation = !isGroupwiseWithConfiguredBoxes;

  useEffect(() => {
    if (isCustomGroupPacking && noOfBoxes !== 0) {
      setNoOfBoxes(0);
    }
    if ((isDefaultPacking || isGroupwiseWithConfiguredBoxes) && isMultiLocation) {
      setIsMultiLocation(false);
    }
  }, [
    isCustomGroupPacking,
    isDefaultPacking,
    isGroupwiseWithConfiguredBoxes,
    isMultiLocation,
    noOfBoxes,
  ]);

  const hasFiles = Array.isArray(files) && files.length > 0;
  const isTrackTraceUploadBlockedByExistingFile =
    isTrackTraceUploadFlow && hasFiles;

  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];

  const images =
    files?.filter((file: any) =>
      imageTypes.includes(file.doc_og_name?.split(".").pop()?.toLowerCase()),
    ) || [];

  const documents =
    files?.filter(
      (file: any) =>
        !imageTypes.includes(file.doc_og_name?.split(".").pop()?.toLowerCase()),
    ) || [];

  const canDelete =
    userType === "super-admin" ||
    userType === "admin" ||
    (userType === "pre-prod" && !isPreProdDone);

  const canViewAndWork =
    userType === "super-admin" ||
    userType === "admin" ||
    userType === "pre-prod";
  const canUploadPreProductionFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.pre_production_files.upload",
        )
      : canViewAndWork;
  const canDeletePreProductionFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.pre_production_files.delete",
        )
      : canDelete;
  const canMarkPreProdDone =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.pre_production_files.mark_pre_prod_done_action",
        )
      : canViewAndWork;
  const canEditPreProdRemark =
    userType === "super-admin" ||
    userType === "admin" ||
    userType === "pre-prod";

  useEffect(() => {
    setRemark(normalizedRemark);
  }, [normalizedRemark]);

  const handleMarkPreProdDone = async () => {
    if (!effectiveInstanceId || !userId) return;
    try {
      await markPreProdDone({
        instanceId: effectiveInstanceId,
        updatedBy: userId,
      });
      toastManager.add({ title: "Pre-prod marked as done!", type: "success" });
      queryClient.invalidateQueries({
        queryKey: ["lead-product-structure-instances", leadId, vendorId],
      });
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to mark pre-prod done",
        type: "error",
      });
    }
  };

  const performUpload = async (filesToUpload: File[]) => {
    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadFiles(formData);
      toastManager.add({
        title: "Pre-production files uploaded successfully!",
        type: "success",
      });

      queryClient.invalidateQueries({
        queryKey: [
          "preProductionFiles",
          vendorId,
          leadId,
          effectiveInstanceId ?? "all",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "preProductionFilesReady",
          vendorId,
          leadId,
          effectiveInstanceId ?? "all",
        ],
      });
      return true;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload files.";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
      return false;
    }
  };

  const handleUploadButtonClick = () => {
    if (isTrackTraceUploadBlockedByExistingFile) {
      toastManager.add({
        title:
          "A file has already been uploaded. Delete it before uploading another one.",
        type: "error",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toastManager.add({
        title: "Please select at least one file to upload.",
        type: "error",
      });
      return;
    }

    if (isTrackTraceUploadFlow) {
      setShowPackingModal(true);
      return;
    }

    void performUpload(selectedFiles).then((success) => {
      if (success) setSelectedFiles([]);
    });
  };

  const handleConfirmPackingAndUpload = async () => {
    const filesToProcess = selectedFiles;
    setShowPackingModal(false);

    const uploaded = await performUpload(filesToProcess);
    if (uploaded) setSelectedFiles([]);

    const fileForImport = filesToProcess.find((file) =>
      file.name.toLowerCase().endsWith(".xlsx"),
    );

    if (!fileForImport) {
      toastManager.add({
        title:
          "Track & Trace project was not created: only .xlsx files can be imported for project creation right now. The file was still saved to Pre-Production Files.",
        type: "error",
      });
      return;
    }

    if (!vendorId) return;

    try {
      await createTrackTraceProject({
        vendorId,
        projectName: `Pre-Production Import - Lead #${leadId}`,
        lead_id: leadId,
        packing_type: packingType,
        no_of_boxes: noOfBoxes,
        is_multi_location: isMultiLocation,
        box_info_fields: [],
        file: fileForImport,
      });
      toastManager.add({
        title: "Track & Trace project created successfully!",
        type: "success",
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create Track & Trace project.";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  const handleRemarkUpdate = async () => {
    if (!vendorId || !effectiveInstanceId || !currentInstance) {
      toastManager.add({
        title: "Product structure instance not found.",
        type: "error",
      });
      return;
    }

    if (!remark.trim()) {
      toastManager.add({ title: "Remark cannot be empty.", type: "error" });
      return;
    }

    try {
      await updateLeadProductStructureInstance(vendorId, leadId, effectiveInstanceId, {
        product_structure_id: currentInstance.product_structure_id,
        title: currentInstance.title,
        description: currentInstance.description ?? "",
        pre_prod_remark: remark,
        updated_by: userId,
      });

      toastManager.add({
        title: normalizedRemark ? "Remark updated!" : "Remark added!",
        type: "success",
      });

      queryClient.invalidateQueries({
        queryKey: ["lead-product-structure-instances", leadId, vendorId],
      });
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to update remark.",
        type: "error",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      queryClient.invalidateQueries({
        queryKey: [
          "preProductionFilesReady",
          vendorId,
          leadId,
          effectiveInstanceId ?? "all",
        ],
      });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <ClientRequiredDeliveryDateBanner leadId={leadId} />

      <div className="border rounded-lg bg-background shadow-sm">
        {/* -------------------------------- HEADER -------------------------------- */}
        <div className="px-6 py-4 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-lg font-semibold tracking-tight">
                Pre-Production Files
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-7 mt-1">
              Upload final production files before proceeding to Under
              Production.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {files.length} File{files.length > 1 && "s"}
            </span>
          )} */}
            {isPreProdDone ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 w-full justify-center sm:w-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pre Prod Completed
              </span>
            ) : (
              canMarkPreProdDone &&
              effectiveInstanceId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={!hasFiles ? 0 : undefined} className="w-full sm:w-auto block sm:inline-block">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleMarkPreProdDone}
                        disabled={markingDone || !hasFiles}
                        className="w-full sm:w-auto"
                      >
                        {markingDone ? (
                          <>
                            <Loader2 className="animate-spin size-3.5 mr-1" />
                            Marking...
                          </>
                        ) : (
                          "Mark Pre Prod Done"
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!hasFiles && (
                    <TooltipContent side="bottom">
                      Upload at least one file before marking pre-prod as done
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            )}
          </div>
        </div>

        {/* -------------------------------- UPLOAD AREA -------------------------------- */}
        {canUploadPreProductionFiles && (
          <div className="p-6 border-b space-y-4">
            {isTrackTraceUploadBlockedByExistingFile ? (
              <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                A file has already been uploaded for this project. Delete it
                from the list below before uploading another one.
              </div>
            ) : (
              <>
                <FileUploadField
                  value={selectedFiles}
                  onChange={setSelectedFiles}
                  accept={
                    isTrackTraceUploadFlow
                      ? ".csv,.xlsx"
                      : ".png,.jpg,.jpeg,.pdf,.pyo,.pytha,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip"
                  }
                  multiple={!isTrackTraceUploadFlow}
                />

                <div className="flex sm:justify-end">
                  <Button
                    size="sm"
                    onClick={handleUploadButtonClick}
                    disabled={
                      isPending ||
                      isCreatingProject ||
                      selectedFiles.length === 0
                    }
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {isPending || isCreatingProject ? (
                      <>
                        <Loader2 className="animate-spin size-4" />
                        {isCreatingProject
                          ? "Creating project..."
                          : "Uploading..."}
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload Files
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-tight">Remark</p>

              <TextAreaInput
                value={remark}
                onChange={setRemark}
                maxLength={500}
                placeholder="Add any notes related to pre-production..."
                className="h-[130px] bg-muted/20 rounded-lg"
                disabled={!canEditPreProdRemark}
              />

              <div className="flex sm:justify-end">
                <Button
                  size="sm"
                  onClick={handleRemarkUpdate}
                  disabled={!remark.trim() || !canEditPreProdRemark}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Paperclip size={16} />
                  {normalizedRemark ? "Update Remark" : "Add Remark"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------- FILE LIST -------------------------------- */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Uploaded Files
            </h4>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="animate-spin mr-2 size-4" />
              Loading files...
            </div>
          ) : !hasFiles ? (
            <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
              <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No pre-production files uploaded yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Upload final production files to enable the Under Production
                stage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {images.map((doc: any, index: number) => (
                <ImageComponent
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    doc_og_name: doc.doc_og_name,
                    signedUrl: doc.signed_url,
                    created_at: doc.created_at,
                  }}
                  index={index}
                  canDelete={canDeletePreProductionFiles}
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))}

              {documents.map((doc: any) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    originalName: doc.doc_og_name,
                    signedUrl: doc.signed_url,
                    created_at: doc.created_at,
                  }}
                  canDelete={canDeletePreProductionFiles}
                  onDelete={(id) => setConfirmDelete(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* -------------------------------- DELETE CONFIRMATION -------------------------------- */}
        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected file will be
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

        {/* -------------------------------- PACKING & BOX CONFIGURATION -------------------------------- */}
        <Dialog open={showPackingModal} onOpenChange={setShowPackingModal}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Packing & Box Configuration</DialogTitle>
              <DialogDescription>
                Set up packing rules before this file is imported into a
                Track &amp; Trace project.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>
                  Packing Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={packingType}
                  onValueChange={(value) => setPackingType(value as PackingType)}
                >
                  <SelectTrigger className="h-10 w-full text-sm">
                    <SelectValue placeholder="Select packing type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PackingType.DEFAULT}>Default</SelectItem>
                    <SelectItem value={PackingType.GROUPWISE}>Groupwise</SelectItem>
                    <SelectItem value={PackingType.CUSTOM_GROUP}>
                      Custom Packing Group
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showNoOfBoxes && (
                <div className="space-y-2">
                  <Label>
                    No of Boxes{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g., 10"
                    value={String(noOfBoxes)}
                    onChange={(event) => {
                      const value = event.target.value;
                      setNoOfBoxes(value === "" ? 0 : Number(value));
                    }}
                    className="h-10 text-sm w-full"
                  />
                </div>
              )}

              {showMultiLocation && (
                <div className="space-y-2">
                  <Label>
                    Multi Location{" "}
                    {!isDefaultPacking && (
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    )}
                  </Label>
                  <Select
                    value={isMultiLocation ? "YES" : "NO"}
                    onValueChange={(value) => setIsMultiLocation(value === "YES")}
                    disabled={isDefaultPacking}
                  >
                    <SelectTrigger className="h-10 w-full text-sm">
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO">No</SelectItem>
                      <SelectItem value="YES">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPackingModal(false)}
                disabled={isPending || isCreatingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPackingAndUpload}
                disabled={isPending || isCreatingProject}
              >
                {isPending || isCreatingProject ? (
                  <>
                    <Loader2 className="animate-spin size-4 mr-2" />
                    {isCreatingProject ? "Creating project..." : "Uploading..."}
                  </>
                ) : (
                  "Continue & Upload"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
