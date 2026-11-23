"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileText,
  History,
  ImagePlus,
  IndianRupee,
  Info,
  MessageSquareWarning,
  MousePointerClick,
  Package,
  Plus,
  Search,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { STATUS_META } from "./complaint-meta";
import { BRAND_BUTTON } from "./complaint-action-ui";
import { useVendorBrandStyle } from "@/hooks/use-vendor-theme-color";

// Background only, for the step dots; same vendor colour and zinc fallback as BRAND_BUTTON.
const BRAND_BG =
  "bg-[var(--brand-bg,var(--color-zinc-900))] dark:bg-[var(--brand-bg,var(--color-zinc-800))]";
import type { ComplaintStatus } from "@/types/client-complaints";

interface HelpStep {
  title: string;
  shortTitle: string;
  /**
   * Screenshot shown above the step. Put the file in
   * public/images/complaints-help/; if it is missing the step shows text only.
   */
  image?: string;
  description: string;
  details?: string[];
  /** Who takes each action at this step. */
  roles: { who: RoleKey; does: string }[];
}

type RoleKey = "HO" | "SA" | "SS" | "SS_HO";

// Mirrors the backend: HO = super-admin + head-site-supervisor; a site
// supervisor only acts on complaints assigned to them.
const ROLE_META: Record<RoleKey, { label: string; sub: string; className: string }> = {
  HO: {
    label: "HO",
    sub: "Super Admin · Head Site Supervisor",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900/50",
  },
  SA: {
    label: "Super Admin",
    sub: "only",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
  },
  SS: {
    label: "Site Supervisor",
    sub: "assigned to the complaint",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/50",
  },
  SS_HO: {
    label: "Site Supervisor or HO",
    sub: "assigned SS, Super Admin, Head SS",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
  },
};

