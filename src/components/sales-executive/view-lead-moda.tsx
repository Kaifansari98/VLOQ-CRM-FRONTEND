import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Download, Star } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { ScrollArea } from "../ui/scroll-area";
import InitialSiteMeasuresMent from "./initial-site-measurement-form";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    email: string;
    contact: string;
    billingName: string;
    architechName: string;
    productStructures: string;
    productTypes: string;
    source: string;
    siteType: string;
    createdAt: string;
    priority: string;
    siteAddress: string;
    designerRemark: string;
  };
}




const ViewLeadModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
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
  const vendor = useAppSelector((state) => state.auth.user?.vendor);

  const handleOpenModal = () => {
    setOpenModal(true)
    // onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        {/* Header */}

        <DialogHeader className="flex items-start justify-end border-b px-6 py-4 border-b">
          <Button onClick={handleOpenModal}>
            <Star size={20} className="mr-2" /> Initial Site Measurement
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
          {/* </div> */}
        </ScrollArea>
      </DialogContent>

      <InitialSiteMeasuresMent open={openModal} onOpenChange={setOpenModal} leadId={data?.id} />
    </Dialog>
  );
};

export default ViewLeadModal;
