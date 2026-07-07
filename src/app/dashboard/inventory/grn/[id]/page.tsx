"use client";

import {
  confirmGRN,
  getGRNById,
  GRNDetail,
} from "@/api/grn/grn";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAppSelector } from "@/redux/store";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const n = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const fmtMoney = (value: any) => {
  const num = n(value);

  return num > 0
    ? `₹${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
};

const fmtQty = (value: any) => {
  const num = n(value);

  return num > 0
    ? num.toLocaleString("en-IN", {
        maximumFractionDigits: 3,
      })
    : "—";
};

const fmt = (iso: string | null | undefined) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtDt = (iso: string | null | undefined) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function statusClass(status: string) {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Confirmed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Closed":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

export default function GRNDetailPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));

  const { id } = useParams<{ id: string }>();
  const grnId = Number(id);
  const router = useRouter();

  const [grn, setGrn] = useState<GRNDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = () => {
    if (!vendorId || !grnId) return;

    setLoading(true);

    getGRNById(vendorId, grnId)
      .then(setGrn)
      .catch(() => {
        toastManager.add({
          title: "Failed to fetch GRN details",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [vendorId, grnId]);

  const totals = useMemo(() => {
    const items = grn?.items ?? [];

    return {
      itemCount: items.length,
      receivedQty: items.reduce((sum, item) => sum + n(item.received_qty), 0),
      acceptedQty: items.reduce((sum, item) => sum + n(item.accepted_qty), 0),
      rejectedQty: items.reduce((sum, item) => sum + n(item.rejected_qty), 0),
      totalAmount: n(grn?.total_amount),
    };
  }, [grn]);

  const handleConfirm = async () => {
    if (!vendorId || !grnId || !userId) return;

    setConfirmLoading(true);

    try {
      await confirmGRN(vendorId, grnId, userId);

      toastManager.add({
        title: "GRN confirmed successfully",
        type: "success",
      });

      setConfirmOpen(false);
      load();
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to confirm GRN",
        type: "error",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/inventory/grn">
                  GRN
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>{grn?.grn_no || "View Details"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/inventory/grn")}
                >
                  <ArrowLeft size={14} className="mr-1" />
                  Back
                </Button>

                {grn && <StatusBadge status={grn.status} />}
              </div>

              <h1 className="text-xl font-bold">
                {loading ? "Loading..." : grn?.grn_no || "GRN Details"}
              </h1>

              {grn && (
                <p className="text-sm text-muted-foreground">
                  Received {fmt(grn.received_date)} against PO{" "}
                  {grn.purchaseOrder?.po_no ?? "—"}
                </p>
              )}
            </div>

            {grn?.status === "Draft" && (
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 size={14} className="mr-1" />
                Confirm GRN
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          ) : !grn ? (
            <div className="rounded-2xl border bg-background p-10 text-center text-muted-foreground">
              Failed to load GRN details.
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-5">
                <SummaryBox icon={ClipboardList} label="GRN No" value={grn.grn_no} />
                <SummaryBox icon={Truck} label="Supplier" value={grn.companyVendor?.company_name ?? "—"} />
                <SummaryBox icon={Package} label="Items" value={totals.itemCount} />
                <SummaryBox icon={CheckCircle2} label="Accepted Qty" value={fmtQty(totals.acceptedQty)} />
                <SummaryBox icon={IndianRupee} label="Total Amount" value={fmtMoney(totals.totalAmount)} />
              </div>

              <div className="rounded-2xl border bg-background shadow-sm">
                <div className="border-b px-4 py-3">
                  <p className="font-bold">GRN Information</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <InfoRow label="GRN No" value={grn.grn_no} />
                      <InfoRow label="Status" value={<StatusBadge status={grn.status} />} />
                      <InfoRow label="PO No" value={grn.purchaseOrder?.po_no ?? "—"} />
                      <InfoRow
                        label="Supplier"
                        value={`${grn.companyVendor?.company_name ?? "—"} ${
                          grn.companyVendor?.vendor_code
                            ? `(${grn.companyVendor.vendor_code})`
                            : ""
                        }`}
                      />
                      <InfoRow label="Received Date" value={fmt(grn.received_date)} />
                      <InfoRow label="Invoice No" value={grn.invoice_no || "—"} />
                      <InfoRow label="Invoice Date" value={fmt(grn.invoice_date)} />
                      <InfoRow label="Invoice Amount" value={fmtMoney(grn.invoice_amount)} />
                      <InfoRow label="Vehicle No" value={grn.vehicle_no || "—"} />
                      <InfoRow label="Gate Entry No" value={grn.gate_entry_no || "—"} />
                      <InfoRow label="Created By" value={grn.createdBy?.user_name ?? "—"} />
                      <InfoRow label="Confirmed By" value={grn.confirmedBy?.user_name ?? "—"} />
                      <InfoRow label="Confirmed At" value={fmtDt(grn.confirmed_at)} />
                      <InfoRow label="Remarks" value={grn.remarks || "—"} />
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border bg-background shadow-sm">
                <div className="border-b px-4 py-3">
                  <p className="font-bold">GRN Items</p>
                  <p className="text-xs text-muted-foreground">
                    Tabular received, accepted, rejected and amount details.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1300px] text-xs">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-3 text-left">Product</th>
                        <th className="px-3 py-3 text-left">Code</th>
                        <th className="px-3 py-3 text-left">HSN</th>
                        <th className="px-3 py-3 text-left">UOM</th>
                        <th className="px-3 py-3 text-right">Received</th>
                        <th className="px-3 py-3 text-right">Accepted</th>
                        <th className="px-3 py-3 text-right">Rejected</th>
                        <th className="px-3 py-3 text-right">Rate</th>
                        <th className="px-3 py-3 text-right">Taxable</th>
                        <th className="px-3 py-3 text-right">GST %</th>
                        <th className="px-3 py-3 text-right">Tax</th>
                        <th className="px-3 py-3 text-right">Total</th>
                        <th className="px-3 py-3 text-left">Status</th>
                        <th className="px-3 py-3 text-left">Rejection Reason</th>
                      </tr>
                    </thead>

                    <tbody>
                      {grn.items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={14}
                            className="px-3 py-8 text-center text-muted-foreground"
                          >
                            No GRN items found.
                          </td>
                        </tr>
                      ) : (
                        grn.items.map((item) => (
                          <tr key={item.id} className="border-t hover:bg-muted/30">
                            <td className="px-3 py-3 font-semibold">
                              {item.product?.product_name ?? "—"}
                            </td>
                            <td className="px-3 py-3">
                              {item.product?.article_code ?? "—"}
                            </td>
                            <td className="px-3 py-3">
                              {item.hsn_code || item.product?.hsn_code || "—"}
                            </td>
                            <td className="px-3 py-3">{item.uom || "—"}</td>
                            <td className="px-3 py-3 text-right">
                              {fmtQty(item.received_qty)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtQty(item.accepted_qty)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtQty(item.rejected_qty)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(item.rate || item.unit_price)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(item.taxable_amount || item.amount)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {item.tax_pct ? `${n(item.tax_pct)}%` : "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(item.tax_amount)}
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-indigo-600">
                              {fmtMoney(item.total_amount)}
                            </td>
                            <td className="px-3 py-3">{item.status}</td>
                            <td className="px-3 py-3">
                              {item.rejection_reason || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    <tfoot className="border-t bg-muted/50 font-bold">
                      <tr>
                        <td className="px-3 py-3" colSpan={4}>
                          Total
                        </td>
                        <td className="px-3 py-3 text-right">
                          {fmtQty(totals.receivedQty)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {fmtQty(totals.acceptedQty)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {fmtQty(totals.rejectedQty)}
                        </td>
                        <td className="px-3 py-3" colSpan={4} />
                        <td className="px-3 py-3 text-right text-indigo-600">
                          {fmtMoney(totals.totalAmount)}
                        </td>
                        <td className="px-3 py-3" colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border bg-background shadow-sm">
                <div className="border-b px-4 py-3">
                  <p className="font-bold">Additional Amounts</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <InfoRow label="Subtotal" value={fmtMoney(grn.subtotal_amount)} />
                      <InfoRow label="Taxable Amount" value={fmtMoney(grn.taxable_amount)} />
                      <InfoRow label="CGST" value={fmtMoney(grn.cgst_amount)} />
                      <InfoRow label="SGST" value={fmtMoney(grn.sgst_amount)} />
                      <InfoRow label="IGST" value={fmtMoney(grn.igst_amount)} />
                      <InfoRow label="CESS" value={fmtMoney(grn.cess_amount)} />
                      <InfoRow label="Tax Amount" value={fmtMoney(grn.tax_amount)} />
                      <InfoRow label="Discount" value={fmtMoney(grn.discount_amount)} />
                      <InfoRow label="Packing" value={fmtMoney(grn.packing_amount)} />
                      <InfoRow label="Freight" value={fmtMoney(grn.freight_amount)} />
                      <InfoRow label="Other Charges" value={fmtMoney(grn.other_charges_amount)} />
                      <InfoRow label="Round Off" value={fmtMoney(grn.roundoff_amount)} />
                      <InfoRow label="Total Amount" value={fmtMoney(grn.total_amount)} />
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border bg-background shadow-sm">
                <div className="border-b px-4 py-3">
                  <p className="font-bold">Transport Details</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <InfoRow label="E-way Bill No" value={grn.eway_bill_no || "—"} />
                      <InfoRow label="Transporter" value={grn.transporter_name || "—"} />
                      <InfoRow label="LR No" value={grn.lr_no || "—"} />
                      <InfoRow label="LR Date" value={fmt(grn.lr_date)} />
                    </tbody>
                  </table>
                </div>
              </div>

              {grn.debitCreditNotes?.length > 0 && (
                <div className="rounded-2xl border bg-background shadow-sm">
                  <div className="border-b px-4 py-3">
                    <p className="font-bold">Debit / Credit Notes</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-3 py-3 text-left">Note No</th>
                          <th className="px-3 py-3 text-left">Type</th>
                          <th className="px-3 py-3 text-right">Amount</th>
                          <th className="px-3 py-3 text-left">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {grn.debitCreditNotes.map((note) => (
                          <tr key={note.id} className="border-t">
                            <td className="px-3 py-3 font-semibold">
                              {note.note_no}
                            </td>
                            <td className="px-3 py-3">{note.type}</td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(note.amount)}
                            </td>
                            <td className="px-3 py-3">{note.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {confirmOpen && grn && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!confirmLoading) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-base font-bold">Confirm GRN</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {grn.grn_no}
              </p>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Are you sure you want to confirm this GRN? Stock and PO received
              quantities will be updated after confirmation.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={confirmLoading}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={confirmLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleConfirm}
              >
                {confirmLoading ? (
                  <Loader2 size={13} className="mr-1 animate-spin" />
                ) : null}
                Confirm GRN
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryBox({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <Icon size={17} className="mb-3 text-indigo-500" />
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <tr className="border-t first:border-t-0">
      <td className="w-56 bg-muted/30 px-4 py-3 text-xs font-bold uppercase text-muted-foreground">
        {label}
      </td>
      <td className="px-4 py-3 text-sm">{value}</td>
    </tr>
  );
}