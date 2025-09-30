"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppSelector } from "@/redux/store";
import {
  useOnHoldLeads,
  useLostLeads,
  useLostApprovalLeads,
  useUpdateActivityStatus,
} from "@/hooks/useActivityStatus";
import { DataTable } from "@/components/data-table/data-table";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import React from "react";
import type { Lead } from "@/api/leads";
import {
  getPendingLeadsColumns,
  PendingLeadRow,
} from "./pending-leads-columns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RevertRemarkModal from "@/components/generics/RevertRemarkModal";
import { useRevertActivityStatus } from "@/hooks/useActivityStatus";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useQueryClient } from "@tanstack/react-query";

export default function PendingLeadsTable() {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const router = useRouter();

  const { data: onHoldData = [], isLoading: onHoldLoading } = useOnHoldLeads(
    vendorId!
  );
  const { data: lostData = [], isLoading: lostLoading } = useLostLeads(
    vendorId!
  );

  const { data: lostApprovalData = [], isLoading: lostApprovalLoading } =
    useLostApprovalLeads(vendorId!);

  const [activeLead, setActiveLead] = React.useState<PendingLeadRow | null>(
    null
  );
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [openRemark, setOpenRemark] = React.useState(false);
  const [openActivityStatus, setOpenActivityStatus] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState<
    "revert" | "lost" | null
  >(null);

  const [tab, setTab] = React.useState<"onHold" | "lostApproval" | "lost">(
    "onHold"
  );

  const markAsLostMutation = useUpdateActivityStatus();

  const revertMutation = useRevertActivityStatus();

  // Lead → PendingLeadRow
  const processLeads = (leads: Lead[]): PendingLeadRow[] =>
    leads.map((lead, index) => ({
      id: lead.id,
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      priority: lead.priority || "",
      siteAddress: lead.site_address || "",
      billingName: lead.billing_name || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      activity_status: lead.activity_status || "",
      productTypes:
        lead.productMappings?.map((pm) => pm.productType.type).join(", ") || "",
      productStructures:
        lead.leadProductStructureMapping
          ?.map((psm) => psm.productStructure.type)
          .join(", ") || "",
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at || "",
      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "",
      initial_site_measurement_date: lead.initial_site_measurement_date || "",
      // 👇 ensure accountId is present for payload. Adjust according to your API shape.
      accountId: (lead as any).account?.id ?? (lead as any).account_id ?? 0,
    }));

  const onHoldProcessed = React.useMemo(
    () => processLeads(onHoldData),
    [onHoldData]
  );
  const lostProcessed = React.useMemo(() => processLeads(lostData), [lostData]);
  const lostApprovalProcessed = React.useMemo(
    () => processLeads(lostApprovalData),
    [lostApprovalData]
  );

  const columns = React.useMemo(
    () =>
      getPendingLeadsColumns({
        tab,
        onRevert: (lead) => {
          setActiveLead(lead);
          setActiveAction("revert");
          setOpenConfirm(true);
        },
        onMarkAsLost: (lead) => {
          setActiveLead(lead);
          setActiveAction("lost");
          setOpenActivityStatus(true);
        },
      }),
    [tab, vendorId, userId]
  );

  const onConfirmRevert = () => {
    setOpenConfirm(false);
    setOpenRemark(true);
  };

  const onSubmitRemark = (remark: string) => {
    if (!activeLead || !vendorId || !userId) {
      toast.error("Missing vendor/user/lead info");
      return;
    }

    revertMutation.mutate(
      {
        leadId: activeLead.id,
        payload: {
          vendorId,
          accountId: activeLead.accountId || 0,
          userId,
          remark,
          createdBy: userId,
        },
      },
      {
        onSuccess: () => {
          setOpenRemark(false);
          setActiveLead(null);
        },
      }
    );
  };

  const handleRowDoubleClick = (row: PendingLeadRow) => {
    const leadId = row.id;
    const accountId = row.accountId;
    router.push(
      `/dashboard/sales-executive/pending-leads/details/${leadId}?accountId=${accountId}`
    );
  };

  const table = useReactTable({
    data:
      tab === "onHold"
        ? onHoldProcessed
        : tab === "lostApproval"
        ? lostApprovalProcessed
        : lostProcessed,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "onHold" | "lostApproval" | "lost")}
      >
        <TabsList>
          <TabsTrigger value="onHold">On Hold Leads</TabsTrigger>
          <TabsTrigger value="lostApproval">Lost Approval Leads</TabsTrigger>
          <TabsTrigger value="lost">Lost Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="onHold">
          {onHoldLoading ? (
            <p>Loading...</p>
          ) : (
            <DataTable table={table} onRowDoubleClick={handleRowDoubleClick} />
          )}
        </TabsContent>

        <TabsContent value="lostApproval">
          {lostApprovalLoading ? (
            <p>Loading...</p>
          ) : (
            <DataTable table={table} onRowDoubleClick={handleRowDoubleClick} />
          )}
        </TabsContent>

        <TabsContent value="lost">
          {lostLoading ? (
            <p>Loading...</p>
          ) : (
            <DataTable table={table} onRowDoubleClick={handleRowDoubleClick} />
          )}
        </TabsContent>
      </Tabs>

      {/* Step 1: Confirmation Modal */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert Lead to OnGoing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the lead back to OnGoing from its current
              OnHold/Lost status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRevert}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Remark Modal */}
      <RevertRemarkModal
        open={openRemark}
        onOpenChange={setOpenRemark}
        onSubmitRemark={(remark) => {
          if (!activeLead || !vendorId || !userId) return;

          revertMutation.mutate(
            {
              leadId: activeLead.id,
              payload: {
                vendorId,
                accountId: activeLead.accountId || 0,
                userId,
                remark,
                createdBy: userId,
              },
            },
            {
              onSuccess: () => {
                toast.success("Lead reverted to OnGoing!");
                setOpenRemark(false); // ✅ close modal
                setActiveLead(null); // ✅ clear active lead
                queryClient.invalidateQueries({ queryKey: ["onHoldLeads"] });
                queryClient.invalidateQueries({
                  queryKey: ["lostApprovalLeads"],
                });
                queryClient.invalidateQueries({ queryKey: ["lostLeads"] });
              },
            }
          );
        }}
        loading={revertMutation.isPending}
      />

      {/* Activity Status Modal (Mark as Lost) */}
      <ActivityStatusModal
        open={openActivityStatus}
        onOpenChange={setOpenActivityStatus}
        statusType="lost"
        onSubmitRemark={(remark) => {
          if (!activeLead || !vendorId || !userId) return;

          markAsLostMutation.mutate(
            {
              leadId: activeLead.id,
              payload: {
                vendorId,
                accountId: activeLead.accountId || 0,
                userId,
                status: "lost",
                remark,
                createdBy: userId,
              },
            },
            {
              onSuccess: () => {
                toast.success("Lead marked as Lost!");
                setOpenActivityStatus(false); // ✅ close modal
                setActiveLead(null); // ✅ clear active lead
                queryClient.invalidateQueries({
                  queryKey: ["lostApprovalLeads"],
                });
                queryClient.invalidateQueries({ queryKey: ["lostLeads"] });
              },
            }
          );
        }}
        loading={markAsLostMutation.isPending}
      />
    </>
  );
}
