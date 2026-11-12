import {
  ComplaintComponent,
  ComplaintPriority,
  ComplaintStatus,
} from "@/types/client-complaints";

type Tone = "slate" | "blue" | "indigo" | "amber" | "orange" | "violet" | "cyan" | "emerald" | "red";

const TONES: Record<Tone, { className: string; dot: string }> = {
  slate: { className: "bg-muted/60 text-muted-foreground border-border", dot: "bg-muted-foreground" },
  blue: { className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50", dot: "bg-blue-500" },
  indigo: { className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50", dot: "bg-indigo-500" },
  amber: { className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50", dot: "bg-amber-500" },
  orange: { className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50", dot: "bg-orange-500" },
  violet: { className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50", dot: "bg-violet-500" },
  cyan: { className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50", dot: "bg-cyan-500" },
  emerald: { className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50", dot: "bg-emerald-500" },
  red: { className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50", dot: "bg-red-500" },
};

const STATUS_DEFS: Record<ComplaintStatus, [label: string, tone: Tone]> = {
  NEW: ["New", "blue"],
  UNDER_VERIFICATION: ["Under Verification", "blue"],
  MORE_INFORMATION_REQUIRED: ["More Info Required", "amber"],
  REJECTED: ["Rejected", "red"],
  APPROVED_FOR_VISIT: ["Approved for Visit", "indigo"],
  AWAITING_CLIENT_ACCEPTANCE: ["Awaiting Client Acceptance", "violet"],
  PAYMENT_PENDING: ["Payment Pending", "amber"],
  VISIT_SCHEDULED: ["Visit Scheduled", "indigo"],
  INSPECTION_SUBMITTED: ["Inspection Submitted", "indigo"],
  QUOTATION_PREPARATION: ["Quotation Preparation", "indigo"],
  DEPARTMENT_HEAD_APPROVAL: ["Dept. Head Approval", "violet"],
  QUOTATION_SHARED: ["Quotation Shared", "violet"],
  AWAITING_CLIENT_APPROVAL: ["Awaiting Client Approval", "violet"],
  AWAITING_PAYMENT: ["Awaiting Payment", "amber"],
  PROCUREMENT_PENDING: ["Procurement Pending", "orange"],
  MATERIAL_RECEIVED: ["Material Received", "orange"],
  REPAIR_SCHEDULED: ["Repair Scheduled", "indigo"],
  WORK_IN_PROGRESS: ["Work in Progress", "indigo"],
  AWAITING_CLIENT_CONFIRMATION: ["Awaiting Client Confirmation", "cyan"],
  AWAITING_HO_CLOSURE_APPROVAL: ["Awaiting HO Closure", "cyan"],
  CLOSED: ["Closed", "emerald"],
  REOPENED: ["Reopened", "orange"],
  ON_HOLD: ["On Hold", "slate"],
  CANCELLED: ["Cancelled", "slate"],
};

export const STATUS_META = Object.fromEntries(
  Object.entries(STATUS_DEFS).map(([status, [label, tone]]) => [status, { label, ...TONES[tone] }]),
) as Record<ComplaintStatus, { label: string; className: string; dot: string }>;

export const ALL_STATUSES = Object.keys(STATUS_DEFS) as ComplaintStatus[];

const FINISHED: ComplaintStatus[] = ["CLOSED", "REJECTED", "CANCELLED"];

// Dashboard counters from spec 6.1. Overdue needs the SLA settings and is added later.
export const STATUS_GROUPS: { key: string; label: string; statuses: ComplaintStatus[]; tone: Tone }[] = [
  { key: "all", label: "Total Complaints", statuses: [], tone: "slate" },
  { key: "open", label: "Open", statuses: ALL_STATUSES.filter((s) => !FINISHED.includes(s)), tone: "blue" },
  { key: "new", label: "New", statuses: ["NEW"], tone: "blue" },
  { key: "verification", label: "Under Verification", statuses: ["UNDER_VERIFICATION", "MORE_INFORMATION_REQUIRED"], tone: "blue" },
  { key: "visit", label: "Visit Scheduled", statuses: ["VISIT_SCHEDULED"], tone: "indigo" },
  { key: "inspection", label: "Inspection Completed", statuses: ["INSPECTION_SUBMITTED"], tone: "indigo" },
  { key: "quotation", label: "Quotation Pending", statuses: ["QUOTATION_PREPARATION", "DEPARTMENT_HEAD_APPROVAL", "QUOTATION_SHARED", "AWAITING_CLIENT_APPROVAL"], tone: "violet" },
  { key: "payment", label: "Payment Pending", statuses: ["AWAITING_CLIENT_ACCEPTANCE", "PAYMENT_PENDING", "AWAITING_PAYMENT"], tone: "amber" },
  { key: "material", label: "Material Pending", statuses: ["PROCUREMENT_PENDING", "MATERIAL_RECEIVED"], tone: "orange" },
  { key: "work", label: "Work in Progress", statuses: ["REPAIR_SCHEDULED", "WORK_IN_PROGRESS"], tone: "indigo" },
  { key: "closed", label: "Closed", statuses: ["CLOSED"], tone: "emerald" },
  { key: "reopened", label: "Reopened", statuses: ["REOPENED"], tone: "orange" },
];

export const toneClasses = (tone: Tone) => TONES[tone];

export const COMPONENT_LABELS: Record<ComplaintComponent, string> = {
  SHUTTER: "Shutter",
  CARCASS: "Carcass",
  HARDWARE: "Hardware",
  ACCESSORY: "Accessory",
};

export const PRIORITY_META: Record<ComplaintPriority, { label: string; className: string }> = {
  LOW: { label: "Low", className: TONES.slate.className },
  MEDIUM: { label: "Medium", className: TONES.blue.className },
  HIGH: { label: "High", className: TONES.orange.className },
  URGENT: { label: "Urgent", className: TONES.red.className },
};
