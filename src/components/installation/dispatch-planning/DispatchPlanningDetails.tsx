"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import {
  Calendar,
  User,
  Phone,
  Truck,
  FileText,
  CreditCard,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDispatchPlanningInfo,
  useDispatchPlanningPayment,
  useSaveDispatchPlanningInfo,
  useSaveDispatchPlanningPayment,
  usePendingProjectAmount,
} from "@/api/installation/useDispatchPlanning";
import { useAppSelector } from "@/redux/store";
import CurrencyInput from "@/components/custom/CurrencyInput";
import { PhoneInput } from "@/components/ui/phone-input";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaInput from "@/components/origin-text-area";
import { useDeleteDocument } from "@/api/leads";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkDispatchPlanningStage } from "@/components/utils/privileges";
import { Checkbox } from "@/components/ui/checkbox";

interface DispatchPlanningDetailsProps {
  leadId: number;
  accountId: number;
}

const dispatchSchema = z.object({
  required_date_for_dispatch: z
    .string()
    .nonempty("Required OnSite Delivery Date is mandatory"),
  onsite_contact_person_name: z
    .string()
    .nonempty("Onsite contact person name is mandatory"),
  onsite_contact_person_number: z
    .string()
    .min(10, "Enter a valid contact number"),
  material_lift_availability: z
    .boolean()
    .nullable()
    .refine((val) => val !== null, {
      message: "Please select material lift availability",
    }),
  alt_onsite_contact_person_name: z.string().optional(),
  alt_onsite_contact_person_number: z.string().optional(),
  dispatch_planning_remark: z.string().optional(),
});

const paymentSchema = z
  .object({
    pending_payment: z.string().optional(),
    pending_payment_details: z.string().optional(),
    payment_proof_file: z.array(z.instanceof(File)).optional(),
  })
  .superRefine((data, ctx) => {
    const hasAmount =
      data.pending_payment && data.pending_payment.trim() !== "";
    const hasDetails =
      data.pending_payment_details &&
      data.pending_payment_details.trim() !== "";
    const hasFile =
      data.payment_proof_file && data.payment_proof_file.length > 0;

    // If any field is filled, all fields must be filled
    if (hasAmount || hasDetails || hasFile) {
      if (!hasAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pending payment amount is required",
          path: ["pending_payment"],
        });
      }
      if (!hasDetails) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pending payment details are required",
          path: ["pending_payment_details"],
        });
      }
      if (!hasFile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Payment proof file is required",
          path: ["payment_proof_file"],
        });
      }
    }
  });

