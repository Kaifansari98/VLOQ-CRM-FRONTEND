"use client";

import { useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock,
  Eye,
  FileText,
  History,
  ImageIcon,
  Loader2,
  Lock,
  MessageSquareQuote,
  MoreHorizontal,
  Paperclip,
  Pause,
  Play,
  Send,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomeDatePicker from "@/components/date-picker";
import { cn } from "@/lib/utils";
import {
  type StaffTracker,
  type TrackerAction,
  type TrackerRevision,
  type TrackerStage,
  type TrackerStageKey,
  type TrackerStatus,
  trackerError,
  useStaffTracker,
  useTrackerAction,
} from "@/api/project-tracker";

// The Client Tracker tab is hidden in production for now.
export const isClientTrackerEnabled =
  (process.env.NEXT_PUBLIC_ENVIRONMENT ?? "").toUpperCase() !== "PRODUCTION";

// CRM "Client Tracker" tab: what the client sees in the app for this booking,
// and the controls to keep it accurate. Internal notes never reach the client;
// every field marked "shown to the client" does.

const STATUS: Record<TrackerStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
  IN_PROGRESS: { label: "In progress", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  ON_HOLD: { label: "On hold", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  DELAYED: { label: "Delayed", className: "bg-red-500/10 text-red-700 dark:text-red-400", dot: "bg-red-500" },
  COMPLETED: { label: "Completed", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
};

const day = (value: string | null | undefined) => (value ? format(parseISO(value), "d MMM yyyy") : null);
const stamp = (value: string) => format(parseISO(value), "d MMM yyyy, h:mm a");

function StatusPill({ status }: { status: TrackerStatus }) {
  const meta = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

type DialogMode =
  | { kind: "status"; stage: TrackerStage }
  | { kind: "expectedDate"; stage: TrackerStage }
  | { kind: "revision"; stage: TrackerStage }
  | { kind: "remark"; stage: TrackerStage }
  | { kind: "update" }
  | { kind: "decision"; revision: TrackerRevision };

export function ClientTrackerTab({ leadId, vendorId }: { leadId: number; vendorId: number }) {
  const tracker = useStaffTracker(vendorId, leadId);
  const [dialog, setDialog] = useState<DialogMode | null>(null);

  if (tracker.isPending)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  if (tracker.isError || !tracker.data)
    return (
      <div className="rounded-xl border px-4 py-10 text-center text-sm text-muted-foreground">
        {trackerError(tracker.error)}
      </div>
    );

  const t = tracker.data;
  const { can_edit, can_approve } = t.permissions;
  const pending = t.revisions.filter((r) => r.status === "PENDING");
  const pendingStages = new Set(pending.map((r) => r.stage));
  const overdue = t.stages.filter((s) => s.overdue);

  return (
    <div className="space-y-4">
      <Summary tracker={t} onPublish={can_edit ? () => setDialog({ kind: "update" }) : undefined} />

      {t.project.completed && (
        <Notice tone="muted" icon={Lock}>
          The project is completed, so its client tracker is read-only.
        </Notice>
      )}
      {overdue.map((s) => (
        <Notice key={s.key} tone="red" icon={AlertTriangle}>
          <span className="font-semibold">{s.name}</span> passed its expected date ({day(s.latest_expected_date)}).
          The client still sees it as {STATUS[s.status].label.toLowerCase()}. Mark it Delayed with a reason and a
          revised date.
        </Notice>
      ))}

      {pending.length > 0 && (
        <section className="rounded-xl border border-amber-300/60 bg-amber-500/5">
          <header className="flex items-center gap-2 border-b border-amber-300/50 px-4 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <CalendarClock className="size-4" /> Date revisions awaiting approval
            {!can_approve && <span className="font-normal opacity-80">· an admin or super-admin approves these</span>}
          </header>
          <div className="divide-y divide-amber-300/40">
            {pending.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 text-xs">
                  <p>
                    <span className="font-semibold">{r.stage_name}</span>{" "}
                    <span className="text-muted-foreground line-through">{day(r.previous_date)}</span> →{" "}
                    <span className="font-semibold">{day(r.proposed_date)}</span>
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {r.reason} · {r.requested_by ?? "—"}, {stamp(r.requested_at)}
                  </p>
                </div>
                {can_approve && (
                  <Button size="sm" className="h-8 text-xs" onClick={() => setDialog({ kind: "decision", revision: r })}>
                    Review
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border">
        <header className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
          <h3 className="text-sm font-semibold">Project journey</h3>
          <span className="text-xs text-muted-foreground">
            {t.project.milestones_completed} of {t.project.milestones_total} milestones completed
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Completed</th>
                <th className="px-3 py-2 font-medium">Original date</th>
                <th className="px-3 py-2 font-medium">Latest approved</th>
                <th className="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {t.stages.map((s) => {
                const isCurrent = s.key === t.current?.key;
                return (
                  <tr key={s.key} className={cn(isCurrent && "bg-orange-500/[0.04]")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-semibold">
                        {s.name}
                        {isCurrent && (
                          <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-400">
                            Current
                          </span>
                        )}
                      </div>
                      {s.items && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {s.items.map((it) => (
                            <span key={it.id} className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]">
                              {it.title}
                              <span className={cn("size-1.5 rounded-full", STATUS[it.status].dot)} />
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill status={s.status} />
                        {s.overdue && <span className="text-[10px] font-semibold text-red-600">Overdue</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{day(s.started_at) ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{day(s.completed_at) ?? "—"}</td>
                    <td className="px-3 py-3">
                      {s.original_expected_date ? (
                        <span className={cn(s.revised && "text-muted-foreground line-through")}>
                          {day(s.original_expected_date)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {s.revised ? <span className="font-semibold">{day(s.latest_expected_date)}</span> : <span className="text-muted-foreground">—</span>}
                      {pendingStages.has(s.key) && (
                        <span className="ml-1.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {can_edit && s.status !== "COMPLETED" && (
                        <StageMenu
                          stage={s}
                          current={isCurrent}
                          revisionPending={pendingStages.has(s.key)}
                          onPick={(kind) => setDialog({ kind, stage: s })}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {t.current && <CurrentStagePanel tracker={t} onEdit={can_edit ? (kind) => setDialog({ kind, stage: t.current! }) : undefined} />}

      <Tabs defaultValue="updates" className="w-full">
        <TabsList className="h-auto gap-1 px-1 py-1">
          <TabsTrigger value="updates" className="text-xs">
            <Eye className="mr-1 size-3.5 opacity-60" /> Published updates ({t.updates.length})
          </TabsTrigger>
          <TabsTrigger value="revisions" className="text-xs">
            <CalendarClock className="mr-1 size-3.5 opacity-60" /> Date revisions ({t.revisions.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">
            <History className="mr-1 size-3.5 opacity-60" /> Audit log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="updates">
          <UpdatesList updates={t.updates} />
        </TabsContent>
        <TabsContent value="revisions">
          <RevisionHistory revisions={t.revisions} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLog audit={t.audit} />
        </TabsContent>
      </Tabs>

      {dialog && (
        <TrackerDialog
          key={JSON.stringify(dialog)}
          mode={dialog}
          tracker={t}
          vendorId={vendorId}
          leadId={leadId}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function Summary({ tracker: t, onPublish }: { tracker: StaffTracker; onPublish?: () => void }) {
  const exp = t.expected_completion;
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-gradient-to-r from-muted/40 to-transparent p-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Client app · {t.project.lead_code}
        </p>
        <h2 className="mt-0.5 text-base font-semibold">{t.project.name}</h2>
        <p className="text-xs text-muted-foreground">
          {t.project.client_name}
          {t.project.site_address ? ` · ${t.project.site_address}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-[11px] text-muted-foreground">Current stage</p>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
            {t.project.completed ? "Completed" : t.current?.name ?? "—"}
            <StatusPill status={t.project.completed ? "COMPLETED" : t.current?.status ?? "PENDING"} />
          </div>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Expected completion</p>
          <p className="mt-1 text-sm font-semibold">
            {day(exp.latest) ?? "To be confirmed"}
            {exp.original && exp.latest !== exp.original && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">{day(exp.original)}</span>
            )}
          </p>
        </div>
        {onPublish && (
          <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={onPublish}>
            <Send className="size-3.5" /> Publish update
          </Button>
        )}
      </div>
    </section>
  );
}

function Notice({
  tone,
  icon: Icon,
  children,
}: {
  tone: "red" | "muted";
  icon: typeof AlertTriangle;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs",
        tone === "red" ? "border-red-300/60 bg-red-500/5 text-red-800 dark:text-red-300" : "bg-muted/30 text-muted-foreground",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function StageMenu({
  stage,
  current,
  revisionPending,
  onPick,
}: {
  stage: TrackerStage;
  current: boolean;
  revisionPending: boolean;
  onPick: (kind: "status" | "expectedDate" | "revision" | "remark") => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${stage.name}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 text-xs">
        {current && (
          <>
            <DropdownMenuItem className="text-xs" onClick={() => onPick("status")}>
              <Pause className="mr-2 size-3.5" /> Change status
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => onPick("remark")}>
              <MessageSquareQuote className="mr-2 size-3.5" /> Client remark
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {stage.original_expected_date ? (
          <DropdownMenuItem className="text-xs" disabled={revisionPending} onClick={() => onPick("revision")}>
            <CalendarClock className="mr-2 size-3.5" />
            {revisionPending ? "Revision pending approval" : "Request date revision"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="text-xs" onClick={() => onPick("expectedDate")}>
            <CalendarClock className="mr-2 size-3.5" /> Set expected date
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CurrentStagePanel({
  tracker: t,
  onEdit,
}: {
  tracker: StaffTracker;
  onEdit?: (kind: "status" | "remark") => void;
}) {
  const c = t.current!;
  return (
    <section className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Current stage card · {c.name}</h3>
          <StatusPill status={c.status} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Started on</dt>
          <dd className="font-medium">{day(c.started_at) ?? "—"}</dd>
          <dt className="text-muted-foreground">Responsible team</dt>
          <dd className="font-medium">{c.department}</dd>
          <dt className="text-muted-foreground">Expected</dt>
          <dd className="font-medium">{day(c.latest_expected_date) ?? "Date to be confirmed"}</dd>
        </dl>
        {c.hold && (
          <div
            className={cn(
              "mt-3 space-y-1.5 rounded-lg border p-3 text-xs",
              c.hold.status === "ON_HOLD" ? "border-amber-300/60 bg-amber-500/5" : "border-red-300/60 bg-red-500/5",
            )}
          >
            <p>
              <span className="font-semibold">Reason: </span>
              {c.hold.reason}
            </p>
            <p>
              <span className="font-semibold">Action: </span>
              {c.hold.action}
            </p>
            {c.hold.resume_date && (
              <p>
                <span className="font-semibold">Expected to resume: </span>
                {day(c.hold.resume_date)}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col rounded-lg bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">Latest remark (shown to the client)</p>
          {onEdit && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEdit("remark")}>
              {c.remark ? "Edit" : "Add"}
            </Button>
          )}
        </div>
        {c.remark ? (
          <>
            <p className="mt-1.5 text-sm">{c.remark}</p>
            {c.remark_at && <p className="mt-auto pt-2 text-[11px] text-muted-foreground">{stamp(c.remark_at)}</p>}
          </>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">No remark published for this stage yet.</p>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" className="mt-3 h-8 self-start text-xs" onClick={() => onEdit("status")}>
            Change status
          </Button>
        )}
      </div>
    </section>
  );
}

const KIND_LABEL: Record<string, string> = {
  MANUAL: "Update",
  HOLD: "On hold",
  DELAYED: "Delayed",
  RESUMED: "Resumed",
  REVISION: "Date revised",
  MILESTONE: "Milestone (automatic)",
};

function UpdatesList({ updates }: { updates: StaffTracker["updates"] }) {
  if (!updates.length)
    return <p className="rounded-xl border px-4 py-8 text-center text-xs text-muted-foreground">Nothing published yet.</p>;
  return (
    <div className="divide-y rounded-xl border">
      {updates.map((u) => (
        <article key={u.id} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">{u.stage_name}</span>
            <span>{KIND_LABEL[u.kind] ?? u.kind}</span>·<span>{stamp(u.at)}</span>
            {u.published_by && <span>· by {u.published_by}</span>}
          </div>
          <p className="mt-1 text-sm font-semibold">{u.title}</p>
          {u.description && <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">{u.description}</p>}
          {u.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {u.files.map((f) => {
                const Icon = f.media_type === "PHOTO" ? ImageIcon : f.media_type === "VIDEO" ? Video : FileText;
                return (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] hover:bg-muted"
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function RevisionHistory({ revisions }: { revisions: TrackerRevision[] }) {
  if (!revisions.length)
    return <p className="rounded-xl border px-4 py-8 text-center text-xs text-muted-foreground">No date revisions yet.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-xs">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 font-medium">Stage</th>
            <th className="px-3 py-2 font-medium">From → proposed</th>
            <th className="px-3 py-2 font-medium">Reason</th>
            <th className="px-3 py-2 font-medium">Requested</th>
            <th className="px-3 py-2 font-medium">Decision</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {revisions.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2.5 font-medium">{r.stage_name}</td>
              <td className="px-3 py-2.5">
                {day(r.previous_date) ?? "—"} → {day(r.proposed_date)}
                {r.approved_date && r.approved_date !== r.proposed_date && (
                  <span className="block text-[11px] text-muted-foreground">approved as {day(r.approved_date)}</span>
                )}
              </td>
              <td className="max-w-[240px] px-3 py-2.5 text-muted-foreground">{r.reason}</td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {r.requested_by ?? "—"}
                <span className="block text-[11px]">{stamp(r.requested_at)}</span>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    "font-semibold",
                    r.status === "APPROVED" && "text-emerald-700",
                    r.status === "REJECTED" && "text-red-700",
                    r.status === "PENDING" && "text-amber-700",
                  )}
                >
                  {r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : "Rejected"}
                </span>
                {r.decided_by && (
                  <span className="block text-[11px] text-muted-foreground">
                    {r.decided_by}, {r.decided_at && stamp(r.decided_at)}
                  </span>
                )}
                {r.decision_remarks && <span className="block text-[11px] text-muted-foreground">{r.decision_remarks}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const AUDIT_LABEL: Record<string, string> = {
  STATUS_IN_PROGRESS: "Marked in progress",
  STATUS_ON_HOLD: "Marked on hold",
  STATUS_DELAYED: "Marked delayed",
  EXPECTED_DATE_SET: "Expected date set",
  REVISION_REQUESTED: "Date revision requested",
  REVISION_APPROVED: "Date revision approved",
  REVISION_REJECTED: "Date revision rejected",
  REMARK_PUBLISHED: "Client remark published",
  UPDATE_PUBLISHED: "Update published",
};

function AuditLog({ audit }: { audit: StaffTracker["audit"] }) {
  if (!audit.length)
    return <p className="rounded-xl border px-4 py-8 text-center text-xs text-muted-foreground">No changes recorded yet.</p>;
  return (
    <ol className="divide-y rounded-xl border">
      {audit.map((a) => (
        <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-xs">
          <span>
            <span className="font-semibold">{AUDIT_LABEL[a.action] ?? a.action}</span>
            {a.stage && <span className="text-muted-foreground"> · {a.stage.replace(/_/g, " ").toLowerCase()}</span>}
          </span>
          <span className="text-muted-foreground">
            {a.by ?? "—"} · {stamp(a.at)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

const FILE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,application/pdf";

function TrackerDialog({
  mode,
  tracker: t,
  vendorId,
  leadId,
  onClose,
}: {
  mode: DialogMode;
  tracker: StaffTracker;
  vendorId: number;
  leadId: number;
  onClose: () => void;
}) {
  const action = useTrackerAction(vendorId, leadId);
  const stage = "stage" in mode ? mode.stage : null;
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"IN_PROGRESS" | "ON_HOLD" | "DELAYED">(
    // Resuming is the usual next step once a stage is on hold or delayed.
    t.current?.hold ? "IN_PROGRESS" : "ON_HOLD",
  );
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState("");
  const [date, setDate] = useState("");
  const [text, setText] = useState(mode.kind === "remark" ? t.current?.remark ?? "" : "");
  const [title, setTitle] = useState("");
  const [updateStage, setUpdateStage] = useState<TrackerStageKey>(t.current?.key ?? "HANDOVER");
  const [files, setFiles] = useState<File[]>([]);
  const [outcome, setOutcome] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);

  const meta: Record<DialogMode["kind"], { title: string; description: string; confirm: string }> = {
    status: {
      title: `Status · ${stage?.name}`,
      description: "The client sees this status, the reason and your action plan. Internal notes don't belong here.",
      confirm: "Update status",
    },
    expectedDate: {
      title: `Expected date · ${stage?.name}`,
      description: "The first expected date becomes the original commitment and can't be overwritten. Later changes go through a date revision.",
      confirm: "Set date",
    },
    revision: {
      title: `Date revision · ${stage?.name}`,
      description: "An admin or super-admin approves the revision before the client sees the new date. The original date stays on record.",
      confirm: "Request revision",
    },
    remark: {
      title: `Client remark · ${stage?.name}`,
      description: "Shown on the client's current-stage card. Write it for the client.",
      confirm: "Publish remark",
    },
    update: {
      title: "Publish project update",
      description: "Appears in the client's Project Updates. Only the files you attach here are shown to the client.",
      confirm: "Publish",
    },
    decision: {
      title: "Review date revision",
      description: "Approving makes the new date visible to the client as the latest commitment.",
      confirm: "Save decision",
    },
  };

  const build = (): TrackerAction | null => {
    const next: Record<string, string> = {};
    const need = (key: string, value: string, message: string) => {
      if (!value.trim()) next[key] = message;
    };
    let request: TrackerAction | null = null;
    switch (mode.kind) {
      case "status":
        if (status !== "IN_PROGRESS") {
          need("reason", reason, "The reason is required.");
          need("plan", plan, "The action plan is required.");
        }
        if (status === "DELAYED") need("date", date, "Pick the revised expected date.");
        request = {
          kind: "status",
          stage: stage!.key,
          status,
          reason: reason.trim() || undefined,
          action: plan.trim() || undefined,
          resume_date: status === "ON_HOLD" ? date || undefined : undefined,
          revised_date: status === "DELAYED" ? date : undefined,
          remarks: status === "IN_PROGRESS" ? text.trim() || undefined : undefined,
        };
        break;
      case "expectedDate":
        need("date", date, "Pick the expected date.");
        request = { kind: "expectedDate", stage: stage!.key, date };
        break;
      case "revision":
        need("date", date, "Pick the revised date.");
        need("reason", reason, "The reason is required.");
        request = { kind: "revision", stage: stage!.key, proposed_date: date, reason: reason.trim() };
        break;
      case "remark":
        need("text", text, "Write the remark.");
        request = { kind: "remark", stage: stage!.key, remark: text.trim() };
        break;
      case "update":
        need("title", title, "Give the update a title.");
        request = { kind: "update", stage: updateStage, title: title.trim(), description: text.trim() || undefined, files };
        break;
      case "decision":
        if (outcome === "REJECTED") need("text", text, "Say why it's rejected.");
        request = {
          kind: "decision",
          revision_id: mode.revision.id,
          outcome,
          approved_date: outcome === "APPROVED" ? date || undefined : undefined,
          remarks: text.trim() || undefined,
        };
        break;
    }
    setErrors(next);
    return Object.keys(next).length ? null : request;
  };

  const confirm = async () => {
    const request = build();
    if (!request) return;
    setFailure(null);
    try {
      await action.mutateAsync(request);
      onClose();
    } catch (e) {
      setFailure(trackerError(e));
    }
  };

  const m = meta[mode.kind];
  const datePicker = (label: string, hint?: string, restriction: "futureOnly" | "none" = "futureOnly") => (
    <Field label={label} hint={hint} error={errors.date}>
      <CustomeDatePicker
        value={date}
        onChange={(v) => setDate(v ?? "")}
        restriction={restriction}
        className={cn("h-9 w-full rounded-lg text-xs", errors.date && "border-destructive")}
        placeholder="Select a date"
      />
    </Field>
  );
  const area = (key: "reason" | "plan" | "text", label: string, value: string, set: (v: string) => void, hint?: string) => (
    <Field label={label} hint={hint} error={errors[key]}>
      <Textarea value={value} onChange={(e) => set(e.target.value)} rows={3} className="text-xs" />
    </Field>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !action.isPending && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="text-base">{m.title}</DialogTitle>
          <DialogDescription className="text-xs">{m.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {mode.kind === "status" && (
            <>
              <Field label="Status shown to the client">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["IN_PROGRESS", "In progress", Play],
                      ["ON_HOLD", "On hold", Pause],
                      ["DELAYED", "Delayed", Clock],
                    ] as const
                  ).map(([value, label, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                        status === value ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                      )}
                    >
                      <Icon className="size-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </Field>
              {status === "IN_PROGRESS" ? (
                area("text", "Update for the client (optional)", text, setText, "Published as a 'resumed' update.")
              ) : (
                <>
                  {area("reason", status === "ON_HOLD" ? "Reason for hold" : "Reason for delay", reason, setReason, "Shown to the client.")}
                  {area("plan", status === "ON_HOLD" ? "Action being taken by Shambhala" : "Action plan", plan, setPlan, "Shown to the client.")}
                  {status === "ON_HOLD"
                    ? datePicker("Expected resumption date (optional)")
                    : datePicker(
                        "Revised expected completion date",
                        "Goes for approval unless you're an admin; the client sees it once approved.",
                      )}
                </>
              )}
            </>
          )}
          {mode.kind === "expectedDate" && datePicker("Expected completion date", undefined, "none")}
          {mode.kind === "revision" && (
            <>
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
                Current commitment: <span className="font-semibold">{day(stage!.latest_expected_date)}</span>
                {stage!.revised && <span className="text-muted-foreground"> (original {day(stage!.original_expected_date)})</span>}
              </p>
              {datePicker("Revised date", undefined, "none")}
              {area("reason", "Reason for revision", reason, setReason, "Shown to the client with the new date once approved.")}
            </>
          )}
          {mode.kind === "remark" && area("text", "Remark", text, setText)}
          {mode.kind === "update" && (
            <>
              <Field label="Stage">
                <Select value={updateStage} onValueChange={(v) => setUpdateStage(v as TrackerStageKey)}>
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {t.stages.map((s) => (
                      <SelectItem key={s.key} value={s.key} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Title" error={errors.title}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="h-9 text-xs" placeholder="e.g. Kitchen carcasses completed" />
              </Field>
              {area("text", "Description (optional)", text, setText)}
              <Field label={`Photos, videos or PDFs (${files.length}/10)`}>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={files.length >= 10} onClick={() => fileRef.current?.click()}>
                  <Paperclip className="size-3.5" /> Add files
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  multiple
                  accept={FILE_ACCEPT}
                  onChange={(e) => {
                    setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])].slice(0, 10));
                    e.target.value = "";
                  }}
                />
                {files.length > 0 && (
                  <div className="space-y-1">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md border px-2 py-1 text-[11px]">
                        <span className="truncate">{f.name}</span>
                        <button type="button" title="Remove file" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </>
          )}
          {mode.kind === "decision" && (
            <>
              <div className="space-y-1 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                <p>
                  <span className="font-semibold">{mode.revision.stage_name}</span>: {day(mode.revision.previous_date)} →{" "}
                  <span className="font-semibold">{day(mode.revision.proposed_date)}</span>
                </p>
                <p className="text-muted-foreground">{mode.revision.reason}</p>
                <p className="text-muted-foreground">
                  Requested by {mode.revision.requested_by ?? "—"}, {stamp(mode.revision.requested_at)}
                </p>
              </div>
              <Field label="Decision">
                <div className="grid grid-cols-2 gap-2">
                  {(["APPROVED", "REJECTED"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOutcome(o)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium",
                        outcome === o ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                      )}
                    >
                      {o === "APPROVED" ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                      {o === "APPROVED" ? "Approve" : "Reject"}
                    </button>
                  ))}
                </div>
              </Field>
              {outcome === "APPROVED" && datePicker("Approve a different date (optional)", "Leave empty to approve the proposed date.", "none")}
              {area("text", outcome === "REJECTED" ? "Reason for rejection" : "Remarks (optional)", text, setText)}
            </>
          )}
        </div>
        <DialogFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-3">
          {failure && <p className="mr-auto text-xs font-medium text-destructive">{failure}</p>}
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={onClose} disabled={action.isPending}>
            Cancel
          </Button>
          <Button size="sm" className="h-9 gap-2 text-xs font-semibold" onClick={() => void confirm()} disabled={action.isPending}>
            {action.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {m.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
