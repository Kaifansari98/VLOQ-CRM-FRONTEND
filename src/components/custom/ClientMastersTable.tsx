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
import { Plus, Trash2, FileText, Upload, Eye, ExternalLink } from "lucide-react";
import DocumentPreview from "@/components/utils/file-preview";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useClientTypes,
  useCreateClientType,
} from "@/hooks/useClientMaster";
import { Client } from "@/types/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/redux/store";

type ClientRow = {
  srNo: number;
  id: number;
  clientCode: string;
  name: string;
  company_name: string;
  contact: string;
  alt_contact: string;
  email: string;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  client_type_id: number | null;
  client_type_name: string;
  is_active: boolean;
  status: "active" | "inactive";
  bankAccounts: any[];
};

const bankSchema = z.object({
  bank_name: z.string().min(1, "Bank Name is required"),
  holder_name: z
    .string()
    .regex(/^[a-zA-Z\s.]+$/, "Only letters, spaces, and dots allowed")
    .min(1, "Account Holder Name is required"),
  account_no: z.string().regex(/^\d{9,18}$/, "Account number must be 9–18 digits"),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format (e.g. SBIN0001234)"),
  branch: z.string().min(1, "Branch Name is required"),
  swift: z
    .string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid SWIFT code format")
    .or(z.literal(""))
    .optional(),
});

const toRow = (item: Client, index: number): ClientRow => ({
  srNo: index + 1,
  id: item.id,
  clientCode: item.clientCode,
  name: item.name,
  company_name: item.company_name || "",
  contact: item.contact,
  alt_contact: item.alt_contact || "",
  email: item.email,
  gst_number: item.gst_number || "",
  address: item.address,
  city: item.city,
  state: item.state,
  country: item.country,
  pincode: item.pincode,
  client_type_id: item.client_type_id ?? null,
  client_type_name: item.clientType?.type || "",
  is_active: item.is_active,
  status: item.is_active ? "active" : "inactive",
  bankAccounts: item.bankAccounts || [],
});

