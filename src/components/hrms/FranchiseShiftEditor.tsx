"use client";
import { useState } from "react";
import { Clock3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUpdateFranchiseShift, type CalendarLocation } from "@/api/attendance-calendar";
import { leaveErrorMessage } from "@/api/hrms-leaves";
import { toastManager } from "@/components/ui/toast";
export function FranchiseShiftRow({ vendorId, location }: { vendorId: number; location: CalendarLocation }) {
  const [hours, setHours] = useState(String(location.shift_minutes / 60));
  const action = useUpdateFranchiseShift(vendorId);
  const minutes = Number(hours) * 60;
  const valid = !!hours && Number.isInteger(minutes) && minutes >= 15 && minutes <= 1440 && minutes % 15 === 0;
  const save = async () => {
    if (!valid) return;
    try { await action.mutateAsync({ id: Number(location.id), shift_minutes: minutes }); toastManager.add({ title: `Shift saved for ${location.name}`, type: "success" }); }
    catch (error) { toastManager.add({ title: leaveErrorMessage(error), type: "error" }); }
  };
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-4"><div className="min-w-0"><p className="break-words text-sm font-semibold">{location.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{location.unit} · Half day at {(valid ? minutes : location.shift_minutes) / 120}h</p></div><div className="flex items-center gap-2"><div className="relative"><Input aria-label={`Shift hours for ${location.name}`} className="h-9 w-24 pr-7 tabular-nums" type="number" min="0.25" max="24" step="0.25" value={hours} disabled={action.isPending} onChange={e => setHours(e.target.value)} /><span className="pointer-events-none absolute right-3 top-2.5 text-[11px] text-muted-foreground">h</span></div><Button size="sm" variant="outline" className="h-9 gap-1.5" disabled={!valid || minutes === location.shift_minutes || action.isPending} onClick={save}><Save className="size-3.5" />{action.isPending ? "Saving…" : "Save"}</Button></div></div>;
}
export default function FranchiseShiftEditor({ vendorId, locations, open, onOpenChange }: { vendorId: number; locations: CalendarLocation[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Clock3 className="size-5 text-[#FF8D28]" />Location shifts</DialogTitle><DialogDescription>Set the daily shift for each branch, franchise and factory. Default: 8 hours. Full day is 100% of the shift; half day starts at 50%. Enter 0.25–24 hours in 15-minute increments.</DialogDescription></DialogHeader><div className="space-y-3">{locations.filter(location => location.id !== "head-office").map(location => <FranchiseShiftRow key={`${location.id}:${location.shift_minutes}`} location={location} vendorId={vendorId} />)}{!locations.some(location => location.id !== "head-office") && <p className="py-6 text-sm text-muted-foreground">No locations found. Unassigned employees use the 8-hour default.</p>}</div><p className="rounded-lg bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">New attendance sessions keep the shift in effect at check-in. Older records without a saved shift use the current location setting. Hours worked exclude breaks.</p></DialogContent></Dialog>;
}
