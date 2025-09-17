"use client";

import BaseModal from "@/components/utils/baseModal";
import React, { useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Plus } from "lucide-react";
import AddSiteImageModal from "./add-siteimage-modal";
import EditNotesModal from "./edit-note-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number;
  };
}

const FinalMeasurementEditModal = ({ open, onOpenChange, data }: Props) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const leadId = data?.id;

  const { data: LeadDetails } = useFinalMeasurementLeadById(vendorId!, leadId!);
  const [openImageModal, setOpenImageModal] = useState<boolean>(false);
  const [openNotesModal, setOpenNotesModal] = useState(false);
  const leadData = {
    leadId: leadId ?? 0,
    accountId: data?.accountId ?? 0,
  };

  const noteData = {
    leadId: leadId ?? 0,
    final_desc_note: LeadDetails?.final_desc_note ?? "",
  };

  const measurementDoc = LeadDetails?.measurementDoc;
  const sitePhotos = LeadDetails?.sitePhotos || [];

  // 🔹 Separate Functions
  const handleViewPdf = (url: string) => {
    window.open(url, "_blank"); // open PDF in new tab
  };

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title={`Edit Final Measurement for ${data?.name || "Customer"}`}
        size="lg"
        description="Update the final measurement details, modify notes, or adjust attachments as needed."
      >
        <div className="px-5 py-4 space-y-6">
          {/* Notes */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Critical Discussion Notes</p>
              <Button onClick={() => setOpenNotesModal(true)} className="h-7">
                Edit
              </Button>
            </div>

            <div className="bg-muted border rounded-sm py-1 min-h-20 px-2 text-sm overflow-y-auto">
              {LeadDetails?.final_desc_note || "No notes available"}
            </div>
          </div>

          {/* Measurement Doc */}
          {measurementDoc && (
            <div className="space-y-3">
              <h3 className="text-base font-medium">Measurement Document</h3>
              <div className="border rounded-md p-3 flex items-center justify-between">
                {/* Left: PDF Icon + Info */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-md bg-red-50 text-red-500 border">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {measurementDoc.doc_og_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on{" "}
                      {new Date(measurementDoc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewPdf(measurementDoc.signedUrl)}
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Current Site Photos */}
          {sitePhotos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-medium">Current Site Photos</h3>
              <div className="flex flex-wrap gap-3">
                {sitePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative h-32 w-32 rounded-lg border overflow-hidden bg-gray-50 group"
                  >
                    <img
                      src={photo.signedUrl}
                      alt={photo.doc_og_name}
                      className="h-full w-full object-cover"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs px-2 text-center break-words">
                        {photo.doc_og_name}
                      </span>
                    </div>
                  </div>
                ))}

                <div
                  className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group"
                  onClick={() => setOpenImageModal(true)}
                >
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-blue-600">
                    <Plus size={24} className="mb-1" />
                    <span className="text-xs font-medium">Add Photos</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </BaseModal>

      <AddSiteImageModal
        open={openImageModal}
        onOpenChange={setOpenImageModal}
        data={leadData}
      />

      <EditNotesModal
        open={openNotesModal}
        onOpenChange={setOpenNotesModal}
        data={noteData}
      />
    </>
  );
};

export default FinalMeasurementEditModal;
