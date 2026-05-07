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
import {
  CheckIcon,
  ChevronDown,
  EyeIcon,
  EyeOffIcon,
  ListFilter,
  Pencil,
  Plus,
  UserCog,
  UserPlus,
  XCircle,
  XIcon,
} from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { cn } from "@/lib/utils";
import {
  useUsersForMaster,
  useCreateUser,
  usePrivilegeMasters,
  useUpdateUserPrivileges,
  useUpdateUser,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type UserMasterRow = {
  srNo: number;
  id: number;
  user_name: string;
  user_contact: string;
  user_email: string;
  user_type: string;
  franchise_name: string;
  status: string;
  franchise_id: number | null;
  user_type_id: number | null;
};

function formatUserTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";

  return normalized
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function areNumberArraysEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;

  return left.every((value, index) => value === right[index]);
}

function normalizeNumberArray(values: number[]) {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

const columns: ColumnDef<UserMasterRow>[] = [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("srNo")}</span>
    ),
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

function FilterByStores({
  value,
  onChange,
  franchises,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  franchises: { id: number; franchise_name: string }[];
}) {
  const isFiltered = value !== undefined;
  const selectedLabel = franchises.find((f) => f.id === value)?.franchise_name;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed h-9">
          {isFiltered ? (
            <div
              role="button"
              aria-label="Clear store filter"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </div>
          ) : (
            <ListFilter className="h-4 w-4 shrink-0" />
          )}
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">Filter by Store</span>
            {isFiltered && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-0.5 data-[orientation=vertical]:h-4"
                />
                <Badge
                  variant="secondary"
                  className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[120px]"
                >
                  {selectedLabel}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <button
          onClick={() => onChange(undefined)}
          className={`w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
            !isFiltered ? "bg-accent text-accent-foreground font-medium" : ""
          }`}
        >
          All Stores
        </button>
        {franchises.map((fr) => (
          <button
            key={fr.id}
            onClick={() => onChange(fr.id)}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
              value === fr.id
                ? "bg-accent text-accent-foreground font-medium"
                : ""
            }`}
          >
            {fr.franchise_name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

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

const customPrivilegeSections = [
  {
    id: "leads",
    title: "Leads",
    parentModule: "Leads",
    description:
      "Manage access to lead viewing, status updates, reassignment, and task actions.",
    children: [
      {
        id: "open",
        title: "Open Leads",
        childModuleIncludes: ["Open Leads"],
      },
      {
        id: "initial_site_measurement",
        title: "Initial Site Measurement",
        childModuleIncludes: ["ISM Leads"],
      },
      {
        id: "designing_stage",
        title: "Desiging Stage",
        childModuleIncludes: ["Designing Stage"],
      },
      {
        id: "booking_stage",
        title: "Booking Stage",
        childModuleIncludes: ["Booking Done"],
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    parentModule: "Project",
    description:
      "Manage access to project milestones, files, approvals, and project updates.",
    children: [
      {
        id: "final_measurements",
        title: "Final Measurements",
        childModuleIncludes: ["Final Measurement"],
      },
      {
        id: "client_documentations",
        title: "Client Documentations",
        childModuleIncludes: ["Client Documentation"],
      },
      {
        id: "client_approvals",
        title: "Client Approvals",
        childModuleIncludes: [
          "Client Approval",
          "Client Approval Form",
          "Client Payment Details",
          "Client Approval Screenshots",
        ],
      },
    ],
  },
  {
    id: "productions",
    title: "Productions",
    parentModule: "Production",
    description:
      "Manage access to production stages, planning flows, and execution actions.",
    children: [],
  },
  {
    id: "installations",
    title: "Installations",
    parentModule: "Installation",
    description:
      "Manage access to installation progress, readiness, documents, and handover actions.",
    children: [],
  },
] as const;

export default function UserMastersTable() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [editingUserId, setEditingUserId] = React.useState<number | null>(null);
  const [editingUserType, setEditingUserType] = React.useState<string | null>(
    null,
  );
  const [franchiseFilter, setFranchiseFilter] = React.useState<
    number | undefined
  >(undefined);
  const [form, setForm] = React.useState(defaultForm);
  const [originalForm, setOriginalForm] = React.useState(defaultForm);
  const [showPassword, setShowPassword] = React.useState(false);
  const [openPrivilegesModal, setOpenPrivilegesModal] = React.useState(false);
  const [openPrivilegeSection, setOpenPrivilegeSection] = React.useState<
    string | null
  >(customPrivilegeSections[0]?.id ?? null);
  const [openLeadPrivilegeSection, setOpenLeadPrivilegeSection] =
    React.useState<string | null>(null);
  const [selectedPrivilegeIds, setSelectedPrivilegeIds] = React.useState<
    number[]
  >([]);
  const [privilegeSearch, setPrivilegeSearch] = React.useState("");
  const deferredPrivilegeSearch = React.useDeferredValue(privilegeSearch);

  const { data, isLoading, isError, error } = useUsersForMaster({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter,
    franchise_id: franchiseFilter,
  });
  const { data: franchisesData = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );
  const { data: userTypesData } = useUserTypes();
  const {
    data: privilegeMastersData,
    isLoading: isLoadingPrivilegeMasters,
    isError: isPrivilegeMastersError,
  } = usePrivilegeMasters({
    enabled: openPrivilegesModal,
    search: deferredPrivilegeSearch,
    userId: editingUserId,
  });
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const updateUserPrivilegesMutation = useUpdateUserPrivileges();

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
        franchise_id: item.franchise_id ?? null,
        user_type_id:
          userTypesData?.data?.find(
            (ut) => ut.user_type === item.user_type?.user_type,
          )?.id ?? null,
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
  const privilegeMasters = React.useMemo(
    () => privilegeMastersData?.data ?? [],
    [privilegeMastersData?.data],
  );
  const serverSelectedPrivilegeIds = React.useMemo(
    () =>
      normalizeNumberArray(
        privilegeMasters
          .filter((privilege) => privilege.is_selected)
          .map((privilege) => privilege.id),
      ),
    [privilegeMasters],
  );
  const normalizedSelectedPrivilegeIds = React.useMemo(
    () => normalizeNumberArray(selectedPrivilegeIds),
    [selectedPrivilegeIds],
  );
  const hasPrivilegeSelectionChanged = !areNumberArraysEqual(
    normalizedSelectedPrivilegeIds,
    serverSelectedPrivilegeIds,
  );

  React.useEffect(() => {
    if (!openPrivilegesModal || deferredPrivilegeSearch.trim()) return;

    setSelectedPrivilegeIds((current) =>
      areNumberArraysEqual(current, serverSelectedPrivilegeIds)
        ? current
        : serverSelectedPrivilegeIds,
    );
  }, [
    openPrivilegesModal,
    serverSelectedPrivilegeIds,
    deferredPrivilegeSearch,
  ]);

  const getSectionChildPrivileges = React.useCallback(
    (parentModuleName: string, childModuleIncludes: readonly string[]) => {
      const normalizedKeywords = childModuleIncludes.map((value) =>
        value.toLowerCase(),
      );

      return privilegeMasters.filter((privilege) => {
        const parentModule = privilege.parent_module.toLowerCase();
        const childModule = privilege.child_module.toLowerCase();

        return (
          parentModule === parentModuleName.toLowerCase() &&
          normalizedKeywords.some((keyword) => childModule.includes(keyword))
        );
      });
    },
    [privilegeMasters],
  );

  const handleSaveUserPrivileges = () => {
    if (!editingUserId || !vendorId) return;

    updateUserPrivilegesMutation.mutate({
      userId: editingUserId,
      payload: {
        vendor_id: vendorId,
        privilege_ids: normalizedSelectedPrivilegeIds,
      },
    });
  };

  const resetForm = () => {
    setForm(defaultForm);
    setOriginalForm(defaultForm);
    setShowPassword(false);
    setModalMode("create");
    setEditingUserId(null);
    setEditingUserType(null);
    setOpenPrivilegesModal(false);
    setOpenPrivilegeSection(customPrivilegeSections[0]?.id ?? null);
    setOpenLeadPrivilegeSection(null);
    setSelectedPrivilegeIds([]);
    setPrivilegeSearch("");
  };

  const isEditingCustomUser =
    modalMode === "edit" && editingUserType?.toLowerCase() === "custom";

  const isFormValid =
    form.user_name.trim() &&
    form.user_contact.trim() &&
    form.user_email.trim() &&
    (modalMode === "edit" || form.password.trim()) &&
    form.franchise_id &&
    form.user_type_id;

  const handleRowDoubleClick = (row: UserMasterRow) => {
    const prefilled = {
      user_name: row.user_name,
      user_contact: row.user_contact,
      user_email: row.user_email,
      password: "",
      franchise_id: row.franchise_id ? String(row.franchise_id) : "",
      user_type_id: row.user_type_id ? String(row.user_type_id) : "",
      status: (row.status === "active" || row.status === "inactive"
        ? row.status
        : "active") as "active" | "inactive",
    };
    setForm(prefilled);
    setOriginalForm(prefilled);
    setEditingUserId(row.id);
    setEditingUserType(row.user_type);
    setModalMode("edit");
    setOpenCreateModal(true);
  };

  const handleSave = () => {
    if (!editingUserId || !vendorId) return;

    // Normalize phone to national number for comparison
    const extractNational = (val: string) => {
      const parsed = parsePhoneNumberFromString(val);
      return parsed?.nationalNumber ?? val.replace(/\D/g, "");
    };

    const payload: Record<string, any> = {};

    if (form.user_name.trim() !== originalForm.user_name.trim())
      payload.user_name = form.user_name.trim();

    const currContact = extractNational(form.user_contact);
    const origContact = extractNational(originalForm.user_contact);
    if (currContact !== origContact) payload.user_contact = currContact;

    if (form.user_email.trim() !== originalForm.user_email.trim())
      payload.user_email = form.user_email.trim();

    if (form.franchise_id !== originalForm.franchise_id)
      payload.franchise_id = Number(form.franchise_id);

    if (form.user_type_id !== originalForm.user_type_id)
      payload.user_type_id = Number(form.user_type_id);

    if (form.status !== originalForm.status) payload.status = form.status;

    // Only include password if the user typed something new
    if (form.password.trim()) payload.password = form.password;

    if (Object.keys(payload).length === 0) {
      setOpenCreateModal(false);
      resetForm();
      return;
    }

    updateUserMutation.mutate(
      { userId: editingUserId, payload },
      {
        onSuccess: () => {
          resetForm();
          setOpenCreateModal(false);
        },
      },
    );
  };

  const handleCreate = () => {
    if (!isFormValid || !vendorId) return;

    const parsed = parsePhoneNumberFromString(form.user_contact);
    const contactNumber =
      parsed?.nationalNumber || form.user_contact.replace(/\D/g, "");

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
            <div className="flex items-center gap-2 flex-1">
              <ClearInput
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                placeholder="Search users..."
                className="h-9 w-full max-w-md"
              />
              <FilterByStores
                value={franchiseFilter}
                onChange={(v) => {
                  setFranchiseFilter(v);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                franchises={franchisesData}
              />
            </div>
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
              {(error as any)?.response?.data?.message ||
                "Failed to load users."}
            </div>
          ) : (
            <div className="select-none">
              <DataTable
                table={table}
                onRowDoubleClick={handleRowDoubleClick}
              />
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
          <div className="flex items-center gap-3 px-6 pt-6 pb-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {modalMode === "edit" ? (
                <UserCog size={18} className="text-primary" />
              ) : (
                <UserPlus size={18} className="text-primary" />
              )}
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-base font-semibold leading-tight">
                {modalMode === "edit" ? "Edit User" : "Create User"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-tight mt-0.5">
                {modalMode === "edit"
                  ? "Update the details for this user."
                  : "Add a new user for this vendor."}
              </DialogDescription>
            </div>
          </div>
          <div className="mx-6 border-b" />

          <div className="px-6 pb-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Row 1: User Name | Contact No. */}
              <div className="space-y-2">
                <Label htmlFor="user-name">User Name</Label>
                <Input
                  id="user-name"
                  value={form.user_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, user_name: e.target.value }))
                  }
                  placeholder="Enter user name"
                />
              </div>

              <div className="space-y-2">
                <Label>Contact No.</Label>
                <PhoneInput
                  defaultCountry="IN"
                  placeholder="Enter contact number"
                  value={form.user_contact}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, user_contact: val }))
                  }
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, user_email: e.target.value }))
                  }
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
                        setForm((f) => ({
                          ...f,
                          status: checked ? "active" : "inactive",
                        }))
                      }
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {form.status === "active"
                      ? "User will be active"
                      : "User will be inactive"}
                  </span>
                </div>
              </div>

              {/* Row 3: User Type | Franchise */}
              {!isEditingCustomUser && (
                <div className="space-y-2">
                  <Label>User Type</Label>
                  <AssignToPicker
                    data={(userTypesData?.data ?? []).map((ut) => ({
                      id: ut.id,
                      label: formatUserTypeLabel(ut.user_type),
                    }))}
                    value={
                      form.user_type_id ? Number(form.user_type_id) : undefined
                    }
                    onChange={(selectedId) =>
                      setForm((f) => ({
                        ...f,
                        user_type_id: selectedId ? String(selectedId) : "",
                      }))
                    }
                    placeholder="Select user type..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Franchise</Label>
                <AssignToPicker
                  data={franchisesData.map((fr) => ({
                    id: fr.id,
                    label: fr.franchise_name,
                  }))}
                  value={
                    form.franchise_id ? Number(form.franchise_id) : undefined
                  }
                  onChange={(selectedId) =>
                    setForm((f) => ({
                      ...f,
                      franchise_id: selectedId ? String(selectedId) : "",
                    }))
                  }
                  placeholder="Select franchise..."
                />
              </div>

              {/* Row 4: Password (full width) */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="user-password">
                  Password
                  {modalMode === "edit" && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (leave blank to keep current)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder={
                      modalMode === "edit"
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    className="pe-9 h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOffIcon size={15} />
                    ) : (
                      <EyeIcon size={15} />
                    )}
                  </button>
                </div>

                {/* Strength bar — always shown in create, only shown when typing in edit */}
                {(modalMode === "create" || form.password.length > 0) && (
                  <>
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
                        style={{
                          width: `${(passwordStrengthScore / 5) * 100}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs font-medium text-foreground mb-1.5">
                      {getStrengthText(passwordStrengthScore)}
                    </p>

                    <ul className="space-y-1">
                      {passwordStrength.map((req) => (
                        <li key={req.text} className="flex items-center gap-2">
                          {req.met ? (
                            <CheckIcon
                              size={13}
                              className="text-emerald-500 shrink-0"
                            />
                          ) : (
                            <XIcon
                              size={13}
                              className="text-muted-foreground/60 shrink-0"
                            />
                          )}
                          <span
                            className={`text-xs ${req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                          >
                            {req.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-4 border-t mt-2">
              <div className="w-fit h-auto">
                {isEditingCustomUser && (
                  <Button
                    size="sm"
                    onClick={() => setOpenPrivilegesModal(true)}
                  >
                    User Privileges
                  </Button>
                )}
              </div>
              <div className="w-fit h-auto flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpenCreateModal(false);
                    resetForm();
                  }}
                  disabled={
                    createUserMutation.isPending || updateUserMutation.isPending
                  }
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={modalMode === "edit" ? handleSave : handleCreate}
                  disabled={
                    !isFormValid ||
                    !vendorId ||
                    createUserMutation.isPending ||
                    updateUserMutation.isPending
                  }
                >
                  {modalMode === "edit" ? (
                    updateUserMutation.isPending ? (
                      "Saving..."
                    ) : (
                      <>
                        <Pencil size={13} className="mr-1.5" />
                        Save Changes
                      </>
                    )
                  ) : createUserMutation.isPending ? (
                    "Creating..."
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openPrivilegesModal}
        onOpenChange={(open) => {
          setOpenPrivilegesModal(open);
          if (!open) {
            setOpenPrivilegeSection(customPrivilegeSections[0]?.id ?? null);
            setOpenLeadPrivilegeSection(null);
            setSelectedPrivilegeIds([]);
            setPrivilegeSearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[760px] h-[80vh] max-h-[80vh] p-0 overflow-hidden flex flex-col">
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b">
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold leading-tight">
                User Privileges
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Manage custom privilege access for this user from here.
              </DialogDescription>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            {customPrivilegeSections.map((section) => {
              const isOpen = openPrivilegeSection === section.id;

              return (
                <div
                  key={section.id}
                  className="overflow-hidden rounded-xl border bg-background"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPrivilegeSection((current) =>
                        current === section.id ? null : section.id,
                      )
                    }
                    className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {section.title}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t bg-muted/20 px-4 py-3">
                      {section.children.length > 0 ? (
                        <div className="space-y-2">
                          {section.children.map((child) => {
                            const isLeadSectionOpen =
                              openLeadPrivilegeSection === child.id;
                            const childPrivileges = getSectionChildPrivileges(
                              section.parentModule,
                              child.childModuleIncludes,
                            );

                            return (
                              <div
                                key={child.id}
                                className="overflow-hidden rounded-lg border bg-background"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenLeadPrivilegeSection((current) =>
                                      current === child.id ? null : child.id,
                                    )
                                  }
                                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                                >
                                  <p className="text-sm font-medium text-foreground">
                                    {child.title}
                                  </p>
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                      isLeadSectionOpen && "rotate-180",
                                    )}
                                  />
                                </button>

                                {isLeadSectionOpen && (
                                  <div className="border-t bg-muted/20 px-4 py-3">
                                    <div className="mb-3">
                                      <Input
                                        value={privilegeSearch}
                                        onChange={(e) =>
                                          setPrivilegeSearch(e.target.value)
                                        }
                                        placeholder="Search by code or action..."
                                        className="h-9 bg-background"
                                        disabled={
                                          updateUserPrivilegesMutation.isPending
                                        }
                                      />
                                    </div>
                                    {isLoadingPrivilegeMasters ? (
                                      <div className="text-xs text-muted-foreground">
                                        Loading privilege actions...
                                      </div>
                                    ) : isPrivilegeMastersError ? (
                                      <div className="text-xs text-destructive">
                                        Failed to load privilege actions.
                                      </div>
                                    ) : childPrivileges.length === 0 ? (
                                      <div className="text-xs text-muted-foreground">
                                        No privilege actions found for this
                                        section.
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {childPrivileges.map((privilege) => {
                                          const isChecked =
                                            selectedPrivilegeIds.includes(
                                              privilege.id,
                                            );

                                          return (
                                            <label
                                              key={privilege.id}
                                              className="flex items-center gap-3 rounded-md border bg-background px-3 py-2"
                                            >
                                              <Checkbox
                                                checked={isChecked}
                                                disabled={
                                                  updateUserPrivilegesMutation.isPending
                                                }
                                                onCheckedChange={(checked) =>
                                                  setSelectedPrivilegeIds(
                                                    (current) => {
                                                      if (checked) {
                                                        return current.includes(
                                                          privilege.id,
                                                        )
                                                          ? current
                                                          : [
                                                              ...current,
                                                              privilege.id,
                                                            ];
                                                      }

                                                      return current.filter(
                                                        (id) =>
                                                          id !== privilege.id,
                                                      );
                                                    },
                                                  )
                                                }
                                              />
                                              <div className="space-y-0.5">
                                                <p className="text-sm font-medium text-foreground">
                                                  {privilege.action}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {privilege.code}
                                                </p>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Privilege options for {section.title.toLowerCase()}{" "}
                          will be added here next.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setOpenPrivilegesModal(false)}
              disabled={updateUserPrivilegesMutation.isPending}
            >
              Close
            </Button>
            <Button
              onClick={handleSaveUserPrivileges}
              disabled={
                !editingUserId ||
                !vendorId ||
                !hasPrivilegeSelectionChanged ||
                updateUserPrivilegesMutation.isPending
              }
            >
              {updateUserPrivilegesMutation.isPending
                ? "Saving..."
                : "Save Privileges"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
