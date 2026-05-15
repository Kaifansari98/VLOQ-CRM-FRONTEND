"use client";

import {
  deletePOItem,
  getPOById,
  PODetail,
  POStatus,
  updatePOItem,
  updatePOStatus,
} from "@/api/purchaseOrder/purchaseOrder";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  ShoppingCart,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { STATUS_CFG, StatusBadge } from "../shared/poUtils";
import { POHero } from "./POHero";
import { POSummaryCards } from "./POSummaryCards";
import { POSupplierCard } from "./POSupplierCard";
import { POItemsSection } from "./POItemsSection";
import { POFinancialSidebar } from "./POFinancialSidebar";
import { POReceiptsSection } from "./POReceiptsSection";
import { POTimelineSection } from "./POTimelineSection";
import { ConfirmModal } from "../modals/ConfirmModal";
import { EditPOItemModal } from "../modals/EditPOItemModal";
import { GRNFromPOModal } from "../modals/GRNFromPOModal";

export function PODetailDrawer({
  vendorId,
  poId,
  onClose,
  onRefresh,
}: {
  vendorId: number;
  poId: number;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const userId = Number(useAppSelector((s) => s.auth.user?.id));

  const [po, setPo] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editItem, setEditItem] = useState<PODetail["items"][0] | null>(null);
  const [deleteItem, setDeleteItem] = useState<PODetail["items"][0] | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<POStatus | "cancel" | null>(null);
  const [showGRN, setShowGRN] = useState(false);

  const load = useCallback(() => {
    setLoading(true);

    getPOById(vendorId, poId)
      .then(setPo)
      .catch(() => {
        toastManager.add({
          title: "Failed to load PO",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [vendorId, poId]);

  useEffect(() => {
    load();
  }, [load]);

  const canEdit = po && !["Cancelled", "Received"].includes(po.status);
  const nextStatuses = po ? STATUS_CFG[po.status]?.next ?? [] : [];

  const saveItem = async (payload: any) => {
    if (!editItem) return;

    setActionLoading(true);

    try {
      await updatePOItem(vendorId, poId, editItem.id, payload);

      toastManager.add({
        title: "PO item updated",
        type: "success",
      });

      setEditItem(null);
      load();
      onRefresh();
    } catch {
      toastManager.add({
        title: "Failed to update item",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const removeItem = async () => {
    if (!deleteItem) return;

    setActionLoading(true);

    try {
      await deletePOItem(vendorId, poId, deleteItem.id);

      toastManager.add({
        title: "Item removed",
        type: "success",
      });

      setDeleteItem(null);
      load();
      onRefresh();
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message ?? "Failed to remove item",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (status: POStatus, remarks?: string) => {
    setActionLoading(true);

    try {
      await updatePOStatus(vendorId, poId, userId, status, remarks);

      toastManager.add({
        title: `PO marked as ${STATUS_CFG[status]?.label ?? status}`,
        type: "success",
      });

      setConfirmStatus(null);
      load();
      onRefresh();
    } catch {
      toastManager.add({
        title: "Action failed",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-6xl flex-col bg-zinc-50 shadow-2xl dark:bg-zinc-950">
        <div className="shrink-0 border-b bg-background px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                <ShoppingCart size={20} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-black">
                    {po?.po_no ?? "Loading..."}
                  </p>
                  {po && <StatusBadge status={po.status} />}
                </div>

                {po && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {po.companyVendor.company_name} • PI {po.purchaseIntent.intent_no}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {po &&
                nextStatuses
                  .filter((s) => s !== "Cancelled")
                  .map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      className="h-9 gap-1.5 rounded-xl bg-indigo-600 text-xs hover:bg-indigo-700"
                      onClick={() => setConfirmStatus(s)}
                    >
                      <CheckCircle2 size={13} />
                      {STATUS_CFG[s]?.label}
                    </Button>
                  ))}

              {po && ["Approved", "PartiallyReceived"].includes(po.status) && (
                <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-emerald-600 text-xs hover:bg-emerald-700"
                  onClick={() => setShowGRN(true)}
                >
                  <ClipboardList size={13} />
                  Create GRN
                </Button>
              )}

              {po && canEdit && nextStatuses.includes("Cancelled") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-xl border-red-200 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setConfirmStatus("cancel")}
                >
                  <XCircle size={13} />
                  Cancel
                </Button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={19} />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5">
              <Skeleton className="mb-5 h-40 rounded-[28px]" />
              <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 rounded-3xl" />
                  ))}
                </div>
                <Skeleton className="h-96 rounded-[28px]" />
              </div>
            </div>
          ) : !po ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Failed to load PO.
            </div>
          ) : (
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_340px]">
              <section className="space-y-5">
                <POHero po={po} />
                <POSummaryCards po={po} />
                <POSupplierCard po={po} />
                <POItemsSection
                  po={po}
                  canEdit={!!canEdit}
                  onEditItem={setEditItem}
                  onDeleteItem={setDeleteItem}
                />
                <POReceiptsSection po={po} onCreateGRN={() => setShowGRN(true)} />
                <POTimelineSection po={po} />
              </section>

              <aside className="lg:sticky lg:top-5 lg:h-fit">
                <POFinancialSidebar po={po} />
              </aside>
            </div>
          )}
        </div>
      </div>

      {editItem && (
        <EditPOItemModal
          item={editItem}
          loading={actionLoading}
          onClose={() => setEditItem(null)}
          onSave={saveItem}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          title="Remove Item"
          message={`Remove ${deleteItem.product.product_name} from this PO?`}
          confirmLabel="Remove"
          danger
          loading={actionLoading}
          onClose={() => setDeleteItem(null)}
          onConfirm={removeItem}
        />
      )}

      {confirmStatus && po && (
        <ConfirmModal
          title={confirmStatus === "cancel" ? "Cancel PO" : `Mark as ${STATUS_CFG[confirmStatus]?.label}`}
          message={po.po_no}
          confirmLabel={confirmStatus === "cancel" ? "Cancel PO" : "Confirm"}
          danger={confirmStatus === "cancel"}
          loading={actionLoading}
          withRemarks
          onClose={() => setConfirmStatus(null)}
          onConfirm={(remarks) =>
            updateStatus(confirmStatus === "cancel" ? "Cancelled" : confirmStatus, remarks)
          }
        />
      )}

      {showGRN && po && (
        <GRNFromPOModal
          vendorId={vendorId}
          userId={userId}
          poId={po.id}
          onClose={() => setShowGRN(false)}
          onCreated={() => {
            setShowGRN(false);
            load();
            onRefresh();
          }}
        />
      )}
    </>
  );
}