"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import type { ServiceSchedule } from "@/api/installation/useServicingStageLeads";
import { Button } from "@/components/ui/button";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

interface ServicingViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceLabel?: string;
  service?: ServiceSchedule | null;
}

const ServicingViewModal: React.FC<ServicingViewModalProps> = ({
  open,
  onOpenChange,
  serviceLabel,
  service,
}) => {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`${serviceLabel || "Service"} Details`}
      description="View the completion documents and remark saved for this service."
      size="lg"
    >
      <div className="space-y-6 p-6">
        <div className="rounded-xl border bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Marked At
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatDateTime(service?.completed_at)}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Uploaded Documents</p>
            <p className="text-xs text-muted-foreground">
              View all files uploaded while completing this service.
            </p>
          </div>

          {service?.completionDocuments?.length ? (
            <div className="space-y-2">
              {service.completionDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {doc.doc_og_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {formatDateTime(doc.created_at)}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border px-4 py-3 text-sm text-muted-foreground">
              No completion documents available.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Remark</p>
            <p className="text-xs text-muted-foreground">
              Completion remark, if it was provided.
            </p>
          </div>
          <div className="rounded-xl border px-4 py-3 text-sm">
            {service?.completion_remark || "No remark added."}
          </div>
        </div>

        <div className="flex items-center justify-end border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ServicingViewModal;
