"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import {
  useCompanyVendorsForMaster,
  useCreateCompanyVendor,
  useUpdateCompanyVendor,
  useUpdateCompanyVendorStatus,
} from "@/hooks/useTypesMaster";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import ClearInput from "@/components/origin-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type CompanyVendorRow = {
  srNo: number;
  id: number;
  vendor_code: string;
  company_name: string;
  point_of_contact: string;
  contact_no: string;
  email?: string | null;
  address?: string | null;
  in_house: boolean;
  status: string;
};

const getCompanyVendorColumns = ({
  onEdit,
  onToggleStatus,
}: {
  onEdit: (row: CompanyVendorRow) => void;
  onToggleStatus: (row: CompanyVendorRow) => void;
}): ColumnDef<CompanyVendorRow>[] => [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("srNo")}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "vendor_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor Code" />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company Name" />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "point_of_contact",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Point of Contact" />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "contact_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact No." />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "in_house",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="In House" />
    ),
    cell: ({ row }) => {
      const inHouse = row.getValue("in_house") as boolean;
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            inHouse
              ? "border-blue-200 bg-blue-500/10 text-blue-600"
              : "border-zinc-200 bg-zinc-100 text-zinc-600",
          )}
        >
          {inHouse ? "Yes" : "No"}
        </span>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = ((row.getValue("status") as string) || "").toLowerCase();
      const isActive = status === "active";

      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            isActive
              ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
              : "border-zinc-200 bg-zinc-100 text-zinc-600",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isActive ? "bg-emerald-500" : "bg-zinc-400",
            )}
          />
          {status || "—"}
        </span>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: "actions",
    header: () => <div>Action</div>,
    cell: ({ row }) => {
      const original = row.original;
      const isActive = original.status === "active";

      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(original)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onToggleStatus(original)}>
            {isActive ? "Mark Inactive" : "Mark Active"}
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

interface CompanyVendorMastersTableProps {
  vendorIdOverride?: number;
}

