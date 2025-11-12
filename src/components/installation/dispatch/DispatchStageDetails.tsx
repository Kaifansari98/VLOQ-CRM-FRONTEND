"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  Download,
  Eye,
  Package,
  X,
  FileCheck,
  ExternalLink,
  Pencil,
} from "lucide-react";
import {
  useRequiredDateForDispatch,
  useDispatchDetails,
  useAddDispatchDetails,
  useDispatchDocuments,
  useUploadDispatchDocuments,
  AddDispatchDetailsPayload,
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
import { toast } from "react-toastify";
import { z } from "zod";

const DispatchDetailsSchema = z.object({
  dispatch_date: z.string().nonempty("Dispatch date is required"),
  vehicle_no: z.string().min(2, "Vehicle number is required"),
  driver_name: z.string().optional(),
  driver_number: z.string().optional(),
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
  name,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth.user?.id) || 0;

  // API Hooks
  const { data: requiredDateData, isLoading: loadingRequiredDate } =
    useRequiredDateForDispatch(vendorId, leadId);
  const { data: dispatchDetails, isLoading: loadingDispatchDetails } =
    useDispatchDetails(vendorId, leadId);
  const { data: documents, isLoading: loadingDocuments } = useDispatchDocuments(
    vendorId,
    leadId
  );
  const addDispatchMutation = useAddDispatchDetails();
  const uploadDocsMutation = useUploadDispatchDocuments();

  // Form State
  const [formData, setFormData] = useState<DispatchDetailsForm>({
    dispatch_date: dispatchDetails?.dispatch_date || "",
    driver_name: dispatchDetails?.driver_name || "",
    driver_number: dispatchDetails?.driver_number || "",
    vehicle_no: dispatchDetails?.vehicle_no || "",
    dispatch_remark: dispatchDetails?.dispatch_remark || "",
    updated_by: userId,
  });

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // 🧩 For Edit No. of Boxes Modal
  const [openBoxesModal, setOpenBoxesModal] = useState(false);
  const [noOfBoxesInput, setNoOfBoxesInput] = useState(
    requiredDateData?.no_of_boxes?.toString() || ""
  );
  const queryClient = useQueryClient();
  const { mutateAsync: updateNoBoxes, isPending: updatingBoxes } =
    useUpdateNoOfBoxes(vendorId, leadId);

  // Update form when dispatch details load
  React.useEffect(() => {
    if (dispatchDetails) {
      setFormData({
        dispatch_date: dispatchDetails.dispatch_date
          ? format(new Date(dispatchDetails.dispatch_date), "yyyy-MM-dd")
          : "",
        driver_name: dispatchDetails.driver_name || "",
        driver_number: dispatchDetails.driver_number || "",
        vehicle_no: dispatchDetails.vehicle_no || "",
        dispatch_remark: dispatchDetails.dispatch_remark || "",
        updated_by: userId,
      });
      setDetailsSaved(true);
    }
  }, [dispatchDetails, userId]);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = DispatchDetailsSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    addDispatchMutation.mutate(
      {
        vendorId,
        leadId,
        payload: formData,
      },
      {
        onSuccess: () => {
          setDetailsSaved(true);
        },
      }
    );
  };

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

  if (loadingRequiredDate && loadingDispatchDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Required Date & Boxes Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Required Date for Dispatch
                </p>
                {loadingRequiredDate ? (
                  <div className="h-6 w-32 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-xl font-bold text-foreground">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Boxes</p>
                {loadingRequiredDate ? (
                  <div className="h-6 w-20 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">
                      {requiredDateData?.no_of_boxes || 0}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-accent rounded-full"
                      onClick={() => {
                        setNoOfBoxesInput(
                          requiredDateData?.no_of_boxes?.toString() || ""
                        );
                        setOpenBoxesModal(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Dispatch Details Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle>Dispatch Details</CardTitle>
            </div>
            {detailsSaved && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingDispatchDetails ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dispatch Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Dispatch Date
                    <span className="text-red-500">*</span>
                  </Label>
                  <CustomeDatePicker
                    value={formData.dispatch_date}
                    onChange={(value) =>
                      setFormData({ ...formData, dispatch_date: value || "" })
                    }
                    restriction="futureOnly"
                  />
                </div>

                {/* Vehicle Number */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Vehicle Number
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="vehicle_no"
                    value={formData.vehicle_no}
                    onChange={handleInputChange}
                    placeholder="e.g., MH-01-AB-1234"
                  />
                </div>

                {/* Driver Name */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Driver Name
                  </Label>
                  <Input
                    type="text"
                    name="driver_name"
                    value={formData.driver_name}
                    onChange={handleInputChange}
                    placeholder="Enter driver name"
                  />
                </div>

                {/* Driver Number */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Driver Contact Number
                  </Label>
                  <PhoneInput
                    placeholder="Enter phone number"
                    defaultCountry="IN"
                    value={formData.driver_number}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        driver_number: value || "",
                      })
                    }
                  />
                </div>
              </div>

              {/* Dispatch Remark */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Dispatch Remark
                </Label>
                <Textarea
                  name="dispatch_remark"
                  value={formData.dispatch_remark}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes or remarks..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
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
            </form>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Photos & Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Dispatch Photos & Documents
            <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Files</Label>
              <FileUploadField
                value={selectedFiles}
                onChange={setSelectedFiles}
                accept="image/*,.pdf,.doc,.docx"
                multiple={true}
              />
              <p className="text-xs text-muted-foreground">
                Upload images, PDFs, or documents (Maximum 10 files)
              </p>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    Selected Files ({selectedFiles.length})
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="h-8 text-destructive hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-background rounded">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="w-full flex justify-end">

                <Button
                  onClick={handleUploadDocuments}
                  disabled={uploadDocsMutation.isPending}
                  className="flex justify-end"
                >
                  {uploadDocsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </>
                  )}
                </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Uploaded Documents */}
          <div className="space-y-3">
            <Label>Uploaded Documents</Label>
            {loadingDocuments ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.doc_og_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded on{" "}
                          {format(new Date(doc.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={doc.signed_url}
                          download={doc.doc_og_name}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-muted rounded-full">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No documents uploaded yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload dispatch photos and documents above
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
    </div>
  );
};

export default DispatchStageDetails;
