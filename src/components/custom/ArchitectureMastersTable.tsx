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
import { Plus, Upload, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useArchitectureMasters,
  useCreateArchitectureMaster,
  useUpdateArchitectureMaster,
  useUpdateArchitectureMasterStatus,
  useDeleteArchitectureMaster,
  useUploadArchitectureMasters,
} from "@/hooks/useArchitectureMaster";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
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
import { useAppSelector } from "@/redux/store";
import { FileUploadField } from "@/components/custom/file-upload";
import BaseModal from "@/components/utils/baseModal";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type ArchitectureMasterRow = {
  srNo: number;
  id: number;
  vendorId: number;
  name: string;
  email: string;
  mobile: string;
  alt_mobile?: string;
  is_active: boolean;
  status: "active" | "inactive";
};

const getArchitectureColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  onEdit: (row: ArchitectureMasterRow) => void;
  onDelete: (row: ArchitectureMasterRow) => void;
  onToggleStatus: (row: ArchitectureMasterRow) => void;
}): ColumnDef<ArchitectureMasterRow>[] => [
  {
    accessorKey: "srNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sr. No." />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("srNo")}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "mobile",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mobile" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "alt_mobile",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Alt. Mobile" />,
    cell: ({ row }) => row.getValue("alt_mobile") || "—",
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
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
            className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-zinc-400")}
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
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:border-red-300"
            onClick={() => onDelete(original)}
          >
            Delete
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

interface ArchitectureMastersTableProps {
  vendorIdOverride?: number;
}

const defaultForm = { name: "", email: "", mobile: "", alt_mobile: "" };

export default function ArchitectureMastersTable({ vendorIdOverride }: ArchitectureMastersTableProps) {
  const vendorId = vendorIdOverride ?? useAppSelector((state) => state.auth.user?.vendor_id);

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);
  const [openConfirmStatusModal, setOpenConfirmStatusModal] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<ArchitectureMasterRow | null>(null);
  const [deletingRow, setDeletingRow] = React.useState<ArchitectureMasterRow | null>(null);
  const [statusTargetRow, setStatusTargetRow] = React.useState<ArchitectureMasterRow | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; mobile?: string; alt_mobile?: string }>({});
  const [isMobileValid, setIsMobileValid] = React.useState(true);
  const [isAltMobileValid, setIsAltMobileValid] = React.useState(true);

  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const { data, isLoading, isError, error, refetch } = useArchitectureMasters({ page, limit: 50, search });
  const createMutation = useCreateArchitectureMaster();
  const updateMutation = useUpdateArchitectureMaster();
  const updateStatusMutation = useUpdateArchitectureMasterStatus();
  const deleteMutation = useDeleteArchitectureMaster();
  const uploadMutation = useUploadArchitectureMasters();

  const handleUploadSubmit = () => {
    const file = selectedFiles[0];
    if (!file || !vendorId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", String(vendorId));

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        refetch();
        setOpenUploadModal(false);
        setSelectedFiles([]);
      },
      onError: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
      },
    });
  };

  const handleImportClick = () => {
    setSelectedFiles([]);
    setOpenUploadModal(true);
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Architects Template");

    // Add headers and set columns with custom widths
    worksheet.columns = [
      { header: "name", key: "name", width: 30 },
      { header: "email", key: "email", width: 40 },
      { header: "contact", key: "contact", width: 25 },
      { header: "alt contact", key: "alt_contact", width: 25 }
    ];

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(1).height = 20;

    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "architects_template.xlsx");
  };

  const tableData = React.useMemo<ArchitectureMasterRow[]>(
    () =>
      (data?.data?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        vendorId: item.vendorId,
        name: item.name,
        email: item.email,
        mobile: item.mobile,
        alt_mobile: item.alt_mobile,
        is_active: item.is_active,
        status: item.is_active ? "active" : "inactive",
      })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getArchitectureColumns({
      onEdit: (row) => {
        setEditingRow(row);
        setForm({ name: row.name, email: row.email, mobile: row.mobile, alt_mobile: row.alt_mobile || "" });
        setIsMobileValid(true);
        setIsAltMobileValid(true);
        setOpenEditModal(true);
      },
      onDelete: (row) => {
        setDeletingRow(row);
        setOpenDeleteModal(true);
      },
      onToggleStatus: (row) => {
        setStatusTargetRow(row);
        setOpenConfirmStatusModal(true);
      },
    }),
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const s = String(value ?? "").trim().toLowerCase();
      if (!s) return true;
      return String(row.getValue(columnId) ?? "").toLowerCase().includes(s);
    },
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setErrors({});
    setIsMobileValid(true);
    setIsAltMobileValid(true);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!isMobileValid) {
      newErrors.mobile = " ";
    }

    if (form.alt_mobile && form.alt_mobile.trim() !== "" && !isAltMobileValid) {
      newErrors.alt_mobile = " ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canSubmit = true; // Handled by validateForm() onSubmit now

  const handleCreate = () => {
    if (!validateForm() || !vendorId) return;
    const rawMobile = form.mobile.trim();
    const cleanMobile = rawMobile.startsWith("+91") ? rawMobile.slice(3) : rawMobile;
    const rawAltMobile = form.alt_mobile.trim();
    const cleanAltMobile = rawAltMobile ? (rawAltMobile.startsWith("+91") ? rawAltMobile.slice(3) : rawAltMobile) : undefined;
    createMutation.mutate(
      { vendorId: Number(vendorId), name: form.name.trim(), email: form.email.trim(), mobile: cleanMobile, alt_mobile: cleanAltMobile },
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
    if (!editingRow || !validateForm()) return;
    const rawMobile = form.mobile.trim();
    const cleanMobile = rawMobile.startsWith("+91") ? rawMobile.slice(3) : rawMobile;
    const rawAltMobile = form.alt_mobile.trim();
    const cleanAltMobile = rawAltMobile ? (rawAltMobile.startsWith("+91") ? rawAltMobile.slice(3) : rawAltMobile) : undefined;
    updateMutation.mutate(
      { id: editingRow.id, data: { name: form.name.trim(), email: form.email.trim(), mobile: cleanMobile, alt_mobile: cleanAltMobile } },
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

  const handleDelete = () => {
    if (!deletingRow) return;
    deleteMutation.mutate(deletingRow.id, {
      onSuccess: () => {
        refetch();
        setDeletingRow(null);
        setOpenDeleteModal(false);
      },
    });
  };

  const handleToggleStatus = () => {
    if (!statusTargetRow) return;

    updateStatusMutation.mutate(
      {
        id: statusTargetRow.id,
        data: {
          is_active: statusTargetRow.status !== "active",
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
        <Label htmlFor="arch-name">Name</Label>
        <Input
          id="arch-name"
          value={form.name}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, name: e.target.value }));
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Enter name"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="arch-email">Email</Label>
        <Input
          id="arch-email"
          type="email"
          value={form.email}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, email: e.target.value }));
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="Enter email"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="arch-mobile">Mobile</Label>
        <PhoneInput
          id="arch-mobile"
          value={form.mobile}
          onChange={(val) => {
            setForm((prev) => ({ ...prev, mobile: val || "" }));
            if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
          }}
          defaultCountry="IN"
          placeholder="Enter mobile number"
          validateIndianNumber={true}
          onValidationChange={(isValid) => setIsMobileValid(isValid)}
        />
        {errors.mobile && errors.mobile !== " " && <p className="text-xs text-destructive">{errors.mobile}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="arch-alt-mobile">Alt. Mobile</Label>
        <PhoneInput
          id="arch-alt-mobile"
          value={form.alt_mobile}
          onChange={(val) => {
            setForm((prev) => ({ ...prev, alt_mobile: val || "" }));
            if (errors.alt_mobile) setErrors((prev) => ({ ...prev, alt_mobile: undefined }));
          }}
          defaultCountry="IN"
          placeholder="Enter alternate mobile number"
          validateIndianNumber={true}
          onValidationChange={(isValid) => setIsAltMobileValid(isValid)}
        />
        {errors.alt_mobile && errors.alt_mobile !== " " && <p className="text-xs text-destructive">{errors.alt_mobile}</p>}
      </div>
    </>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Architects</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all architect entries from one place.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:self-start">
            <Button
              variant="outline"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={uploadMutation.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setOpenCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Architect
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading architects...</div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.message || "Failed to load architects."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ClearInput
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search architect..."
                  className="h-9 w-full md:w-72"
                />
              </div>
            </DataTable>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog
        open={openCreateModal}
        onOpenChange={(open) => {
          setOpenCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Architect</DialogTitle>
            <DialogDescription>Add a new architect entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{formFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={openEditModal}
        onOpenChange={(open) => {
          setOpenEditModal(open);
          if (!open) {
            setEditingRow(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Architect</DialogTitle>
            <DialogDescription>Update the selected architect entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{formFields}</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditModal(false);
                setEditingRow(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!canSubmit || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog
        open={openDeleteModal}
        onOpenChange={(open) => {
          setOpenDeleteModal(open);
          if (!open) setDeletingRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Architect</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Name: </span>
            <span className="font-medium">{deletingRow?.name}</span>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenDeleteModal(false);
                setDeletingRow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirm Modal */}
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
                ? "Mark Architect Inactive"
                : "Mark Architect Active"}
            </DialogTitle>
            <DialogDescription>
              {statusTargetRow?.status === "active"
                ? "This architect will be marked inactive."
                : "This architect will be marked active again."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Architect:</span>{" "}
            <span className="font-medium">{statusTargetRow?.name}</span>
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
              disabled={!statusTargetRow || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? "Updating..."
                : statusTargetRow?.status === "active"
                  ? "Mark Inactive"
                  : "Mark Active"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <BaseModal
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setSelectedFiles([]);
          }
        }}
        title="Import Architects"
        description="Upload a CSV or XLSX file containing Name, Email, Mobile, and Alt Contact columns."
        size="smd"
      
      >
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".csv,.xlsx"
              multiple={false}
              maxFiles={1}
            />
          </div>

          <div className="flex gap-2 justify-end border-t pt-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setOpenUploadModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload & Import"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
