"use client";

import { useRouter } from "next/navigation";

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
  ChevronLeft,
  ChevronRight,
  Download,
  EyeIcon,
  EyeOffIcon,
  FileText,
  CheckCircle2,
  Loader2,
  Trash2,
  Upload,
  ListFilter,
  Pencil,
  Plus,
  Shield,
  UserCog,
  UserPlus,
  XCircle,
  XIcon,
} from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { cn } from "@/lib/utils";
import {
  useUsersForMaster,
  useCreateUser,
  useUpdateUser,
  useUserTypes,
} from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useVendorById } from "@/api/vendors";
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
import MultipleSelector from "@/components/ui/multiselect";
import { useStates } from "@/api/vendors";
import { INDIAN_STATES, parseAddress, formatAddress } from "@/lib/addressUtils";
import AssignToPicker from "@/components/assign-to-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { CreateUserMasterPayload, UpdateUserMasterPayload } from "@/api/typesMasterApi";
import { fetchUsersForMaster, uploadUserDocument, fetchUserDocumentUrl } from "@/api/typesMasterApi";
import DocumentCard from "@/components/utils/documentCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";

const toast = {
  success: (message: string) => toastManager.add({ title: message, type: "success" }),
  error: (message: string) => toastManager.add({ title: message, type: "error" }),
};

type UserMasterRow = {
  srNo: number;
  id: number;
  employee_code?: string | null;
  department?: string | null;
  aadhar_no?: string | null;
  pan_no?: string | null;
  permanent_address?: string | null;
  current_address?: string | null;
  aadhar_card_file?: string | null;
  pan_card_file?: string | null;
  user_name: string;
  designation?: string;
  user_contact: string;
  user_email: string;
  user_type: string;
  franchise_name: string;
  status: string;
  franchise_id: number | null;
  franchise_ids: number[];
  user_type_id: number | null;
  created_at?: string;
};

function formatUserTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";

  if (normalized.toLowerCase().replace(/[-_]+/g, " ") === "hrms admin") {
    return "HRMS Admin";
  }

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