export default function CompanyVendorMastersTable({
  vendorIdOverride,
}: CompanyVendorMastersTableProps) {
  const router = useRouter();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = vendorIdOverride ?? useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError, error, refetch } = useCompanyVendorsForMaster(vendorId);
  const createCompanyVendorMutation = useCreateCompanyVendor(vendorId);
  const updateCompanyVendorMutation = useUpdateCompanyVendor(vendorId);
  const updateCompanyVendorStatusMutation = useUpdateCompanyVendorStatus(vendorId);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<CompanyVendorRow | null>(null);
  const [statusTargetRow, setStatusTargetRow] = React.useState<CompanyVendorRow | null>(null);
  const [form, setForm] = React.useState({
    vendor_code: "",
    company_name: "",
    point_of_contact: "",
    contact_no: "",
    email: "",
    address: "",
    in_house: false,
  });

  const tableData = React.useMemo<CompanyVendorRow[]>(
    () =>
      (data?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        vendor_code: item.vendor_code,
        company_name: item.company_name,
        point_of_contact: item.point_of_contact,
        contact_no: item.contact_no,
        email: item.email,
        address: item.address,
        in_house: item.in_house ?? false,
        status: item.is_active ? "active" : "inactive",
      })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getCompanyVendorColumns({
      onEdit: (row) => {
        router.push(`/dashboard/masters-management/field-masters/company-vendor/edit/${row.id}`);
      },
      onToggleStatus: (row) => {
        setStatusTargetRow(row);
        setOpenConfirmStatusModal(true);
      },
    }),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const search = String(value ?? "").trim().toLowerCase();
      if (!search) return true;
      return String(row.getValue(columnId) ?? "").toLowerCase().includes(search);
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  const resetForm = () => {
    setForm({
      vendor_code: "",
      company_name: "",
      point_of_contact: "",
      contact_no: "",
      email: "",
      address: "",
      in_house: false,
    });
  };

  const canSubmit =
    !!userId &&
    !!form.vendor_code.trim() &&
    !!form.company_name.trim() &&
    !!form.point_of_contact.trim() &&
    !!form.contact_no.trim();

  const handleCreate = () => {
    if (!canSubmit) return;

    createCompanyVendorMutation.mutate(
      {
        vendor_code: form.vendor_code.trim(),
        company_name: form.company_name.trim(),
        point_of_contact: form.point_of_contact.trim(),
        contact_no: form.contact_no.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        in_house: form.in_house,
        created_by: userId!,
      },
      {
        onSuccess: () => {
          refetch();
          resetForm();
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleEdit = () => {
    if (!editingRow || !canSubmit) return;

    updateCompanyVendorMutation.mutate(
      {
        companyVendorId: editingRow.id,
        payload: {
          vendor_code: form.vendor_code.trim(),
          company_name: form.company_name.trim(),
          point_of_contact: form.point_of_contact.trim(),
          contact_no: form.contact_no.trim(),
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          in_house: form.in_house,
          updated_by: userId!,
        },
      },
      {
        onSuccess: () => {
          refetch();
          resetForm();
          setEditingRow(null);
          setOpenEditModal(false);
        },
      },
    );
  };

  const handleToggleStatus = () => {
    if (!statusTargetRow || !userId || !vendorId) return;

    updateCompanyVendorStatusMutation.mutate(
      {
        companyVendorId: statusTargetRow.id,
        payload: {
          updated_by: userId,
          is_deleted: statusTargetRow.status === "active",
        },
      },
      {
        onSuccess: () => {
          refetch();
          setOpenConfirmStatusModal(false);
          setStatusTargetRow(null);
        },
      },
    );
  };

  const formFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="company-vendor-code">Vendor Code</Label>
        <Input
          id="company-vendor-code"
          value={form.vendor_code}
          onChange={(e) => setForm((prev) => ({ ...prev, vendor_code: e.target.value }))}
          placeholder="Enter vendor code"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-name">Company Name</Label>
        <Input
          id="company-name"
          value={form.company_name}
          onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
          placeholder="Enter company name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="point-of-contact">Point Of Contact</Label>
        <Input
          id="point-of-contact"
          value={form.point_of_contact}
          onChange={(e) => setForm((prev) => ({ ...prev, point_of_contact: e.target.value }))}
          placeholder="Enter point of contact"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-number">Contact Number</Label>
        <Input
          id="contact-number"
          value={form.contact_no}
          onChange={(e) => setForm((prev) => ({ ...prev, contact_no: e.target.value }))}
          placeholder="Enter contact number"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-email">Email</Label>
        <Input
          id="company-email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-address">Address</Label>
        <Input
          id="company-address"
          value={form.address}
          onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Enter address"
        />
      </div>
      <div className="space-y-2">
        <Label>Is this in house ?</Label>
        <div className="flex items-center gap-6 pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-house-yes"
              checked={form.in_house === true}
              onCheckedChange={(checked) => {
                if (checked) {
                  setForm((prev) => ({ ...prev, in_house: true }));
                } else {
                  setForm((prev) => ({ ...prev, in_house: false }));
                }
              }}
            />
            <Label htmlFor="in-house-yes" className="font-normal cursor-pointer">
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-house-no"
              checked={form.in_house === false}
              onCheckedChange={(checked) => {
                if (checked) {
                  setForm((prev) => ({ ...prev, in_house: false }));
                } else {
                  setForm((prev) => ({ ...prev, in_house: true }));
                }
              }}
            />
            <Label htmlFor="in-house-no" className="font-normal cursor-pointer">
              No
            </Label>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Company Vendor Masters</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all company vendor master entries from one place.
            </p>
          </div>

          <Button onClick={() => router.push("/dashboard/masters-management/field-masters/company-vendor/create")} className="sm:self-start">
            <Plus className="mr-2 h-4 w-4" />
            Create Company Vendor
          </Button>
        </CardHeader>

        <CardContent>
          {!vendorId ? (
            <div className="py-10 text-sm text-red-500">
              Vendor not found for the current user.
            </div>
          ) : !userId ? (
            <div className="py-10 text-sm text-red-500">
              User not found for the current session.
            </div>
          ) : isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">
              Loading company vendors...
            </div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.message || "Failed to load company vendors."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ClearInput
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search company vendor..."
                  className="h-9 w-full md:w-72"
                />
              </div>
            </DataTable>
          )}
        </CardContent>
      </Card>



      <Dialog
        open={openConfirmStatusModal}
        onOpenChange={(open) => {
          setOpenConfirmStatusModal(open);
          if (!open) setStatusTargetRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusTargetRow?.status === "active"
                ? "Mark Company Vendor Inactive"
                : "Mark Company Vendor Active"}
            </DialogTitle>
            <DialogDescription>
              {statusTargetRow?.status === "active"
                ? "This company vendor will be marked inactive."
                : "This company vendor will be marked active again."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Company Vendor:</span>{" "}
            <span className="font-medium">{statusTargetRow?.company_name}</span>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenConfirmStatusModal(false);
                setStatusTargetRow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              disabled={!statusTargetRow || updateCompanyVendorStatusMutation.isPending}
            >
              {updateCompanyVendorStatusMutation.isPending
                ? "Updating..."
                : statusTargetRow?.status === "active"
                  ? "Mark Inactive"
                  : "Mark Active"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
