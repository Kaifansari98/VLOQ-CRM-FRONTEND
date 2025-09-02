import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Download, Star } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import InitialSiteMeasuresMent from "../initial-site-measurement-form";

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
    documentUrl: string[];
  };
}

const ViewInitialSiteMeasurmentLead: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  //   const formatDateTime = (dateString?: string) => {
  //     if (!dateString) return "N/A";
  //     const date = new Date(dateString);
  //     return date.toLocaleString("en-IN", {
  //       year: "numeric",
  //       month: "short",
  //       day: "numeric",
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     });
  //   };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        {/* Header */}

        <DialogHeader className="flex items-start justify-end border-b px-6 py-4 border-b">
          <Button>
            <Star size={20} className="mr-2" /> Initial Site Measurement
          </Button>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          {/* <h1>{data?.map }</h1> */}
          <div>
            {data?.documentUrl?.map((doc: string, index: number) => (
              <div key={index}>{doc}</div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInitialSiteMeasurmentLead;
