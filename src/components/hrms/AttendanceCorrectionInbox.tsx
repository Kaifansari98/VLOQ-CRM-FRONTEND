"use client";

import { useState } from "react";
import { useAttendanceAction, useAttendanceCorrectionInbox, type ServerCorrection } from "@/api/hrms-attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toastManager } from "@/components/ui/toast";

const localInput = (value: string | null | undefined, timeZone: string) => {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

export default function AttendanceCorrectionInbox({ vendorId, userId }: { vendorId?: number; userId?: number }) {
  const [page, setPage] = useState(1);
  const query = useAttendanceCorrectionInbox(vendorId, page);
  const action = useAttendanceAction(vendorId, userId);
  const [selected, setSelected] = useState<ServerCorrection | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [note, setNote] = useState("");
  const timeZone = query.data?.vendor_time_zone || "UTC";
  const decide = async (status: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    try {
      await action.mutateAsync({ kind: "decision", id: selected.id, status, review_note: note, requested_check_in: checkIn || undefined, requested_check_out: checkOut || undefined });
      setSelected(null);
      toastManager.add({ title: status === "APPROVED" ? "Attendance correction approved" : "Attendance correction rejected", type: "success" });
    } catch (error: any) { toastManager.add({ title: error?.response?.data?.message || "Could not review correction.", type: "error" }); }
  };
  return <section className="rounded-xl border bg-background p-5 shadow-sm">
    <h2 className="text-base font-semibold">Attendance correction approvals</h2>
    <p className="mt-1 text-xs text-muted-foreground">Review pending requests for your vendor. Your own requests must be reviewed by another authorized administrator.</p>
    {query.isError ? <p role="alert" className="mt-4 text-sm text-destructive">Could not load requests. <button className="underline" onClick={() => query.refetch()}>Retry</button></p> : query.isPending ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading requests…</p> : !query.data?.items.length ? <p className="py-6 text-sm text-muted-foreground">No pending correction requests.</p> : <div className="mt-3 divide-y">{query.data.items.map(request => <div key={request.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{request.user?.user_name} · {request.attendance_date.slice(0, 10)}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">{request.reason}</p></div><Button size="sm" variant="outline" disabled={request.user?.id === userId} onClick={() => { setSelected(request); setCheckIn(localInput(request.requested_check_in, timeZone)); setCheckOut(localInput(request.requested_check_out, timeZone)); setNote(""); }}>{request.user?.id === userId ? "Your request" : "Review"}</Button></div>)}</div>}
    {(query.data?.total_pages || 0) > 1 && <div className="mt-3 flex items-center justify-end gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-xs">{page} / {query.data?.total_pages}</span><Button size="sm" variant="outline" disabled={page >= (query.data?.total_pages || 1)} onClick={() => setPage(page + 1)}>Next</Button></div>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open && !action.isPending) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>Review attendance correction</DialogTitle><DialogDescription>{selected?.user?.user_name} · {selected?.attendance_date.slice(0, 10)} · Times in {timeZone}. Existing times are retained when a field is left empty.</DialogDescription></DialogHeader><p className="whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-sm">{selected?.reason}</p><div className="space-y-2"><Label htmlFor="review-check-in">Correct check-in</Label><DateTimePicker id="review-check-in" value={checkIn} onChange={setCheckIn} baseDate={selected?.attendance_date?.slice(0, 10)} placeholder="Select check-in time" /></div><div className="space-y-2"><Label htmlFor="review-check-out">Correct check-out</Label><DateTimePicker id="review-check-out" value={checkOut} onChange={setCheckOut} baseDate={selected?.attendance_date?.slice(0, 10)} placeholder="Select check-out time" /></div><div className="space-y-2"><Label htmlFor="review-note">Review note (required for rejection)</Label><Textarea id="review-note" maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /></div><DialogFooter><Button variant="outline" disabled={action.isPending || !note.trim()} onClick={() => decide("REJECTED")}>Reject</Button><Button disabled={action.isPending} onClick={() => decide("APPROVED")}>{action.isPending ? "Saving…" : "Approve correction"}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