function WhoDoesThis({ roles }: { roles: HelpStep["roles"] }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        Who does this
      </div>
      <div className="space-y-2">
        {roles.map(({ who, does }) => {
          const r = ROLE_META[who];
          return (
            <div key={who + does} className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3">
              <div className="sm:w-44 shrink-0">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${r.className}`}>
                  {r.label}
                </span>
                <div className="text-[10px] text-muted-foreground mt-0.5 sm:pl-0.5">{r.sub}</div>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">{does}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const IMG = "/images/complaints-help";

const STEPS: HelpStep[] = [
  {
    title: "The Complaints Dashboard",
    roles: [{ who: "HO", does: "See every complaint of the vendor" }, { who: "SS", does: "See only the complaints assigned to them" }],
    shortTitle: "Dashboard",
    image: `${IMG}/step1.png`,
    description:
      "This page lists every client complaint. The counters at the top (Open, New, Under Verification, Visit Scheduled, Quotation Pending, Payment Pending and so on) show how many complaints are at each step. Click a counter to show only those complaints.",
    details: [
      "Search by Complaint ID, client, mobile, lead code or issue",
      "Use the Status dropdown for one exact status",
      "Open a complaint by double-clicking its row",
    ],
  },
  {
    title: "Register a Complaint",
    roles: [{ who: "HO", does: "Register complaints for CRM leads or external clients" }, { who: "SS", does: "Cannot register; works on complaints assigned by HO" }],
    shortTitle: "Register",
    image: `${IMG}/step2.png`,
    description:
      "Click Register Complaint. Choose a CRM lead to fill in the client, site and supervisors automatically, or enter an external client by hand. Pick one or more issue categories, describe each one and attach photos or videos.",
    details: [
      "Each selected category becomes its own complaint",
      "Earlier complaints for the same lead are shown to avoid duplicates",
      "Possible duplicates are flagged for HO review",
    ],
  },
  {
    title: "Verify the Complaint",
    roles: [{ who: "HO", does: "Approve for Visit, Request More Information, Remote Resolution, Reject, reassign and set priority" }, { who: "SS", does: "When More Info Required, collect the details from the client and hand it back to HO; can set the priority if none is set" }],
    shortTitle: "Verify",
    image: `${IMG}/step3.png`,
    description:
      "A new complaint starts as New. Open it and use the actions panel to decide what happens next.",
    details: [
      "Approve for Visit: send someone to the site",
      "Request More Information: ask the client for details",
      "Remote Resolution: solve it without a visit",
      "Reject Complaint: close it with a reason",
    ],
  },
  {
    title: "Visiting Charge",
    roles: [{ who: "SS_HO", does: "Record the client's acceptance or decline, Record Payment, Cash at Visit" }, { who: "HO", does: "Waive Charge, Approve or Decline a free visit" }, { who: "SA", does: "Set the visiting fee from the Visiting Charge settings" }],
    shortTitle: "Visiting Charge",
    image: `${IMG}/step4.png`,
    description:
      "If a visiting charge applies, record what the client decides. Admins set the fee with the Visiting Charge settings button on this page.",
    details: [
      "Client Accepted Charge, Client Declined or Waive Charge",
      "Record Payment now, or choose Cash at Visit",
      "Approve Free Visit or Decline Free Visit when one is requested",
    ],
  },
  {
    title: "Schedule the Site Visit",
    roles: [{ who: "SS_HO", does: "Schedule, Confirm, Reschedule, mark a failed visit or Cancel Visit" }, { who: "HO", does: "Approve a free repeat visit requested by the site supervisor" }],
    shortTitle: "Site Visit",
    image: `${IMG}/step5.png`,
    description:
      "Click Schedule Visit and pick a date and the site supervisor. Confirm the visit once it is fixed with the client.",
    details: [
      "Reschedule if the date changes",
      "Mark Client Not Available or Site Not Accessible if the visit fails",
      "Cancel Visit if it is no longer needed",
    ],
  },
  {
    title: "Complete the Inspection",
    roles: [{ who: "SS_HO", does: "Complete Inspection at the site with findings and photos" }, { who: "HO", does: "Decide what happens next: Prepare Quotation or Resolve Without Repair" }, { who: "SA", does: "Make the Warranty Decision" }],
    shortTitle: "Inspection",
    image: `${IMG}/step6.png`,
    description:
      "At the site, the supervisor clicks Complete Inspection and records the findings with photos. After that, decide whether the problem is under warranty.",
    details: [
      "Warranty Decision: Covered, Partially covered or Not covered",
      "Resolve Without Repair if nothing needs fixing",
      "Otherwise, move on to Prepare Quotation",
    ],
  },
  {
    title: "Quotation & Payment",
    roles: [{ who: "HO", does: "Prepare, upload, review and share the quotation, record the client's response, waive charges" }, { who: "SS_HO", does: "Record Payment; payments recorded by the site supervisor are verified by HO" }],
    shortTitle: "Quotation",
    image: `${IMG}/step7.png`,
    description:
      "Prepare and upload the quotation. The department head reviews it and either approves it or sends it for revision. Share the approved quotation with the client and record their response.",
    details: [
      "Review Quotation: Approve or Send for revision",
      "Share with Client, then Record Client Response",
      "Record Payment, or Waive Charge if it is free",
    ],
  },
  {
    title: "Material & Repair",
    roles: [{ who: "SS_HO", does: "Update material status, Start Resolution, Start Work and Work Completed" }],
    shortTitle: "Material & Repair",
    image: `${IMG}/step8.png`,
    description:
      "If parts are needed, track them under Material Procurement. When the material is ready, schedule and carry out the repair.",
    details: [
      "Material Ordered, Material Received, Material Ready",
      "Start Resolution to schedule the repair (Reschedule if needed)",
      "Start Work, then Work Completed",
    ],
  },
  {
    title: "Client Confirmation & Closure",
    roles: [{ who: "SS_HO", does: "Record Client Confirmation" }, { who: "HO", does: "Close Without Response and Approve Closure" }, { who: "SA", does: "Cancel Complaint" }],
    shortTitle: "Closure",
    image: `${IMG}/step9.png`,
    description:
      "After the work, record whether the client is satisfied. HO then approves the closure. A closed complaint can be reopened if the problem comes back.",
    details: [
      "Record Client Confirmation, or Close Without Response",
      "HO clicks Approve Closure to close it",
      "Every action is listed under History & Activity Log",
    ],
  },
];

const SECTIONS = [
  { title: "Getting Started", stepIndices: [0, 1] },
  { title: "Verification & Visit", stepIndices: [2, 3, 4, 5] },
  { title: "Repair", stepIndices: [6, 7] },
  { title: "Closure", stepIndices: [8] },
];

/* ---------- Illustrations: simplified mock-ups of each step's screen ---------- */

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full rounded-xl border border-border/80 bg-muted/20 shadow-xs overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/40">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-[11px] font-medium text-muted-foreground truncate">{title}</span>
      </div>
      <div className="p-4 sm:p-5 bg-background">{children}</div>
    </div>
  );
}

function Status({ s }: { s: ComplaintStatus }) {
  const m = STATUS_META[s];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${m.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function FakeBtn({ children, primary, danger }: { children: React.ReactNode; primary?: boolean; danger?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap ${
        primary
          ? `${BRAND_BUTTON} border-transparent`
          : danger
          ? "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400"
          : "bg-card text-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`space-y-1 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[10px] font-medium text-muted-foreground">{label}</div>
      <div className="rounded-md border bg-card px-2.5 py-1.5 text-[11px] text-foreground truncate">{value}</div>
    </div>
  );
}

/** A left-to-right chain of statuses, highlighting the ones this step covers. */
function Flow({ items }: { items: ComplaintStatus[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
          <Status s={s} />
        </React.Fragment>
      ))}
    </div>
  );
}

function ActionCard({ heading, status, children }: { heading: string; status: ComplaintStatus; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{heading}</span>
        <Status s={status} />
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const ILLUSTRATIONS: (() => React.ReactNode)[] = [
  // 1. Dashboard
  () => (
    <Frame title="Dashboard › Complaints">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          ["Total", 42],
          ["Open", 18],
          ["New", 5],
          ["Visit Scheduled", 4],
          ["Quotation Pending", 3],
          ["Closed", 24],
        ].map(([l, n], i) => (
          <div key={l} className={`rounded-lg border p-2 ${i === 1 ? "ring-2 ring-primary/40" : ""}`}>
            <div className="text-[10px] text-muted-foreground truncate">{l}</div>
            <div className="text-base font-bold">{n}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <div className="flex-1 flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <Search className="w-3 h-3" /> Search by Complaint ID, client, mobile…
        </div>
        <FakeBtn>Status: All</FakeBtn>
      </div>
      <div className="mt-3 rounded-lg border divide-y text-[11px]">
        {(
          [
            ["CMP-0042", "Rahul Mehta", "NEW"],
            ["CMP-0041", "Priya Shah", "VISIT_SCHEDULED"],
            ["CMP-0039", "Anil Kumar", "QUOTATION_SHARED"],
          ] as [string, string, ComplaintStatus][]
        ).map(([code, name, s], i) => (
          <div key={code} className={`flex items-center justify-between gap-2 px-3 py-2 ${i === 0 ? "bg-primary/5" : ""}`}>
            <span className="font-semibold">{code}</span>
            <span className="flex-1 truncate text-muted-foreground">{name}</span>
            <Status s={s} />
            {i === 0 && <MousePointerClick className="w-3.5 h-3.5 text-primary shrink-0" />}
          </div>
        ))}
      </div>
    </Frame>
  ),
  // 2. Register
  () => (
    <Frame title="Register Complaint">
      <div className="inline-flex rounded-lg border p-0.5 text-[11px] mb-3">
        <span className={`rounded-md px-3 py-1 font-medium ${BRAND_BUTTON}`}>CRM Lead</span>
        <span className="px-3 py-1 text-muted-foreground">External Client</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lead" value="VLOQ-128 · Rahul Mehta" />
        <Field label="Product" value="Modular Kitchen" />
        <Field label="Site address" value="Auto-filled from the lead" wide />
      </div>
      <div className="mt-3 text-[10px] font-medium text-muted-foreground">Issue categories (one complaint each)</div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {["Shutter alignment", "Hinge broken", "Edge band peeling"].map((c, i) => (
          <span key={c} className={`rounded-full border px-2.5 py-1 text-[11px] ${i < 2 ? "bg-primary/10 border-primary/40 text-primary font-medium" : "text-muted-foreground"}`}>
            {i < 2 && "✓ "}
            {c}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ImagePlus className="w-3.5 h-3.5" /> Photos & videos attached
        </span>
        <FakeBtn primary>
          <Plus className="w-3 h-3" /> Register Complaint
        </FakeBtn>
      </div>
    </Frame>
  ),
  // 3. Verify
  () => (
    <Frame title="Complaint CMP-0042 › Actions">
      <ActionCard heading="Verify the complaint" status="NEW">
        <FakeBtn primary>Approve for Visit</FakeBtn>
        <FakeBtn>Request More Information</FakeBtn>
        <FakeBtn>Remote Resolution</FakeBtn>
        <FakeBtn danger>Reject Complaint</FakeBtn>
      </ActionCard>
      <div className="mt-3">
        <Flow items={["NEW", "UNDER_VERIFICATION", "APPROVED_FOR_VISIT"]} />
      </div>
    </Frame>
  ),
  // 4. Visiting charge
  () => (
    <Frame title="Complaint CMP-0042 › Visiting Charge">
      <ActionCard heading="Visiting charge: ₹500" status="AWAITING_CLIENT_ACCEPTANCE">
        <FakeBtn primary>Client Accepted Charge</FakeBtn>
        <FakeBtn>Client Declined</FakeBtn>
        <FakeBtn>Waive Charge</FakeBtn>
      </ActionCard>
      <div className="mt-3">
        <ActionCard heading="Collect payment" status="PAYMENT_PENDING">
          <FakeBtn primary>
            <IndianRupee className="w-3 h-3" /> Record Payment
          </FakeBtn>
          <FakeBtn>Cash at Visit</FakeBtn>
        </ActionCard>
      </div>
    </Frame>
  ),
  // 5. Visit
  () => (
    <Frame title="Complaint CMP-0042 › Visit & Inspection">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Visit date" value="28 Nov 2026, 11:00 AM" />
        <Field label="Site supervisor" value="Imran Shaikh" />
      </div>
      <div className="mt-3">
        <ActionCard heading="Site visit" status="VISIT_SCHEDULED">
          <FakeBtn primary>
            <CalendarCheck className="w-3 h-3" /> Confirm
          </FakeBtn>
          <FakeBtn>Reschedule</FakeBtn>
          <FakeBtn>Client Not Available</FakeBtn>
          <FakeBtn>Site Not Accessible</FakeBtn>
          <FakeBtn danger>Cancel Visit</FakeBtn>
        </ActionCard>
      </div>
    </Frame>
  ),
  // 6. Inspection
  () => (
    <Frame title="Complaint CMP-0042 › Inspection">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Findings" value="Hinge sheared on upper shutter" wide />
      </div>
      <div className="mt-3 text-[10px] font-medium text-muted-foreground">Warranty decision</div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {["Covered", "Partially covered", "Not covered"].map((w, i) => (
          <span key={w} className={`rounded-full border px-2.5 py-1 text-[11px] ${i === 0 ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}>
            {w}
          </span>
        ))}
      </div>
      <div className="mt-3">
        <ActionCard heading="Next step" status="INSPECTION_SUBMITTED">
          <FakeBtn primary>
            <ClipboardCheck className="w-3 h-3" /> Prepare Quotation
          </FakeBtn>
          <FakeBtn>Resolve Without Repair</FakeBtn>
        </ActionCard>
      </div>
    </Frame>
  ),
  // 7. Quotation
  () => (
    <Frame title="Complaint CMP-0042 › Quote & Payments">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <FileText className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">Quotation_CMP-0042.pdf</div>
          <div className="text-[10px] text-muted-foreground">₹2,400 · uploaded today</div>
        </div>
        <FakeBtn primary>Share with Client</FakeBtn>
      </div>
      <div className="mt-3">
        <Flow items={["QUOTATION_PREPARATION", "DEPARTMENT_HEAD_APPROVAL", "QUOTATION_SHARED", "AWAITING_CLIENT_APPROVAL", "AWAITING_PAYMENT"]} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <FakeBtn>Review Quotation</FakeBtn>
        <FakeBtn>Record Client Response</FakeBtn>
        <FakeBtn>Record Payment</FakeBtn>
      </div>
    </Frame>
  ),
  // 8. Material & repair
  () => (
    <Frame title="Complaint CMP-0042 › Material & Resolution">
      <div className="grid grid-cols-3 gap-2">
        {["Material Ordered", "Material Received", "Material Ready"].map((m, i) => (
          <div key={m} className={`rounded-lg border p-2.5 text-center ${i < 2 ? "bg-emerald-500/10 border-emerald-300 dark:border-emerald-900" : "bg-card"}`}>
            <Package className={`w-4 h-4 mx-auto ${i < 2 ? "text-emerald-600" : "text-muted-foreground"}`} />
            <div className="text-[10px] font-medium mt-1">{m}</div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Flow items={["PROCUREMENT_PENDING", "MATERIAL_RECEIVED", "REPAIR_SCHEDULED", "WORK_IN_PROGRESS"]} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <FakeBtn primary>
          <Wrench className="w-3 h-3" /> Start Resolution
        </FakeBtn>
        <FakeBtn>Start Work</FakeBtn>
        <FakeBtn>Work Completed</FakeBtn>
      </div>
    </Frame>
  ),
  // 9. Closure
  () => (
    <Frame title="Complaint CMP-0042 › Feedback & Closure">
      <ActionCard heading="Resolution done" status="AWAITING_CLIENT_CONFIRMATION">
        <FakeBtn primary>Record Client Confirmation</FakeBtn>
        <FakeBtn>Close Without Response</FakeBtn>
      </ActionCard>
      <div className="mt-3">
        <ActionCard heading="Ready for HO closure" status="AWAITING_HO_CLOSURE_APPROVAL">
          <FakeBtn primary>
            <CheckCircle2 className="w-3 h-3" /> Approve Closure
          </FakeBtn>
        </ActionCard>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <History className="w-3.5 h-3.5" /> Every action is logged under History & Activity Log
        <span className="ml-auto"><Status s="CLOSED" /></span>
      </div>
    </Frame>
  ),
];

/** Shows the step's screenshot when one exists, otherwise its mock-up. */
function StepImage({ src, alt, fallback }: { src?: string; alt: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <>{fallback}</>;
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border/80 bg-muted/20 shadow-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="w-full h-auto max-h-[360px] object-contain bg-background mx-auto"
      />
    </div>
  );
}

function ComplaintsHelpGuide({ open }: { open: boolean }) {
  const [currentStep, setCurrentStep] = useState(0);
  const last = STEPS.length - 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrentStep((s) => Math.min(last, s + 1));
      if (e.key === "ArrowLeft") setCurrentStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, last]);

  const brandStyle = useVendorBrandStyle();
  const step = STEPS[currentStep];
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="flex flex-col min-h-0 h-full" style={brandStyle}>
      {/* Header */}
      <div className="px-6 py-4 pr-12 border-b bg-gradient-to-r from-card via-card to-muted/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold tracking-tight">
              How to Use Client Complaints
            </DialogTitle>
            <DialogDescription className="text-xs">
              A step-by-step guide from registering a complaint to closing it.
            </DialogDescription>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <div className="text-xs font-semibold text-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </div>
            <div className="text-[11px] text-muted-foreground">{progress}% Completed</div>
          </div>
          <div className="w-20 sm:w-28 h-2 bg-muted rounded-full overflow-hidden border">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-border">
        <aside className="w-full md:w-56 lg:w-60 shrink-0 bg-muted/10 p-3 space-y-3.5 overflow-y-auto max-h-48 md:max-h-none">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/70">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.stepIndices.map((idx) => {
                  const isActive = idx === currentStep;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentStep(idx)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-2 cursor-pointer border ${
                        isActive
                          ? `${BRAND_BUTTON} border-transparent shadow-xs font-semibold`
                          : "bg-card/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          isActive
                            ? "bg-white/20 font-bold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="truncate flex-1 leading-snug">{STEPS[idx].shortTitle}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="p-2.5 rounded-lg bg-card/60 border border-border/60 text-[11px] space-y-1 text-muted-foreground">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Tip</span>
            </div>
            <p className="leading-snug">
              HO means Super Admin and Head Site Supervisor. You only see the actions your role can take at the complaint&apos;s current status.
            </p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-card">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <StepImage
              key={currentStep}
              src={step.image}
              alt={step.title}
              fallback={ILLUSTRATIONS[currentStep]?.()}
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary font-semibold text-xs"
                >
                  Step {currentStep + 1} of {STEPS.length}
                </Badge>
                <h3 className="text-xl font-bold tracking-tight text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{step.description}</p>
              {step.details && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {step.details.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border"
                    >
                      <Info className="w-3 h-3 text-blue-500 shrink-0" />
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <WhoDoesThis roles={step.roles} />
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t bg-card/70 shrink-0 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="hidden sm:flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to step ${i + 1}`}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === currentStep
                      ? `w-6 ${BRAND_BG}`
                      : i < currentStep
                      ? `w-2 ${BRAND_BG} opacity-60`
                      : "w-2 bg-muted hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => setCurrentStep((s) => Math.min(last, s + 1))}
              disabled={currentStep === last}
              className={`gap-1.5 font-semibold cursor-pointer ${BRAND_BUTTON}`}
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Header icon that opens the complaints tutorial. */
export function ComplaintsHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="relative bg-accent p-1.5 rounded-sm"
        onClick={() => setOpen(true)}
        title="Need help?"
      >
        <CircleHelp />
        <span className="sr-only">Need help</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-5xl h-[85vh] flex flex-col">
          <ComplaintsHelpGuide open={open} />
        </DialogContent>
      </Dialog>
    </>
  );
}
