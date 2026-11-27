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
import {
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { bulkUploadCompanyVendors } from "@/api/typesMasterApi";
import { toastManager } from "@/components/ui/toast";
import { useCompanyVendorMetaData } from "@/hooks/useDetailedCompanyVendor";

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
              ? "border-border bg-foreground/10 text-foreground"
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
              ? "border-border bg-foreground/10 text-foreground"
              : "border-zinc-200 bg-zinc-100 text-zinc-600",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isActive ? "bg-foreground" : "bg-zinc-400",
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
        <div className="flex items-center gap-2 min-w-0">
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


interface PreviewResult {
  totalRows: number;
  validCount: number;
  failedCount: number;
  errors: string[];
  criticalError?: string;
}

function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const cleanText = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(field);
      if (row.some((c) => c.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

const parseInventoryFileForPreview = async (
  file: File,
  currentVendors: any[],
  meta?: any
): Promise<PreviewResult> => {
  const workbook = new ExcelJS.Workbook();
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    const parsedRows = parseCSVText(text);
    if (parsedRows.length <= 1) {
      return {
        totalRows: 0,
        validCount: 0,
        failedCount: 0,
        errors: [],
        criticalError: "Uploaded sheet contains no data rows",
      };
    }
    const sheet = workbook.addWorksheet("CSV");
    parsedRows.forEach((r) => sheet.addRow(r));
  } else {
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.actualRowCount <= 1) {
    return {
      totalRows: 0,
      validCount: 0,
      failedCount: 0,
      errors: [],
      criticalError: "Uploaded sheet contains no data rows",
    };
  }

  const getCellValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "object") {
      if ("richText" in val && Array.isArray(val.richText)) {
        return val.richText.map((t: any) => t.text).join("");
      }
      if ("text" in val) return String(val.text ?? "");
      if ("result" in val) return String(val.result ?? "");
      if ("formula" in val) return String(val.result ?? val.formula ?? "");
    }
    return String(val).trim();
  };

  const headers: Record<number, string> = {};
  const rows: Record<string, string>[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const raw = getCellValue(cell.value);
        const clean = raw.replace(/\*/g, "").toLowerCase().replace(/[\s_-]+/g, " ").trim();
        headers[colNumber] = clean;
      });
    } else {
      const rowData: Record<string, string> = {};
      let hasAnyData = false;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = headers[colNumber];
        if (key) {
          const val = getCellValue(cell.value);
          if (val) hasAnyData = true;
          rowData[key] = val;
        }
      });
      if (hasAnyData) {
        rows.push(rowData);
      }
    }
  });

  if (rows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      failedCount: 0,
      errors: [],
      criticalError: "Uploaded sheet contains no data rows",
    };
  }

  const findValue = (row: Record<string, string>, aliases: string[]) => {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const foundKey = keys.find((k) => k === alias || k.includes(alias));
      if (foundKey && row[foundKey] !== undefined) {
        return row[foundKey];
      }
    }
    return "";
  };

  const allHeaderKeys = Object.values(headers).filter(Boolean);
  const hasVendorCode = allHeaderKeys.some((k) => k.includes("vendor code") || k.includes("company code") || k.includes("code"));
  const hasCompanyName = allHeaderKeys.some((k) => k.includes("company name") || k.includes("company"));

  if (!hasVendorCode || !hasCompanyName) {
    return {
      totalRows: rows.length,
      validCount: 0,
      failedCount: rows.length,
      errors: [],
      criticalError:
        "Required columns are missing in sheet. Expected: Company Code, Company Name, Vendor Type, Primary Contact Person, Mobile No, Email, Payment Term, GST No, PAN No, Address Line 1, State, City, Pincode, Contact Department, Contact Designation, Bank Account Holder Name, Bank Account Number, Bank IFSC Code, Bank Branch Name",
    };
  }

  const existingCodeSet = new Set(
    (currentVendors || []).map((v: any) => String(v.vendor_code || "").trim().toLowerCase())
  );
  const existingGstSet = new Set(
    (currentVendors || []).filter((v: any) => v.gst_no).map((v: any) => String(v.gst_no).trim().toUpperCase())
  );
  const existingPanSet = new Set(
    (currentVendors || []).filter((v: any) => v.pan_no).map((v: any) => String(v.pan_no).trim().toUpperCase())
  );

  const seenSheetCodes = new Set<string>();
  const seenSheetGst = new Set<string>();
  const seenSheetPan = new Set<string>();
  const errors: string[] = [];
  let validCount = 0;

  const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

  let rowNum = 1;
  for (const row of rows) {
    rowNum++;
    const vendorCode = findValue(row, ["vendor code", "company code", "code"]).trim();
    const companyName = findValue(row, ["company name", "company"]).trim();
    const rawVendorTypes = findValue(row, ["vendor type", "vendor_type", "type"]).trim();
    const pointOfContact = findValue(row, ["primary contact person", "point of contact", "contact person", "poc"]).trim();
    const rawContact = findValue(row, ["mobile no", "mobile", "contact no", "contact number", "phone"]).trim();
    const email = findValue(row, ["email", "email address", "mail"]).trim();
    const rawPaymentTerm = findValue(row, ["payment term", "payment_term"]).trim();
    const gstNo = findValue(row, ["gst no", "gst", "gstin"]).trim().toUpperCase();
    const panNo = findValue(row, ["pan no", "pan"]).trim().toUpperCase();

    // Address
    const addressLine1 = findValue(row, ["address line 1", "address_line_1", "address 1", "address"]).trim();
    const rawState = findValue(row, ["state"]).trim();
    const rawCity = findValue(row, ["city"]).trim();
    const pincode = findValue(row, ["pincode", "pin code", "pin"]).trim();

    // Contact Person details
    const department = findValue(row, ["contact department", "department"]).trim();
    const designation = findValue(row, ["contact designation", "designation"]).trim();

    // Bank Details
    const bankHolder = findValue(row, ["bank account holder name", "account holder name", "account holder", "holder name"]).trim();
    const bankAccount = findValue(row, ["bank account number", "account number", "account no"]).trim();
    const bankIfsc = findValue(row, ["bank ifsc code", "ifsc code", "ifsc"]).trim().toUpperCase();
    const bankBranch = findValue(row, ["bank branch name", "branch name", "branch"]).trim();

    // Required fields check
    if (!vendorCode) {
      errors.push(`Row ${rowNum}: Company Code is required`);
      continue;
    }
    if (!companyName) {
      errors.push(`Row ${rowNum}: Company Name is required`);
      continue;
    }
    if (!rawVendorTypes) {
      errors.push(`Row ${rowNum}: Vendor Type is required`);
      continue;
    }
    if (!pointOfContact) {
      errors.push(`Row ${rowNum}: Primary Contact Person is required`);
      continue;
    }

    const cleanContact = rawContact.replace(/\D/g, "");
    const normalizedContact =
      cleanContact.length === 12 && cleanContact.startsWith("91")
        ? cleanContact.slice(2)
        : cleanContact;
    if (!normalizedContact || normalizedContact.length < 10) {
      errors.push(`Row ${rowNum}: Valid 10-digit Mobile No is required (got: "${rawContact}")`);
      continue;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${rowNum}: Valid Email is required (got: "${email}")`);
      continue;
    }

    if (!rawPaymentTerm) {
      errors.push(`Row ${rowNum}: Payment Term is required`);
      continue;
    }

    if (!gstNo || !gstRegex.test(gstNo)) {
      errors.push(`Row ${rowNum}: Valid 15-character GSTIN is required (got: "${gstNo}")`);
      continue;
    }

    if (!panNo || !panRegex.test(panNo)) {
      errors.push(`Row ${rowNum}: Valid 10-character PAN No is required (got: "${panNo}")`);
      continue;
    }

    if (!addressLine1) {
      errors.push(`Row ${rowNum}: Address Line 1 is required`);
      continue;
    }
    if (!rawState) {
      errors.push(`Row ${rowNum}: State is required`);
      continue;
    }
    if (!rawCity) {
      errors.push(`Row ${rowNum}: City is required`);
      continue;
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      errors.push(`Row ${rowNum}: Valid 6-digit Pincode is required (got: "${pincode}")`);
      continue;
    }

    if (!department) {
      errors.push(`Row ${rowNum}: Contact Department is required`);
      continue;
    }
    if (!designation) {
      errors.push(`Row ${rowNum}: Contact Designation is required`);
      continue;
    }

    if (!bankHolder) {
      errors.push(`Row ${rowNum}: Bank Account Holder Name is required`);
      continue;
    }
    if (!bankAccount || !/^\d{9,18}$/.test(bankAccount)) {
      errors.push(`Row ${rowNum}: Valid Bank Account Number (9-18 digits) is required (got: "${bankAccount}")`);
      continue;
    }
    if (!bankIfsc || !ifscRegex.test(bankIfsc)) {
      errors.push(`Row ${rowNum}: Valid IFSC Code (e.g. SBIN0001234) is required (got: "${bankIfsc}")`);
      continue;
    }
    if (!bankBranch) {
      errors.push(`Row ${rowNum}: Bank Branch Name is required`);
      continue;
    }

    // Duplicates check
    const lowerCode = vendorCode.toLowerCase();
    if (seenSheetCodes.has(lowerCode)) {
      errors.push(`Row ${rowNum}: Duplicate Company Code "${vendorCode}" in sheet`);
      continue;
    }
    seenSheetCodes.add(lowerCode);
    if (existingCodeSet.has(lowerCode)) {
      errors.push(`Row ${rowNum}: Company Code "${vendorCode}" already exists in database`);
      continue;
    }

    if (seenSheetGst.has(gstNo)) {
      errors.push(`Row ${rowNum}: Duplicate GST No "${gstNo}" in sheet`);
      continue;
    }
    seenSheetGst.add(gstNo);
    if (existingGstSet.has(gstNo)) {
      errors.push(`Row ${rowNum}: GST No "${gstNo}" already exists in database`);
      continue;
    }

    if (seenSheetPan.has(panNo)) {
      errors.push(`Row ${rowNum}: Duplicate PAN No "${panNo}" in sheet`);
      continue;
    }
    seenSheetPan.add(panNo);
    if (existingPanSet.has(panNo)) {
      errors.push(`Row ${rowNum}: PAN No "${panNo}" already exists in database`);
      continue;
    }

    // Check state in meta if available
    if (meta?.states && meta.states.length > 0) {
      const stateExists = meta.states.some(
        (s: any) => s.name.toLowerCase() === rawState.toLowerCase() || String(s.id) === rawState
      );
      if (!stateExists) {
        errors.push(`Row ${rowNum}: State "${rawState}" not found in database`);
        continue;
      }
    }

    validCount++;
  }

  return {
    totalRows: rows.length,
    validCount,
    failedCount: rows.length - validCount,
    errors,
  };
};

export default function CompanyVendorMastersTable({
  vendorIdOverride,
}: CompanyVendorMastersTableProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id;
  const vendorId = vendorIdOverride ?? user?.vendor_id;

  const isSuperAdmin = React.useMemo(() => {
    if (!user) return false;
    const roleName = (
      user.user_type?.user_type ||
      user.user_role ||
      ""
    ).toLowerCase().trim();
    return (
      roleName === "super-admin" ||
      roleName === "superadmin" ||
      roleName === "super admin" ||
      roleName === "super_admin"
    );
  }, [user]);

  const { data, isLoading, isError, error, refetch } = useCompanyVendorsForMaster(vendorId, true);
  const { data: allVendorsData, refetch: refetchAllVendors } = useCompanyVendorsForMaster(vendorId);
  const allVendors = allVendorsData?.data || [];
  const { data: metaDataResponse } = useCompanyVendorMetaData(vendorId);
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

  // Bulk Upload States
  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<{
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);
  const [previewResult, setPreviewResult] = React.useState<PreviewResult | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
        router.push(`/dashboard/inventory/master/company-vendor/edit/${row.id}`);
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


  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventory Company Vendors");

    worksheet.columns = [
      { header: "Company Code *", key: "vendor_code", width: 18 },
      { header: "Company Name *", key: "company_name", width: 30 },
      { header: "Vendor Display Name", key: "vendor_display_name", width: 25 },
      { header: "Vendor Type *", key: "vendor_type", width: 22 },
      { header: "Primary Contact Person *", key: "point_of_contact", width: 25 },
      { header: "Mobile No *", key: "contact_no", width: 18 },
      { header: "Email *", key: "email", width: 28 },
      { header: "Alternate Mobile No", key: "alternate_mobile_no", width: 20 },
      { header: "Alternate Email", key: "alternate_email", width: 28 },
      { header: "Payment Term *", key: "payment_term", width: 18 },
      { header: "GST No *", key: "gst_no", width: 20 },
      { header: "PAN No *", key: "pan_no", width: 18 },
      { header: "In House (Yes/No)", key: "in_house", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Address Line 1 *", key: "address_line_1", width: 35 },
      { header: "Address Line 2", key: "address_line_2", width: 25 },
      { header: "State *", key: "state", width: 20 },
      { header: "City *", key: "city", width: 20 },
      { header: "Pincode *", key: "pincode", width: 15 },
      { header: "Landmark", key: "landmark", width: 22 },
      { header: "Contact Department *", key: "department", width: 22 },
      { header: "Contact Designation *", key: "designation", width: 22 },
      { header: "Bank Account Holder Name *", key: "bank_holder", width: 28 },
      { header: "Bank Account Number *", key: "bank_account", width: 24 },
      { header: "Bank IFSC Code *", key: "bank_ifsc", width: 18 },
      { header: "Bank Branch Name *", key: "bank_branch", width: 25 },
      { header: "Bank SWIFT Code", key: "bank_swift", width: 18 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 24;

    worksheet.addRow({
      vendor_code: "VEN-001",
      company_name: "Acme Supplies Pvt Ltd",
      vendor_display_name: "Acme Supplies",
      vendor_type: "Raw Material",
      point_of_contact: "Rahul Verma",
      contact_no: "9876543210",
      email: "rahul@acmesupplies.com",
      alternate_mobile_no: "9876543211",
      alternate_email: "sales@acmesupplies.com",
      payment_term: "Net 30",
      gst_no: "27ABCDE1234F1Z5",
      pan_no: "ABCDE1234F",
      in_house: "No",
      status: "Active",
      address_line_1: "Plot 45, Industrial Area",
      address_line_2: "Phase 2",
      state: "Maharashtra",
      city: "Pune",
      pincode: "411018",
      landmark: "Near Metro Station",
      department: "Sales",
      designation: "Manager",
      bank_holder: "Acme Supplies Pvt Ltd",
      bank_account: "123456789012",
      bank_ifsc: "SBIN0001234",
      bank_branch: "Bhosari Branch",
      bank_swift: "SBININBB123",
    });

    worksheet.addRow({
      vendor_code: "VEN-002",
      company_name: "Global Hardware Ltd",
      vendor_display_name: "Global Hardware",
      vendor_type: "Hardware",
      point_of_contact: "Sunil Patil",
      contact_no: "9823012345",
      email: "sunil@globalhardware.in",
      alternate_mobile_no: "",
      alternate_email: "info@globalhardware.in",
      payment_term: "Immediate",
      gst_no: "27XYZAB5678C1Z2",
      pan_no: "XYZAB5678C",
      in_house: "Yes",
      status: "Active",
      address_line_1: "Unit 2, MIDC Bhosari",
      address_line_2: "",
      state: "Maharashtra",
      city: "Pune",
      pincode: "411026",
      landmark: "Opp Steel Market",
      department: "Operations",
      designation: "Lead",
      bank_holder: "Global Hardware Ltd",
      bank_account: "987654321000",
      bank_ifsc: "HDFC0000123",
      bank_branch: "Pimpri Branch",
      bank_swift: "",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Inventory_Company_Vendor_Template.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (selectedFile: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      toastManager.add({
        title: "Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.",
        type: "error",
      });
      return;
    }

    setUploadFile(selectedFile);
    setUploadResult(null);
    setPreviewResult(null);
    setIsParsing(true);

    try {
      const preview = await parseInventoryFileForPreview(selectedFile, allVendors, metaDataResponse?.data);
      setPreviewResult(preview);
    } catch (err: any) {
      setPreviewResult({
        totalRows: 0,
        validCount: 0,
        failedCount: 0,
        errors: [],
        criticalError:
          "Failed to parse file: " +
          (err.message || "Invalid or unsupported file format. Please ensure standard Excel/CSV format."),
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !vendorId || !userId) return;

    setIsUploading(true);

    try {
      const res = await bulkUploadCompanyVendors(vendorId, uploadFile, userId, true);
      if (res.success) {
        setUploadResult(res.data);
        refetch();
        refetchAllVendors();
        if (res.data.successCount > 0) {
          toastManager.add({
            title: `Successfully imported ${res.data.successCount} company vendor(s).`,
            type: "success",
          });
        }
        if (res.data.failedCount > 0) {
          toastManager.add({
            title: `${res.data.failedCount} row(s) could not be imported. Please review the errors below.`,
            type: "error",
          });
        }
      } else {
        toastManager.add({
          title: res.message || "Failed to upload company vendors",
          type: "error",
        });
      }
    } catch (err: any) {
      toastManager.add({
        title: err.response?.data?.message || err.message || "Failed to upload company vendors",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
            <CardTitle className="text-2xl font-bold tracking-tight">Company Vendor Masters</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage all company vendor master entries from one place.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-start">
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUploadFile(null);
                  setUploadResult(null);
                  setPreviewResult(null);
                  setIsParsing(false);
                  setOpenUploadModal(true);
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
            )}
            <Button
              onClick={() => router.push("/dashboard/inventory/master/company-vendor/create")}
              size="sm"
              className="gap-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              <Plus className="mr-0 h-4 w-4" />
              Create Company Vendor
            </Button>
          </div>
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
            <DialogDescription className="break-words">
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
    
      {/* Bulk Upload Modal (Super Admin Only) */}
      <Dialog
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setUploadFile(null);
            setUploadResult(null);
            setPreviewResult(null);
            setIsParsing(false);
            setIsUploading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Bulk Upload Company Vendors
            </DialogTitle>
            <DialogDescription className="break-words">
              Upload an Excel (.xlsx, .xls) or CSV (.csv) file to import inventory company vendor master entries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Template Download Alert */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Need the standard format?</p>
                <p className="text-xs text-muted-foreground">
                  Download our pre-formatted sample Excel sheet with column headers and sample data.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="shrink-0 ml-3"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-background",
                uploadFile && "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {uploadFile ? (
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFile(null);
                      setUploadResult(null);
                      setPreviewResult(null);
                      setIsParsing(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Excel (.xlsx, .xls) or CSV (.csv) up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Parsing State */}
            {isParsing && (
              <div className="flex items-center justify-center p-4 rounded-lg border bg-muted/20 text-muted-foreground text-sm gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Validating rows and checking duplicates...</span>
              </div>
            )}

            {/* Validation Preview (Before Upload) */}
            {!uploadResult && !isParsing && previewResult && (
              <div className="space-y-3 pt-1">
                {previewResult.criticalError ? (
                  <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{previewResult.criticalError}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {previewResult.validCount > 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          {previewResult.validCount > 0
                            ? `${previewResult.validCount} of ${previewResult.totalRows} row(s) will be added`
                            : `0 of ${previewResult.totalRows} row(s) will be added`}
                        </span>
                      </div>
                      {previewResult.failedCount > 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 shrink-0">
                          {previewResult.failedCount} Skipped / Won't Add
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">
                          All Valid
                        </span>
                      )}
                    </div>

                    {previewResult.errors.length > 0 && (
                      <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-3 min-w-0">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-2">
                          <AlertCircle className="h-4 w-4 shrink-0" /> Row Issues ({previewResult.errors.length}) — These rows will be skipped
                        </p>
                        <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-red-700 dark:text-red-400 pr-1">
                          {previewResult.errors.map((err: string, i: number) => (
                            <p key={i} className="leading-relaxed font-mono text-[11px] break-words break-all">
                              • {err}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Upload Results & Feedback (After Upload) */}
            {uploadResult && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                      Imported {uploadResult.successCount} of {uploadResult.totalRows} rows
                    </span>
                  </div>
                  {uploadResult.failedCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 shrink-0">
                      {uploadResult.failedCount} Failed
                    </span>
                  )}
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-3 min-w-0">
                    <p className="text-xs font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-4 w-4 shrink-0" /> Row Issues ({uploadResult.errors.length})
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-red-700 dark:text-red-400 pr-1">
                      {uploadResult.errors.map((err: string, i: number) => (
                        <p key={i} className="leading-relaxed font-mono text-[11px] break-words break-all">
                          • {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => setOpenUploadModal(false)}
            >
              {uploadResult ? "Close" : "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={
                !uploadFile ||
                isUploading ||
                isParsing ||
                !!uploadResult ||
                (previewResult ? previewResult.validCount === 0 : false)
              }
              onClick={handleUploadSubmit}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : isParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : uploadResult ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Imported
                </>
              ) : previewResult && previewResult.validCount === 0 ? (
                "No Valid Rows to Import"
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {previewResult && previewResult.validCount > 0
                    ? `Upload & Import (${previewResult.validCount} rows)`
                    : "Upload & Import"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
