"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import { useGetServiceSchedules } from "@/api/installation/useServicingStageLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function formatStatusLabel(status: string) {
  return status.replace(/^\w/, (char) => char.toUpperCase());
}

function getStatusVariant(status: string) {
  if (status === "completed") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function ServicingDetails({
  leadId,
}: {
  leadId: number;
}) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: serviceSchedules,
    isLoading,
    isError,
  } = useGetServiceSchedules(vendorId, leadId);

  const freeServiceCards = useMemo(() => {
    return (serviceSchedules ?? []).filter((item) => item.service_type === "free");
  }, [serviceSchedules]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">Servicing</h2>
        <p className="text-sm text-muted-foreground">
          View and manage scheduled free service visits for this project.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          Loading service schedules...
        </div>
      ) : isError ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
          Failed to load service schedules.
        </div>
      ) : freeServiceCards.length === 0 ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          No servicing schedules are available for this lead yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {freeServiceCards.map((service) => (
            <Card key={service.id} className="border bg-background">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    Service {service.service_no}
                  </CardTitle>
                  <Badge variant={getStatusVariant(service.status)}>
                    {formatStatusLabel(service.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Scheduled service information captured for this lead.
                </p>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Service Type" value={service.service_type.toUpperCase()} />
                <InfoRow label="Scheduled For" value={formatDateTime(service.scheduled_for)} />
                <InfoRow
                  label="Original Scheduled For"
                  value={formatDateTime(service.original_scheduled_for)}
                />
                <InfoRow
                  label="Rescheduled Once"
                  value={service.rescheduled_once ? "Yes" : "No"}
                />
                <InfoRow
                  label="Rescheduled From"
                  value={formatDateTime(service.rescheduled_from)}
                />
                <InfoRow
                  label="Completed At"
                  value={formatDateTime(service.completed_at)}
                />
                <InfoRow
                  label="Completed By"
                  value={service.completedBy?.user_name || "-"}
                />
                <InfoRow
                  label="Completion Remark"
                  value={service.completion_remark || "-"}
                />
                <InfoRow
                  label="Completion Document"
                  value={service.completionDocument?.doc_og_name || "-"}
                />
                <InfoRow
                  label="Rejected At"
                  value={formatDateTime(service.rejected_at)}
                />
                <InfoRow
                  label="Rejected By"
                  value={service.rejectedBy?.user_name || "-"}
                />
                <InfoRow
                  label="Rejection Remark"
                  value={service.rejection_remark || "-"}
                />
                <InfoRow
                  label="Closure Reason"
                  value={service.closure_reason || "-"}
                />
                <InfoRow
                  label="Created By"
                  value={service.createdBy?.user_name || "-"}
                />
                <InfoRow
                  label="Created At"
                  value={formatDateTime(service.created_at)}
                />
                <InfoRow
                  label="Updated By"
                  value={service.updatedBy?.user_name || "-"}
                />
                <InfoRow
                  label="Updated At"
                  value={formatDateTime(service.updated_at)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
