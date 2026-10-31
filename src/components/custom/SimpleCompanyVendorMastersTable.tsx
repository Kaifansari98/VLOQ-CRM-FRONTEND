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
import ExcelJS from "exceljs";
import { bulkUploadCompanyVendors } from "@/api/typesMasterApi";
import { toastManager } from "@/components/ui/toast";

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
import { PhoneInput } from "@/components/ui/phone-input";
import { validateIndianMobileRisk } from "@/utils/phoneRiskValidator";

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

interface SimpleCompanyVendorMastersTableProps {
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

const parseFileForPreview = async (
  file: File,
  currentVendors: any[]
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
  const hasVendorCodeHeader = allHeaderKeys.some((k) => k.includes("vendor code") || k.includes("code"));
  const hasCompanyNameHeader = allHeaderKeys.some((k) => k.includes("company") || k.includes("vendor name"));

  if (!hasVendorCodeHeader || !hasCompanyNameHeader) {
    return {
      totalRows: rows.length,
      validCount: 0,
      failedCount: rows.length,
      errors: [],
      criticalError:
        "Required columns are missing in sheet. Expected at minimum: 'Vendor Code', 'Company Name', 'Point of Contact', 'Contact No'",
    };
  }

  const existingCodeSet = new Set(
    (currentVendors || []).map((v: any) => String(v.vendor_code || "").trim().toLowerCase())
  );

  const seenSheetCodes = new Set<string>();
  const errors: string[] = [];
  let validCount = 0;

  let rowNum = 1;
  for (const row of rows) {
    rowNum++;
    const rawCode = findValue(row, ["vendor code", "vendor_code", "company code", "code"]);
    const rawCompany = findValue(row, ["company name", "company_name", "company", "vendor name"]);
    const rawPoc = findValue(row, ["point of contact", "point_of_contact", "contact person", "poc"]);
    const rawContact = findValue(row, ["contact no", "contact_no", "contact number", "mobile", "phone", "contact"]);

    const vendorCode = rawCode ? String(rawCode).trim() : "";
    const companyName = rawCompany ? String(rawCompany).trim() : "";
    const pointOfContact = rawPoc ? String(rawPoc).trim() : "";
    const contactNo = rawContact ? String(rawContact).trim() : "";

    if (!vendorCode) {
      errors.push(`Row ${rowNum}: Vendor Code is required`);
      continue;
    }

    if (!companyName) {
      errors.push(`Row ${rowNum}: Company Name is required`);
      continue;
    }

    if (!pointOfContact) {
      errors.push(`Row ${rowNum}: Point of Contact is required`);
      continue;
    }

    const cleanContact = contactNo.replace(/\D/g, "");
    const normalizedContact =
      cleanContact.length === 12 && cleanContact.startsWith("91")
        ? cleanContact.slice(2)
        : cleanContact;

    if (!normalizedContact || normalizedContact.length < 10) {
      errors.push(`Row ${rowNum}: Valid 10-digit Contact No is required (got: "${contactNo}")`);
      continue;
    }

    const lowerCode = vendorCode.toLowerCase();
    if (seenSheetCodes.has(lowerCode)) {
      errors.push(`Row ${rowNum}: Duplicate Vendor Code "${vendorCode}" found in uploaded sheet`);
      continue;
    }
    seenSheetCodes.add(lowerCode);

    if (existingCodeSet.has(lowerCode)) {
      errors.push(`Row ${rowNum}: Vendor Code "${vendorCode}" already exists in database`);
      continue;
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

export default function SimpleCompanyVendorMastersTable({
  vendorIdOverride,
}: SimpleCompanyVendorMastersTableProps) {
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
  
  // List filtered for Field Masters (is_inventory_company_vendor = false)
  const { data, isLoading, isError, error, refetch } = useCompanyVendorsForMaster(vendorId, false);
  
  // Fetch all vendors to check duplicate errors across database
  const { data: allVendorsData, refetch: refetchAllVendors } = useCompanyVendorsForMaster(vendorId);
  const allVendors = allVendorsData?.data || [];

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

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Company Vendors");

    worksheet.columns = [
      { header: "Vendor Code *", key: "vendor_code", width: 18 },
      { header: "Company Name *", key: "company_name", width: 32 },
      { header: "Point of Contact *", key: "point_of_contact", width: 24 },
      { header: "Contact No *", key: "contact_no", width: 20 },
      { header: "In House (Yes/No)", key: "in_house", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Address", key: "address", width: 36 },
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
      vendor_code: "CV-001",
      company_name: "Apex Wood Solutions",
      point_of_contact: "Rahul Verma",
      contact_no: "9876543210",
      in_house: "No",
      email: "contact@apexwood.com",
      address: "Plot 45, Industrial Area, Pune",
    });
    worksheet.addRow({
      vendor_code: "CV-002",
      company_name: "Furnix In-House Factory",
      point_of_contact: "Sunil Patil",
      contact_no: "9823012345",
      in_house: "Yes",
      email: "factory@furnix.in",
      address: "Unit 2, MIDC Bhosari, Pune",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Company_Vendor_Master_Template.xlsx";
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
      const preview = await parseFileForPreview(selectedFile, allVendors);
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
    setUploadResult(null);

    try {
      const res = await bulkUploadCompanyVendors(vendorId, uploadFile, userId);
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

  const [form, setForm] = React.useState({
    vendor_code: "",
    company_name: "",
    point_of_contact: "",
    contact_no: "",
    in_house: false,
  });

  // Phone validation
  const phoneValidationError = React.useMemo(() => {
    if (!form.contact_no) return null;
    const clean = form.contact_no.replace(/\D/g, "").replace(/^91/, "");
    if (clean.length > 0 && !/^[6-9]\d{9}$/.test(clean)) {
      return "Valid 10-digit mobile number required";
    }
    if (clean.length === 10) {
      const riskResult = validateIndianMobileRisk(clean);
      if (!riskResult.isValid) {
        return riskResult.reason || "Invalid or fake phone number";
      }
    }
    return null;
  }, [form.contact_no]);

  // Duplication check validation (identical to CompanyVendorForm.tsx)
  const duplicateErrors = React.useMemo(() => {
    const errors: Record<string, string> = {};
    if (allVendors && allVendors.length > 0) {
      const activeRecordId = editingRow?.id;

      const checkDup = (field: string, val: string, label: string) => {
        if (!val) return;
        const exists = allVendors.some((v: any) => {
          if (activeRecordId && v.id === activeRecordId) return false;
          return String(v[field] || "").trim().toLowerCase() === val.trim().toLowerCase();
        });
        if (exists) {
          errors[field] = `${label} already exists in database`;
        }
      };

      checkDup("vendor_code", form.vendor_code, "Company Code");
      checkDup("company_name", form.company_name, "Company Name");
      checkDup("contact_no", form.contact_no, "Mobile No.");
    }
    return errors;
  }, [form.vendor_code, form.company_name, form.contact_no, allVendors, editingRow]);

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
        setEditingRow(row);
        setForm({
          vendor_code: row.vendor_code,
          company_name: row.company_name,
          point_of_contact: row.point_of_contact,
          contact_no: row.contact_no,
          in_house: row.in_house,
        });
        setOpenEditModal(true);
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
      in_house: false,
    });
  };

  const hasDuplicateErrors = Object.keys(duplicateErrors).length > 0;

  const canSubmit =
    !!userId &&
    !!form.vendor_code.trim() &&
    !!form.company_name.trim() &&
    !!form.point_of_contact.trim() &&
    !!form.contact_no.trim() &&
    !hasDuplicateErrors &&
    !phoneValidationError;

  const handleCreate = () => {
    if (!canSubmit) return;

    createCompanyVendorMutation.mutate(
      {
        vendor_code: form.vendor_code.trim(),
        company_name: form.company_name.trim(),
        point_of_contact: form.point_of_contact.trim(),
        contact_no: form.contact_no.trim(),
        in_house: form.in_house,
        is_inventory_company_vendor: false,
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
          in_house: form.in_house,
          is_inventory_company_vendor: false,
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
        <Label htmlFor="company-vendor-code">Vendor Code <span className="text-red-500">*</span></Label>
        <Input
          id="company-vendor-code"
          value={form.vendor_code}
          onChange={(e) => setForm((prev) => ({ ...prev, vendor_code: e.target.value }))}
          placeholder="Enter vendor code"
        />
        {duplicateErrors.vendor_code && (
          <p className="text-red-500 text-xs mt-1">{duplicateErrors.vendor_code}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-name">Company Name <span className="text-red-500">*</span></Label>
        <Input
          id="company-name"
          value={form.company_name}
          onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
          placeholder="Enter company name"
        />
        {duplicateErrors.company_name && (
          <p className="text-red-500 text-xs mt-1">{duplicateErrors.company_name}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="point-of-contact">Point of Contact <span className="text-red-500">*</span></Label>
        <Input
          id="point-of-contact"
          value={form.point_of_contact}
          onChange={(e) => setForm((prev) => ({ ...prev, point_of_contact: e.target.value }))}
          placeholder="Enter point of contact"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-number">Mobile No. <span className="text-red-500">*</span></Label>
        <PhoneInput
          id="contact-number"
          defaultCountry="IN"
          value={form.contact_no}
          onChange={(val) => setForm((prev) => ({ ...prev, contact_no: val }))}
          placeholder="10 digit mobile"
          validateIndianNumber={true}
          showError={false}
        />
        {phoneValidationError && (
          <p className="text-red-500 text-xs mt-1">{phoneValidationError}</p>
        )}
        {duplicateErrors.contact_no && (
          <p className="text-red-500 text-xs mt-1">{duplicateErrors.contact_no}</p>
        )}
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

          <div className="flex items-center gap-2 sm:self-start">
            {isSuperAdmin && (
              <Button
                variant="outline"
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
            <Button onClick={() => setOpenCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
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
        open={openCreateModal}
        onOpenChange={(open) => {
          setOpenCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Company Vendor</DialogTitle>
            <DialogDescription>
              Enter vendor code, company name, contact details and type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{formFields}</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!canSubmit || createCompanyVendorMutation.isPending}
            >
              {createCompanyVendorMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogTitle>Edit Company Vendor</DialogTitle>
            <DialogDescription>
              Update vendor details for this entry.
            </DialogDescription>
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
            <Button
              onClick={handleEdit}
              disabled={!canSubmit || updateCompanyVendorMutation.isPending}
            >
              {updateCompanyVendorMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Bulk Upload Modal (Super Admin Only) */}
      <Dialog
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setUploadFile(null);
            setUploadResult(null);
            setIsUploading(false);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Bulk Upload Company Vendors
            </DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx, .xls) or CSV (.csv) file to import multiple company vendor master entries.
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
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2">
                        {previewResult.validCount > 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                        <span className="text-sm font-medium">
                          {previewResult.validCount > 0
                            ? `${previewResult.validCount} of ${previewResult.totalRows} row(s) will be added`
                            : `0 of ${previewResult.totalRows} row(s) will be added`}
                        </span>
                      </div>
                      {previewResult.failedCount > 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          {previewResult.failedCount} Skipped / Won't Add
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          All Valid
                        </span>
                      )}
                    </div>

                    {previewResult.errors.length > 0 && (
                      <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-3">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-2">
                          <AlertCircle className="h-4 w-4" /> Row Issues ({previewResult.errors.length}) — These rows will be skipped
                        </p>
                        <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-red-700 dark:text-red-400">
                          {previewResult.errors.map((err: string, i: number) => (
                            <p key={i} className="leading-relaxed font-mono text-[11px]">
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
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                      Imported {uploadResult.successCount} of {uploadResult.totalRows} rows
                    </span>
                  </div>
                  {uploadResult.failedCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      {uploadResult.failedCount} Failed
                    </span>
                  )}
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-3">
                    <p className="text-xs font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-4 w-4" /> Row Issues ({uploadResult.errors.length})
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-red-700 dark:text-red-400">
                      {uploadResult.errors.map((err, i) => (
                        <p key={i} className="leading-relaxed font-mono text-[11px]">
                          • {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 sm:gap-3 pt-2">
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
