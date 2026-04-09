"use client";

import { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useGetServiceSchedules } from "@/api/installation/useServicingStageLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarDays, CircleDot } from "lucide-react";
import ServicingActionModal from "./servicing-action-modal";
import ServicingViewModal from "./servicing-view-modal";
import type { ServiceSchedule } from "@/api/installation/useServicingStageLeads";

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
  if (status === "open") return "Pending";

  return status.replace(/^\w/, (char) => char.toUpperCase());
}

function getStatusVariant(status: string) {
  if (status === "completed") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

function formatUserRole(role?: string) {
  switch ((role || "").toLowerCase()) {
    case "super-admin":
      return "S.Admin";
    case "admin":
      return "Admin";
    case "site-supervisor":
      return "Site Supervisor";
    case "head-site-supervisor":
      return "Head Site Supervisor";
    default:
      return role || "-";
  }
}

function formatServiceOrdinal(serviceNo: number) {
  if (serviceNo === 1) return "1st";
  if (serviceNo === 2) return "2nd";
  if (serviceNo === 3) return "3rd";
  return `${serviceNo}th`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = formatStatusLabel(status);
  const classes =
    status === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
      : status === "rejected"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        : "border-bluq-200 bg-blue-50 text-blue-500 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

export default function ServicingDetails({ leadId }: { leadId: number }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const [openActionModal, setOpenActionModal] = useState(false);
  const [activeServiceLabel, setActiveServiceLabel] = useState<string>("");
  const [activeServiceId, setActiveServiceId] = useState<number | undefined>();
  const [activeServiceRescheduled, setActiveServiceRescheduled] = useState(false);
  const [activeServiceStatus, setActiveServiceStatus] = useState<
    "open" | "completed" | "rejected"
  >("open");
  const [openViewModal, setOpenViewModal] = useState(false);
  const [activeService, setActiveService] = useState<ServiceSchedule | null>(null);
  const {
    data: serviceSchedules,
    isLoading,
    isError,
  } = useGetServiceSchedules(vendorId, leadId);

  const freeServiceCards = useMemo(() => {
    return (serviceSchedules ?? []).filter(
      (item) => item.service_type === "free",
    );
  }, [serviceSchedules]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-background pb-2">
        <h2 className="text-lg font-semibold">Free Servicing</h2>
        <p className="text-xs text-muted-foreground">
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
            (() => {
              const blockingServiceNo = freeServiceCards
                .filter(
                  (item) =>
                    item.service_no < service.service_no && item.status === "open",
                )
                .sort((a, b) => a.service_no - b.service_no)[0]?.service_no;

              const isActionDisabled = Boolean(blockingServiceNo);

              return (
                <Card
                  key={service.id}
                  className="overflow-hidden rounded-2xl border border-border/70 from-background via-background to-muted/20"
                >
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
                          <span>
                            {formatServiceOrdinal(service.service_no)} Service
                          </span>
                          <StatusPill status={service.status} />
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Free service schedule for this project.
                        </p>
                      </div>
                      {service.status === "completed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-md px-4"
                          onClick={() => {
                            setActiveServiceLabel(
                              `${formatServiceOrdinal(service.service_no)} Service`,
                            );
                            setActiveService(service);
                            setOpenViewModal(true);
                          }}
                        >
                          View
                        </Button>
                      ) : isActionDisabled ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>
                              <Button
                                variant="default"
                                size="sm"
                                className="rounded-md px-4"
                                disabled
                              >
                                Action
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {formatServiceOrdinal(blockingServiceNo!)} Service is
                            still pending.
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-md px-4"
                          onClick={() => {
                            setActiveServiceLabel(
                              `${formatServiceOrdinal(service.service_no)} Service`,
                            );
                            setActiveServiceId(service.id);
                            setActiveServiceRescheduled(service.rescheduled_once);
                            setActiveServiceStatus(service.status);
                            setActiveService(service);
                            setOpenActionModal(true);
                          }}
                        >
                          Action
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                        <CircleDot className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Service Type
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {service.service_type.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                        <CalendarDays className="h-4 w-4 text-cyan-600" />
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Scheduled For
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatDateTime(service.scheduled_for)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {/* <div className="mx-6 border-t border-dashed border-gray-300 dark:border-gray-700" />
                  <CardContent className="space-y-2 pt-0">
                    <div className="[&_p:first-child]:text-[10px]">
                      <InfoRow
                        label="Rescheduled"
                        value={service.rescheduled_once ? "Yes" : "No"}
                      />
                    </div>
                    <div className="[&_p:first-child]:text-[10px]">
                      <InfoRow
                        label="Created By"
                        value={
                          service.createdBy
                            ? `${service.createdBy.user_name} - ${formatUserRole(
                                service.createdBy.user_type?.user_type,
                              )}`
                            : "-"
                        }
                      />
                    </div>
                    <div className="[&_p:first-child]:text-[10px]">
                      <InfoRow
                        label="Created At"
                        value={formatDateTime(service.created_at)}
                      />
                    </div>
                  </CardContent> */}
                </Card>
              );
            })()
          ))}
        </div>
      )}

      <ServicingActionModal
        open={openActionModal}
        onOpenChange={setOpenActionModal}
        serviceLabel={activeServiceLabel}
        leadId={leadId}
        serviceId={activeServiceId}
        isRescheduled={activeServiceRescheduled}
        serviceStatus={activeServiceStatus}
      />
      <ServicingViewModal
        open={openViewModal}
        onOpenChange={setOpenViewModal}
        serviceLabel={activeServiceLabel}
        service={activeService}
      />
    </div>
  );
}
