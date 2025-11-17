"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  ExternalLink,
  FileCheck,
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaInput from "@/components/origin-text-area";

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

type DispatchFormData = z.infer<typeof dispatchSchema>;

export default function DispatchPlanningDetails({
  leadId,
  accountId,
}: DispatchPlanningDetailsProps) {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth.user?.id) || 0;

  // State for Dispatch Planning Info
  const [dispatchInfo, setDispatchInfo] = useState({
    required_date_for_dispatch: "",
    onsite_contact_person_name: "",
    onsite_contact_person_number: "",
    alt_onsite_contact_person_name: "",
    alt_onsite_contact_person_number: "",
    material_lift_availability: null as boolean | null,
    dispatch_planning_remark: "",
  });

  // State for Payment Info
  const [paymentInfo, setPaymentInfo] = useState({
    pending_payment: "",
    pending_payment_details: "",
    payment_proof_file: [] as File[],
  });

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

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    watch,
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

  const watchLiftAvailability = watch("material_lift_availability");

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

  // Calculate minimum date based on current time
  const getMinimumDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const daysToAdd = currentHour >= 15 ? 3 : 2;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + daysToAdd);
    minDate.setHours(0, 0, 0, 0);
    return minDate.toISOString().split("T")[0];
  };

  // Load dispatch info data
  useEffect(() => {
    if (dispatchInfoData) {
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
        material_lift_availability:
          dispatchInfoData.material_lift_availability ?? null,
        dispatch_planning_remark:
          dispatchInfoData.dispatch_planning_remark || "",
      };

      // ✅ 1. Update local state (optional, for reference)
      setDispatchInfo(formValues);

      // ✅ 2. Also populate react-hook-form fields
      Object.entries(formValues).forEach(([key, value]) => {
        setValue(key as keyof DispatchFormData, value as any, {
          shouldValidate: false,
        });
      });

      setInfoSaved(true);
    }
  }, [dispatchInfoData, setValue]);

  // Load payment info data
  useEffect(() => {
    if (paymentData) {
      setPaymentInfo({
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
  }, [paymentData]);

  // Handle Save Dispatch Planning Info
  const handleSaveInfo = handleSubmit(async (values) => {
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

  // Validate payment fields
  const validatePaymentFields = () => {
    const hasAmount = paymentInfo.pending_payment.trim() !== "";
    const hasDetails = paymentInfo.pending_payment_details.trim() !== "";
    const hasFile =
      paymentInfo.payment_proof_file.length > 0 || existingPaymentDoc !== null;

    // If any field is filled, all fields must be filled
    if (hasAmount || hasDetails || hasFile) {
      if (!hasAmount) {
        toast.error("Pending payment amount is required");
        return false;
      }
      if (!hasDetails) {
        toast.error("Pending payment details are required");
        return false;
      }
      if (!hasFile) {
        toast.error("Payment proof file is required");
        return false;
      }
    }

    return true;
  };

  // Handle Save Payment Info (after confirmation)
  const handleSavePayment = async () => {
    try {
      if (!infoSaved) {
        toast.error("Please save dispatch planning info first");
        return;
      }

      if (!validatePaymentFields()) {
        return;
      }

      // 🚫 Restrict entering amount > project pending amount
      const pendingAmt = Number(paymentInfo.pending_payment);
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
      formData.append("pending_payment", paymentInfo.pending_payment || "0");
      formData.append(
        "pending_payment_details",
        paymentInfo.pending_payment_details
      );
      formData.append("account_id", accountId.toString());
      formData.append("created_by", userId.toString());

      if (paymentInfo.payment_proof_file.length > 0) {
        formData.append(
          "payment_proof_file",
          paymentInfo.payment_proof_file[0]
        );
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
  };

  // Handle payment save button click (show confirmation)
  const handlePaymentSaveClick = () => {
    if (!infoSaved) {
      toast.error("Please save dispatch planning info first");
      return;
    }

    if (!validatePaymentFields()) {
      return;
    }

    setShowConfirmDialog(true);
  };

  if (loadingDispatchInfo && loadingPaymentInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Dispatch Planning Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle>Dispatch Planning Information</CardTitle>
            </div>
            {infoSaved && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Onsite Contact Person Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Onsite Contact Person Name{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter contact person name"
                {...register("onsite_contact_person_name")}
              />
              {errors.onsite_contact_person_name && (
                <p className="text-xs text-red-500">
                  {errors.onsite_contact_person_name.message}
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
                value={getValues("onsite_contact_person_number")}
                onChange={(value) =>
                  setValue("onsite_contact_person_number", value || "")
                }
              />
              {errors.onsite_contact_person_number && (
                <p className="text-xs text-red-500">
                  {errors.onsite_contact_person_number.message}
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
                {...register("alt_onsite_contact_person_name")}
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
                value={getValues("alt_onsite_contact_person_number")}
                onChange={(value) =>
                  setValue("alt_onsite_contact_person_number", value || "")
                }
              />
            </div>

            {/* Required OnSite Delivery Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Required OnSite Delivery Date{" "}
                <span className="text-red-500">*</span>
              </Label>
              <CustomeDatePicker
                value={getValues("required_date_for_dispatch")}
                onChange={(value) =>
                  setValue("required_date_for_dispatch", value || "")
                }
                restriction="futureAfterTwoDays"
              />
              {errors.required_date_for_dispatch && (
                <p className="text-xs text-red-500">
                  {errors.required_date_for_dispatch.message}
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

              <div className="flex gap-3">
                {[
                  { label: "Available", value: true },
                  { label: "Not Available", value: false },
                ].map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    variant={
                      watchLiftAvailability === option.value
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setValue("material_lift_availability", option.value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {errors.material_lift_availability && (
                <p className="text-xs text-red-500">
                  {errors.material_lift_availability.message}
                </p>
              )}
            </div>

            {/* Hint text when no selection */}
            {dispatchInfo.material_lift_availability === null && (
              <p className="text-xs text-muted-foreground mt-1">
                Please select whether a material lift is available at the site.
              </p>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Remarks
            </Label>
            <TextAreaInput
              placeholder="Enter any additional remarks..."
              value={watch("dispatch_planning_remark") || ""}
              onChange={(value) =>
                setValue("dispatch_planning_remark", value || "")
              }
              maxLength={1000}
            />
          </div>

          <Button
            onClick={handleSaveInfo}
            disabled={saveInfoMutation.isPending}
            className="w-full md:w-auto"
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
        </CardContent>
      </Card>

      <Separator />

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Payment Information</CardTitle>
            </div>
            {paymentSaved && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!infoSaved && (
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              Please save dispatch planning information first before adding
              payment details.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Pending Payment
                {(paymentInfo.pending_payment_details ||
                  paymentInfo.payment_proof_file.length > 0 ||
                  existingPaymentDoc) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>

              <CurrencyInput
                value={
                  paymentInfo.pending_payment
                    ? Number(paymentInfo.pending_payment)
                    : undefined
                }
                onChange={(val) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    pending_payment: val?.toString() || "",
                  })
                }
                placeholder="Enter amount"
                disabled={!infoSaved || existingPaymentDoc !== null}
              />

              {!paymentData && (
                <p className="text-xs text-muted-foreground">
                  Project Pending Amount:{" "}
                  <strong>₹{project_pending_amount ?? 0}</strong>
                </p>
              )}
            </div>

            {/* Pending Payment Details */}
            <div className="space-y-2">
              <Label>
                Pending Payment Details
                {(paymentInfo.pending_payment ||
                  paymentInfo.payment_proof_file.length > 0 ||
                  existingPaymentDoc) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <Input
                placeholder="Enter payment details"
                value={paymentInfo.pending_payment_details}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    pending_payment_details: e.target.value,
                  })
                }
                disabled={!infoSaved || existingPaymentDoc !== null}
              />
            </div>
          </div>

          {/* Payment Screenshot */}
          <div className="space-y-2">
            <Label>
              Payment Screenshot
              {(paymentInfo.pending_payment ||
                paymentInfo.pending_payment_details) && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>

            {/* Show existing document if uploaded */}
            {existingPaymentDoc ? (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {existingPaymentDoc.doc_og_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Already uploaded
                      </p>
                    </div>
                  </div>
                  {existingPaymentDoc.signed_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={existingPaymentDoc.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        View
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Payment proof has been uploaded. You cannot change it.
                </p>
              </div>
            ) : (
              <FileUploadField
                value={paymentInfo.payment_proof_file}
                onChange={(files) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    payment_proof_file: files,
                  })
                }
                accept=".jpg,.jpeg,.png,.pdf"
                multiple={false}
              />
            )}
          </div>

          {(paymentInfo.pending_payment ||
            paymentInfo.pending_payment_details ||
            paymentInfo.payment_proof_file.length > 0) && (
            <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <strong>Note:</strong> If you fill any payment field, all three
              fields (Amount, Details, and Screenshot) become mandatory.
            </p>
          )}

          <Button
            onClick={handlePaymentSaveClick}
            disabled={
              savePaymentMutation.isPending ||
              !infoSaved ||
              existingPaymentDoc !== null
            }
            className="w-full md:w-auto"
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
        </CardContent>
      </Card>

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
                  <span>₹{paymentInfo.pending_payment || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Details:</span>
                  <span className="text-right max-w-[200px] truncate">
                    {paymentInfo.pending_payment_details || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Proof:</span>
                  <span>
                    {paymentInfo.payment_proof_file.length > 0
                      ? paymentInfo.payment_proof_file[0].name
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
    </div>
  );
}