const getClientColumns = ({
  onEdit,
}: {
  onEdit: (row: ClientRow) => void;
}): ColumnDef<ClientRow>[] => [
  {
    accessorKey: "srNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sr. No." />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("srNo")}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "clientCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Code" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "company_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company Name" />,
    cell: ({ row }) => row.getValue("company_name") || "—",
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "contact",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "gst_number",
    header: ({ column }) => <DataTableColumnHeader column={column} title="GST Number" />,
    cell: ({ row }) => row.getValue("gst_number") || "—",
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "client_type_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Type" />,
    cell: ({ row }) => row.getValue("client_type_name") || "—",
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
    cell: ({ row }) => (
      <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
        Edit
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

interface ClientMastersTableProps {
  vendorIdOverride?: number;
}

const defaultForm = {
  name: "",
  company_name: "",
  contact: "",
  alt_contact: "",
  email: "",
  gst_number: "",
  client_type_id: "",
  clientCode: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  is_active: true,
};

export default function ClientMastersTable({ vendorIdOverride }: ClientMastersTableProps) {
  const sessionVendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = vendorIdOverride ?? sessionVendorId;

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<ClientRow | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isContactValid, setIsContactValid] = React.useState(true);
  const [isAltContactValid, setIsAltContactValid] = React.useState(true);
  const [showAddType, setShowAddType] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");
  const [banks, setBanks] = React.useState<any[]>([]);

  const handleAddBank = () => {
    setBanks([...banks, {
      bank_name: "",
      holder_name: "",
      account_no: "",
      ifsc: "",
      branch: "",
      swift: "",
      cancelled_cheque_path: "",
      cancelled_cheque_name: "",
      cancelled_cheque_file: null,
      is_default: banks.length === 0
    }]);
  };

  const handleBankChange = (index: number, field: string | Record<string, any>, value?: any) => {
    setBanks((prev) => {
      const newBanks = [...prev];
      if (typeof field === "object") {
        newBanks[index] = { ...newBanks[index], ...field };
      } else {
        newBanks[index] = { ...newBanks[index], [field]: value };
      }
      return newBanks;
    });
  };

  const handleRemoveBank = (index: number) => {
    setBanks((prev) => prev.filter((_, i) => i !== index));
  };

  const { data, isLoading, isError, error, refetch } = useClients({
    vendor_id: vendorId,
    page: 1,
    limit: 100,
  });
  const { data: clientTypesData } = useClientTypes(vendorId);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const createTypeMutation = useCreateClientType();

  const clientTypes = clientTypesData?.data ?? [];

  const tableData = React.useMemo<ClientRow[]>(
    () => (data?.data?.data ?? []).map(toRow),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: getClientColumns({
      onEdit: (row) => {
        setEditingRow(row);
        setForm({
          name: row.name,
          company_name: row.company_name,
          contact: row.contact,
          alt_contact: row.alt_contact,
          email: row.email,
          gst_number: row.gst_number,
          client_type_id: row.client_type_id ? String(row.client_type_id) : "",
          clientCode: row.clientCode,
          address: row.address,
          city: row.city,
          state: row.state,
          country: row.country,
          pincode: row.pincode,
          is_active: row.is_active,
        });
        setIsContactValid(true);
        setIsAltContactValid(true);
        setBanks(row.bankAccounts || []);
        setOpenEditModal(true);
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
    setIsContactValid(true);
    setIsAltContactValid(true);
    setShowAddType(false);
    setNewTypeName("");
    setBanks([]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.clientCode.trim()) newErrors.clientCode = "Client code is required";

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.contact.trim()) {
      newErrors.contact = "Contact is required";
    } else if (!isContactValid) {
      newErrors.contact = " ";
    }

    if (form.alt_contact.trim() && !isAltContactValid) {
      newErrors.alt_contact = " ";
    }

    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.country.trim()) newErrors.country = "Country is required";
    if (!form.pincode.trim()) newErrors.pincode = "Pincode is required";

    const seenAccounts = new Set<string>();
    banks.forEach((bank, index) => {
      const accNo = bank.account_no?.trim();
      if (accNo) {
        if (seenAccounts.has(accNo)) {
          newErrors[`bank_${index}_account_no`] = "Duplicate account number in form";
        } else {
          seenAccounts.add(accNo);
        }
      }

      const result = bankSchema.safeParse({
        bank_name: bank.bank_name || "",
        holder_name: bank.holder_name || "",
        account_no: bank.account_no || "",
        ifsc: bank.ifsc || "",
        branch: bank.branch || "",
        swift: bank.swift || "",
      });

      if (!result.success) {
        const fieldErrors = result.error.format();
        if (fieldErrors.bank_name?._errors?.[0]) newErrors[`bank_${index}_bank_name`] = fieldErrors.bank_name._errors[0];
        if (fieldErrors.holder_name?._errors?.[0]) newErrors[`bank_${index}_holder_name`] = fieldErrors.holder_name._errors[0];
        if (fieldErrors.account_no?._errors?.[0] && !newErrors[`bank_${index}_account_no`]) {
          newErrors[`bank_${index}_account_no`] = fieldErrors.account_no._errors[0];
        }
        if (fieldErrors.ifsc?._errors?.[0]) newErrors[`bank_${index}_ifsc`] = fieldErrors.ifsc._errors[0];
        if (fieldErrors.branch?._errors?.[0]) newErrors[`bank_${index}_branch`] = fieldErrors.branch._errors[0];
        if (fieldErrors.swift?._errors?.[0]) newErrors[`bank_${index}_swift`] = fieldErrors.swift._errors[0];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const stripCountryCode = (value: string) => {
    const trimmed = value.trim();
    return trimmed.startsWith("+91") ? trimmed.slice(3) : trimmed;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    company_name: form.company_name.trim() || undefined,
    contact: stripCountryCode(form.contact),
    alt_contact: form.alt_contact.trim() ? stripCountryCode(form.alt_contact) : undefined,
    email: form.email.trim(),
    gst_number: form.gst_number.trim() || undefined,
    client_type_id: form.client_type_id ? Number(form.client_type_id) : undefined,
    clientCode: form.clientCode.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    pincode: form.pincode.trim(),
    bankAccounts: banks.map(b => ({
      id: b.id,
      bank_name: b.bank_name,
      holder_name: b.holder_name,
      account_no: b.account_no,
      ifsc: b.ifsc,
      swift: b.swift,
      branch: b.branch,
      cancelled_cheque_path: b.cancelled_cheque_file ? "" : (b.cancelled_cheque_path || ""),
      cancelled_cheque_name: b.cancelled_cheque_file?.name || b.cancelled_cheque_name || "",
      is_default: b.is_default
    }))
  });

  const buildFormDataPayload = (extraFields: Record<string, any> = {}) => {
    const formData = new FormData();
    const payload: any = { ...buildPayload(), ...extraFields };

    Object.entries(payload).forEach(([key, val]) => {
      if (key !== "bankAccounts" && val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    });

    const bankAccountsJson = payload.bankAccounts.map((b: any, index: number) => {
      const bankItem = { ...b };
      delete bankItem.cancelled_cheque_file;
      delete bankItem.cancelled_cheque_url;
      if (banks[index]?.cancelled_cheque_file) {
        formData.append(`cancelled_cheque_${index}`, banks[index].cancelled_cheque_file);
      }
      return bankItem;
    });

    formData.append("bankAccounts", JSON.stringify(bankAccountsJson));
    return formData;
  };

  const handleCreate = () => {
    if (!validateForm() || !vendorId) return;
    const formData = buildFormDataPayload({ vendor_id: Number(vendorId), created_by: userId });
    createMutation.mutate(
      formData,
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
    const formData = buildFormDataPayload({ is_active: form.is_active, updated_by: userId });
    updateMutation.mutate(
      { id: editingRow.id, data: formData },
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

  const handleAddType = () => {
    if (!newTypeName.trim() || !vendorId) return;
    createTypeMutation.mutate(
      { vendorId: Number(vendorId), type: newTypeName.trim() },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            setForm((prev) => ({ ...prev, client_type_id: String(res.data.id) }));
          }
          setNewTypeName("");
          setShowAddType(false);
        },
      },
    );
  };

  const formFields = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-name">Name</Label>
          <Input
            id="client-name"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="Enter client name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-company-name">Company Name</Label>
          <Input
            id="client-company-name"
            value={form.company_name}
            onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
            placeholder="Enter company name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-contact">Contact</Label>
          <PhoneInput
            id="client-contact"
            value={form.contact}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, contact: val || "" }));
              if (errors.contact) setErrors((prev) => ({ ...prev, contact: "" }));
            }}
            defaultCountry="IN"
            placeholder="Enter contact number"
            validateIndianNumber={true}
            onValidationChange={(isValid) => setIsContactValid(isValid)}
          />
          {errors.contact && errors.contact !== " " && (
            <p className="text-xs text-destructive">{errors.contact}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-alt-contact">Alt. Contact</Label>
          <PhoneInput
            id="client-alt-contact"
            value={form.alt_contact}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, alt_contact: val || "" }));
              if (errors.alt_contact) setErrors((prev) => ({ ...prev, alt_contact: "" }));
            }}
            defaultCountry="IN"
            placeholder="Enter alternate contact number"
            validateIndianNumber={true}
            onValidationChange={(isValid) => setIsAltContactValid(isValid)}
          />
          {errors.alt_contact && errors.alt_contact !== " " && (
            <p className="text-xs text-destructive">{errors.alt_contact}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, email: e.target.value }));
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="Enter email"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-gst">GST Number</Label>
          <Input
            id="client-gst"
            value={form.gst_number}
            onChange={(e) => setForm((prev) => ({ ...prev, gst_number: e.target.value }))}
            placeholder="Enter GST number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Client Type</Label>
          <Select
            value={form.client_type_id}
            onValueChange={(val) => setForm((prev) => ({ ...prev, client_type_id: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select client type" />
            </SelectTrigger>
            <SelectContent>
              {clientTypes.map((ct) => (
                <SelectItem key={ct.id} value={String(ct.id)}>
                  {ct.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!showAddType ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setShowAddType(true)}
            >
              + Add new client type
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="New client type"
                className="h-8"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddType}
                disabled={!newTypeName.trim() || createTypeMutation.isPending}
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddType(false);
                  setNewTypeName("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-code">Client Code</Label>
          <Input
            id="client-code"
            value={form.clientCode}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, clientCode: e.target.value }));
              if (errors.clientCode) setErrors((prev) => ({ ...prev, clientCode: "" }));
            }}
            placeholder="Enter client code"
          />
          {errors.clientCode && <p className="text-xs text-destructive">{errors.clientCode}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-address">Address</Label>
        <Input
          id="client-address"
          value={form.address}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, address: e.target.value }));
            if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
          }}
          placeholder="Enter address"
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-city">City</Label>
          <Input
            id="client-city"
            value={form.city}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, city: e.target.value }));
              if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
            }}
            placeholder="Enter city"
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-state">State</Label>
          <Input
            id="client-state"
            value={form.state}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, state: e.target.value }));
              if (errors.state) setErrors((prev) => ({ ...prev, state: "" }));
            }}
            placeholder="Enter state"
          />
          {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-country">Country</Label>
          <Input
            id="client-country"
            value={form.country}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, country: e.target.value }));
              if (errors.country) setErrors((prev) => ({ ...prev, country: "" }));
            }}
            placeholder="Enter country"
          />
          {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-pincode">Pincode</Label>
          <Input
            id="client-pincode"
            value={form.pincode}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, pincode: e.target.value }));
              if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: "" }));
            }}
            placeholder="Enter pincode"
          />
          {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bank Details</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddBank}>
            <Plus className="mr-2 h-4 w-4" /> Add Bank
          </Button>
        </div>
        {banks.map((bank, index) => (
          <div key={index} className="p-4 border rounded-md space-y-4 relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 text-destructive"
              onClick={() => handleRemoveBank(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bank Name <span className="text-red-500">*</span></Label>
                <Input
                  value={bank.bank_name}
                  onChange={(e) => handleBankChange(index, "bank_name", e.target.value)}
                  placeholder="e.g. HDFC Bank"
                />
                {errors[`bank_${index}_bank_name`] && <p className="text-xs text-destructive">{errors[`bank_${index}_bank_name`]}</p>}
              </div>
              <div className="space-y-2">
                <Label>Account Holder Name <span className="text-red-500">*</span></Label>
                <Input
                  value={bank.holder_name}
                  onChange={(e) => handleBankChange(index, "holder_name", e.target.value)}
                  placeholder="Account holder's name"
                />
                {errors[`bank_${index}_holder_name`] && <p className="text-xs text-destructive">{errors[`bank_${index}_holder_name`]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Account Number <span className="text-red-500">*</span></Label>
                <Input
                  value={bank.account_no}
                  onChange={(e) => handleBankChange(index, "account_no", e.target.value.replace(/\D/g, ''))}
                  placeholder="9 to 18 digit account number"
                />
                {errors[`bank_${index}_account_no`] && <p className="text-xs text-destructive">{errors[`bank_${index}_account_no`]}</p>}
              </div>
              <div className="space-y-2">
                <Label>IFSC Code <span className="text-red-500">*</span></Label>
                <Input
                  value={bank.ifsc}
                  onChange={(e) => handleBankChange(index, "ifsc", e.target.value.toUpperCase().slice(0, 11))}
                  placeholder="e.g. SBIN0001234"
                />
                {errors[`bank_${index}_ifsc`] && <p className="text-xs text-destructive">{errors[`bank_${index}_ifsc`]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Branch Name <span className="text-red-500">*</span></Label>
                <Input
                  value={bank.branch}
                  onChange={(e) => handleBankChange(index, "branch", e.target.value)}
                  placeholder="e.g. Andheri East Branch"
                />
                {errors[`bank_${index}_branch`] && <p className="text-xs text-destructive">{errors[`bank_${index}_branch`]}</p>}
              </div>
              <div className="space-y-2">
                <Label>SWIFT Code (Optional)</Label>
                <Input
                  value={bank.swift || ""}
                  onChange={(e) => handleBankChange(index, "swift", e.target.value.toUpperCase())}
                  placeholder="e.g. BARCINBB or BARCINBB123"
                />
                {errors[`bank_${index}_swift`] && <p className="text-xs text-destructive">{errors[`bank_${index}_swift`]}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload Cancelled Cheque (Optional)</Label>
              {bank.cancelled_cheque_file || bank.cancelled_cheque_path || bank.cancelled_cheque_url ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {bank.cancelled_cheque_file?.name ||
                          bank.cancelled_cheque_name ||
                          (bank.cancelled_cheque_path
                            ? bank.cancelled_cheque_path.split("/").pop()
                            : "Cheque document")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {bank.cancelled_cheque_file ? `${(bank.cancelled_cheque_file.size / 1024).toFixed(1)} KB` : "Uploaded cheque"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => {
                        let targetUrl = "";
                        if (bank.cancelled_cheque_file) {
                          try {
                            targetUrl = URL.createObjectURL(bank.cancelled_cheque_file);
                          } catch (e) {
                            console.error("Failed to create blob URL:", e);
                          }
                        }
                        
                        if (!targetUrl && bank.cancelled_cheque_url && /^https?:\/\//i.test(bank.cancelled_cheque_url)) {
                          targetUrl = bank.cancelled_cheque_url;
                        } else if (!targetUrl && bank.cancelled_cheque_path && /^https?:\/\//i.test(bank.cancelled_cheque_path)) {
                          targetUrl = bank.cancelled_cheque_path;
                        }

                        if (targetUrl) {
                          window.open(targetUrl, "_blank", "noopener,noreferrer");
                        } else {
                          toast.error("Preview is unavailable for this file. Please re-upload or save the client.");
                        }
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        handleBankChange(index, {
                          cancelled_cheque_file: null,
                          cancelled_cheque_path: "",
                          cancelled_cheque_name: "",
                          cancelled_cheque_url: "",
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleBankChange(index, "cancelled_cheque_file", file);
                        handleBankChange(index, "cancelled_cheque_path", "");
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-foreground">
                    Drag & Drop or Click to Select File
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Supports PDF, JPG, JPEG, PNG (max 10MB)
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingRow && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="client-is-active"
            checked={form.is_active}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, is_active: checked === true }))
            }
          />
          <Label htmlFor="client-is-active" className="font-normal">
            Active
          </Label>
        </div>
      )}
    </>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Clients</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all client entries from one place.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:self-start">
            <Button onClick={() => setOpenCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Client
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading clients...</div>
          ) : isError ? (
            <div className="py-10 text-sm text-red-500">
              {(error as any)?.response?.data?.message || "Failed to load clients."}
            </div>
          ) : (
            <DataTable table={table} className="px-0 pt-0">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ClearInput
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search client..."
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Client</DialogTitle>
            <DialogDescription>Add a new client entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{formFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the selected client entry.</DialogDescription>
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
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
