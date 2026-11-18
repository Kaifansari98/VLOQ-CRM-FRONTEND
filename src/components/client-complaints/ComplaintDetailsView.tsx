"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useVendorBrandStyle } from "@/hooks/use-vendor-theme-color";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileText,
  History,
  House,
  Images,
  Layers,
  LockKeyhole,
  MessageSquare,
  Package,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  ComplaintDetails,
  ComplaintDecision,
} from "@/types/complaint-details";
import { COMPONENT_LABELS, PRIORITY_META, STATUS_META } from "./complaint-meta";
import {
  complaintDate as date,
  complaintMoney as money,
  displayText as text,
} from "./complaint-details-format";
import { ComplaintEvidence } from "./ComplaintEvidence";
import { ComplaintActivityLog } from "./ComplaintActivityLog";
import { ComplaintActionsPanel } from "./ComplaintActionsPanel";

const TABS = [
  { id: "overview", label: "Overview", icon: House },
  { id: "client", label: "Client Details", icon: UserRound },
  { id: "complaint", label: "Complaint Details", icon: ClipboardList },
  { id: "handover", label: "Handover Details", icon: FileCheck2 },
  { id: "visits", label: "Visit History", icon: CalendarDays },
  { id: "inspections", label: "Inspection Reports", icon: FileText },
  { id: "quotations", label: "Quotations", icon: Layers },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "procurement", label: "Material / Procurement", icon: Package },
  { id: "resolution", label: "Resolution", icon: CheckCircle2 },
  { id: "communications", label: "Communication History", icon: MessageSquare },
  { id: "activity", label: "Activity Log", icon: History },
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}
function Info({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm font-medium">
            {value === null || value === undefined || value === "" ? (
              <span className="font-normal text-muted-foreground">
                Not recorded
              </span>
            ) : typeof value === "boolean" ? (
              value ? (
                "Yes"
              ) : (
                "No"
              )
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Note({ title, children }: { title: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <h3 className="text-xs text-muted-foreground">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}
function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/10 px-6 py-12 text-center">
      <ClipboardList className="mx-auto mb-3 size-7 text-muted-foreground/60" />
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
function Restricted() {
  return (
    <div className="rounded-2xl border p-10 text-center">
      <LockKeyhole className="mx-auto mb-3 size-6 text-muted-foreground" />
      <h2 className="font-medium">Financial information</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Available to Head Site Supervisors and Super Admins.
      </p>
    </div>
  );
}
function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
function Decisions({ rows }: { rows: ComplaintDecision[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">{text(row.decision_type)}</h3>
            <Tag>{text(row.outcome)}</Tag>
          </div>
          <div className="mt-3 space-y-3">
            <Note title="Remarks">{row.remarks}</Note>
            <Note title="Remote instructions">{row.remote_instructions}</Note>
            <Note title="Client response">{row.client_response}</Note>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {row.performedBy?.user_name || text(row.actor_type)} ·{" "}
            {date(row.decided_at, true)}
            {row.acting_on_behalf_of_client ? " · On behalf of client" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ComplaintDetailsView({
  complaint: c,
  vendorId,
}: {
  complaint: ComplaintDetails;
  vendorId: number;
}) {
  // Active tab follows the vendor's sidebar theme, falling back to system zinc.
  const activeTabStyle = useVendorBrandStyle();
  const [tab, setTab] = useState("overview");
  const [cycle, setCycle] = useState("all");
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const cycleId = cycle === "all" ? undefined : Number(cycle);
  const inCycle = <T extends { cycle_id: number | null }>(rows: T[]) =>
    rows.filter((row) => !cycleId || row.cycle_id === cycleId);
  const attachments = inCycle(c.attachments),
    visits = inCycle(c.visits),
    inspections = inCycle(c.inspections);
  const quotations = inCycle(c.quotations),
    charges = inCycle(c.charges),
    payments = inCycle(c.payments);
  const executions = inCycle(c.executions),
    decisions = inCycle(c.decisions),
    closures = inCycle(c.closures);
  const materials = c.materials.filter(
    (row) =>
      !cycleId ||
      executions.some(
        (execution) => execution.id === row.complaint_execution_id,
      ),
  );
  const communications = c.communications.filter(
    (row) => !cycleId || row.cycle_id === null || row.cycle_id === cycleId,
  );
  const assignments = inCycle(c.assignments);
  const selectedCycle = c.cycles.find((row) => row.id === cycleId);
  const cycleLabel = (id: number) =>
    `Cycle ${c.cycles.find((row) => row.id === id)?.cycle_number ?? "—"}`;
  const status = STATUS_META[c.status];
  const cycleTag = (id: number) => <Tag>{cycleLabel(id)}</Tag>;
  const stageEvidence = (
    key: "visit_id" | "inspection_report_id" | "execution_id",
    id: number,
  ) => attachments.filter((file) => file[key] === id);
  const financial = c.permissions.can_view_financial;
  const count: Record<string, number> = {
    visits: visits.length,
    inspections: inspections.length,
    quotations: quotations.length,
    payments: payments.length,
    procurement: materials.length,
    communications: communications.length,
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 rounded-xl border bg-card px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="break-words text-lg font-semibold tracking-tight">
              {c.complaint_code}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                status.className,
              )}
            >
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
            {c.priority && (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  PRIORITY_META[c.priority].className,
                )}
              >
                {PRIORITY_META[c.priority].label} priority
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <span className="text-muted-foreground">
            {c.client_name} <span className="mx-1">/</span>
            {c.product_type || "Product not recorded"}
          </span>
          <span className="hidden h-3 w-px bg-border sm:block" />
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">SS</span>
            <span className="font-medium">{c.assignedSS?.user_name || "Unassigned"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <UserRound className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">HSS</span>
            <span className="font-medium">{c.assignedHSS?.user_name || "Unassigned"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Wrench className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Component</span>
            <span className="font-medium">{COMPONENT_LABELS[c.component]}</span>
          </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs text-muted-foreground">
            Registered {date(c.created_at)} · {c.cycles.length}{" "}
            {c.cycles.length === 1 ? "cycle" : "cycles"} · {text(c.registration_channel)}
          </p>
          <div className="flex items-center gap-2">
            <label
              htmlFor="complaint-cycle"
              className="text-xs text-muted-foreground"
            >
              Show
            </label>
            <Select value={cycle} onValueChange={setCycle}>
              <SelectTrigger
                id="complaint-cycle"
                size="sm"
                className="w-40 text-xs"
                aria-label="Complaint cycle"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cycles</SelectItem>
                {c.cycles.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    Cycle {row.cycle_number}
                    {row.id === c.current_cycle_id ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <ComplaintActionsPanel complaint={c} vendorId={vendorId} />
      {c.possible_duplicate && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Possible duplicate flagged</p>
            <p className="mt-1 text-muted-foreground">
              {c.duplicate_reviewed_at
                ? `Reviewed ${date(c.duplicate_reviewed_at, true)}${c.duplicate_review_remarks ? ` · ${c.duplicate_review_remarks}` : ""}`
                : "Awaiting HO review. The original complaint and its history remain available."}
            </p>
          </div>
        </div>
      )}
      {selectedCycle?.reopened_reason && (
        <div className="rounded-xl border bg-muted/20 p-4 text-sm">
          <span className="font-medium">Reason for reopening: </span>
          {selectedCycle.reopened_reason}
        </div>
      )}
      <Tabs
        value={tab}
        onValueChange={setTab}
        orientation={desktop ? "vertical" : "horizontal"}
        className="gap-5 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start"
      >
        <div className="min-w-0 overflow-x-auto lg:sticky lg:top-5">
          <TabsList
            aria-label="Complaint detail sections"
            className="h-auto w-max justify-start gap-1 rounded-xl border bg-muted/20 p-2 lg:w-full lg:flex-col lg:items-stretch"
            style={activeTabStyle}
          >
            {TABS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="h-auto flex-none justify-start gap-2.5 px-3 py-2.5 text-xs data-[state=active]:border-transparent data-[state=active]:shadow-sm data-[state=active]:bg-[var(--brand-bg,var(--color-zinc-900))] data-[state=active]:text-[var(--brand-text,var(--color-white))] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--brand-bg,var(--color-zinc-800))] dark:data-[state=active]:text-[var(--brand-text,var(--color-white))]"
              >
                <item.icon className="size-4 text-muted-foreground in-data-[state=active]:text-current" />
                <span>{item.label}</span>
                {count[item.id] > 0 && (
                  <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground in-data-[state=active]:bg-white/15 in-data-[state=active]:text-current">
                    {count[item.id]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="min-w-0 [&_[data-slot=tabs-content]]:space-y-5">
          <TabsContent value="overview">
            <Section
              title="At a glance"
              description="Current status and saved complaint information."
            >
              <Info
                items={[
                  ["Category", c.category.name],
                  ["Warranty", text(c.warranty_status)],
                  ["Source", text(c.registration_channel)],
                  ["Client type", text(c.client_type)],
                  [
                    "Raised by",
                    c.raisedBy?.user_name ||
                      (c.registration_channel === "STAFF" ? null : "Client"),
                  ],
                  ["Status updated", date(c.status_changed_at, true)],
                ]}
              />
              <div className="border-t pt-4">
                <Note title="Reported issue">{c.description}</Note>
              </div>
            </Section>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Visits", visits.length, CalendarDays],
                ["Inspection reports", inspections.length, FileText],
                ["Evidence files", attachments.length, Images],
              ].map(([label, value, Icon]) => {
                const SummaryIcon = Icon as typeof CalendarDays;
                return (
                  <div key={String(label)} className="rounded-xl border p-4">
                    <SummaryIcon className="mb-3 size-4 text-muted-foreground" />
                    <p className="text-2xl font-semibold">{String(value)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(label)}
                    </p>
                  </div>
                );
              })}
            </div>
            <Section
              title="Complaint cycles"
              description="Reopened complaints keep the same complaint ID and previous records."
            >
              <div className="space-y-3">
                {c.cycles
                  .filter((row) => !cycleId || row.id === cycleId)
                  .map((row) => (
                    <div key={row.id} className="rounded-xl border p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">
                          Cycle {row.cycle_number}
                        </h3>
                        <Tag>
                          {row.id === c.current_cycle_id
                            ? "Current cycle"
                            : text(row.end_reason) === "Not recorded"
                              ? "Previous cycle"
                              : text(row.end_reason)}
                        </Tag>
                      </div>
                      <Info
                        items={[
                          ["Opened", date(row.opened_at, true)],
                          ["Resolved", date(row.resolved_at, true)],
                          ["Closed", date(row.closed_at, true)],
                        ]}
                      />
                      <div className="mt-3">
                        <Note title="Reopening reason">
                          {row.reopened_reason}
                        </Note>
                      </div>
                    </div>
                  ))}
              </div>
            </Section>
            {!!decisions.filter((row) =>
              [
                "HO_VERIFICATION",
                "WARRANTY_DECISION",
                "EXCEPTIONAL_APPROVAL",
                "EXTERNAL_LEAD_LINK",
              ].includes(row.decision_type),
            ).length && (
              <Section title="HO review & decisions">
                <Decisions
                  rows={decisions.filter((row) =>
                    [
                      "HO_VERIFICATION",
                      "WARRANTY_DECISION",
                      "EXCEPTIONAL_APPROVAL",
                      "EXTERNAL_LEAD_LINK",
                    ].includes(row.decision_type),
                  )}
                />
              </Section>
            )}
          </TabsContent>
          <TabsContent value="client">
            <Section
              title="Client details"
              description="Client information saved when this complaint was registered."
            >
              <Info
                items={[
                  ["Client name", c.client_name],
                  ["Mobile number", c.client_mobile],
                  ["Alternate mobile", c.client_alternate_mobile],
                  ["Email", c.client_email],
                  ["Client type", text(c.client_type)],
                  ["Lead code", c.lead?.lead_code],
                  [
                    "External client code",
                    c.externalClient?.external_client_code,
                  ],
                  ["City", c.city],
                ]}
              />
              <div className="border-t pt-4">
                <Note title="Site address">{c.site_address}</Note>
              </div>
              <Note title="Exceptional-client reason">
                {c.exceptional_reason}
              </Note>
            </Section>
          </TabsContent>
          <TabsContent value="complaint">
            <Section title="Complaint details">
              <Info
                items={[
                  ["Product type", c.product_type],
                  ["Component", COMPONENT_LABELS[c.component]],
                  ["Category", c.category.name],
                  [
                    "Priority",
                    c.priority
                      ? PRIORITY_META[c.priority].label
                      : "Not assigned",
                  ],
                  ["Preferred visit date", date(c.preferred_visit_date)],
                  ["Registration channel", text(c.registration_channel)],
                ]}
              />
              <div className="border-t pt-4">
                <Note title="Issue description">{c.description}</Note>
              </div>
              <Note title="Additional remarks">{c.additional_remarks}</Note>
            </Section>
            <Section
              title="Photos & videos"
              description="Registration evidence and additional information."
            >
              <ComplaintEvidence
                files={attachments.filter((file) =>
                  ["REGISTRATION", "ADDITIONAL_INFORMATION", "OTHER"].includes(
                    file.category,
                  ),
                )}
              />
            </Section>
          </TabsContent>
          <TabsContent value="handover">
            <Section
              title="Usable & final handover details"
              description="Dates recorded against this complaint."
            >
              <Info
                items={[
                  ["Installation date", date(c.installation_date)],
                  ["Usable handover date", date(c.usable_handover_date)],
                  ["Final handover date", date(c.final_handover_date)],
                  ["Warranty status", text(c.warranty_status)],
                ]}
              />
            </Section>
          </TabsContent>
          <TabsContent value="visits">
            {!visits.length ? (
              <Empty
                title="No visits recorded"
                description="Scheduled visits, assigned teams and repeat-visit information will appear here once saved."
              />
            ) : (
              visits.map((visit) => (
                <Section
                  key={visit.id}
                  title={`Visit ${visit.visit_number} · ${text(visit.purpose)}`}
                >
                  <div className="flex flex-wrap gap-2">
                    <Tag>{text(visit.status)}</Tag>
                    {cycleTag(visit.cycle_id)}
                    <Tag>{text(visit.charge_mode)}</Tag>
                  </div>
                  <Info
                    items={[
                      ["Scheduled for", date(visit.scheduled_for, true)],
                      ["Completed", date(visit.completed_at, true)],
                      ["Site supervisor", visit.assignedSS?.user_name],
                      ["Team", visit.team_details],
                      ["Reschedules", visit.reschedule_count],
                      ...(financial
                        ? [
                            [
                              "Standard visit fee",
                              money(visit.standard_fee, visit.currency),
                            ] as [string, ReactNode],
                          ]
                        : []),
                      [
                        "Repeat of visit",
                        visit.repeat_of_visit_id
                          ? `Visit record #${visit.repeat_of_visit_id}`
                          : "Not a repeat visit",
                      ],
                    ]}
                  />
                  <Note title="Repeat-visit remarks">
                    {visit.repeat_remarks}
                  </Note>
                  <Note title="Remarks">{visit.remarks}</Note>
                  <ComplaintEvidence
                    files={stageEvidence("visit_id", visit.id)}
                  />
                </Section>
              ))
            )}
          </TabsContent>
          <TabsContent value="inspections">
            {!inspections.length ? (
              <Empty
                title="No inspection reports"
                description="Submitted inspection findings, material requirements and evidence will appear here."
              />
            ) : (
              inspections.map((report) => (
                <Section
                  key={report.id}
                  title={`Inspection report #${report.id}`}
                >
                  <div className="flex flex-wrap gap-2">
                    {cycleTag(report.cycle_id)}
                    <Tag>Visit record #{report.visit_id}</Tag>
                  </div>
                  <Info
                    items={[
                      ["Actual visit date", date(report.actual_visit_date)],
                      ["Submitted by", report.submittedBy.user_name],
                      ["Submitted", date(report.submitted_at, true)],
                      ["Client available", report.client_available],
                      ["Affected product", report.affected_product],
                      ["Affected unit", report.affected_unit_number],
                      ["Responsibility", text(report.responsibility)],
                      ["Material required", report.material_required],
                      ["Estimated work days", report.estimated_work_days],
                      [
                        "Expected completion",
                        date(report.expected_completion_date),
                      ],
                      [
                        "Additional visit required",
                        report.additional_visit_required,
                      ],
                      [
                        "Further approval required",
                        report.further_approval_required,
                      ],
                    ]}
                  />
                  <Note title="Issue observed">{report.issue_observed}</Note>
                  <Note title="Root cause">{report.root_cause}</Note>
                  <Note title="Responsibility remarks">
                    {report.responsibility_remarks}
                  </Note>
                  <Note title="Repair actions">
                    {report.repair_actions.map(text).join(", ")}
                  </Note>
                  <Note title="Remarks">{report.remarks}</Note>
                  {!!report.materials.length && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">
                        Material requirements
                      </h3>
                      {report.materials.map((material) => (
                        <div
                          key={material.id}
                          className="rounded-xl border p-4"
                        >
                          <p className="mb-3 text-sm font-medium">
                            {material.material_name}
                          </p>
                          <Info
                            items={[
                              [
                                "Quantity",
                                `${material.quantity}${material.unit ? ` ${material.unit}` : ""}`,
                              ],
                              ["Specification", material.specification],
                              ["Finish / colour", material.finish_colour],
                              ...(financial
                                ? [
                                    [
                                      "Estimated cost",
                                      money(material.estimated_cost),
                                    ] as [string, ReactNode],
                                  ]
                                : []),
                            ]}
                          />
                          <div className="mt-3">
                            <Note title="Remarks">{material.remarks}</Note>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <ComplaintEvidence
                    files={stageEvidence("inspection_report_id", report.id)}
                  />
                </Section>
              ))
            )}
          </TabsContent>
          <TabsContent value="quotations">
            {!financial ? (
              <Restricted />
            ) : !quotations.length ? (
              <Empty
                title="No quotations recorded"
                description="Quotation versions, warranty coverage and saved approval decisions will appear here."
              />
            ) : (
              quotations.map((quote) => (
                <Section
                  key={quote.id}
                  title={`Quotation ${quote.quotation_number} · Revision ${quote.revision}`}
                >
                  <div className="flex flex-wrap gap-2">
                    <Tag>{text(quote.status)}</Tag>
                    {cycleTag(quote.cycle_id)}
                  </div>
                  <Info
                    items={[
                      ["Created by", quote.createdBy.user_name],
                      ["Created", date(quote.created_at, true)],
                      ["Shared", date(quote.shared_at, true)],
                    ]}
                  />
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          {[
                            "Item",
                            "Quantity",
                            "Rate",
                            "Total",
                            "Warranty covered",
                            "Client payable",
                          ].map((label) => (
                            <th
                              key={label}
                              className="whitespace-nowrap p-3 font-medium"
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {quote.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="min-w-48 p-3">
                              <p className="font-medium">{item.description}</p>
                              <p className="mt-1 text-muted-foreground">
                                {text(item.category)}
                              </p>
                              {item.chargeable_reason && (
                                <p className="mt-1 text-muted-foreground">
                                  {item.chargeable_reason}
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              {item.quantity} {item.unit}
                            </td>
                            {[
                              item.unit_rate,
                              item.line_total,
                              item.warranty_covered_amount,
                              item.client_payable_amount,
                            ].map((amount, i) => (
                              <td key={i} className="whitespace-nowrap p-3">
                                {money(amount, quote.currency)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Info
                    items={[
                      ["Subtotal", money(quote.subtotal, quote.currency)],
                      ["Tax", money(quote.tax_amount, quote.currency)],
                      ["Total", money(quote.total_amount, quote.currency)],
                      [
                        "Warranty covered",
                        money(quote.warranty_covered_amount, quote.currency),
                      ],
                      [
                        "Client payable",
                        money(quote.client_payable_amount, quote.currency),
                      ],
                    ]}
                  />
                  <Decisions
                    rows={decisions.filter(
                      (row) => row.quotation_id === quote.id,
                    )}
                  />
                </Section>
              ))
            )}
            {financial &&
              attachments.some((file) => file.category === "QUOTATION") && (
                <Section title="Quotation documents">
                  <ComplaintEvidence
                    files={attachments.filter(
                      (file) => file.category === "QUOTATION",
                    )}
                  />
                </Section>
              )}
          </TabsContent>
          <TabsContent value="payments">
            {!financial ? (
              <Restricted />
            ) : (
              <>
                {!charges.length && !payments.length ? (
                  <Empty
                    title="No charges or payments"
                    description="Visit charges and repair charges are tracked separately. Payment proofs and verification records will appear here."
                  />
                ) : (
                  <>
                    {!!charges.length && (
                      <Section
                        title="Charges"
                        description="Visiting charges remain separate from repair quotations."
                      >
                        <div className="space-y-3">
                          {charges.map((charge) => (
                            <div
                              key={charge.id}
                              className="rounded-xl border p-4"
                            >
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-medium">
                                  {text(charge.charge_type)} charge #{charge.id}
                                </h3>
                                <div className="flex gap-2">
                                  {cycleTag(charge.cycle_id)}
                                  <Tag>{text(charge.status)}</Tag>
                                </div>
                              </div>
                              <Info
                                items={[
                                  [
                                    "Amount",
                                    money(charge.amount, charge.currency),
                                  ],
                                  ["Due date", date(charge.due_at)],
                                  [
                                    "Reference",
                                    charge.visit_id
                                      ? `Visit record #${charge.visit_id}`
                                      : charge.quotation_id
                                        ? `Quotation record #${charge.quotation_id}`
                                        : null,
                                  ],
                                ]}
                              />
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                    {payments.map((payment) => (
                      <Section
                        key={payment.id}
                        title={`Payment #${payment.id}`}
                      >
                        <div className="flex gap-2">
                          <Tag>{text(payment.status)}</Tag>
                          {cycleTag(payment.cycle_id)}
                        </div>
                        <Info
                          items={[
                            ["Amount", money(payment.amount, payment.currency)],
                            ["Method", text(payment.method)],
                            [
                              "Transaction reference",
                              payment.transaction_reference,
                            ],
                            ["Payment date", date(payment.payment_date)],
                            ["Verified by", payment.verifiedBy?.user_name],
                            ["Verified", date(payment.verified_at, true)],
                            ["Refunded", date(payment.refunded_at, true)],
                          ]}
                        />
                        <Note title="Rejection remarks">
                          {payment.rejection_remarks}
                        </Note>
                        <Note title="Refund remarks">
                          {payment.refund_remarks}
                        </Note>
                        {!!payment.allocations.length && (
                          <Note title="Allocations">
                            {payment.allocations
                              .map(
                                (row) =>
                                  `Charge #${row.charge_id}: ${money(row.amount, payment.currency)}`,
                              )
                              .join(" · ")}
                          </Note>
                        )}
                        <ComplaintEvidence
                          files={attachments.filter(
                            (file) => file.id === payment.proof_attachment_id,
                          )}
                          emptyText="Payment proof is unavailable."
                        />
                      </Section>
                    ))}
                  </>
                )}
              </>
            )}
          </TabsContent>
          <TabsContent value="procurement">
            {!executions.length && !materials.length ? (
              <Empty
                title="No procurement or execution records"
                description="Linked factory requests, material readiness and repair schedules will appear here."
              />
            ) : (
              <>
                {executions.map((execution) => (
                  <Section
                    key={execution.id}
                    title={`Execution #${execution.id}`}
                  >
                    <div className="flex gap-2">
                      <Tag>{text(execution.status)}</Tag>
                      {cycleTag(execution.cycle_id)}
                    </div>
                    <Info
                      items={[
                        ["Material required", execution.material_required],
                        ["Purchase order", execution.purchase_order_reference],
                        [
                          "Material expected",
                          date(execution.material_expected_date),
                        ],
                        [
                          "Material received",
                          date(execution.material_received_date),
                        ],
                        [
                          "Repair scheduled",
                          date(execution.scheduled_for, true),
                        ],
                        ["Started", date(execution.started_at, true)],
                        ["Site supervisor", execution.assignedSS?.user_name],
                        ["Team", execution.team_details],
                      ]}
                    />
                  </Section>
                ))}
                {!!materials.length && (
                  <Section title="Factory / Miscl requests">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="space-y-4 rounded-xl border p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold">
                            Request #{material.id} · {material.type.name}
                          </h3>
                          <Tag>
                            {material.is_resolved
                              ? "Resolved"
                              : material.misc_approved === true
                                ? "Approved"
                                : material.misc_approved === false
                                  ? "Rejected"
                                  : "Awaiting approval"}
                          </Tag>
                        </div>
                        <Note title="Problem">
                          {material.problem_description}
                        </Note>
                        <Note title="Reorder material details">
                          {material.reorder_material_details}
                        </Note>
                        <Info
                          items={[
                            ["Quantity", material.quantity],
                            [
                              "Expected ready date",
                              date(material.expected_ready_date),
                            ],
                            [
                              "Required delivery",
                              date(material.required_delivery_date),
                            ],
                            ...(financial
                              ? [
                                  ["Cost", money(material.cost)] as [
                                    string,
                                    ReactNode,
                                  ],
                                ]
                              : []),
                            ["Resolved", date(material.resolved_at, true)],
                          ]}
                        />
                        <Note title="Supervisor remarks">
                          {material.supervisor_remark}
                        </Note>
                        <Note title="Solution">{material.solution}</Note>
                      </div>
                    ))}
                  </Section>
                )}
              </>
            )}
          </TabsContent>
          <TabsContent value="resolution">
            {!closures.length &&
            !executions.some(
              (row) => row.completed_at || row.completion_remarks,
            ) &&
            !decisions.some((row) =>
              [
                "CLIENT_RESOLUTION_CONFIRMATION",
                "REOPEN_REVIEW",
                "INSPECTION_SKIP",
                "QUOTATION_SKIP",
              ].includes(row.decision_type),
            ) ? (
              <Empty
                title="No resolution recorded"
                description="Completion reports, client responses and final HO closure records will appear here."
              />
            ) : (
              <>
                {executions
                  .filter((row) => row.completed_at || row.completion_remarks)
                  .map((execution) => (
                    <Section
                      key={execution.id}
                      title={`Completion report · Execution #${execution.id}`}
                    >
                      <div className="flex gap-2">
                        {cycleTag(execution.cycle_id)}
                        <Tag>{text(execution.status)}</Tag>
                      </div>
                      <Info
                        items={[
                          ["Completed", date(execution.completed_at, true)],
                          ["Completed by", execution.completedBy?.user_name],
                        ]}
                      />
                      <Note title="Completion remarks">
                        {execution.completion_remarks}
                      </Note>
                      <Note title="Material used">
                        {execution.material_used}
                      </Note>
                      <Note title="Replacement details">
                        {execution.replacement_details}
                      </Note>
                      <Note title="Client remarks">
                        {execution.client_remarks}
                      </Note>
                      <Note title="Pending work">{execution.pending_work}</Note>
                      <h3 className="text-sm font-medium">
                        Before & after evidence
                      </h3>
                      <ComplaintEvidence
                        files={stageEvidence("execution_id", execution.id)}
                      />
                    </Section>
                  ))}
                {!!decisions.filter((row) =>
                  [
                    "CLIENT_RESOLUTION_CONFIRMATION",
                    "REOPEN_REVIEW",
                    "INSPECTION_SKIP",
                    "QUOTATION_SKIP",
                  ].includes(row.decision_type),
                ).length && (
                  <Section title="Client responses & resolution decisions">
                    <Decisions
                      rows={decisions.filter((row) =>
                        [
                          "CLIENT_RESOLUTION_CONFIRMATION",
                          "REOPEN_REVIEW",
                          "INSPECTION_SKIP",
                          "QUOTATION_SKIP",
                        ].includes(row.decision_type),
                      )}
                    />
                  </Section>
                )}
                {closures.map((closure) => (
                  <Section key={closure.id} title="HO closure review">
                    <div className="flex gap-2">
                      {cycleTag(closure.cycle_id)}
                      <Tag>{text(closure.status)}</Tag>
                    </div>
                    <Info
                      items={[
                        [
                          "Client confirmation",
                          text(closure.client_confirmation_status),
                        ],
                        [
                          "Completion verified",
                          date(closure.completion_verified_at, true),
                        ],
                        [
                          "Financial verification",
                          date(closure.financial_verified_at, true),
                        ],
                        ["Closed by", closure.closedBy?.user_name],
                        ["Closed", date(closure.closed_at, true)],
                      ]}
                    />
                    <Note title="No-response reason">
                      {closure.no_response_reason}
                    </Note>
                    <Note title="Closure remarks">
                      {closure.closure_remarks}
                    </Note>
                  </Section>
                ))}
              </>
            )}
            {attachments.some(
              (file) => file.category === "CLIENT_CONFIRMATION",
            ) && (
              <Section title="Client confirmation evidence">
                <ComplaintEvidence
                  files={attachments.filter(
                    (file) => file.category === "CLIENT_CONFIRMATION",
                  )}
                />
              </Section>
            )}
          </TabsContent>
          <TabsContent value="communications">
            {!communications.length ? (
              <Empty
                title="No communication records"
                description="Saved notification delivery records will appear here. No messages have been recorded for this selection."
              />
            ) : (
              <Section
                title="Communication history"
                description="Recorded notifications and delivery status."
              >
                <div className="space-y-3">
                  {communications.map((row) => (
                    <div
                      key={row.id}
                      className="space-y-3 rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">
                          {text(row.event)}
                        </h3>
                        <div className="flex gap-2">
                          <Tag>{text(row.channel)}</Tag>
                          <Tag>{text(row.delivery_status)}</Tag>
                        </div>
                      </div>
                      <Info
                        items={[
                          [
                            "Recipient",
                            row.recipientUser?.user_name ||
                              row.recipient_address,
                          ],
                          ["Recipient type", text(row.recipient_type)],
                          ["Created", date(row.created_at, true)],
                          ["Sent", date(row.sent_at, true)],
                          [
                            "Cycle",
                            row.cycle_id
                              ? cycleLabel(row.cycle_id)
                              : "Complaint-wide",
                          ],
                        ]}
                      />
                      <Note title="Delivery failure">{row.failure_reason}</Note>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </TabsContent>
          <TabsContent value="activity">
            <Section title="History">
              <ComplaintActivityLog
                key={`${c.id}-${cycle}`}
                vendorId={vendorId}
                complaintId={c.id}
                cycleId={cycleId}
              />
            </Section>
            {!!assignments.length && (
              <Section title="Assignment history">
                <div className="space-y-3">
                  {assignments.map((row) => (
                    <div key={row.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">
                          {text(row.role)}
                        </h3>
                        {cycleTag(row.cycle_id)}
                      </div>
                      <p className="mt-2 text-sm">
                        {row.previousUser
                          ? `${row.previousUser.user_name} → `
                          : "Assigned to "}
                        {row.newUser.user_name}
                      </p>
                      <div className="mt-3">
                        <Note title="Reason">{row.reason}</Note>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {row.assignedBy?.user_name || "System"} ·{" "}
                        {date(row.assigned_at, true)}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
