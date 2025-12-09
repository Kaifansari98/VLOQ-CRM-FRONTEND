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
  FileText,
  Loader2,
  CheckCircle2,
  Package,
  Pencil,
} from "lucide-react";
import {
  useRequiredDateForDispatch,
  useDispatchDetails,
  useAddDispatchDetails,
  useDispatchDocuments,
  useUploadDispatchDocuments,
} from "@/api/installation/useDispatchStageLeads";
import { useAppSelector } from "@/redux/store";
import { useUpdateNoOfBoxes } from "@/api/production/production-api";
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
import { toast } from "react-toastify";
import { z } from "zod";
import PendingMaterialDetails from "./PendingMaterialDetails";
import VehicleNumberInput from "@/components/custom/VehicleNumberInput";
import { useDeleteDocument } from "@/api/leads";
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkDispatchStage } from "@/components/utils/privileges";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const DispatchDetailsSchema = z.object({
  dispatch_date: z.string().nonempty("Dispatch date is required"),
  vehicle_no: z.string().min(2, "Vehicle number is required"),
  driver_name: z.string().optional(),
  driver_number: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;

        const digits = val.replace(/\D/g, "");

        // Reject repeated digits like 0000000000, 1111111111, etc.
        const isRepeated =
          /^(\d)\1{9}$/.test(digits) ||
          (digits.length === 12 && /^(\d)\1{9}$/.test(digits.slice(2)));

        if (isRepeated) return false;

        // CASE 1 → Exactly 10 digits
        if (digits.length === 10) return true;

        // CASE 2 → Country code + 10 digits
        if (digits.length === 12 && digits.startsWith("91")) return true;

        return false;
      },
      {
        message: "Enter a valid 10-digit mobile number",
      }
    ),

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
    (state) => state.auth.user?.user_type?.user_type
  );

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

  // API Hooks
  const { data: requiredDateData, isLoading: loadingRequiredDate } =
    useRequiredDateForDispatch(vendorId, leadId);
  const { data: dispatchDetails, isLoading: loadingDispatchDetails } =
    useDispatchDetails(vendorId, leadId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { data: documents, isLoading: loadingDocuments } = useDispatchDocuments(
    vendorId,
    leadId
  );

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;
  const addDispatchMutation = useAddDispatchDetails();
  const uploadDocsMutation = useUploadDispatchDocuments();

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // 🧩 For Edit No. of Boxes Modal
  const [openBoxesModal, setOpenBoxesModal] = useState(false);
  const [noOfBoxesInput, setNoOfBoxesInput] = useState(
    requiredDateData?.no_of_boxes?.toString() || ""
  );
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  const queryClient = useQueryClient();
  const { mutateAsync: updateNoBoxes, isPending: updatingBoxes } =
    useUpdateNoOfBoxes(vendorId, leadId);

  // Update form when dispatch details load
  // React.useEffect(() => {
  //   if (dispatchDetails) {
  //     setFormData({
  //       dispatch_date: dispatchDetails.dispatch_date
  //         ? format(new Date(dispatchDetails.dispatch_date), "yyyy-MM-dd")
  //         : "",
  //       driver_name: dispatchDetails.driver_name || "",
  //       driver_number: dispatchDetails.driver_number || "",
  //       vehicle_no: dispatchDetails.vehicle_no || "",
  //       dispatch_remark: dispatchDetails.dispatch_remark || "",
  //       updated_by: userId,
  //     });
  //   }
  // }, [dispatchDetails, userId]);

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

  const onSubmit = form.handleSubmit((values) => {
    addDispatchMutation.mutate({
      vendorId,
      leadId,
      payload: values,
    });
  });

  const handleUploadDocuments = () => {
    if (selectedFiles.length === 0) return;

    uploadDocsMutation.mutate(
      {
        vendorId,
        leadId,
        payload: {
          files: selectedFiles,
          account_id: accountId,
          created_by: userId,
        },
      },
      {
        onSuccess: () => {
          setSelectedFiles([]);
        },
      }
    );
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

  const imageExtensions = ["jpg", "jpeg", "png", "webp"];
  const documentExtensions = ["pdf", "doc", "docx"];

  const images =
    documents?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    }) || [];

  const Documents =
    documents?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return documentExtensions.includes(ext || "");
    }) || [];

  if (loadingRequiredDate && loadingDispatchDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canDelete = userType === "admin" || userType === "super-admin";
  const canViewAndWork = canViewAndWorkDispatchStage(userType, leadStatus);

  return (
    <div className="space-y-6 h-full overflow-y-scroll bg-[#fff] dark:bg-[#0a0a0a]">
      {/* Required Date & Boxes Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ---- Required Delivery Date Card ---- */}
        <div className="border rounded-xl bg-background transition-all">
          <div className="p-5 flex items-center gap-4">
            {/* Icon */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                Required OnSite Delivery Date
              </p>

              {loadingRequiredDate ? (
                <div className="h-6 w-40 bg-muted animate-pulse rounded-md mt-2" />
              ) : (
                <p className="text-lg md:text-xl font-semibold text-foreground mt-1">
                  {requiredDateData?.required_date_for_dispatch
                    ? format(
                        new Date(requiredDateData.required_date_for_dispatch),
                        "EEEE dd MMMM yyyy"
                      )
                    : "Not set"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ---- Number of Boxes Card ---- */}
        <div className="border rounded-xl bg-background transition-all">
          <div className="p-5 flex items-center gap-4">
            {/* Icon */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex flex-col w-full">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                Number of Boxes
              </p>

              {loadingRequiredDate ? (
                <div className="h-6 w-24 bg-muted animate-pulse rounded-md mt-2" />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg md:text-xl font-semibold text-foreground">
                    {requiredDateData?.no_of_boxes || 0}
                  </p>

                  {canViewAndWork && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 p-0 rounded-full hover:bg-accent"
                      onClick={() => {
                        setNoOfBoxesInput(
                          requiredDateData?.no_of_boxes?.toString() || ""
                        );
                        setOpenBoxesModal(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Dispatch Details Form */}
      <div className="border rounded-lg bg-background overflow-y-auto">
        {/* ---------- HEADER ---------- */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Dispatch Details
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Enter vehicle, driver & dispatch related information.
            </p>
          </div>

          {/* Save Button – stays in header but triggers form */}
          {canViewAndWork && (
            <Button
              type="submit"
              form="dispatch-form"
              disabled={addDispatchMutation.isPending}
              className="w-full md:w-auto"
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
          )}
        </div>

        {/* ---------- CONTENT ---------- */}
        <div className="p-6">
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
                onSubmit={onSubmit}
                className="space-y-6"
              >
                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dispatch Date */}
                  <FormField
                    control={form.control}
                    name="dispatch_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispatch Date</FormLabel>

                        <div
                          className={
                            !canViewAndWork
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }
                        >
                          <FormControl>
                            <CustomeDatePicker
                              value={field.value}
                              onChange={field.onChange}
                              restriction="futureOnly"
                            />
                          </FormControl>
                        </div>

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
                        <div
                          className={
                            !canViewAndWork
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }
                        >
                          <FormControl>
                            <VehicleNumberInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
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
                        <FormLabel>Driver Name</FormLabel>
                        <div
                          className={
                            !canViewAndWork
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }
                        >
                          <FormControl>
                            <Input placeholder="Enter driver name" {...field} />
                          </FormControl>
                        </div>
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
                        <FormLabel>Driver Contact Number</FormLabel>

                        <div
                          className={
                            !canViewAndWork
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }
                        >
                          <FormControl>
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              defaultCountry="IN"
                            />
                          </FormControl>
                        </div>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dispatch Remark */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="dispatch_remark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispatch Remark</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any remarks..."
                            rows={3}
                            {...field}
                            disabled={!canViewAndWork}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>

      <Separator />

      {/* Dispatch Photos & Documents (Premium Container) */}
      <div className="border rounded-lg bg-background overflow-hidden">
        {/* ---------------------- HEADER ---------------------- */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Dispatch Photos & Documents
              </h2>
              <span className="text-red-500">*</span>
            </div>

            <p className="text-xs text-muted-foreground ml-7">
              Upload and manage dispatch images & files for this lead.
            </p>
          </div>

          {documents?.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {documents.length} File{documents.length > 1 && "s"}
            </span>
          )}
        </div>

        {/* ---------------------- UPLOAD AREA ---------------------- */}
        {canViewAndWork && (
          <div className="p-6 border-b space-y-4">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept="image/*,.pdf,.doc,.docx"
              multiple
            />

            {selectedFiles.length > 0 && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleUploadDocuments}
                  disabled={uploadDocsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {uploadDocsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ---------------------- FILE LIST ---------------------- */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Uploaded Documents
            </h4>
          </div>

          {loadingDocuments ? (
            <div className="flex justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="animate-spin mr-2 size-4" />
              Loading documents...
            </div>
          ) : documents?.length === 0 ? (
            <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
              <FileText className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No documents uploaded yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Upload dispatch photos and files above.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[420px] pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {[...images, ...Documents]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  )
                  .map((doc: any, index: number) => {
                    const ext = doc.doc_og_name
                      ?.split(".")
                      .pop()
                      ?.toLowerCase();
                    const isImage = [
                      "jpg",
                      "jpeg",
                      "png",
                      "gif",
                      "bmp",
                      "webp",
                      "tiff",
                      "heic",
                      "avif",
                      "svg",
                    ].includes(ext);

                    return isImage ? (
                      <ImageComponent
                        key={`img-${doc.id}`}
                        doc={{
                          id: doc.id,
                          doc_og_name: doc.doc_og_name,
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                        index={index}
                        canDelete={canDelete}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    ) : (
                      <DocumentCard
                        key={`doc-${doc.id}`}
                        doc={{
                          id: doc.id,
                          originalName: doc.doc_og_name,
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                        canDelete={canDelete}
                        onDelete={(id) => setConfirmDelete(id)}
                      />
                    );
                  })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* ---------------------- DELETE CONFIRMATION MODAL ---------------------- */}
        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The document will be permanently
                removed.
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

      {/* Pending Material Details Section */}

      <PendingMaterialDetails
        leadId={leadId}
        accountId={accountId}
        disabled={canViewAndWork}
      />

      {/* ✨ Edit No. of Boxes Modal */}
      <Dialog open={openBoxesModal} onOpenChange={setOpenBoxesModal}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl border shadow-lg bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Update Number of Boxes
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Enter the total number of boxes ready for dispatch.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Number of Boxes
            </Label>
            <Input
              type="number"
              min={1}
              value={noOfBoxesInput}
              onChange={(e) => setNoOfBoxesInput(e.target.value)}
              placeholder="e.g. 12"
              className="border rounded-md"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setOpenBoxesModal(false)}
              disabled={updatingBoxes}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!noOfBoxesInput || Number(noOfBoxesInput) <= 0) {
                  toast.error("Please enter a valid positive number");
                  return;
                }
                const formData = new FormData();
                formData.append("user_id", String(userId || 0));
                formData.append("account_id", String(accountId || 0));
                formData.append("no_of_boxes", String(noOfBoxesInput));

                try {
                  await updateNoBoxes(formData);
                  toast.success("No. of Boxes updated successfully!");
                  queryClient.invalidateQueries({
                    queryKey: ["requiredDateForDispatch"],
                  });
                  setOpenBoxesModal(false);
                } catch (err: any) {
                  toast.error(
                    err?.response?.data?.message ||
                      "Failed to update No. of Boxes"
                  );
                }
              }}
              disabled={updatingBoxes}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default DispatchStageDetails;