function DocumentUploadBox({
  label,
  fileUrl,
  fileName,
  signedUrlOverride,
  createdAt,
  onUpload,
  onRemove,
  isUploading,
}: {
  label: string;
  fileUrl?: string | null;
  fileName?: string | null;
  signedUrlOverride?: string | null;
  createdAt?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [signedUrl, setSignedUrl] = React.useState<string>("");
  const [loadingUrl, setLoadingUrl] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!fileUrl) {
      setSignedUrl("");
      return;
    }
    if (signedUrlOverride) {
      setSignedUrl(signedUrlOverride);
      return;
    }
    if (
      fileUrl.startsWith("http://") ||
      fileUrl.startsWith("https://") ||
      fileUrl.startsWith("blob:")
    ) {
      setSignedUrl(fileUrl);
      return;
    }

    let isMounted = true;
    setLoadingUrl(true);
    fetchUserDocumentUrl(fileUrl)
      .then((url) => {
        if (isMounted) {
          setSignedUrl(url || fileUrl);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch signed URL:", err);
        if (isMounted) {
          setSignedUrl(fileUrl);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingUrl(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileUrl, signedUrlOverride]);

  const displayName = React.useMemo(() => {
    const defaultLabel = label.replace(/^Upload\s+/i, "");
    const extFromUrl = fileUrl?.split("?")[0]?.split(".").pop()?.toLowerCase();
    const extFromName = fileName?.split(".").pop()?.toLowerCase();
    const validExt =
      extFromName && extFromName.length <= 5
        ? extFromName
        : extFromUrl && extFromUrl.length <= 5
        ? extFromUrl
        : "pdf";

    const name = fileName?.trim() || fileUrl?.split("/").pop()?.split("?")[0] || "";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(name);
    if (!name || isUuid) {
      return `${defaultLabel.replace(/\s+/g, "_")}.${validExt}`;
    }
    return name.includes(".") ? name : `${name}.${validExt}`;
  }, [label, fileUrl, fileName]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {fileUrl ? (
        <div className="w-full">
          {loadingUrl && !signedUrl ? (
            <div className="flex items-center justify-center p-6 border rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground">Loading preview...</span>
            </div>
          ) : (
            <DocumentCard
              doc={{
                id: 1,
                originalName: displayName,
                signedUrl: signedUrl || fileUrl,
                created_at: createdAt || undefined,
              }}
              canDelete={true}
              onDelete={() => onRemove()}
              className="w-full"
            />
          )}
        </div>

          ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center p-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-accent/40 cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file);
              }
            }}
          />
          {isUploading ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5 py-0.5 text-center">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Upload File</span>
              <span className="text-[10px] text-muted-foreground">PDF, JPG, PNG (Max 10MB)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getUserMasterColumns(
  isEmployeeMaster: boolean,
  isHrmsMasterEnabled?: boolean,
  onManagePrivileges?: (row: UserMasterRow) => void,
  onEdit?: (row: UserMasterRow) => void,
): ColumnDef<UserMasterRow>[] {
  const baseColumns: ColumnDef<UserMasterRow>[] = [
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
  ];

  baseColumns.push({
    accessorKey: "employee_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employee Code" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("employee_code") || "—"}</span>
    ),
    enableSorting: false,
    enableHiding: false,
  });

  baseColumns.push(
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
      accessorKey: "designation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Designation" />
      ),
      cell: ({ row }) => <span>{row.getValue("designation") || "—"}</span>,
      enableSorting: false,
      enableHiding: false,
    },
  );

  if (!isEmployeeMaster || isHrmsMasterEnabled) {
    baseColumns.push({
      accessorKey: "user_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User Type" />
      ),
      cell: ({ row }) => (
        <span>{formatUserTypeLabel(row.getValue("user_type") as string)}</span>
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  baseColumns.push(
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
  );

  baseColumns.push({
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      const isCustom = user.user_type?.trim().toLowerCase() === "custom";

      return (
        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Edit User"
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          )}

          {isCustom && onManagePrivileges && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
              title="Manage Privileges"
              onClick={() => onManagePrivileges(user)}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Privileges</span>
            </Button>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  });

  return baseColumns;
}

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
  employee_code: "",
  department: "",
  aadhar_no: "",
  pan_no: "",
  permanent_address: "",
  current_address: "",
  aadhar_card_file: "",
  pan_card_file: "",
  designation: "",
  user_contact: "",
  user_email: "",
  password: "",
  franchise_ids: [] as number[],
  user_type_id: "",
  status: "active" as "active" | "inactive",
};

interface UserMastersTableProps {
  vendorIdOverride?: number;
  userTypeFilter?: string;
  entityName?: string;
  isEmployeeMaster?: boolean;
}

export default function UserMastersTable({
  vendorIdOverride,
  userTypeFilter,
  entityName = "User",
  isEmployeeMaster: isEmployeeMasterProp,
}: UserMastersTableProps) {
  const router = useRouter();

  const handleManagePrivileges = (row: { id: number }) => {
    router.push(
      `/dashboard/masters-management/user-master/${row.id}/privileges${
        vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""
      }`
    );
  };
  const vendorId =
    vendorIdOverride ?? useAppSelector((state) => state.auth.user?.vendor_id);

  const isEmployeeMaster = Boolean(
    isEmployeeMasterProp ?? (userTypeFilter?.trim().toLowerCase() === "employee")
  );

  const loggedInUserType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  )
    ?.trim()
    .toLowerCase();
  const isMasterAdmin = loggedInUserType === "master-admin";

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [supervisorConfirmation, setSupervisorConfirmation] = React.useState<{
    franchises: { id: number; franchise_name: string }[];
    confirm: () => void;
  } | null>(null);
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
  const [isExporting, setIsExporting] = React.useState(false);
  const [modalStep, setModalStep] = React.useState<1 | 2>(1);
  const [uploadingAadhar, setUploadingAadhar] = React.useState(false);
  const [uploadingPan, setUploadingPan] = React.useState(false);
  const [aadharFileName, setAadharFileName] = React.useState("");
  const [panFileName, setPanFileName] = React.useState("");
  const [sameAddress, setSameAddress] = React.useState(false);

  const statesQuery = useStates();
  const stateOptions = React.useMemo(() => {
    const apiStates = statesQuery.data?.data?.map((s) => s.name) || [];
    if (apiStates.length > 0) {
      return Array.from(new Set([...apiStates, ...INDIAN_STATES])).sort((a, b) =>
        a.localeCompare(b),
      );
    }
    return INDIAN_STATES;
  }, [statesQuery.data?.data]);
  const [aadharSignedUrl, setAadharSignedUrl] = React.useState("");
  const [panSignedUrl, setPanSignedUrl] = React.useState("");
  const [editingUserCreatedAt, setEditingUserCreatedAt] = React.useState<string | undefined>(undefined);

  const authUser = useAppSelector((state) => state.auth.user);
  const { data: vendorData } = useVendorById(vendorId);

  const isHrmsMasterEnabled =
    vendorData?.data?.is_hrms_master_enabled === true ||
    authUser?.vendor?.is_hrms_master_enabled === true ||
    (authUser as any)?.vendorMaster?.is_hrms_master_enabled === true;

  const isHrmsEmployeeFlow = isEmployeeMaster && isHrmsMasterEnabled;

  const effectiveEntityName =
    isHrmsEmployeeFlow ? "User" : entityName;

  const queryUserType =
    isEmployeeMaster
      ? undefined
      : userTypeFilter;

  const { data, isLoading, isError, error } = useUsersForMaster(
    {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: globalFilter,
      franchise_id: franchiseFilter,
      user_type: queryUserType,
      exclude_user_type: undefined,
    },
    vendorId,
  );
  const { data: franchisesData = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );

  const filteredFranchises = React.useMemo(() => {
    if (!isHrmsEmployeeFlow) return franchisesData;
    if (!form.department) return franchisesData;

    const depUpper = form.department.trim().toUpperCase();
    return franchisesData.filter((fr) => {
      const fDep = (fr.Department || (fr as any).department || "").trim().toUpperCase();
      if (fDep) {
        return fDep === depUpper;
      }
      return true;
    });
  }, [franchisesData, isHrmsEmployeeFlow, form.department]);

  const handleDepartmentChange = (val: string) => {
    const nextDepUpper = val.trim().toUpperCase();
    const matchingFranchises = franchisesData.filter((fr) => {
      const fDep = (fr.Department || (fr as any).department || "").trim().toUpperCase();
      return !fDep || fDep === nextDepUpper;
    });
    const validIds = new Set(matchingFranchises.map((fr) => fr.id));

    setForm((f) => ({
      ...f,
      department: val,
      franchise_ids: f.franchise_ids.filter((id) => validIds.has(id)),
    }));
  };
  const { data: userTypesData } = useUserTypes();
  const employeeUserType = React.useMemo(
    () =>
      userTypesData?.data?.find(
        (ut) => ut.user_type?.trim().toLowerCase() === "employee",
      ),
    [userTypesData?.data],
  );
  const employeeUserTypeId = employeeUserType?.id
    ? String(employeeUserType.id)
    : "";
  const createUserMutation = useCreateUser(vendorId);
  const updateUserMutation = useUpdateUser(vendorId);

  const tableData = React.useMemo<UserMasterRow[]>(
    () =>
      (data?.data ?? [])
        .filter((item) => {
          const itemUserType = item.user_type?.user_type?.trim().toLowerCase();
          if (itemUserType === "master-admin") {
            return false;
          }
          if (userTypeFilter && !isEmployeeMaster) {
            return itemUserType === userTypeFilter.trim().toLowerCase();
          }
          return true;
        })
        .map((item, index) => ({
          srNo: pagination.pageIndex * pagination.pageSize + index + 1,
          id: item.id,
          employee_code: item.employee_code ?? "\u2014",
          department: item.department ?? "",
          aadhar_no: item.aadhar_no ?? "",
          pan_no: item.pan_no ?? "",
          permanent_address: item.permanent_address ?? "",
          current_address: item.current_address ?? "",
          aadhar_card_file: item.aadhar_card_file ?? "",
          pan_card_file: item.pan_card_file ?? "",
          created_at: (item as any).created_at ?? "",
          user_name: item.user_name,
          designation: item.designation ?? "",
          user_contact: item.user_contact,
          user_email: item.user_email,
          user_type: item.user_type?.user_type ?? "—",
          franchise_name: item.franchises?.map((fr) => fr.franchise_name).join(", ") || item.franchise?.franchise_name || "—",
          franchise_ids: item.franchise_ids ?? (item.franchise_id ? [item.franchise_id] : []),
          status: item.status,
          franchise_id: item.franchise_id ?? null,
          user_type_id:
            userTypesData?.data?.find(
              (ut) =>
                ut.user_type?.trim().toLowerCase() ===
                item.user_type?.user_type?.trim().toLowerCase(),
            )?.id ?? null,
        })),
    [
      data,
      userTypesData,
      pagination.pageIndex,
      pagination.pageSize,
      userTypeFilter,
      isEmployeeMaster,
      isHrmsMasterEnabled,
      isHrmsEmployeeFlow,
      router,
      vendorIdOverride,
    ],
  );

  const totalPages = data?.pagination?.totalPages ?? 1;

  const handleRowDoubleClick = React.useCallback(
    (row: UserMasterRow) => {
      if (isHrmsEmployeeFlow) {
        router.push(
          `/dashboard/masters-management/hrms-masters/employee-master/edit/${row.id}` +
            (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
        );
        return;
      }
      const fallbackUserTypeId =
        row.user_type_id ??
        userTypesData?.data?.find(
          (ut) =>
            ut.user_type?.trim().toLowerCase() ===
            row.user_type?.trim().toLowerCase(),
        )?.id ??
        (isEmployeeMaster && !isHrmsMasterEnabled && employeeUserType?.id
          ? employeeUserType.id
          : null);

      const normalizeDept = (d?: string | null) => {
        if (!d || d === "—") return "";
        const lower = d.trim().toLowerCase();
        if (lower === "branch") return "Branch";
        if (lower === "franchise") return "Franchise";
        if (lower === "factory") return "Factory";
        return d.trim();
      };

      let initialDept = normalizeDept(row.department);
      if (!initialDept && row.franchise_ids?.length) {
        const matchedFranchise = franchisesData.find((fr) => row.franchise_ids.includes(fr.id));
        if (matchedFranchise?.Department) {
          initialDept = normalizeDept(matchedFranchise.Department);
        }
      }

      const prefilled = {
        user_name: row.user_name,
        employee_code: row.employee_code && row.employee_code !== "—" ? row.employee_code : "",
        department: initialDept,
        aadhar_no: row.aadhar_no || "",
        pan_no: row.pan_no || "",
        permanent_address: row.permanent_address || "",
        current_address: row.current_address || "",
        aadhar_card_file: row.aadhar_card_file || "",
        pan_card_file: row.pan_card_file || "",
        designation: row.designation || "",
        user_contact: row.user_contact,
        user_email: row.user_email,
        password: "",
        franchise_ids: [...row.franchise_ids],
        user_type_id: fallbackUserTypeId ? String(fallbackUserTypeId) : "",
        status: (row.status === "active" || row.status === "inactive"
          ? row.status
          : "active") as "active" | "inactive",
      };
      setForm(prefilled);
      setOriginalForm(prefilled);
      setEditingUserId(row.id);
      setEditingUserType(row.user_type);
      setModalMode("edit");
      setModalStep(1);
      setEditingUserCreatedAt(row.created_at || undefined);
      setAadharSignedUrl("");
      setPanSignedUrl("");
      setAadharFileName(
        row.aadhar_card_file
          ? row.aadhar_card_file.split("/").pop() || "Aadhar_Card"
          : ""
      );
      setPanFileName(
        row.pan_card_file
          ? row.pan_card_file.split("/").pop() || "PAN_Card"
          : ""
      );
      setSameAddress(
        Boolean(
          row.permanent_address &&
          row.current_address &&
          row.permanent_address.trim() === row.current_address.trim()
        )
      );
      setOpenCreateModal(true);
    },
    [
      userTypesData?.data,
      isEmployeeMaster,
      isHrmsMasterEnabled,
      isHrmsEmployeeFlow,
      router,
      vendorIdOverride,
      employeeUserType?.id,
      franchisesData,
    ],
  );

  const columns = React.useMemo(
    () =>
      getUserMasterColumns(
        isEmployeeMaster,
        isHrmsMasterEnabled,
        handleManagePrivileges,
        handleRowDoubleClick,
      ),
    [
      isEmployeeMaster,
      isHrmsMasterEnabled,
      isHrmsEmployeeFlow,
      router,
      vendorIdOverride,
      handleManagePrivileges,
      handleRowDoubleClick,
    ],
  );

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
  const userTypeOptions = React.useMemo(
    () =>
      (userTypesData?.data ?? [])
        .filter((ut) => {
          const typeName = ut.user_type?.trim().toLowerCase();
          if (typeName === "master-admin") return false;
          if (userTypeFilter && !isEmployeeMaster) {
            return typeName === userTypeFilter.trim().toLowerCase();
          }
          return true;
        })
        .map((ut) => ({
          id: ut.id,
          label: formatUserTypeLabel(ut.user_type),
        })),
    [userTypesData?.data, userTypeFilter, isEmployeeMaster],
  );
  const hrmsUserTypeOptions = React.useMemo(() => {
    const all = userTypesData?.data ?? [];
    return all
      .filter((ut) => ut.user_type?.trim().toLowerCase() !== "master-admin")
      .map((ut) => ({
        id: ut.id,
        label: formatUserTypeLabel(ut.user_type),
      }));
  }, [userTypesData?.data]);

  const handleUploadAadhar = async (file: File) => {
    if (!vendorId) return;
    setUploadingAadhar(true);
    try {
      const res = await uploadUserDocument(file, vendorId);
      if (res.file_url) {
        setForm((f) => ({ ...f, aadhar_card_file: res.file_url }));
        setAadharFileName(file.name);
        if (res.signed_url) setAadharSignedUrl(res.signed_url);
        toast.success("Aadhar card uploaded successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload Aadhar card");
    } finally {
      setUploadingAadhar(false);
    }
  };

  const handleUploadPan = async (file: File) => {
    if (!vendorId) return;
    setUploadingPan(true);
    try {
      const res = await uploadUserDocument(file, vendorId);
      if (res.file_url) {
        setForm((f) => ({ ...f, pan_card_file: res.file_url }));
        setPanFileName(file.name);
        if (res.signed_url) setPanSignedUrl(res.signed_url);
        toast.success("PAN card uploaded successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload PAN card");
    } finally {
      setUploadingPan(false);
    }
  };

  const handleRemoveAadhar = () => {
    setForm((f) => ({ ...f, aadhar_card_file: "" }));
    setAadharFileName("");
    setAadharSignedUrl("");
  };

  const handleRemovePan = () => {
    setForm((f) => ({ ...f, pan_card_file: "" }));
    setPanFileName("");
    setPanSignedUrl("");
  };

  const resetForm = () => {
    setSupervisorConfirmation(null);
    let defaultUserTypeId = "";
    if (isEmployeeMaster) {
      if (isHrmsMasterEnabled && hrmsUserTypeOptions.length > 0) {
        defaultUserTypeId = String(hrmsUserTypeOptions[0].id);
      } else if (employeeUserTypeId) {
        defaultUserTypeId = employeeUserTypeId;
      }
    } else if (userTypeFilter && userTypeOptions.length > 0) {
      defaultUserTypeId = String(userTypeOptions[0].id);
    }

    setForm({ ...defaultForm, user_type_id: defaultUserTypeId });
    setOriginalForm({ ...defaultForm, user_type_id: defaultUserTypeId });
    setShowPassword(false);
    setModalMode("create");
    setEditingUserId(null);
    setEditingUserType(null);
    setModalStep(1);
    setUploadingAadhar(false);
    setUploadingPan(false);
    setAadharFileName("");
    setPanFileName("");
    setAadharSignedUrl("");
    setPanSignedUrl("");
    setEditingUserCreatedAt(undefined);
    setSameAddress(false);
  };

  React.useEffect(() => {
    if (modalMode === "create") {
      if (isEmployeeMaster) {
        if (isHrmsMasterEnabled) {
          if (!form.user_type_id && hrmsUserTypeOptions.length > 0) {
            setForm((f) => ({ ...f, user_type_id: String(hrmsUserTypeOptions[0].id) }));
          }
        } else if (employeeUserTypeId) {
          if (!form.user_type_id || form.user_type_id !== employeeUserTypeId) {
            setForm((f) => ({ ...f, user_type_id: employeeUserTypeId }));
          }
        }
      } else if (
        userTypeFilter &&
        userTypeOptions.length > 0 &&
        !form.user_type_id
      ) {
        setForm((f) => ({ ...f, user_type_id: String(userTypeOptions[0].id) }));
      }
    }
  }, [
    isEmployeeMaster,
    isHrmsMasterEnabled,
    hrmsUserTypeOptions,
    employeeUserTypeId,
    modalMode,
    userTypeFilter,
    userTypeOptions,
    form.user_type_id,
  ]);

  const isEditingCustomUser =
    modalMode === "edit" && editingUserType?.toLowerCase() === "custom";

  const isPasswordValid =
    modalMode === "edit"
      ? !form.password || passwordStrengthScore === 5
      : passwordStrengthScore === 5;

  const effectiveUserTypeId =
    isEmployeeMaster && !isHrmsMasterEnabled
      ? form.user_type_id || employeeUserTypeId
      : form.user_type_id;

  const isFormValid =
    form.user_name.trim() &&
    form.user_contact.trim() &&
    form.user_email.trim() &&
    isPasswordValid &&
    form.franchise_ids.length > 0 &&
    effectiveUserTypeId &&
    (!isHrmsEmployeeFlow || Boolean(form.department?.trim()));

  const handleSubmitError = (error: unknown, confirm: () => void) => {
    const response = (error as { response?: { data?: {
      code?: string; franchises?: { id: number; franchise_name: string }[];
    } } }).response?.data;
    if (response?.code === "SUPERVISOR_CONFIRMATION_REQUIRED" && response.franchises?.length) {
      setSupervisorConfirmation({ franchises: response.franchises, confirm });
    } else {
      setSupervisorConfirmation(null);
    }
  };

  const submitCreate = (payload: CreateUserMasterPayload) => {
    createUserMutation.mutate(payload, {
      onSuccess: () => { resetForm(); setOpenCreateModal(false); },
      onError: (error) => handleSubmitError(error, () =>
        submitCreate({ ...payload, confirm_additional_supervisor: true })),
    });
  };

  const submitUpdate = (userId: number, payload: UpdateUserMasterPayload) => {
    updateUserMutation.mutate({ userId, payload }, {
      onSuccess: () => { resetForm(); setOpenCreateModal(false); },
      onError: (error) => handleSubmitError(error, () =>
        submitUpdate(userId, { ...payload, confirm_additional_supervisor: true })),
    });
  };

  const handleSave = () => {
    if (!editingUserId || !vendorId || !isFormValid) return;

    // Normalize phone to national number for comparison
    const extractNational = (val: string) => {
      const parsed = parsePhoneNumberFromString(val);
      return parsed?.nationalNumber ?? val.replace(/\D/g, "");
    };

    const payload: Record<string, any> = {};

    if (form.user_name.trim() !== originalForm.user_name.trim())
      payload.user_name = form.user_name.trim();

    if (form.employee_code?.trim() !== (originalForm.employee_code || "").trim())
      payload.employee_code = form.employee_code?.trim() || null;

    if (form.designation.trim() !== (originalForm.designation || "").trim())
      payload.designation = form.designation.trim() || null;

    if ((form.department || "").trim() !== (originalForm.department || "").trim())
      payload.department = form.department?.trim() || null;

    if ((form.aadhar_no || "").trim() !== (originalForm.aadhar_no || "").trim())
      payload.aadhar_no = form.aadhar_no?.trim() || null;

    if ((form.pan_no || "").trim() !== (originalForm.pan_no || "").trim())
      payload.pan_no = form.pan_no?.trim() || null;

    if ((form.permanent_address || "").trim() !== (originalForm.permanent_address || "").trim())
      payload.permanent_address = form.permanent_address?.trim() || null;

    if ((form.current_address || "").trim() !== (originalForm.current_address || "").trim())
      payload.current_address = form.current_address?.trim() || null;

    if ((form.aadhar_card_file || "").trim() !== (originalForm.aadhar_card_file || "").trim())
      payload.aadhar_card_file = form.aadhar_card_file?.trim() || null;

    if ((form.pan_card_file || "").trim() !== (originalForm.pan_card_file || "").trim())
      payload.pan_card_file = form.pan_card_file?.trim() || null;

    const currContact = extractNational(form.user_contact);
    const origContact = extractNational(originalForm.user_contact);
    if (currContact !== origContact) payload.user_contact = currContact;

    if (form.user_email.trim() !== originalForm.user_email.trim())
      payload.user_email = form.user_email.trim();

    if (JSON.stringify(form.franchise_ids) !== JSON.stringify(originalForm.franchise_ids))
      payload.franchise_ids = form.franchise_ids;

    if ((!isEmployeeMaster || isHrmsMasterEnabled) && form.user_type_id !== originalForm.user_type_id)
      payload.user_type_id = Number(form.user_type_id);

    if (form.status !== originalForm.status) payload.status = form.status;

    // Only include password if the user typed something new
    if (form.password.trim()) payload.password = form.password;

    if (Object.keys(payload).length === 0) {
      setOpenCreateModal(false);
      resetForm();
      return;
    }

    submitUpdate(editingUserId, payload);
  };

  const handleCreate = () => {
    if (!isFormValid || !vendorId) return;

    const parsed = parsePhoneNumberFromString(form.user_contact);
    const contactNumber =
      parsed?.nationalNumber || form.user_contact.replace(/\D/g, "");

    submitCreate(
      {
        vendor_id: vendorId,
        franchise_id: form.franchise_ids[0],
        franchise_ids: form.franchise_ids,
        user_name: form.user_name.trim(),
        employee_code: form.employee_code?.trim() || undefined,
        designation: form.designation.trim() || undefined,
        user_contact: contactNumber,
        user_email: form.user_email.trim(),
        user_timezone: "Asia/Kolkata",
        password: form.password,
        user_type_id: Number(effectiveUserTypeId),
        status: form.status,
        department: form.department?.trim() || undefined,
        aadhar_no: form.aadhar_no?.trim() || undefined,
        pan_no: form.pan_no?.trim() || undefined,
        permanent_address: form.permanent_address?.trim() || undefined,
        current_address: form.current_address?.trim() || undefined,
        aadhar_card_file: form.aadhar_card_file?.trim() || undefined,
        pan_card_file: form.pan_card_file?.trim() || undefined,
      }
    );
  };

  const handleExportData = async () => {
    if (!vendorId || isExporting) return;

    setIsExporting(true);
    try {
      const response = await fetchUsersForMaster(vendorId, {
        page: 1,
        limit: 1000000,
        search: "",
        franchise_id: franchiseFilter,
      });

      const exportRows = response.data.filter(
        (item) =>
          item.user_type?.user_type?.trim().toLowerCase() !== "master-admin",
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users");

      worksheet.columns = [
        { header: "Sr No", key: "srNo", width: 8 },
        ...(isHrmsEmployeeFlow ? [{ header: "Employee Code", key: "employee_code", width: 18 }] : []),
        { header: "Name", key: "name", width: 25 },
        { header: "Contact No", key: "contact", width: 18 },
        { header: "Email", key: "email", width: 30 },
        { header: "User Type", key: "userType", width: 20 },
        { header: "Franchise", key: "franchise", width: 25 },
        { header: "Status", key: "status", width: 12 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "left" };
      headerRow.height = 20;

      exportRows.forEach((item, index) => {
        worksheet.addRow({
          srNo: index + 1,
          employee_code: item.employee_code || "-",
          name: item.user_name,
          contact: item.user_contact,
          email: item.user_email,
          userType: formatUserTypeLabel(item.user_type?.user_type),
          franchise:
            item.franchises?.map((fr) => fr.franchise_name).join(", ") ||
            item.franchise?.franchise_name ||
            "—",
          status: item.status,
          createdAt: item.created_at
            ? new Date(item.created_at).toLocaleString("en-IN")
            : "—",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const sanitizedVendorName = (vendorData?.data?.vendor_name || `vendor_${vendorId}`)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      saveAs(blob, `${sanitizedVendorName}_usersdata_${timestamp}.xlsx`);
    } catch (error) {
      console.error("Failed to export users data", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <AlertDialog
        open={supervisorConfirmation !== null}
        onOpenChange={(open) => {
          if (!open && !createUserMutation.isPending && !updateUserMutation.isPending)
            setSupervisorConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add another site supervisor?</AlertDialogTitle>
            <AlertDialogDescription>
              {supervisorConfirmation?.franchises.map((fr) => fr.franchise_name).join(", ")}
              {supervisorConfirmation?.franchises.length === 1
                ? " already has a site supervisor."
                : " already have site supervisors."}
              {" Are you sure you want to assign this user as an additional site supervisor?"}
              {vendorData?.data?.handlesLargeScaleProjects === false && " All existing leads with an account in the selected franchises will be assigned to this user, replacing their current site supervisor assignments and previous supervisors in existing lead chats."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createUserMutation.isPending || updateUserMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                supervisorConfirmation?.confirm();
              }}
            >
              {createUserMutation.isPending || updateUserMutation.isPending ? "Saving..." : "Confirm and save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card className="rounded-2xl p-0 border-0">
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full">
              <ClearInput
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                placeholder={`Search ${effectiveEntityName.toLowerCase()}s...`}
                className="h-9 w-full sm:max-w-md"
              />
              <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
                <FilterByStores
                  value={franchiseFilter}
                  onChange={(v) => {
                    setFranchiseFilter(v);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  franchises={franchisesData}
                />
                <Button
                  onClick={() => {
                    if (isHrmsEmployeeFlow) {
                      router.push(
                        "/dashboard/masters-management/hrms-masters/employee-master/create" +
                          (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
                      );
                      return;
                    }
                    resetForm();
                    setOpenCreateModal(true);
                  }}
                  className="sm:hidden"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create {effectiveEntityName}
                </Button>
              </div>
            </div>
            <Button
              onClick={() => {
                if (isHrmsEmployeeFlow) {
                  router.push(
                    "/dashboard/masters-management/hrms-masters/employee-master/create" +
                      (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
                  );
                  return;
                }
                resetForm();
                setOpenCreateModal(true);
              }}
              className="hidden sm:flex"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create {effectiveEntityName}
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
              Loading ${effectiveEntityName.toLowerCase()}s...
            </div>
          ) : isError ? (
            <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
              {(error as any)?.response?.data?.message ||
                `Failed to load ${effectiveEntityName.toLowerCase()}s.`}
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
        <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {modalMode === "edit" ? (
                  <UserCog size={18} className="text-primary" />
                ) : (
                  <UserPlus size={18} className="text-primary" />
                )}
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-base font-semibold leading-tight">
                  {modalMode === "edit" ? `Edit ${effectiveEntityName}` : `Create ${effectiveEntityName}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {modalMode === "edit"
                    ? `Update the details for this ${effectiveEntityName.toLowerCase()}.`
                    : isHrmsEmployeeFlow
                    ? modalStep === 1
                      ? "Enter basic user, department & credentials (Step 1 of 2)"
                      : "Enter IDs & addresses (Step 2 of 2)"
                    : `Add a new ${effectiveEntityName.toLowerCase()} for this vendor.`}
                </DialogDescription>
              </div>
            </div>
            {isHrmsEmployeeFlow && (
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                    modalStep === 1
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  1. Basic
                </span>
                <span className="text-muted-foreground text-[10px]">→</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                    modalStep === 2
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2. Details
                </span>
              </div>
            )}
          </div>
          <div className="mx-6 border-b" />

          <div className="px-6 pb-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {isHrmsEmployeeFlow && modalStep === 2 ? (
              /* ================== STEP 2 (Employee Details) ================== */
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Aadhar No & PAN No */}
                <div className="space-y-2">
                  <Label htmlFor="employee-aadhar-no">Aadhar Card No.</Label>
                  <Input
                    id="employee-aadhar-no"
                    placeholder="12-digit Aadhar"
                    maxLength={12}
                    value={form.aadhar_no}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                      setForm((f) => ({ ...f, aadhar_no: val }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-pan-no">PAN Card No.</Label>
                  <Input
                    id="employee-pan-no"
                    placeholder="10-digit PAN (e.g. ABCDE1234F)"
                    maxLength={10}
                    value={form.pan_no}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().slice(0, 10);
                      setForm((f) => ({ ...f, pan_no: val }));
                    }}
                  />
                </div>

                {/* Aadhar & PAN Document Uploads */}
                <div className="space-y-2">
                  <DocumentUploadBox
                    label="Upload Aadhar Card"
                    fileUrl={form.aadhar_card_file}
                    fileName={aadharFileName}
                    signedUrlOverride={aadharSignedUrl}
                    createdAt={editingUserCreatedAt}
                    onUpload={handleUploadAadhar}
                    onRemove={handleRemoveAadhar}
                    isUploading={uploadingAadhar}
                  />
                </div>

                <div className="space-y-2">
                  <DocumentUploadBox
                    label="Upload PAN Card"
                    fileUrl={form.pan_card_file}
                    fileName={panFileName}
                    signedUrlOverride={panSignedUrl}
                    createdAt={editingUserCreatedAt}
                    onUpload={handleUploadPan}
                    onRemove={handleRemovePan}
                    isUploading={uploadingPan}
                  />
                </div>

                {/* Permanent Address */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="employee-permanent-address">Permanent Address</Label>
                  <Textarea
                    id="employee-permanent-address"
                    rows={2}
                    placeholder="Enter permanent address..."
                    value={form.permanent_address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => {
                        const next = { ...f, permanent_address: val };
                        if (sameAddress) next.current_address = val;
                        return next;
                      });
                    }}
                  />
                </div>

                {/* Current Address */}
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="employee-current-address">Current Address</Label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        checked={sameAddress}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAddress(checked);
                          if (checked) {
                            setForm((f) => ({ ...f, current_address: f.permanent_address }));
                          }
                        }}
                      />
                      Same as Permanent Address
                    </label>
                  </div>
                  <Textarea
                    id="employee-current-address"
                    rows={2}
                    placeholder="Enter current address..."
                    value={form.current_address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSameAddress(false);
                      setForm((f) => ({ ...f, current_address: val }));
                    }}
                  />
                </div>
              </div>
            ) : (
              /* ================== STEP 1 (Basic & Login Info) ================== */
              <div className="grid grid-cols-2 gap-4">
                {/* Employee Code */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="employee-code">Employee Code</Label>
                  <Input
                    id="employee-code"
                    value={
                      form.employee_code ||
                      (modalMode === "create"
                        ? "Auto-generated (e.g. EMP-XXX)"
                        : "Auto-assigned on save")
                    }
                    disabled
                    className="bg-muted font-mono text-muted-foreground"
                  />
                </div>

                {isEmployeeMaster ? (
                  <>
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

                    {/* Row 3: If HRMS Master is enabled, render User Type and Designation side-by-side, with Franchise spanning 2 cols */}
                    {isHrmsMasterEnabled ? (
                      <>
                        <div className="space-y-2">
                          <Label>User Type</Label>
                          <AssignToPicker
                            data={hrmsUserTypeOptions}
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

                        <div className="space-y-2">
                          <Label htmlFor="user-designation">Designation</Label>
                          <Input
                            id="user-designation"
                            value={form.designation}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, designation: e.target.value }))
                            }
                            placeholder="Enter designation"
                          />
                        </div>

                        {/* Department & Franchise on same row */}
                        <div className="space-y-2">
                          <Label htmlFor="employee-department">
                            Department <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={form.department}
                            onValueChange={handleDepartmentChange}
                          >
                            <SelectTrigger id="employee-department" className="h-9 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Branch">Branch</SelectItem>
                              <SelectItem value="Franchise">Franchise</SelectItem>
                              <SelectItem value="Factory">Factory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employee-franchise-search">
                            Franchise <span className="text-destructive">*</span>
                          </Label>
                          <MultipleSelector
                            inputProps={{
                              id: "employee-franchise-search",
                              name: "employee-franchise-search",
                              autoComplete: "off",
                              autoCapitalize: "none",
                              spellCheck: false,
                            }}
                            options={filteredFranchises.map((fr) => ({
                              value: String(fr.id),
                              label: fr.franchise_name,
                            }))}
                            value={form.franchise_ids.map((id) => ({
                              value: String(id),
                              label: franchisesData.find((fr) => fr.id === id)?.franchise_name ?? String(id),
                            }))}
                            onChange={(selected) =>
                              setForm((f) => ({ ...f, franchise_ids: selected.map((option) => Number(option.value)) }))
                            }
                            placeholder={
                              form.department
                                ? `Select ${form.department} franchises...`
                                : "Select franchises..."
                            }
                            hidePlaceholderWhenSelected
                            showSelectedOptionsInDropdown
                          />
                          {form.department && filteredFranchises.length === 0 && (
                            <p className="text-[11px] text-amber-600 mt-1">
                              No franchises under {form.department}.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="user-designation">Designation</Label>
                          <Input
                            id="user-designation"
                            value={form.designation}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, designation: e.target.value }))
                            }
                            placeholder="Enter designation"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employee-franchise-search">Franchise</Label>
                          <MultipleSelector
                            inputProps={{
                              id: "employee-franchise-search",
                              name: "employee-franchise-search",
                              autoComplete: "off",
                              autoCapitalize: "none",
                              spellCheck: false,
                            }}
                            options={franchisesData.map((fr) => ({
                              value: String(fr.id),
                              label: fr.franchise_name,
                            }))}
                            value={form.franchise_ids.map((id) => ({
                              value: String(id),
                              label: franchisesData.find((fr) => fr.id === id)?.franchise_name ?? String(id),
                            }))}
                            onChange={(selected) =>
                              setForm((f) => ({ ...f, franchise_ids: selected.map((option) => Number(option.value)) }))
                            }
                            placeholder="Select franchises..."
                            hidePlaceholderWhenSelected
                            showSelectedOptionsInDropdown
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Row 1: User Name | Designation */}
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
                      <Label htmlFor="user-designation">Designation</Label>
                      <Input
                        id="user-designation"
                        value={form.designation}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, designation: e.target.value }))
                        }
                        placeholder="Enter designation"
                      />
                    </div>

                    {/* Row 2: Contact No. | Email */}
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

                    {/* Row 3: User Type | Franchise */}
                    {!isEditingCustomUser && (
                      <div className="space-y-2">
                        <Label>User Type</Label>
                        <AssignToPicker
                          data={userTypeOptions}
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

                    <div
                      className={cn(
                        "space-y-2",
                        isEditingCustomUser && "col-span-2",
                      )}
                    >
                      <Label htmlFor="user-franchise-search">Franchise</Label>
                      <MultipleSelector
                        inputProps={{
                          id: "user-franchise-search",
                          name: "franchise-search",
                          autoComplete: "off",
                          autoCapitalize: "none",
                          spellCheck: false,
                        }}
                        options={franchisesData.map((fr) => ({
                          value: String(fr.id),
                          label: fr.franchise_name,
                        }))}
                        value={form.franchise_ids.map((id) => ({
                          value: String(id),
                          label: franchisesData.find((fr) => fr.id === id)?.franchise_name ?? String(id),
                        }))}
                        onChange={(selected) =>
                          setForm((f) => ({ ...f, franchise_ids: selected.map((option) => Number(option.value)) }))
                        }
                        placeholder="Select franchises..."
                        hidePlaceholderWhenSelected
                        showSelectedOptionsInDropdown
                      />
                    </div>

                    {/* Row 4: Status */}
                    <div className="col-span-2 space-y-2">
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
                  </>
                )}

                {/* Password (full width) */}
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
                      name="new-password"
                      autoComplete="new-password"
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

                  {/* Strength bar */}
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
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-2 pt-4 border-t mt-2">
              <div className="w-fit h-auto">
                {isHrmsEmployeeFlow && modalStep === 2 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setModalStep(1)}
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  >
                    <ChevronLeft size={14} />
                    Back
                  </Button>
                ) : isEditingCustomUser && editingUserId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                      setOpenCreateModal(false);
                      handleManagePrivileges({ id: editingUserId });
                    }}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Manage User Privileges
                  </Button>
                ) : null}
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

                {isHrmsEmployeeFlow && modalStep === 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setModalStep(2)}
                    disabled={!isFormValid || !vendorId}
                    className="gap-1.5"
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={modalMode === "edit" ? handleSave : handleCreate}
                    disabled={
                      !isFormValid ||
                      !vendorId ||
                      createUserMutation.isPending ||
                      updateUserMutation.isPending ||
                      uploadingAadhar ||
                      uploadingPan
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
                      `Create ${effectiveEntityName}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      
    </>
  );
}
