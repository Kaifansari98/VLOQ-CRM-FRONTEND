"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  PaginationState,
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CheckIcon, EyeIcon, EyeOffIcon, Plus, UserPlus, XIcon } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { cn } from "@/lib/utils";
import {
  useUsersForMaster,
  useCreateUser,
  useUserTypes,
} from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useAppSelector } from "@/redux/store";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import ClearInput from "@/components/origin-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import AssignToPicker from "@/components/assign-to-picker";
import { Card, CardContent } from "@/components/ui/card";

type UserMasterRow = {
  srNo: number;
  id: number;
  user_name: string;
  user_contact: string;
  user_email: string;
  user_type: string;
  franchise_name: string;
  status: string;
};

function formatUserTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";

  return normalized
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const columns: ColumnDef<UserMasterRow>[] = [
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
    accessorKey: "user_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User Name" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user_contact",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact No." />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user_email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User Type" />
    ),
    cell: ({ row }) => (
      <span>{formatUserTypeLabel(row.getValue("user_type") as string)}</span>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "franchise_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Franchise" />
    ),
    enableSorting: false,
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
    enableSorting: false,
    enableHiding: false,
  },
];

const strengthRequirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  { regex: /[^A-Za-z0-9]/, text: "At least 1 special character" },
];

function getStrengthColor(score: number) {
  if (score === 0) return "bg-border";
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score <= 3) return "bg-amber-500";
  if (score === 4) return "bg-yellow-500";
  return "bg-emerald-500";
}

function getStrengthText(score: number) {
  if (score === 0) return "Enter a password";
  if (score <= 2) return "Weak password";
  if (score <= 3) return "Medium password";
  return "Strong password";
}

const defaultForm = {
  user_name: "",
  user_contact: "",
  user_email: "",
  password: "",
  franchise_id: "",
  user_type_id: "",
  status: "active" as "active" | "inactive",
};

export default function UserMastersTable() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [form, setForm] = React.useState(defaultForm);
  const [showPassword, setShowPassword] = React.useState(false);

  const { data, isLoading, isError, error } = useUsersForMaster({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter,
  });
  const { data: franchisesData = [] } = useFranchisesByVendorId(vendorId, !!vendorId);
  const { data: userTypesData } = useUserTypes();
  const createUserMutation = useCreateUser();

  const tableData = React.useMemo<UserMasterRow[]>(
    () =>
      (data?.data ?? []).map((item, index) => ({
        srNo: pagination.pageIndex * pagination.pageSize + index + 1,
        id: item.id,
        user_name: item.user_name,
        user_contact: item.user_contact,
        user_email: item.user_email,
        user_type: item.user_type?.user_type ?? "—",
        franchise_name: item.franchise?.franchise_name ?? "—",
        status: item.status,
      })),
    [data, pagination.pageIndex, pagination.pageSize],
  );

  const totalPages = data?.pagination?.totalPages ?? 1;

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const passwordStrength = strengthRequirements.map((req) => ({
    met: req.regex.test(form.password),
    text: req.text,
  }));
  const passwordStrengthScore = React.useMemo(
    () => passwordStrength.filter((r) => r.met).length,
    [form.password],
  );

  const resetForm = () => {
    setForm(defaultForm);
    setShowPassword(false);
  };

  const isFormValid =
    form.user_name.trim() &&
    form.user_contact.trim() &&
    form.user_email.trim() &&
    form.password.trim() &&
    form.franchise_id &&
    form.user_type_id;

  const handleCreate = () => {
    if (!isFormValid || !vendorId) return;

    const parsed = parsePhoneNumberFromString(form.user_contact);
    const contactNumber = parsed?.nationalNumber || form.user_contact.replace(/\D/g, "");

    createUserMutation.mutate(
      {
        vendor_id: vendorId,
        franchise_id: Number(form.franchise_id),
        user_name: form.user_name.trim(),
        user_contact: contactNumber,
        user_email: form.user_email.trim(),
        user_timezone: "Asia/Kolkata",
        password: form.password,
        user_type_id: Number(form.user_type_id),
        status: form.status,
      },
      {
        onSuccess: () => {
          resetForm();
          setOpenCreateModal(false);
        },
      },
    );
  };

  return (
    <>
      <Card className="rounded-2xl p-0 border-0">
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center justify-between gap-3">
            <ClearInput
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              placeholder="Search users..."
              className="h-9 w-full max-w-sm"
            />
            <Button onClick={() => setOpenCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
              Loading users...
            </div>
          ) : isError ? (
            <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
              {(error as any)?.response?.data?.message || "Failed to load users."}
            </div>
          ) : (
            <div className="select-none">
              <DataTable table={table} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openCreateModal}
        onOpenChange={(open) => {
          setOpenCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus size={18} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-base font-semibold leading-tight">
                Create User
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-tight mt-0.5">
                Add a new user for this vendor.
              </DialogDescription>
            </div>
          </div>

          <div className="px-6 pt-2 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Row 1: User Name | Contact No. */}
            <div className="space-y-2">
              <Label htmlFor="user-name">User Name</Label>
              <Input
                id="user-name"
                value={form.user_name}
                onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))}
                placeholder="Enter user name"
              />
            </div>

            <div className="space-y-2">
              <Label>Contact No.</Label>
              <PhoneInput
                defaultCountry="IN"
                placeholder="Enter contact number"
                value={form.user_contact}
                onChange={(val) => setForm((f) => ({ ...f, user_contact: val }))}
                validateIndianNumber={true}
              />
            </div>

            {/* Row 2: Email | Status */}
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.user_email}
                onChange={(e) => setForm((f) => ({ ...f, user_email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex h-9 items-center gap-4 rounded-md border px-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.status === "active"}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, status: checked ? "active" : "inactive" }))
                    }
                  />
                  <span className="text-sm">Active</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  {form.status === "active" ? "User will be active" : "User will be inactive"}
                </span>
              </div>
            </div>

            {/* Row 3: User Type | Franchise */}
            <div className="space-y-2">
              <Label>User Type</Label>
              <AssignToPicker
                data={(userTypesData?.data ?? []).map((ut) => ({
                  id: ut.id,
                  label: formatUserTypeLabel(ut.user_type),
                }))}
                value={form.user_type_id ? Number(form.user_type_id) : undefined}
                onChange={(selectedId) =>
                  setForm((f) => ({ ...f, user_type_id: selectedId ? String(selectedId) : "" }))
                }
                placeholder="Select user type..."
              />
            </div>

            <div className="space-y-2">
              <Label>Franchise</Label>
              <AssignToPicker
                data={franchisesData.map((fr) => ({
                  id: fr.id,
                  label: fr.franchise_name,
                }))}
                value={form.franchise_id ? Number(form.franchise_id) : undefined}
                onChange={(selectedId) =>
                  setForm((f) => ({ ...f, franchise_id: selectedId ? String(selectedId) : "" }))
                }
                placeholder="Select franchise..."
              />
            </div>

            {/* Row 4: Password (full width) */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Enter password"
                  className="pe-9 h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>

              {/* Strength bar */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={5}
                aria-valuenow={passwordStrengthScore}
                aria-label="Password strength"
                className="mt-2 mb-2 h-1 w-full overflow-hidden rounded-full bg-border"
              >
                <div
                  className={`h-full transition-all duration-500 ease-out ${getStrengthColor(passwordStrengthScore)}`}
                  style={{ width: `${(passwordStrengthScore / 5) * 100}%` }}
                />
              </div>

              <p className="text-xs font-medium text-foreground mb-1.5">
                {getStrengthText(passwordStrengthScore)}
              </p>

              <ul className="space-y-1">
                {passwordStrength.map((req) => (
                  <li key={req.text} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckIcon size={13} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XIcon size={13} className="text-muted-foreground/60 shrink-0" />
                    )}
                    <span className={`text-xs ${req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {req.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOpenCreateModal(false);
                resetForm();
              }}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!isFormValid || !vendorId || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