type DispatchFormData = z.infer<typeof dispatchSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function DispatchPlanningDetails({
  leadId,
  accountId,
}: DispatchPlanningDetailsProps) {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth.user?.id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [infoSaved, setInfoSaved] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [existingPaymentDoc, setExistingPaymentDoc] = useState<{
    id: number;
    doc_og_name: string;
    signed_url?: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Queries
  const {
    data: dispatchInfoData,
    isLoading: loadingDispatchInfo,
    refetch: refetchDispatchInfo,
  } = useDispatchPlanningInfo(vendorId, leadId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  // Dispatch Form
  const {
    register: registerDispatch,
    handleSubmit: handleSubmitDispatch,
    setValue: setValueDispatch,
    getValues: getValuesDispatch,
    formState: { errors: errorsDispatch },
    watch: watchDispatch,
  } = useForm<DispatchFormData>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      required_date_for_dispatch: "",
      onsite_contact_person_name: "",
      onsite_contact_person_number: "",
      alt_onsite_contact_person_name: "",
      alt_onsite_contact_person_number: "",
      material_lift_availability: null,
      dispatch_planning_remark: "",
    },
  });

  const watchLiftAvailability = watchDispatch("material_lift_availability");

  // Payment Form
  const {
    control: controlPayment,
    handleSubmit: handleSubmitPayment,
    formState: { errors: errorsPayment },
    watch: watchPayment,
    reset: resetPayment,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      pending_payment: "",
      pending_payment_details: "",
      payment_proof_file: [],
    },
  });

  const {
    data: paymentData,
    isLoading: loadingPaymentInfo,
    refetch: refetchPaymentInfo,
  } = useDispatchPlanningPayment(vendorId, leadId);

  const { data: pendingAmountData } = usePendingProjectAmount(vendorId, leadId);
  const project_pending_amount = pendingAmountData?.pending_amount ?? 0;

  // Mutations
  const saveInfoMutation = useSaveDispatchPlanningInfo();
  const savePaymentMutation = useSaveDispatchPlanningPayment();

  // Load dispatch info data
  useEffect(() => {
    if (dispatchInfoData) {
      const apiValue = dispatchInfoData.material_lift_availability;

      const normalizedLiftAvailability =
        apiValue === true ? true : apiValue === false ? null : null;

      const formValues = {
        required_date_for_dispatch: dispatchInfoData.required_date_for_dispatch
          ? new Date(dispatchInfoData.required_date_for_dispatch)
              .toISOString()
              .split("T")[0]
          : "",
        onsite_contact_person_name:
          dispatchInfoData.onsite_contact_person_name || "",
        onsite_contact_person_number:
          dispatchInfoData.onsite_contact_person_number || "",
        alt_onsite_contact_person_name:
          dispatchInfoData.alt_onsite_contact_person_name || "",
        alt_onsite_contact_person_number:
          dispatchInfoData.alt_onsite_contact_person_number || "",
        material_lift_availability: normalizedLiftAvailability,
        dispatch_planning_remark:
          dispatchInfoData.dispatch_planning_remark || "",
      };

      // Update React Hook Form
      Object.entries(formValues).forEach(([key, value]) => {
        setValueDispatch(key as keyof DispatchFormData, value as any, {
          shouldValidate: false,
        });
      });

      setInfoSaved(true);
    }
  }, [dispatchInfoData, setValueDispatch]);

  // Load payment info data
  useEffect(() => {
    if (paymentData) {
      resetPayment({
        pending_payment: paymentData.amount?.toString() || "",
        pending_payment_details: paymentData.payment_text || "",
        payment_proof_file: [],
      });
      setPaymentSaved(true);

      // Set existing payment document
      if (paymentData.document) {
        setExistingPaymentDoc({
          id: paymentData.document.id,
          doc_og_name: paymentData.document.doc_og_name,
          signed_url: paymentData.document.signed_url,
        });
      }
    }
  }, [paymentData, resetPayment]);

  // Handle Save Dispatch Planning Info
  const handleSaveInfo = handleSubmitDispatch(async (values) => {
    try {
      const payload = {
        ...values,
        material_lift_availability:
          values.material_lift_availability!.toString(),
        created_by: userId,
      };

      await saveInfoMutation.mutateAsync({
        vendorId,
        leadId,
        payload,
      });

      toast.success("Dispatch planning info saved successfully");
      queryClient.invalidateQueries({ queryKey: ["dispatchReadinessStatus"] });
      setInfoSaved(true);
      queryClient.invalidateQueries({ queryKey: ["dispatchPlanningLeads"] });
      refetchDispatchInfo();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to save dispatch planning info"
      );
    }
  });

  // Handle Save Payment Info (after confirmation)
  const handleSavePayment = handleSubmitPayment(async (data) => {
    try {
      if (!infoSaved) {
        toast.error("Please save dispatch planning info first");
        return;
      }

      // 🚫 Restrict entering amount > project pending amount
      const pendingAmt = Number(data.pending_payment);
      if (
        project_pending_amount !== undefined &&
        pendingAmt > project_pending_amount
      ) {
        toast.error(
          `Entered amount ₹${pendingAmt} cannot exceed pending project amount ₹${project_pending_amount}`
        );
        return;
      }

      const formData = new FormData();
      formData.append("pending_payment", data.pending_payment || "0");
      formData.append(
        "pending_payment_details",
        data.pending_payment_details || ""
      );
      formData.append("account_id", accountId.toString());
      formData.append("created_by", userId.toString());

      if (data.payment_proof_file && data.payment_proof_file.length > 0) {
        formData.append("payment_proof_file", data.payment_proof_file[0]);
      }

      await savePaymentMutation.mutateAsync({
        vendorId,
        leadId,
        formData,
      });

      toast.success("Payment info saved successfully");
      setPaymentSaved(true);
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ["dispatchPlanningLeads"] });
      refetchPaymentInfo();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to save payment info"
      );
      setShowConfirmDialog(false);
    }
  });

  // Handle payment save button click (show confirmation)
  const handlePaymentSaveClick = handleSubmitPayment(() => {
    if (!infoSaved) {
      toast.error("Please save dispatch planning info first");
      return;
    }
    setShowConfirmDialog(true);
  });

  if (loadingDispatchInfo && loadingPaymentInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const imageExtensions = ["jpg", "jpeg", "png", "webp"];
  const documentExtensions = ["pdf", "zip"];

  // Always initialize empty arrays
  let images: any[] = [];
  let Documents: any[] = [];

  // Get the file object safely
  const file = paymentData?.document;

  if (file && file.doc_og_name) {
    const ext = file.doc_og_name.split(".").pop()?.toLowerCase();

    if (imageExtensions.includes(ext || "")) {
      images.push(file);
    } else if (documentExtensions.includes(ext || "")) {
      Documents.push(file);
    }
  }

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

  const canDelete = userType === "admin" || userType === "super-admin";

  const canViewAndWork = canViewAndWorkDispatchPlanningStage(
    userType,
    leadStatus
  );

  const pendingPayment = watchPayment("pending_payment");
  const pendingPaymentDetails = watchPayment("pending_payment_details");
  const paymentProofFile = watchPayment("payment_proof_file");

  return (
    <div className="space-y-4 pb-6">
      {/* Dispatch Planning Information */}
      <div className="border h-full rounded-lg overflow-y-auto bg-background">
        {/* ---------- HEADER ---------- */}
        <div className="flex flex-col sm:flex-row  items-start space-y-2.5 sm:items-center sm:justify-between px-6 py-4 border-b bg-muted/30 ">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="text-md sm:text-lg font-semibold tracking-tight">
                Dispatch Planning Information
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-7 line-clamp-1">
              Provide onsite contact details & dispatch requirements.
            </p>
          </div>
        </div>

        {/* ---------- BODY ---------- */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Onsite Contact Person Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Onsite Contact Person Name{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter contact person name"
                {...registerDispatch("onsite_contact_person_name")}
                disabled={!canViewAndWork}
              />
              {errorsDispatch.onsite_contact_person_name && (
                <p className="text-xs text-red-500">
                  {errorsDispatch.onsite_contact_person_name.message}
                </p>
              )}
            </div>

            {/* Onsite Contact Person Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Onsite Contact Person Number{" "}
                <span className="text-red-500">*</span>
              </Label>
              <PhoneInput
                placeholder="Enter contact number"
                defaultCountry="IN"
                disabled={!canViewAndWork}
                value={getValuesDispatch("onsite_contact_person_number")}
                onChange={(value) =>
                  setValueDispatch("onsite_contact_person_number", value || "")
                }
              />
              {errorsDispatch.onsite_contact_person_number && (
                <p className="text-xs text-red-500">
                  {errorsDispatch.onsite_contact_person_number.message}
                </p>
              )}
            </div>

            {/* Alternate Onsite Contact Person Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Alternate Contact Person Name
              </Label>
              <Input
                placeholder="Enter alternate contact person name"
                {...registerDispatch("alt_onsite_contact_person_name")}
                disabled={!canViewAndWork}
              />
            </div>

            {/* Alternate Onsite Contact Person Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Alternate Contact Person Number
              </Label>
              <PhoneInput
                placeholder="Enter alternate contact number"
                defaultCountry="IN"
                disabled={!canViewAndWork}
                value={getValuesDispatch("alt_onsite_contact_person_number")}
                onChange={(value) =>
                  setValueDispatch(
                    "alt_onsite_contact_person_number",
                    value || ""
                  )
                }
              />
            </div>

            {/* Required Delivery Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Required OnSite Delivery Date{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div
                className={
                  !canViewAndWork
                    ? "opacity-50 pointer-events-none w-full"
                    : "w-full"
                }
              >
                <CustomeDatePicker
                  value={getValuesDispatch("required_date_for_dispatch")}
                  onChange={
                    !canViewAndWork
                      ? () => {}
                      : (value) =>
                          setValueDispatch(
                            "required_date_for_dispatch",
                            value || ""
                          )
                  }
                  restriction="futureAfterTwoDays"
                />
              </div>

              {errorsDispatch.required_date_for_dispatch && (
                <p className="text-xs text-red-500">
                  {errorsDispatch.required_date_for_dispatch.message}
                </p>
              )}
            </div>

            {/* Material Lift Availability */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <Truck className="h-4 w-4" />
                Material Lift Availability{" "}
                <span className="text-red-500">*</span>
              </Label>

              <div className="flex gap-6 items-center">
                {/* Available */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    defaultChecked={false}
                    disabled={!canViewAndWork}
                    checked={watchLiftAvailability === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setValueDispatch("material_lift_availability", true, {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  <label className="text-sm">Available</label>
                </div>

                {/* Not Available */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    defaultChecked={false}
                    disabled={!canViewAndWork}
                    checked={watchLiftAvailability === false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setValueDispatch("material_lift_availability", false, {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  <label className="text-sm">Not Available</label>
                </div>
              </div>

              {errorsDispatch.material_lift_availability && (
                <p className="text-xs text-red-500">
                  {errorsDispatch.material_lift_availability.message}
                </p>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Remarks
            </Label>
            <TextAreaInput
              placeholder="Enter any additional remarks..."
              value={watchDispatch("dispatch_planning_remark") || ""}
              onChange={(value) =>
                setValueDispatch("dispatch_planning_remark", value || "")
              }
              maxLength={1000}
              disabled={!canViewAndWork}
            />
          </div>

          <div className="flex justify-end">
            {canViewAndWork && (
              <Button
                onClick={handleSaveInfo}
                disabled={saveInfoMutation.isPending}
                size={"sm"}
              >
                {saveInfoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Dispatch Info</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="border rounded-lg bg-background overflow-y-auto">
        {/* ---------- HEADER ---------- */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Payment Information
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Add pending payment details & upload proof.
            </p>
          </div>

          {paymentSaved && (
            <span className="text-xs flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Saved
            </span>
          )}
        </div>

        {/* ---------- BODY ---------- */}
        <div className="p-6 space-y-7">
          {!infoSaved && (
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              Please save dispatch planning information first before adding
              payment details.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
            {/* Pending Payment */}
            <div className="space-y-2">
              <Label>
                Pending Payment
                {(pendingPaymentDetails ||
                  (paymentProofFile && paymentProofFile.length > 0) ||
                  existingPaymentDoc) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>

              <Controller
                name="pending_payment"
                control={controlPayment}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ? Number(field.value) : undefined}
                    onChange={(val) => field.onChange(val?.toString() || "")}
                    placeholder="Enter amount"
                    disabled={
                      !canViewAndWork ||
                      !infoSaved ||
                      existingPaymentDoc !== null
                    }
                  />
                )}
              />

              {errorsPayment.pending_payment && (
                <p className="text-xs text-red-500">
                  {errorsPayment.pending_payment.message}
                </p>
              )}

              <p className="text-sm font-medium mt-2">
                Project Pending Amount: {project_pending_amount}
              </p>
            </div>

            {/* Pending Payment Details */}
            <div className="space-y-2">
              <Label>
                Pending Payment Details
                {(pendingPayment ||
                  (paymentProofFile && paymentProofFile.length > 0) ||
                  existingPaymentDoc) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>

              <Controller
                name="pending_payment_details"
                control={controlPayment}
                render={({ field }) => (
                  <Input
                    placeholder="Enter payment details"
                    value={field.value || ""}
                    onChange={field.onChange}
                    disabled={
                      !canViewAndWork ||
                      !infoSaved ||
                      existingPaymentDoc !== null
                    }
                  />
                )}
              />

              {errorsPayment.pending_payment_details && (
                <p className="text-xs text-red-500">
                  {errorsPayment.pending_payment_details.message}
                </p>
              )}
            </div>
          </div>

          {/* Payment Screenshot */}
          <div className="space-y-2">
            {(existingPaymentDoc || canViewAndWork) && (
              <Label>
                Payment Screenshot
                {(pendingPayment || pendingPaymentDetails) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
            )}

            {existingPaymentDoc ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((doc: any, index: number) => (
                  <ImageComponent
                    key={doc?.id}
                    doc={{
                      id: doc?.id,
                      doc_og_name: doc.doc_og_name,
                      signedUrl: doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    index={index}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ))}

                {Documents.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.doc_og_name,
                      signedUrl: doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(id)}
                  />
                ))}
              </div>
            ) : (
              canViewAndWork && (
                <Controller
                  name="payment_proof_file"
                  control={controlPayment}
                  render={({ field }) => (
                    <FileUploadField
                      value={field.value || []}
                      onChange={field.onChange}
                      disabled={!canViewAndWork}
                      accept=".jpg,.jpeg,.png,.pdf"
                      multiple={false}
                    />
                  )}
                />
              )
            )}

            {errorsPayment.payment_proof_file && (
              <p className="text-xs text-red-500">
                {errorsPayment.payment_proof_file.message}
              </p>
            )}
          </div>

          {/* Note */}
          {canViewAndWork &&
            !existingPaymentDoc &&
            (pendingPayment ||
              pendingPaymentDetails ||
              (paymentProofFile && paymentProofFile.length > 0)) && (
              <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <strong>Note:</strong> If you fill any payment field, all three
                fields (Amount, Details, and Screenshot) become mandatory.
              </p>
            )}

          {/* Save Button */}

          <div className="flex justify-end">
            {canViewAndWork && !existingPaymentDoc && (
              <Button
                onClick={handlePaymentSaveClick}
                disabled={
                  savePaymentMutation.isPending ||
                  !infoSaved ||
                  existingPaymentDoc !== null
                }
              >
                {savePaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Payment Info</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Information</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please review the payment information before saving:</p>
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span>₹{pendingPayment || "0"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Details:</span>
                  <span className="text-right max-w-[200px] truncate">
                    {pendingPaymentDetails || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Proof:</span>
                  <span>
                    {paymentProofFile && paymentProofFile.length > 0
                      ? paymentProofFile[0].name
                      : "Existing file"}
                  </span>
                </div>
              </div>
              <p className="text-red-500 text-xs pt-2">
                Warning: Once saved, you cannot change the payment proof file.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSavePayment}>
              Confirm & Save
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
    </div>
  );
}
