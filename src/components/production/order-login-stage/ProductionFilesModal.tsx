"use client";

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useProductionFiles,
  useUploadProductionFiles,
  useProductionFilesRemark,
  useUpsertProductionFilesRemark,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import { FolderOpen, Upload, Loader2, Paperclip, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
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
import DocumentCard from "@/components/utils/documentCard";
import {
  useInstanceStage,
  useLeadStatus,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { canUploadOrDeleteOrderLogin } from "@/components/utils/privileges";
import TextAreaInput from "@/components/origin-text-area";
import { Badge } from "@/components/ui/badge";
import { ImageComponent } from "@/components/utils/ImageCard";
import { useSearchParams } from "next/navigation";
import ClientRequiredDeliveryDateBanner from "@/components/shared/ClientRequiredDeliveryDateBanner";


import CustomeTooltip from "@/components/custom-tooltip";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useLeadById } from "@/hooks/useLeadsQueries";
interface ProductionFilesSectionProps {
  leadId: number;
  accountId: number | null;
  readOnly?: boolean;
  instanceId?: number | null;
  orderLoginApprovalPending?: boolean;
  orderLoginApprovalPendingTooltip?: string;
}

const MATERIAL_REQUIRED_TEMPLATE_HEADERS = [
  "Sr.",
  "Type",
  "Category",
  "Qty.",
  "Unit",
  "Name",
  "Article Code",
  "Edgeband",
  "Size",
  "Description",
  "Vendor Code",
  "Area",
  "Face Coat 1",
  "Face Coat 2",
  "Alternate Unit Qty.",
  "Minimum Order Qty.",
  "Unit",
  "Cost",
  "Amt.",
  "Tax Amt.",
  "Total",
];

const MATERIAL_REQUIRED_TEMPLATE_HIGHLIGHT_HEADERS = new Set([
  "Type",
  "Category",
  "Qty.",
  "Unit",
  "Name",
  "Article Code",
]);

export default function ProductionFilesSection({
  leadId,
  accountId,
  readOnly = false,
  instanceId,
  orderLoginApprovalPending = false,
  orderLoginApprovalPendingTooltip = "Accounts approval for Order Login is still pending",
}: ProductionFilesSectionProps) {
  const searchParams = useSearchParams();

  const instanceFromUrl = searchParams.get("instance_id");
  const resolvedInstanceId =
    instanceId ?? (instanceFromUrl ? Number(instanceFromUrl) : undefined);

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const handlesLargeScaleProjects = useAppSelector(
    (s) => s.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const customPrivilegeCodes = useAppSelector(
    (s) => s.customPrivileges.codes,
  );
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const { data, isLoading: instanceLoading } = useInstanceStage(
    vendorId,
    leadId,
    resolvedInstanceId,
  );
  const { data: leadStatusData } = useLeadStatus(leadId, vendorId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const queryClient = useQueryClient();

  const { data: productionFiles, isLoading } = useProductionFiles(
    vendorId,
    leadId,
    resolvedInstanceId,
  );
  const { mutateAsync: uploadFiles, isPending } = useUploadProductionFiles(
    vendorId,
    leadId,
    resolvedInstanceId,
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasFiles = Array.isArray(productionFiles) && productionFiles.length > 0;
  const allowedLargeScaleExtensions = [".xlsx", ".csv"];
  const productionFileAccept = handlesLargeScaleProjects
    ? allowedLargeScaleExtensions.join(",")
    : ".png,.jpg,.jpeg,.pdf,.pyo,.pytha,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip";

  const { data: savedRemark } = useProductionFilesRemark(vendorId, leadId);
  const { mutateAsync: saveRemark, isPending: savingRemark } =
    useUpsertProductionFilesRemark(vendorId, leadId);
  const [remark, setRemark] = useState("");


  const { data: leadResponse } = useLeadById(
    leadId,
    vendorId,
    userId,
  );

  const lead = leadResponse?.data?.lead;

  const {
    blockedTooltip,
    shouldDisableBlockedActions,
  } = useLeadAccessControl({
    leadId,
    userType,
    lead,
  });
  const shouldDisableActions =
    shouldDisableBlockedActions || orderLoginApprovalPending;
  const effectiveBlockedTooltip = orderLoginApprovalPending
    ? orderLoginApprovalPendingTooltip
    : blockedTooltip;

  useEffect(() => {
    if (savedRemark && savedRemark !== "N/A") setRemark(savedRemark);
  }, [savedRemark]);

  const handleRemarkSave = async () => {
    if (!remark.trim()) {
      toastManager.add({ title: "Remark cannot be empty.", type: "error" });
      return;
    }
    try {
      await saveRemark({ remark, updated_by: userId! });
      toastManager.add({ title: "Remark saved successfully.", type: "success" });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save remark.";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  // ✅ Handle Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toastManager.add({ title: "Please select at least one file to upload.", type: "error" });
      return;
    }

    if (handlesLargeScaleProjects) {
      const invalidFiles = selectedFiles.filter((file) => {
        const fileName = file.name.toLowerCase();
        return !allowedLargeScaleExtensions.some((ext) => fileName.endsWith(ext));
      });

      if (invalidFiles.length > 0) {
        toastManager.add({
          title: "Only .xlsx and .csv files are allowed for large-scale vendors.",
          type: "error",
        });
        return;
      }
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadFiles(formData);
      toastManager.add({ title: "Production files uploaded successfully!", type: "success" });
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: [
          "productionFiles",
          vendorId,
          leadId,
          resolvedInstanceId ?? "all",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
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
    }
  };

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

  const handleDownloadTemplate = async () => {
    try {
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
        import("exceljs"),
        import("file-saver"),
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Material Report For Production");

      worksheet.addRow(MATERIAL_REQUIRED_TEMPLATE_HEADERS);
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };

      headerRow.eachCell((cell, colNumber) => {
        const header = MATERIAL_REQUIRED_TEMPLATE_HEADERS[colNumber - 1];
        if (!MATERIAL_REQUIRED_TEMPLATE_HIGHLIGHT_HEADERS.has(header)) return;

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" },
        };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, "material_required_template.xlsx");
    } catch (error) {
      console.error("Failed to download production template", error);
      toastManager.add({
        title: "Failed to download template",
        type: "error",
      });
    }
  };

  // ✅ Permission logic for delete
  console.log("UserType: ", userType);
  console.log("Lead Status data with istance id ", data);
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const effectiveStage =
    data?.derived_stage ?? leadStatusData?.status ?? "";
  const canManageProductionFiles =
    !readOnly &&
    !isAuditor &&
    canUploadOrDeleteOrderLogin(userType ?? "", effectiveStage);
  const canUploadProductionFiles =
    !shouldDisableActions &&
    (
      userType === "custom"
        ? customPrivilegeCodes.includes(
          "production.order_login.production_files.upload",
        )
        : canManageProductionFiles
    );

  const canDeleteProductionFiles =
    !shouldDisableActions &&
    (
      userType === "custom"
        ? customPrivilegeCodes.includes(
          "production.order_login.production_files.delete",
        )
        : canManageProductionFiles
    );

  return (
    <div className="space-y-4">
      <ClientRequiredDeliveryDateBanner leadId={leadId} />

      <div className="border rounded-lg bg-background shadow-sm">
        {/* -------------------------------- HEADER -------------------------------- */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b bg-muted/30 ">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Production Files
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Upload and manage production files associated with this
            </p>
          </div>

          <div className="flex items-center gap-2">
            {handlesLargeScaleProjects && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Download Template
              </Button>
            )}
            {hasFiles && (
              <Badge variant="secondary">
                {productionFiles.length} File
                {productionFiles.length > 1 && "s"}
              </Badge>
            )}
          </div>
        </div>

        {/* -------------------------------- UPLOAD AREA -------------------------------- */}


        {shouldDisableActions ? (
          <div className="p-6 border-b space-y-4">
            <CustomeTooltip
              value={effectiveBlockedTooltip}
              truncateValue={
                <div>
                  <FileUploadField
                    value={[]}
                    onChange={() => { }}
                    multiple
                    disabled
                  />
                </div>
              }
            />

       
          </div>
        ) : (
          canUploadProductionFiles && (
            <div className="p-6 border-b space-y-4">
              <FileUploadField
                value={selectedFiles}
                onChange={setSelectedFiles}
                accept={productionFileAccept}
                multiple
              />

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isPending || selectedFiles.length === 0}
                  className="flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin size-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        )}


        {!handlesLargeScaleProjects && (
          <div className="p-6 border-b space-y-2">
            <p className="text-sm font-semibold tracking-tight">Remark</p>
            {shouldDisableActions ? (
              <CustomeTooltip
                value={effectiveBlockedTooltip}
                truncateValue={
                  <div>
                    <TextAreaInput
                      value={remark}
                      onChange={() => { }}
                      disabled
                      maxLength={500}
                      placeholder="Add any notes related to production files..."
                      className="h-[130px] bg-muted/20 rounded-lg"
                    />
                  </div>
                }
              />
            ) : (
              <TextAreaInput
                value={remark}
                onChange={setRemark}
                maxLength={500}
                disabled={!canUploadProductionFiles}
                placeholder="Add any notes related to production files..."
                className="h-[130px] bg-muted/20 rounded-lg"
              />
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleRemarkSave}
                disabled={
                  !remark.trim() || !canUploadProductionFiles || savingRemark
                }
                className="flex items-center gap-2"
              >
                {savingRemark ? (
                  <>
                    <Loader2 className="animate-spin size-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Paperclip size={16} />
                    {savedRemark && savedRemark !== "N/A"
                      ? "Update Remark"
                      : "Add Remark"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* -------------------------------- FILE LIST SECTION -------------------------------- */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold tracking-tight">
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
                No production files uploaded yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Start by uploading your CAD, Pytha, or image files.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {productionFiles.map((doc: any) => {
                const isImage = doc.doc_og_name?.match(
                  /\.(jpg|jpeg|png|gif|webp)$/i,
                );
                if (isImage) {
                  return (
                    <ImageComponent
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        doc_og_name: doc.doc_og_name,
                        signedUrl: doc.signedUrl ?? doc.signed_url,
                        created_at: doc.created_at,
                      }}
                      canDelete={canDeleteProductionFiles}
                      onDelete={(id) =>
                        setConfirmDelete(typeof id === "string" ? Number(id) : id)
                      }
                    />
                  );
                } else {
                  return (
                    <DocumentCard
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        originalName: doc.doc_og_name,
                        signedUrl: doc.signedUrl ?? doc.signed_url,
                        created_at: doc.created_at,
                      }}
                      canDelete={canDeleteProductionFiles}
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  );
                }
              })}
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
              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected document will be
                permanently deleted.
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
      </div>
    </div>
  );
}
