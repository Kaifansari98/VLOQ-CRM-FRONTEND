"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { apiClient } from "@/lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";

interface DispatchPlanningDetailsProps {
  leadId: number;
  accountId: number;
}

export default function DispatchPlanningDetails({
  leadId,
  accountId,
}: DispatchPlanningDetailsProps) {
  const queryClient = useQueryClient();
  const vendorId = 1; // Get from your auth context
  const userId = 1; // Get from your auth context

  // State for Dispatch Planning Info
  const [dispatchInfo, setDispatchInfo] = useState({
    required_date_for_dispatch: "",
    onsite_contact_person_name: "",
    onsite_contact_person_number: "",
    material_lift_availability: false,
    dispatch_planning_remark: "",
  });

  // State for Payment Info
  const [paymentInfo, setPaymentInfo] = useState({
    pending_payment: "",
    pending_payment_details: "",
    payment_proof_file: [] as File[],
  });

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [infoSaved, setInfoSaved] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  // Calculate minimum date based on current time
  const getMinimumDate = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // If after 3 PM, add 3 days, otherwise add 2 days
    const daysToAdd = currentHour >= 15 ? 3 : 2;

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + daysToAdd);
    minDate.setHours(0, 0, 0, 0);

    return minDate.toISOString().split("T")[0];
  };

  // Fetch existing data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);

        // Fetch dispatch planning info
        try {
          const { data: infoData } = await apiClient.get(
            `/leads/installation/dispatch-planning/info/vendorId/${vendorId}/leadId/${leadId}`
          );

          if (infoData?.data) {
            setDispatchInfo({
              required_date_for_dispatch: infoData.data
                .required_date_for_dispatch
                ? new Date(infoData.data.required_date_for_dispatch)
                    .toISOString()
                    .split("T")[0]
                : "",
              onsite_contact_person_name:
                infoData.data.onsite_contact_person_name || "",
              onsite_contact_person_number:
                infoData.data.onsite_contact_person_number || "",
              material_lift_availability:
                infoData.data.material_lift_availability || false,
              dispatch_planning_remark:
                infoData.data.dispatch_planning_remark || "",
            });
            setInfoSaved(true);
          }
        } catch (error: any) {
          if (error?.response?.status !== 404) {
            console.error("Error fetching dispatch info:", error);
          }
        }

        // Fetch payment info
        try {
          const { data: paymentData } = await apiClient.get(
            `/leads/installation/dispatch-planning/payment/vendorId/${vendorId}/leadId/${leadId}`
          );

          if (paymentData?.data) {
            setPaymentInfo({
              pending_payment: paymentData.data.amount?.toString() || "",
              pending_payment_details: paymentData.data.payment_text || "",
              payment_proof_file: [],
            });
            setPaymentSaved(true);
          }
        } catch (error: any) {
          if (error?.response?.status !== 404) {
            console.error("Error fetching payment info:", error);
          }
        }
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [leadId, vendorId]);

  // Handle Save Dispatch Planning Info
  const handleSaveInfo = async () => {
    try {
      // Validation
      if (!dispatchInfo.required_date_for_dispatch) {
        toast.error("Required date for dispatch is mandatory");
        return;
      }
      if (!dispatchInfo.onsite_contact_person_name) {
        toast.error("Onsite contact person name is mandatory");
        return;
      }
      if (!dispatchInfo.onsite_contact_person_number) {
        toast.error("Onsite contact person number is mandatory");
        return;
      }

      setLoadingInfo(true);

      const payload = {
        ...dispatchInfo,
        material_lift_availability:
          dispatchInfo.material_lift_availability.toString(),
        created_by: userId,
      };

      await apiClient.post(
        `/leads/installation/dispatch-planning/info/vendorId/${vendorId}/leadId/${leadId}`,
        payload
      );

      toast.success("Dispatch planning info saved successfully");
      setInfoSaved(true);
      queryClient.invalidateQueries({ queryKey: ["dispatchPlanningLeads"] });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to save dispatch planning info"
      );
    } finally {
      setLoadingInfo(false);
    }
  };

  // Handle Save Payment Info
  const handleSavePayment = async () => {
    try {
      if (!infoSaved) {
        toast.error("Please save dispatch planning info first");
        return;
      }

      setLoadingPayment(true);

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

      await apiClient.post(
        `/leads/installation/dispatch-planning/payment/vendorId/${vendorId}/leadId/${leadId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Payment info saved successfully");
      setPaymentSaved(true);
      queryClient.invalidateQueries({ queryKey: ["dispatchPlanningLeads"] });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to save payment info"
      );
    } finally {
      setLoadingPayment(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {/* Required Date for Dispatch */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Required Date For Dispatch
                <span className="text-red-500">*</span>
              </Label>
              <CustomeDatePicker
                value={dispatchInfo.required_date_for_dispatch}
                onChange={(value) =>
                  setDispatchInfo({
                    ...dispatchInfo,
                    required_date_for_dispatch: value || "",
                  })
                }
                restriction="futureOnly"
                minDate={getMinimumDate()}
              />
              <p className="text-xs text-muted-foreground">
                {new Date().getHours() >= 15
                  ? "After 3 PM: minimum 3 days ahead"
                  : "Minimum 2 days ahead"}
              </p>
            </div>

            {/* Onsite Contact Person Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Onsite Contact Person Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter contact person name"
                value={dispatchInfo.onsite_contact_person_name}
                onChange={(e) =>
                  setDispatchInfo({
                    ...dispatchInfo,
                    onsite_contact_person_name: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Client person or client himself
              </p>
            </div>

            {/* Onsite Contact Person Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Onsite Contact Person Number
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="Enter contact number"
                value={dispatchInfo.onsite_contact_person_number}
                onChange={(e) =>
                  setDispatchInfo({
                    ...dispatchInfo,
                    onsite_contact_person_number: e.target.value,
                  })
                }
              />
            </div>

            {/* Material Lift Availability */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Material Lift Availability
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="material-lift"
                  checked={dispatchInfo.material_lift_availability}
                  onCheckedChange={(checked) =>
                    setDispatchInfo({
                      ...dispatchInfo,
                      material_lift_availability: !!checked,
                    })
                  }
                />
                <label
                  htmlFor="material-lift"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Material lift available at site
                </label>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Remarks
            </Label>
            <Textarea
              placeholder="Enter any additional remarks..."
              value={dispatchInfo.dispatch_planning_remark}
              onChange={(e) =>
                setDispatchInfo({
                  ...dispatchInfo,
                  dispatch_planning_remark: e.target.value,
                })
              }
              rows={3}
            />
          </div>

          <Button
            onClick={handleSaveInfo}
            disabled={loadingInfo}
            className="w-full md:w-auto"
          >
            {loadingInfo ? (
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
            {/* Pending Payment */}
            <div className="space-y-2">
              <Label>Pending Payment</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={paymentInfo.pending_payment}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    pending_payment: e.target.value,
                  })
                }
                disabled={!infoSaved}
              />
            </div>

            {/* Pending Payment Details */}
            <div className="space-y-2">
              <Label>Pending Payment Details</Label>
              <Input
                placeholder="Enter payment details"
                value={paymentInfo.pending_payment_details}
                onChange={(e) =>
                  setPaymentInfo({
                    ...paymentInfo,
                    pending_payment_details: e.target.value,
                  })
                }
                disabled={!infoSaved}
              />
            </div>
          </div>

          {/* Payment Screenshot */}
          <div className="space-y-2">
            <Label>Payment Screenshot</Label>
            <FileUploadField
              value={paymentInfo.payment_proof_file}
              onChange={(files) =>
                setPaymentInfo({ ...paymentInfo, payment_proof_file: files })
              }
              accept=".jpg,.jpeg,.png,.pdf"
              multiple={false}
            />
          </div>

          <Button
            onClick={handleSavePayment}
            disabled={loadingPayment || !infoSaved}
            className="w-full md:w-auto"
          >
            {loadingPayment ? (
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
    </div>
  );
}
