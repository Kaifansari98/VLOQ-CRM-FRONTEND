"use client";

import {
  listPaymentRequisitionsApi,
  markPaymentDoneApi,
  reschedulePaymentRequisitionApi,
  PaymentMode,
} from "@/api/inventory/paymentRequisition";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const statusClass = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "PartiallyPaid":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Overdue":
      return "bg-red-100 text-red-700 border-red-200";
    case "Cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const fmtMoney = (value: any) => {
  const n = Number(value || 0);

  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const fmtDate = (value: string | null) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PaymentRequisitionPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [due, setDue] = useState("");

  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);

  const load = () => {
    if (!vendorId) return;

    setLoading(true);

    listPaymentRequisitionsApi(vendorId, {
      page,
      search,
      status,
      due,
    })
      .then(setData)
      .catch(() => {
        toastManager.add({
          title: "Failed to load payment requisitions",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [vendorId, page, status, due]);

  const rows = data?.rows ?? [];

  return (
    <main className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold">Payment Requisitions</h1>
          <p className="text-sm text-muted-foreground">
            Track supplier payments due against approved purchase orders.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={load}>
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                load();
              }
            }}
            placeholder="Search PO / Supplier"
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="PartiallyPaid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={due}
          onChange={(e) => {
            setDue(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="">All Due</option>
          <option value="today">Due Today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
        </select>

        <Button
          type="button"
          onClick={() => {
            setPage(1);
            load();
          }}
        >
          Apply
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-3 text-left">Due Date</th>
                <th className="px-3 py-3 text-left">PO No</th>
                <th className="px-3 py-3 text-left">Supplier</th>
                <th className="px-3 py-3 text-left">Stage</th>
                <th className="px-3 py-3 text-right">Scheduled</th>
                <th className="px-3 py-3 text-right">Paid</th>
                <th className="px-3 py-3 text-right">Pending</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td colSpan={9} className="px-3 py-3">
                      <Skeleton className="h-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-10 text-center text-muted-foreground"
                  >
                    No payment requisitions found.
                  </td>
                </tr>
              ) : (
                rows.map((row: any) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-3 font-medium">
                      {fmtDate(row.due_date)}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {row.purchaseOrder?.po_no ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {row.purchaseOrder?.companyVendor?.company_name ?? "—"}
                    </td>
                    <td className="px-3 py-3">{row.stage_name}</td>
                    <td className="px-3 py-3 text-right">
                      {fmtMoney(row.scheduled_amount)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {fmtMoney(row.paid_amount)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold">
                      {fmtMoney(row.pending_amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {row.status !== "Paid" &&
                          row.status !== "Cancelled" && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setRescheduleTarget(row)}
                              >
                                <CalendarClock size={13} className="mr-1" />
                                Reschedule
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setPaymentTarget(row)}
                              >
                                <IndianRupee size={13} className="mr-1" />
                                Pay
                              </Button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleModal
          row={rescheduleTarget}
          userId={userId}
          onClose={() => setRescheduleTarget(null)}
          onDone={() => {
            setRescheduleTarget(null);
            load();
          }}
        />
      )}

      {paymentTarget && (
        <PaymentModal
          row={paymentTarget}
          userId={userId}
          onClose={() => setPaymentTarget(null)}
          onDone={() => {
            setPaymentTarget(null);
            load();
          }}
        />
      )}
    </main>
  );
}

function RescheduleModal({
  row,
  userId,
  onClose,
  onDone,
}: {
  row: any;
  userId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const [dueDate, setDueDate] = useState(
    row.due_date ? String(row.due_date).slice(0, 10) : ""
  );
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!dueDate) {
      toastManager.add({
        title: "Due date is required",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      await reschedulePaymentRequisitionApi(vendorId, row.id, {
        user_id: userId,
        due_date: dueDate,
        remarks: remarks || undefined,
      });

      toastManager.add({
        title: "Payment rescheduled",
        type: "success",
      });

      onDone();
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to reschedule payment",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-2xl">
        <h3 className="text-base font-bold">Reschedule Payment</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.purchaseOrder?.po_no} · {row.stage_name}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold">New Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Close
          </Button>

          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  row,
  userId,
  onClose,
  onDone,
}: {
  row: any;
  userId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));

  const [amount, setAmount] = useState(String(row.pending_amount || ""));
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("BankTransfer");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amountNum = Number(amount || 0);

    if (amountNum <= 0) {
      toastManager.add({
        title: "Invalid payment amount",
        type: "error",
      });
      return;
    }

    if (amountNum > Number(row.pending_amount || 0)) {
      toastManager.add({
        title: "Payment amount cannot exceed pending amount",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      await markPaymentDoneApi(vendorId, row.id, {
        user_id: userId,
        amount: amountNum,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        reference_no: referenceNo || undefined,
        remarks: remarks || undefined,
      });

      toastManager.add({
        title: "Payment marked successfully",
        type: "success",
      });

      onDone();
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to mark payment",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-2xl">
        <h3 className="text-base font-bold">Mark Payment Done</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.purchaseOrder?.po_no} · Pending {fmtMoney(row.pending_amount)}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold">Amount *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Payment Date *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Payment Mode *</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="Cash">Cash</option>
              <option value="BankTransfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="RTGS">RTGS</option>
              <option value="NEFT">NEFT</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold">Reference No</label>
            <input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Close
          </Button>

          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : null}
            Mark Paid
          </Button>
        </div>
      </div>
    </div>
  );
}