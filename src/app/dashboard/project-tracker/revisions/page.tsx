"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarClock, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomeDatePicker from "@/components/date-picker";
import { useAppSelector } from "@/redux/store";
import {
  type PendingRevision,
  trackerError,
  usePendingRevisions,
  useTrackerAction,
} from "@/api/project-tracker";

// HO approval queue for Client Project Tracker date revisions. Only an
// approved date is shown to the client.

const day = (value: string | null) => (value ? format(parseISO(value), "d MMM yyyy") : "—");

export default function DateRevisionsPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) as number | undefined;
  const revisions = usePendingRevisions(vendorId);
  const [open, setOpen] = useState<PendingRevision | null>(null);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarClock className="size-5 text-muted-foreground" /> Date revisions
        </h1>
        <p className="text-sm text-muted-foreground">
          Expected-date changes for the client project tracker, waiting for approval. Clients keep seeing the
          current approved date until you decide.
        </p>
      </header>

      {revisions.isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : revisions.isError ? (
        <p className="rounded-xl border px-4 py-10 text-center text-sm text-muted-foreground">
          {trackerError(revisions.error)}
        </p>
      ) : !revisions.data.rows.length ? (
        <p className="rounded-xl border px-4 py-12 text-center text-sm text-muted-foreground">
          Nothing is waiting for approval.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Lead</th>
                <th className="px-3 py-2.5 font-medium">Stage</th>
                <th className="px-3 py-2.5 font-medium">Current → proposed</th>
                <th className="px-3 py-2.5 font-medium">Reason</th>
                <th className="px-3 py-2.5 font-medium">Requested by</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {revisions.data.rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{r.lead_code}</span>
                    <span className="block text-xs text-muted-foreground">{r.client_name}</span>
                  </td>
                  <td className="px-3 py-3">{r.stage_name}</td>
                  <td className="px-3 py-3">
                    <span className="text-muted-foreground line-through">{day(r.previous_date)}</span>{" "}
                    → <span className="font-semibold">{day(r.proposed_date)}</span>
                  </td>
                  <td className="max-w-[280px] px-3 py-3 text-xs text-muted-foreground">{r.reason}</td>
                  <td className="px-3 py-3 text-xs">
                    {r.requested_by ?? "—"}
                    <span className="block text-muted-foreground">
                      {format(parseISO(r.requested_at), "d MMM yyyy, h:mm a")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {revisions.data.can_approve && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => setOpen(r)}>
                        Review
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && vendorId && <DecisionDialog revision={open} vendorId={vendorId} onClose={() => setOpen(null)} />}
    </div>
  );
}

function DecisionDialog({
  revision: r,
  vendorId,
  onClose,
}: {
  revision: PendingRevision;
  vendorId: number;
  onClose: () => void;
}) {
  const action = useTrackerAction(vendorId);
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const decide = async (outcome: "APPROVED" | "REJECTED") => {
    if (outcome === "REJECTED" && !remarks.trim()) return setError("Say why the revision is rejected.");
    setError(null);
    try {
      await action.mutateAsync({
        kind: "decision",
        revision_id: r.id,
        outcome,
        approved_date: outcome === "APPROVED" ? date || undefined : undefined,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (e) {
      setError(trackerError(e));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !action.isPending && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {r.lead_code} · {r.stage_name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {day(r.previous_date)} → {day(r.proposed_date)} · requested by {r.requested_by ?? "—"}
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs">{r.reason}</p>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Approve a different date (optional)</label>
          <CustomeDatePicker
            value={date}
            onChange={(v) => setDate(v ?? "")}
            className="h-9 w-full rounded-lg text-xs"
            placeholder="Leave empty to approve the proposed date"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Remarks (required to reject)</label>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="text-xs" />
        </div>
        <p className="text-xs">
          <Link href={`/dashboard/leads/leadstable/details/${r.lead_id}`} className="text-primary hover:underline">
            Open lead
          </Link>
        </p>
        <DialogFooter className="flex-row items-center justify-end gap-2">
          {error && <p className="mr-auto text-xs font-medium text-destructive">{error}</p>}
          <Button variant="outline" size="sm" className="h-9 text-xs" disabled={action.isPending} onClick={() => void decide("REJECTED")}>
            Reject
          </Button>
          <Button size="sm" className="h-9 gap-2 text-xs" disabled={action.isPending} onClick={() => void decide("APPROVED")}>
            {action.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
