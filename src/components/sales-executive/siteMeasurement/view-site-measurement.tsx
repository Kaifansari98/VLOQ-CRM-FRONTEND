import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ProcessedSiteMeasurementLead } from "@/types/site-measrument-types";
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

interface ViewInitialSiteMeasurmentLeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: ProcessedSiteMeasurementLead;
}

const ViewInitialSiteMeasurmentLead: React.FC<
  ViewInitialSiteMeasurmentLeadProps
> = ({ open, onOpenChange, data }) => {


  const [openConfirmation, setOpenconfirmation] = useState<boolean>(false);
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        {/* Header */}

        <DialogHeader className="flex items-start justify-end border-b px-6 py-4 border-b">
          <Button onClick={() => setOpenconfirmation(true)}>
            <Star size={20} className="mr-2" /> Move To Designing Stage
          </Button>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-5 py-4">
            {/* Lead Info */}
            <div className="w-full border py-4 px-5 mt-2 rounded-lg">
              <div className="border-b flex justify-between items-center pb-2 mb-4">
                <h1 className="font-semibold">Lead Information</h1>
                <p className="text-sm">{formatDateTime(data?.createdAt)}</p>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium">Lead Name</p>
                  <p>{data?.name}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Lead Email</p>
                  <p>{data?.email}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Lead Contact</p>
                  <p>{data?.contact}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Billing Name</p>
                  <p>{data?.billingName}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Architect Name</p>
                  <p>{data?.architechName}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Product Structures</p>
                  <p>{data?.productStructures}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Product Types</p>
                  <p>{data?.productTypes}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Source</p>
                  <p>{data?.source}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Site Type</p>
                  <p>{data?.siteType}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">Priority</p>
                  <p>{data?.priority}</p>
                </div>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"> */}
              {/* Remarks */}
              <div className="flex flex-col gap-1 mt-4">
                <p className="text-sm font-medium">Design Remarks</p>
                <div className="bg-muted border rounded-sm py-1 px-2 text-sm max-h-200 overflow-y-auto">
                  {data?.designerRemark || "N/A"}
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1 mt-4">
                <p className="text-sm font-medium">Site Address</p>
                <div className="bg-muted border rounded-sm py-1 px-2 text-sm max-h-200 overflow-y-auto">
                  {data?.siteAddress || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>

      <AlertDialog open={openConfirmation} onOpenChange={setOpenconfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account. You can log in again
              anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => console.log("button clicked....")}
            >
              Yes{" "}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ViewInitialSiteMeasurmentLead;
