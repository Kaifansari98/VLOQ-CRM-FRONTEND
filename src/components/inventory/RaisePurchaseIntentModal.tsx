"use client";

import {
  fetchPIProducts,
  fetchPICompanyVendors,
  fetchCompanyStateId,
  fetchPIPaymentTerms,
  createPurchaseIntent,
  PIPriority,
  PaymentTermOption,
  fetchAdditionalCosts,
  createAdditionalCostApi,
  AdditionalCostOption,
} from "@/api/inventory/purchaseIntent";

import {
  PIProduct,
  PICompanyVendor,
  VendorEntry,
  recalcVendorEntry,
  emptyVendorEntry,
  toNum,
} from "@/types/inventory/inventory.types";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import CustomeDatePicker from "@/components/date-picker";

import {
  Plus,
  Trash2,
  Loader2,
  Send,
  Search,
  Package,
  IndianRupee,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

import { useEffect, useMemo, useState, useRef } from "react";

type ProductRow = {
  row_id: string;
  product: PIProduct | null;
  product_id: number | "";
  uom: string;
  remarks: string;
  vendor_entries: VendorEntry[];
};

const PRIORITIES: PIPriority[] = ["Low", "Medium", "High", "Urgent"];

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs outline-none transition-colors focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20";

const tableInputClass =
  "h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs outline-none transition-colors focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20";

const tableNumberInputClass =
  "h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none transition-colors focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const tableSelectClass =
  "h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs outline-none transition-colors focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20 cursor-pointer";

const toMoney = (value: any) => {
  const n = Number(value || 0);
  if (!n) return "₹0.00";

  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const makeRowId = () => `${Date.now()}-${Math.random()}`;

type SupplierAdditionalCostRow = {
  row_id: string;
  company_vendor_id: number;
  additional_cost_id: number | "";
  calculation_type: "Fixed" | "Percentage";
  amount: string;
  percentage: string;
  base_amount: string;
  tax_pct: string;
  taxable_amount: string;
  tax_amount: string;
  total_amount: string;
  remarks: string;
};

type CostPopupState = {
  company_vendor_id: number;
  company_name: string;
} | null;

export interface RaisePurchaseIntentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function PriorityDropdown({
  value,
  onChange,
}: {
  value: PIPriority;
  onChange: (val: PIPriority) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-semibold text-foreground">
        Priority
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-foreground/20 hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              value === "Urgent"
                ? "bg-foreground"
                : value === "High"
                ? "bg-foreground/80"
                : value === "Medium"
                ? "bg-foreground/50"
                : "bg-foreground/25"
            )}
          />
          <span className="font-medium text-foreground">{value}</span>
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted text-left",
                value === p && "bg-muted font-semibold"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    p === "Urgent"
                      ? "bg-foreground"
                      : p === "High"
                      ? "bg-foreground/80"
                      : p === "Medium"
                      ? "bg-foreground/50"
                      : "bg-foreground/25"
                  )}
                />
                <span className="text-foreground">{p}</span>
              </span>
              {value === p && <Check size={14} className="text-foreground" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RaisePurchaseIntentModal({
  open,
  onClose,
  onSuccess,
}: RaisePurchaseIntentModalProps) {
  const [supplierPicker, setSupplierPicker] = useState<{
    rowIndex: number;
    vendorIndex: number;
  } | null>(null);

  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));

  const [allVendors, setAllVendors] = useState<PICompanyVendor[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);

  const [productSearchMap, setProductSearchMap] = useState<Record<string, string>>({});
  const [productOptionsMap, setProductOptionsMap] = useState<Record<string, PIProduct[]>>({});
  const [openProductBox, setOpenProductBox] = useState<string | null>(null);

  const [priority, setPriority] = useState<PIPriority>("Medium");
  const [remarks, setRemarks] = useState("");
  const [stateId, setStateId] = useState<number>(0);

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [additionalCostOptions, setAdditionalCostOptions] = useState<
    AdditionalCostOption[]
  >([]);

  const [supplierAdditionalCosts, setSupplierAdditionalCosts] = useState<
    SupplierAdditionalCostRow[]
  >([]);

  const [costPopup, setCostPopup] = useState<CostPopupState>(null);
  const [addCostMasterOpen, setAddCostMasterOpen] = useState(false);
  const [costMasterSaving, setCostMasterSaving] = useState(false);

  const [costMasterForm, setCostMasterForm] = useState({
    cost_name: "",
    cost_code: "",
    description: "",
    is_taxable: false,
    tax_pct: "",
  });

  const getSupplierBaseAmount = (companyVendorId: number) => {
    return rows.reduce((sum, row) => {
      return (
        sum +
        row.vendor_entries.reduce((innerSum, entry) => {
          if (Number(entry.vendor.id) !== Number(companyVendorId)) {
            return innerSum;
          }
          return innerSum + toNum(entry.amount);
        }, 0)
      );
    }, 0);
  };

  const calculateCostRow = (
    row: SupplierAdditionalCostRow
  ): SupplierAdditionalCostRow => {
    const baseAmount = getSupplierBaseAmount(row.company_vendor_id);

    const taxableAmount =
      row.calculation_type === "Percentage"
        ? Number(((baseAmount * toNum(row.percentage)) / 100).toFixed(2))
        : Number(toNum(row.amount).toFixed(2));

    const taxAmount = Number(
      ((taxableAmount * toNum(row.tax_pct)) / 100).toFixed(2)
    );

    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    return {
      ...row,
      base_amount: String(baseAmount),
      taxable_amount: String(taxableAmount),
      tax_amount: String(taxAmount),
      total_amount: String(totalAmount),
    };
  };

  const recalcAllSupplierAdditionalCosts = (
    costs: SupplierAdditionalCostRow[]
  ) => {
    return costs.map((cost) => calculateCostRow(cost));
  };

  const getUsedSuppliers = () => {
    const supplierMap = new Map<number, PICompanyVendor>();

    rows.forEach((row) => {
      row.vendor_entries.forEach((entry) => {
        if (entry.vendor?.id) {
          supplierMap.set(Number(entry.vendor.id), entry.vendor);
        }
      });
    });

    return Array.from(supplierMap.values());
  };

  const getSupplierCostTotal = (companyVendorId: number) => {
    return supplierAdditionalCosts
      .filter((cost) => Number(cost.company_vendor_id) === Number(companyVendorId))
      .reduce((sum, cost) => sum + toNum(cost.total_amount), 0);
  };

  const grandTotal = useMemo(() => {
    return rows.reduce((sum, row) => {
      return (
        sum +
        row.vendor_entries.reduce(
          (innerSum, entry) => innerSum + toNum(entry.total_amount),
          0
        )
      );
    }, 0);
  }, [rows]);

  const additionalCostGrandTotal = useMemo(() => {
    return supplierAdditionalCosts.reduce(
      (sum, cost) => sum + toNum(cost.total_amount),
      0
    );
  }, [supplierAdditionalCosts]);

  const finalGrandTotal = useMemo(() => {
    return grandTotal + additionalCostGrandTotal;
  }, [grandTotal, additionalCostGrandTotal]);

  const saveCostMaster = async () => {
    if (!costMasterForm.cost_name.trim()) {
      toastManager.add({
        title: "Cost name is required",
        type: "error",
      });
      return;
    }

    const taxPct = Number(costMasterForm.tax_pct || 0);

    if (costMasterForm.is_taxable && (taxPct < 0 || taxPct > 100)) {
      toastManager.add({
        title: "Tax percentage must be between 0 and 100",
        type: "error",
      });
      return;
    }

    setCostMasterSaving(true);

    try {
      const created = await createAdditionalCostApi(vendorId, {
        cost_name: costMasterForm.cost_name.trim(),
        cost_code: costMasterForm.cost_code.trim() || undefined,
        description: costMasterForm.description.trim() || undefined,
        is_taxable: costMasterForm.is_taxable,
        tax_pct: costMasterForm.is_taxable ? taxPct : 0,
        created_by: userId,
      });

      setAdditionalCostOptions((prev) =>
        [...prev, created].sort((a, b) =>
          String(a.cost_name).localeCompare(String(b.cost_name))
        )
      );

      toastManager.add({
        title: "Additional cost added",
        type: "success",
      });

      setCostMasterForm({
        cost_name: "",
        cost_code: "",
        description: "",
        is_taxable: false,
        tax_pct: "",
      });

      setAddCostMasterOpen(false);
    } catch (error: any) {
      toastManager.add({
        title: error?.message || "Failed to add cost",
        type: "error",
      });
    } finally {
      setCostMasterSaving(false);
    }
  };

  const addSupplierAdditionalCostRow = (supplier: PICompanyVendor) => {
    const baseAmount = getSupplierBaseAmount(Number(supplier.id));

    const row: SupplierAdditionalCostRow = {
      row_id: makeRowId(),
      company_vendor_id: Number(supplier.id),
      additional_cost_id: "",
      calculation_type: "Fixed",
      amount: "",
      percentage: "",
      base_amount: String(baseAmount),
      tax_pct: "",
      taxable_amount: "0",
      tax_amount: "0",
      total_amount: "0",
      remarks: "",
    };

    setSupplierAdditionalCosts((prev) => [...prev, calculateCostRow(row)]);
  };

  const updateSupplierAdditionalCostRow = (
    rowId: string,
    field: keyof SupplierAdditionalCostRow,
    value: any
  ) => {
    setSupplierAdditionalCosts((prev) =>
      prev.map((row) => {
        if (row.row_id !== rowId) return row;

        let next = {
          ...row,
          [field]: value,
        };

        if (field === "additional_cost_id") {
          const selectedCost = additionalCostOptions.find(
            (cost) => Number(cost.id) === Number(value)
          );

          if (selectedCost) {
            next.tax_pct = selectedCost.is_taxable
              ? String(selectedCost.tax_pct || 0)
              : "0";
          }
        }

        if (field === "calculation_type") {
          if (value === "Fixed") {
            next.percentage = "";
          } else {
            next.amount = "";
          }
        }

        return calculateCostRow(next);
      })
    );
  };

  const removeSupplierAdditionalCostRow = (rowId: string) => {
    setSupplierAdditionalCosts((prev) =>
      prev.filter((row) => row.row_id !== rowId)
    );
  };

  useEffect(() => {
    setSupplierAdditionalCosts((prev) => recalcAllSupplierAdditionalCosts(prev));
  }, [rows]);

  useEffect(() => {
    if (!open || !vendorId) return;

    setLoading(true);

    Promise.all([
      fetchCompanyStateId(vendorId),
      fetchPICompanyVendors(vendorId, ""),
      fetchPIPaymentTerms(vendorId),
      fetchAdditionalCosts(vendorId),
    ])
      .then(([companyStateId, vendors, terms, costs]) => {
        setStateId(companyStateId);
        setAllVendors(vendors);
        setPaymentTerms(terms ?? []);
        setAdditionalCostOptions(costs ?? []);
      })
      .catch(() => {
        toastManager.add({
          title: "Failed to load form data",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [open, vendorId]);

  const searchProductsForRow = async (rowId: string, search: string) => {
    if (!vendorId) return;

    setProductSearchMap((prev) => ({
      ...prev,
      [rowId]: search,
    }));

    if (!search.trim()) {
      setProductOptionsMap((prev) => ({
        ...prev,
        [rowId]: [],
      }));
      return;
    }

    setProductLoading(true);

    try {
      const result = await fetchPIProducts(vendorId, undefined, search);

      setProductOptionsMap((prev) => ({
        ...prev,
        [rowId]: result,
      }));
    } catch {
      toastManager.add({
        title: "Failed to search products",
        type: "error",
      });
    } finally {
      setProductLoading(false);
    }
  };

  const addProductRow = () => {
    setRows((prev) => [
      ...prev,
      {
        row_id: makeRowId(),
        product: null,
        product_id: "",
        uom: "",
        remarks: "",
        vendor_entries: [],
      },
    ]);
  };

  const removeProductRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  const getProductSupplierMappings = (product: PIProduct) => {
    return ((product as any).supplierMappings ?? []).filter(
      (mapping: any) => mapping?.companyVendor?.id
    );
  };

  const applyTaxForSupplier = (
    entry: VendorEntry,
    product: PIProduct,
    supplier: PICompanyVendor
  ) => {
    const cgst = Number(product.cgst_rate || 0);
    const sgst = Number(product.sgst_rate || 0);
    const igst = Number(product.igst_rate || 0);
    const taxPct = Number(product.tax_pct || 0);

    const totalTax = taxPct > 0 ? taxPct : igst > 0 ? igst : cgst + sgst;

    const isSameState =
      Boolean(stateId && supplier.state_id) &&
      Number(supplier.state_id) === Number(stateId);

    if (isSameState) {
      entry.cgst_pct = cgst > 0 ? String(cgst) : String(totalTax / 2);
      entry.sgst_pct = sgst > 0 ? String(sgst) : String(totalTax / 2);
      entry.igst_pct = "0";
      entry.tax_pct = String(totalTax);
    } else {
      entry.cgst_pct = "0";
      entry.sgst_pct = "0";
      entry.igst_pct = igst > 0 ? String(igst) : String(totalTax);
      entry.tax_pct = String(totalTax);
    }

    return entry;
  };

  const buildVendorEntryFromProductMapping = (
    product: PIProduct,
    mapping: any
  ): VendorEntry => {
    const supplier = mapping.companyVendor as PICompanyVendor;

    let entry = emptyVendorEntry(supplier, product);

    entry.payment_term_id = supplier.default_payment_term_id
      ? String(supplier.default_payment_term_id)
      : "";

    entry.required_qty = "";
    entry.rate =
      mapping.amount !== undefined && mapping.amount !== null
        ? String(mapping.amount)
        : "";

    entry.mrp =
      mapping.amount !== undefined && mapping.amount !== null
        ? String(mapping.amount)
        : "";

    entry.remarks = mapping.supplier_item_code
      ? `Supplier item code: ${mapping.supplier_item_code}`
      : "";

    entry = applyTaxForSupplier(entry, product, supplier);

    return recalcVendorEntry(entry);
  };

  const selectProductForRow = (
    rowIndex: number,
    rowId: string,
    product: PIProduct
  ) => {
    const supplierMappings = getProductSupplierMappings(product);

    const mappedVendorEntries = supplierMappings.map((mapping: any) =>
      buildVendorEntryFromProductMapping(product, mapping)
    );

    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      row.product_id = product.id;
      row.product = product;
      row.uom = product.unit_of_measure ?? "";
      row.vendor_entries = mappedVendorEntries;

      next[rowIndex] = row;
      return next;
    });

    setProductSearchMap((prev) => ({
      ...prev,
      [rowId]: `${product.product_name}${
        product.article_code ? ` - ${product.article_code}` : ""
      }`,
    }));

    setProductOptionsMap((prev) => ({
      ...prev,
      [rowId]: [],
    }));

    setOpenProductBox(null);

    if (!supplierMappings.length) {
      toastManager.add({
        title: "No supplier mapped for this product",
        type: "error",
      });
    }
  };

  const updateProductRow = (
    rowIndex: number,
    field: keyof ProductRow,
    value: any
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      (row as any)[field] = value;

      next[rowIndex] = row;
      return next;
    });
  };

  const addSupplierRow = (rowIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      if (!row.product) {
        toastManager.add({
          title: "Please select product first",
          type: "error",
        });
        return prev;
      }

      const supplierMappings = getProductSupplierMappings(row.product);

      if (!supplierMappings.length) {
        toastManager.add({
          title: "No supplier mapped for this product",
          type: "error",
        });
        return prev;
      }

      const firstMapping = supplierMappings.find(
        (mapping: any) =>
          !row.vendor_entries.some(
            (entry) =>
              Number(entry.vendor.id) === Number(mapping.companyVendor.id)
          )
      );

      if (!firstMapping) {
        toastManager.add({
          title: "All mapped suppliers are already added",
          type: "error",
        });
        return prev;
      }

      const entry = buildVendorEntryFromProductMapping(
        row.product,
        firstMapping
      );

      row.vendor_entries = [...row.vendor_entries, entry];
      next[rowIndex] = row;

      return next;
    });
  };

  const updateSupplierRow = (
    rowIndex: number,
    vendorIndex: number,
    field: keyof VendorEntry,
    value: string
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };
      const entries = [...row.vendor_entries];

      if ((field as any) === "vendor") {
        return prev;
      }

      entries[vendorIndex] = recalcVendorEntry({
        ...entries[vendorIndex],
        [field]: value,
      });

      row.vendor_entries = entries;
      next[rowIndex] = row;

      return next;
    });
  };

  const updateSupplierVendor = (
    rowIndex: number,
    vendorIndex: number,
    vendorIdValue: number
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      if (!row.product) return prev;

      const supplierMappings = getProductSupplierMappings(row.product);

      const selectedMapping = supplierMappings.find(
        (mapping: any) =>
          Number(mapping.companyVendor.id) === Number(vendorIdValue)
      );

      if (!selectedMapping) {
        toastManager.add({
          title: "This supplier is not mapped with selected product",
          type: "error",
        });
        return prev;
      }

      const duplicate = row.vendor_entries.some(
        (entry, index) =>
          index !== vendorIndex &&
          Number(entry.vendor.id) === Number(vendorIdValue)
      );

      if (duplicate) {
        toastManager.add({
          title: "This supplier is already added for this product",
          type: "error",
        });
        return prev;
      }

      const oldEntry = row.vendor_entries[vendorIndex];

      let entry = buildVendorEntryFromProductMapping(
        row.product,
        selectedMapping
      );

      entry = {
        ...entry,
        required_qty: oldEntry.required_qty,
        required_by_date: oldEntry.required_by_date,
        remarks: oldEntry.remarks || entry.remarks,
        mrp: oldEntry.mrp || entry.mrp,
        discount_pct: oldEntry.discount_pct,
        rate: entry.rate,
      };

      row.vendor_entries[vendorIndex] = recalcVendorEntry(entry);
      next[rowIndex] = row;

      return next;
    });
  };

  const removeSupplierRow = (rowIndex: number, vendorIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      row.vendor_entries = row.vendor_entries.filter(
        (_, index) => index !== vendorIndex
      );

      next[rowIndex] = row;
      return next;
    });
  };

  const validate = () => {
    if (!rows.length) {
      toastManager.add({
        title: "Please add at least one product",
        type: "error",
      });
      return false;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.product_id || !row.product) {
        toastManager.add({
          title: `Please select product in row ${i + 1}`,
          type: "error",
        });
        return false;
      }

      if (!row.uom.trim()) {
        toastManager.add({
          title: `Please enter UOM in row ${i + 1}`,
          type: "error",
        });
        return false;
      }

      if (!row.vendor_entries.length) {
        toastManager.add({
          title: `Please add supplier in row ${i + 1}`,
          type: "error",
        });
        return false;
      }

      for (let j = 0; j < row.vendor_entries.length; j++) {
        const vendor = row.vendor_entries[j];

        if (!vendor.vendor?.id) {
          toastManager.add({
            title: `Please select supplier in row ${i + 1}`,
            type: "error",
          });
          return false;
        }

        if (!vendor.required_qty || toNum(vendor.required_qty) <= 0) {
          toastManager.add({
            title: `Please enter qty in row ${i + 1}, supplier ${j + 1}`,
            type: "error",
          });
          return false;
        }

        if (!vendor.rate || toNum(vendor.rate) <= 0) {
          toastManager.add({
            title: `Please enter rate in row ${i + 1}, supplier ${j + 1}`,
            type: "error",
          });
          return false;
        }
      }
    }

    for (const cost of supplierAdditionalCosts) {
      if (!cost.additional_cost_id) {
        toastManager.add({
          title: "Please select additional cost type",
          type: "error",
        });
        return false;
      }

      if (cost.calculation_type === "Fixed" && toNum(cost.amount) <= 0) {
        toastManager.add({
          title: "Please enter additional cost amount",
          type: "error",
        });
        return false;
      }

      if (cost.calculation_type === "Percentage" && toNum(cost.percentage) <= 0) {
        toastManager.add({
          title: "Please enter additional cost percentage",
          type: "error",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    try {
      await createPurchaseIntent(vendorId, {
        category_id: rows[0]?.product?.category_id
          ? Number(rows[0].product.category_id)
          : undefined,
        user_id: userId,
        priority,
        remarks: remarks || undefined,

        items: rows.map((row) => ({
          product_id: Number(row.product_id),
          uom: row.uom || undefined,
          remarks: row.remarks || undefined,
          vendors: row.vendor_entries.map((entry) => ({
            company_vendor_id: entry.vendor.id,
            payment_term_id: entry.payment_term_id
              ? Number(entry.payment_term_id)
              : null,
            required_qty: toNum(entry.required_qty),
            required_by_date: entry.required_by_date || undefined,
            remarks: entry.remarks || undefined,
            estimated_price: toNum(entry.rate) || undefined,
            mrp: toNum(entry.mrp) || null,
            discount_pct: toNum(entry.discount_pct) || null,
            rate: toNum(entry.rate) || null,
            tax_pct: toNum(entry.tax_pct) || null,
            cgst_pct: toNum(entry.cgst_pct) || null,
            sgst_pct: toNum(entry.sgst_pct) || null,
            igst_pct: toNum(entry.igst_pct) || null,
            tax_amount: toNum(entry.tax_amount) || null,
            amount: toNum(entry.amount) || null,
            total_amount: toNum(entry.total_amount) || null,
          })),
        })),

        supplier_additional_costs: supplierAdditionalCosts
          .filter((cost) => cost.additional_cost_id)
          .map((cost) => ({
            company_vendor_id: Number(cost.company_vendor_id),
            additional_cost_id: Number(cost.additional_cost_id),
            calculation_type: cost.calculation_type,
            amount: toNum(cost.amount),
            percentage: toNum(cost.percentage),
            tax_pct: toNum(cost.tax_pct),
            remarks: cost.remarks || undefined,
          })),
      });

      toastManager.add({
        title: "Purchase Enquiry created successfully",
        type: "success",
      });

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || error?.message || "Failed to create purchase enquiry",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openSupplierPicker = (rowIndex: number, vendorIndex: number) => {
    setSupplierPicker({
      rowIndex,
      vendorIndex,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-2 backdrop-blur-xs sm:p-4 animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        className="flex h-full max-h-[90vh] w-[95vw] max-w-lg md:max-w-2xl lg:max-w-3xl flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between border-b bg-muted/30 px-6 py-4">
          <div className="space-y-1 pr-6 min-w-0">
            <h2 className="text-base font-semibold leading-normal text-foreground">
              Raise Purchase Enquiry
            </h2>
            <p className="text-xs text-muted-foreground leading-snug">
              Add products and supplier quotations in a simple table.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Priority & Remarks */}
              <div className="rounded-xl border bg-card p-4 shadow-xs">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <PriorityDropdown value={priority} onChange={setPriority} />

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Total Estimated Amount
                    </label>
                    <div className="flex h-9 items-center rounded-md border bg-muted/20 px-3 text-xs font-bold text-foreground">
                      {toMoney(finalGrandTotal)}
                    </div>
                  </div>

                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Overall Remarks
                    </label>
                    <input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional remarks"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Products & Suppliers Header */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Products & Suppliers
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select a product and specify quotations from mapped suppliers.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs px-3"
                  onClick={addProductRow}
                >
                  <Plus size={14} className="mr-1" />
                  Add Product
                </Button>
              </div>

              {rows.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6 text-center">
                  <Package size={32} className="mb-2 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-foreground">No product added</p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Click Add Product to start adding items for this enquiry.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addProductRow}
                    className="h-8 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium px-4"
                  >
                    <Plus size={14} className="mr-1" />
                    Add Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rows.map((row, rowIndex) => (
                    <div
                      key={row.row_id}
                      className="overflow-hidden rounded-xl border bg-card shadow-xs"
                    >
                      <div className="border-b bg-muted/15 p-3">
                        <div className="grid gap-2.5 sm:grid-cols-[2fr_120px_1fr_40px]">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-foreground">
                              Product *
                            </label>
                            <ProductAutocomplete
                              rowId={row.row_id}
                              value={productSearchMap[row.row_id] || ""}
                              open={openProductBox === row.row_id}
                              loading={productLoading}
                              options={productOptionsMap[row.row_id] || []}
                              onFocus={() => setOpenProductBox(row.row_id)}
                              onChange={(value) => {
                                setOpenProductBox(row.row_id);
                                searchProductsForRow(row.row_id, value);
                              }}
                              onSelect={(product) =>
                                selectProductForRow(rowIndex, row.row_id, product)
                              }
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-foreground">
                              UOM *
                            </label>
                            <input
                              value={row.uom}
                              onChange={(e) =>
                                updateProductRow(rowIndex, "uom", e.target.value)
                              }
                              className={inputClass}
                              placeholder="UOM"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-foreground">
                              Product Remark
                            </label>
                            <input
                              value={row.remarks}
                              onChange={(e) =>
                                updateProductRow(
                                  rowIndex,
                                  "remarks",
                                  e.target.value
                                )
                              }
                              className={inputClass}
                              placeholder="Optional"
                            />
                          </div>

                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => removeProductRow(rowIndex)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1500px] text-xs">
                          <thead className="border-b bg-muted/20">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground min-w-[230px] w-[230px]">Supplier *</th>
                              <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[160px] w-[160px]">Payment Term</th>
                              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[90px] w-[90px]">Qty *</th>
                              <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[160px] w-[160px]">Req. Date</th>
                              <th className="px-2 py-2 text-right font-semibold text-muted-foreground min-w-[95px] w-[95px]">MRP</th>
                              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[75px] w-[75px]">Disc %</th>
                              <th className="px-2 py-2 text-right font-semibold text-muted-foreground min-w-[95px] w-[95px]">Rate *</th>
                              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[75px] w-[75px]">GST %</th>
                              <th className="px-2 py-2 text-right font-semibold text-muted-foreground min-w-[90px] w-[90px]">Tax Amt</th>
                              <th className="px-2 py-2 text-right font-semibold text-muted-foreground min-w-[100px] w-[100px]">Total</th>
                              <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[150px] w-[150px]">Remark</th>
                              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[105px] w-[105px]">Charges</th>
                              <th className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[50px] w-[50px]">Action</th>
                            </tr>
                          </thead>

                          <tbody>
                            {row.vendor_entries.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={13}
                                  className="px-3 py-6 text-center text-muted-foreground"
                                >
                                  No supplier added yet. Click &quot;Add Supplier&quot; below.
                                </td>
                              </tr>
                            ) : (
                              row.vendor_entries.map((entry, vendorIndex) => {
                                const availablePaymentTerms = paymentTerms.filter(
                                  (term) =>
                                    term.company_vendor_id === null ||
                                    Number(term.company_vendor_id) ===
                                    Number(entry.vendor.id)
                                );

                                return (
                                  <tr
                                    key={`${entry.vendor.id}-${vendorIndex}`}
                                    className="border-b last:border-b-0 hover:bg-muted/15 transition-colors"
                                  >
                                    <td className="px-2 py-2 min-w-[230px] w-[230px]">
                                      <button
                                        type="button"
                                        onClick={() => openSupplierPicker(rowIndex, vendorIndex)}
                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 text-left text-xs outline-none hover:bg-muted/50 transition-colors"
                                      >
                                        <span className="truncate">
                                          {entry.vendor?.company_name
                                            ? `${entry.vendor.company_name} - ${entry.vendor.vendor_code}`
                                            : "Select supplier"}
                                        </span>

                                        <Search size={13} className="ml-1.5 shrink-0 text-muted-foreground" />
                                      </button>
                                    </td>

                                    <td className="px-2 py-2 min-w-[160px] w-[160px]">
                                      <Select
                                        value={entry.payment_term_id ? String(entry.payment_term_id) : undefined}
                                        onValueChange={(val) =>
                                          updateSupplierRow(
                                            rowIndex,
                                            vendorIndex,
                                            "payment_term_id",
                                            val
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-1 focus:ring-foreground/20 cursor-pointer">
                                          <SelectValue placeholder="Select Term" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border bg-popover p-1 shadow-xl z-[100]">
                                          {availablePaymentTerms.map((term) => (
                                            <SelectItem
                                              key={term.id}
                                              value={String(term.id)}
                                              className="cursor-pointer text-xs rounded-sm hover:bg-muted"
                                            >
                                              {term.term_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </td>

                                    <td className="px-2 py-2 min-w-[90px] w-[90px]">
                                      <input
                                        type="number"
                                        value={entry.required_qty}
                                        onChange={(e) =>
                                          updateSupplierRow(
                                            rowIndex,
                                            vendorIndex,
                                            "required_qty",
                                            e.target.value
                                          )
                                        }
                                        className={cn(tableNumberInputClass, "text-center font-medium")}
                                        placeholder="0"
                                      />
                                    </td>

                                    <td className="px-2 py-2 min-w-[160px] w-[160px]">
                                      <CustomeDatePicker
                                        value={entry.required_by_date}
                                        onChange={(val) =>
                                          updateSupplierRow(
                                            rowIndex,
                                            vendorIndex,
                                            "required_by_date",
                                            val || ""
                                          )
                                        }
                                        dateFormat="dd MMM yyyy"
                                        placeholder="Pick date"
                                        className="h-8 w-full text-xs font-normal"
                                      />
                                    </td>

                                    <td className="px-2 py-2 min-w-[95px] w-[95px]">
                                      <input
                                        type="number"
                                        value={entry.mrp}
                                        onChange={(e) =>
                                          updateSupplierRow(
                                            rowIndex,
                                            vendorIndex,
                                            "mrp",
                                            e.target.value
                                          )
                                        }
                                        className={cn(tableNumberInputClass, "text-right font-mono")}
                                        placeholder="0.00"
                                      />
                                    </td>

                                    <td className="px-2 py-2 min-w-[75px] w-[75px]">
                                      <input
                                        type="number"
                                        value={entry.discount_pct}
                                        onChange={(e) =>
                                          updateSupplierRow(
                                            rowIndex,
                                            vendorIndex,
                                            "discount_pct",
                                            e.target.value
                                          )
                                        }
                                        className={cn(tableNumberInputClass, "text-center")}
                                        placeholder="0"
                                      />
                                    </td>

                                    <td className="px-2 py-2 min-w-[95px] w-[95px]">
                                      <input
                                        type="number"
                                        value={entry.rate}
                                        onChange={(e) =>
                                          updateSupplierRow(
                                            rowIndex,
                                            vendorIndex,
                                            "rate",
                                            e.target.value
                                          )
                                        }
                                        className={cn(tableNumberInputClass, "text-right font-mono font-medium")}
                                        placeholder="0.00"
                                      />
                                    </td>

                                    <td className="px-2 py-2 min-w-[75px] w-[75px]">
                                      <input
                                        type="number"
                                        value={entry.tax_pct}
                                        readOnly
                                        disabled
                                        className={cn(
                                          tableNumberInputClass,
                                          "bg-muted/40 cursor-not-allowed text-muted-foreground font-semibold text-center"
                                        )}
                                        title="GST % is auto-filled from product HSN and cannot be edited"
                                      />
                                    </td>

                                    <td className="px-2 py-2 min-w-[90px] w-[90px] text-right font-semibold font-mono text-muted-foreground">
                                      {toMoney(entry.tax_amount)}
                                    </td>

                                    <td className="px-2 py-2 min-w-[100px] w-[100px] text-right font-bold font-mono text-foreground">
                                      {toMoney(entry.total_amount)}
                                    </td>

                                    <td className="px-2 py-2 min-w-[150px] w-[150px]">
                                      <input
                                        value={entry.remarks}
                                        onChange={(e) =>
                                          updateSupplierRow(
                                            rowIndex,
                                            vendorIndex,
                                            "remarks",
                                            e.target.value
                                          )
                                        }
                                        className={tableInputClass}
                                        placeholder="Remark"
                                      />
                                    </td>

                                    <td className="px-2 py-2 min-w-[105px] w-[105px] text-center">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-full gap-1 whitespace-nowrap text-xs"
                                        onClick={() =>
                                          setCostPopup({
                                            company_vendor_id: Number(entry.vendor.id),
                                            company_name: `${entry.vendor.company_name} - ${entry.vendor.vendor_code}`,
                                          })
                                        }
                                      >
                                        <IndianRupee size={12} />
                                        Charges
                                        {getSupplierCostTotal(Number(entry.vendor.id)) > 0 && (
                                          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                                            {toMoney(getSupplierCostTotal(Number(entry.vendor.id)))}
                                          </span>
                                        )}
                                      </Button>
                                    </td>

                                    <td className="px-2 py-2 min-w-[50px] w-[50px] text-center">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                          removeSupplierRow(rowIndex, vendorIndex)
                                        }
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between border-t bg-muted/15 px-3 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-medium"
                          onClick={() => addSupplierRow(rowIndex)}
                        >
                          <Plus size={12} className="mr-1" />
                          Add Supplier
                        </Button>

                        <p className="text-xs font-semibold text-foreground">
                          Product Total:{" "}
                          <span className="font-bold">
                            {toMoney(
                              row.vendor_entries.reduce(
                                (sum, entry) => sum + toNum(entry.total_amount),
                                0
                              )
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex shrink-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t bg-muted/20 px-6 py-3.5">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>Items: <strong className="text-foreground">{toMoney(grandTotal)}</strong></span>
            <span>·</span>
            <span>Additional Costs: <strong className="text-foreground">{toMoney(additionalCostGrandTotal)}</strong></span>
            <span>·</span>
            <span>Grand Total: <strong className="text-foreground font-bold">{toMoney(finalGrandTotal)}</strong></span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-md text-xs font-medium px-4"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={submitting || rows.length === 0}
              onClick={handleSubmit}
              className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs px-5 shadow-xs gap-1.5"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Submit Enquiry
            </Button>
          </div>
        </div>
      </div>

      {supplierPicker && rows[supplierPicker.rowIndex] && (
        <SupplierPickerModal
          open={!!supplierPicker}
          allVendors={
            getProductSupplierMappings(rows[supplierPicker.rowIndex].product as PIProduct)
              .map((mapping: any) => mapping.companyVendor)
          }
          row={rows[supplierPicker.rowIndex]}
          rowIndex={supplierPicker.rowIndex}
          vendorIndex={supplierPicker.vendorIndex}
          onClose={() => setSupplierPicker(null)}
          onSelect={(vendor) => {
            updateSupplierVendor(
              supplierPicker.rowIndex,
              supplierPicker.vendorIndex,
              vendor.id
            );

            setSupplierPicker(null);
          }}
        />
      )}

      {costPopup && (
        <AdditionalChargesModal
          open={!!costPopup}
          supplierName={costPopup.company_name}
          companyVendorId={costPopup.company_vendor_id}
          baseAmount={getSupplierBaseAmount(costPopup.company_vendor_id)}
          costs={supplierAdditionalCosts.filter(
            (cost) =>
              Number(cost.company_vendor_id) ===
              Number(costPopup.company_vendor_id)
          )}
          costOptions={additionalCostOptions}
          onClose={() => setCostPopup(null)}
          onAddRow={() => {
            const supplier = getUsedSuppliers().find(
              (s) => Number(s.id) === Number(costPopup.company_vendor_id)
            );

            if (supplier) {
              addSupplierAdditionalCostRow(supplier);
            }
          }}
          onUpdateRow={updateSupplierAdditionalCostRow}
          onRemoveRow={removeSupplierAdditionalCostRow}
          onOpenAddMaster={() => setAddCostMasterOpen(true)}
        />
      )}

      {addCostMasterOpen && (
        <AddAdditionalCostMasterModal
          form={costMasterForm}
          saving={costMasterSaving}
          onChange={(field, value) =>
            setCostMasterForm((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onClose={() => setAddCostMasterOpen(false)}
          onSave={saveCostMaster}
        />
      )}
    </div>
  );
}

function ProductAutocomplete({
  rowId,
  value,
  open,
  loading,
  options,
  onFocus,
  onChange,
  onSelect,
}: {
  rowId: string;
  value: string;
  open: boolean;
  loading: boolean;
  options: PIProduct[];
  onFocus: () => void;
  onChange: (value: string) => void;
  onSelect: (product: PIProduct) => void;
}) {
  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <input
          value={value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search product by name/code..."
          className="h-9 w-full rounded-md border bg-background pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-foreground/20"
        />

        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-lg border bg-popover p-1 shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
              <Loader2 size={14} className="mr-2 animate-spin" />
              Searching products...
            </div>
          ) : options.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No products found.
            </div>
          ) : (
            options.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(product)}
                className="flex w-full flex-col rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
              >
                <span className="font-semibold text-foreground">
                  {product.product_name}
                </span>

                <span className="text-[11px] text-muted-foreground">
                  Code: {product.article_code || "—"} · UOM:{" "}
                  {product.unit_of_measure || "—"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SupplierPickerModal({
  open,
  allVendors,
  row,
  rowIndex,
  vendorIndex,
  onClose,
  onSelect,
}: {
  open: boolean;
  allVendors: PICompanyVendor[];
  row: ProductRow;
  rowIndex: number;
  vendorIndex: number;
  onClose: () => void;
  onSelect: (vendor: PICompanyVendor) => void;
}) {
  const [search, setSearch] = useState("");

  const usedVendorIds = useMemo(() => {
    return row.vendor_entries
      .map((entry, index) => (index === vendorIndex ? null : entry.vendor?.id))
      .filter(Boolean);
  }, [row, vendorIndex]);

  const filteredVendors = useMemo(() => {
    const q = search.trim().toLowerCase();

    return allVendors.filter((vendor) => {
      if (!vendor?.id) return false;
      if (usedVendorIds.includes(vendor.id)) return false;

      if (!q) return true;

      const name = String(vendor.company_name || "").toLowerCase();
      const code = String(vendor.vendor_code || "").toLowerCase();
      const contact = String(vendor.point_of_contact || vendor.contact_no || "").toLowerCase();

      return name.includes(q) || code.includes(q) || contact.includes(q);
    });
  }, [allVendors, usedVendorIds, search]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Select Supplier</h3>
            <p className="text-xs text-muted-foreground">
              Choose a mapped supplier for this product.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="border-b p-4">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier name, code, contact..."
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
        </div>

        <div className="max-h-[380px] flex-1 overflow-y-auto p-2">
          {filteredVendors.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No suppliers available.
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => onSelect(vendor)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {vendor.company_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Code: {vendor.vendor_code || "—"} · Contact:{" "}
                    {vendor.point_of_contact || vendor.contact_no || "—"}
                  </p>
                </div>

                <span className="rounded-md border border-border/70 px-2 py-0.5 text-[10px] font-medium text-foreground">
                  Select
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end border-t bg-muted/20 px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdditionalChargesModal({
  open,
  supplierName,
  companyVendorId,
  baseAmount,
  costs,
  costOptions,
  onClose,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onOpenAddMaster,
}: {
  open: boolean;
  supplierName: string;
  companyVendorId: number;
  baseAmount: number;
  costs: SupplierAdditionalCostRow[];
  costOptions: AdditionalCostOption[];
  onClose: () => void;
  onAddRow: () => void;
  onUpdateRow: (rowId: string, field: keyof SupplierAdditionalCostRow, value: any) => void;
  onRemoveRow: (rowId: string) => void;
  onOpenAddMaster: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Additional Charges · {supplierName}
            </h3>
            <p className="text-xs text-muted-foreground">
              Base Amount: <strong className="text-foreground">{toMoney(baseAmount)}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b bg-muted/15 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Manage logistic, packing, loading, or custom charges for this supplier.
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAddMaster}
              className="h-8 text-xs font-medium"
            >
              + Create Charge Type
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onAddRow}
              className="h-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium"
            >
              <Plus size={13} className="mr-1" />
              Add Charge
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="border-b bg-muted/20">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Charge Type</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Calc Type</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Amount</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">%</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Tax %</th>
                <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Taxable</th>
                <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Tax</th>
                <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Total</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Remarks</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>

            <tbody>
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                    No additional charges added for this supplier.
                  </td>
                </tr>
              ) : (
                costs.map((row) => (
                  <tr key={row.row_id} className="border-b last:border-b-0 hover:bg-muted/15">
                    <td className="px-2 py-2">
                      <select
                        value={row.additional_cost_id}
                        onChange={(e) =>
                          onUpdateRow(
                            row.row_id,
                            "additional_cost_id",
                            e.target.value
                          )
                        }
                        className={tableInputClass}
                      >
                        <option value="">Select</option>
                        {costOptions.map((cost) => (
                          <option key={cost.id} value={cost.id}>
                            {cost.cost_name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-2 py-2">
                      <select
                        value={row.calculation_type}
                        onChange={(e) =>
                          onUpdateRow(
                            row.row_id,
                            "calculation_type",
                            e.target.value
                          )
                        }
                        className={tableInputClass}
                      >
                        <option value="Fixed">Fixed</option>
                        <option value="Percentage">Percentage</option>
                      </select>
                    </td>

                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={row.amount}
                        disabled={row.calculation_type === "Percentage"}
                        onChange={(e) =>
                          onUpdateRow(row.row_id, "amount", e.target.value)
                        }
                        className={tableInputClass}
                        placeholder="0.00"
                      />
                    </td>

                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={row.percentage}
                        disabled={row.calculation_type === "Fixed"}
                        onChange={(e) =>
                          onUpdateRow(row.row_id, "percentage", e.target.value)
                        }
                        className={tableInputClass}
                        placeholder="0.00"
                      />
                    </td>

                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={row.tax_pct}
                        onChange={(e) =>
                          onUpdateRow(row.row_id, "tax_pct", e.target.value)
                        }
                        className={tableInputClass}
                        placeholder="0"
                      />
                    </td>

                    <td className="px-2 py-2 text-right font-medium">
                      {toMoney(row.taxable_amount)}
                    </td>

                    <td className="px-2 py-2 text-right font-medium">
                      {toMoney(row.tax_amount)}
                    </td>

                    <td className="px-2 py-2 text-right font-bold text-foreground">
                      {toMoney(row.total_amount)}
                    </td>

                    <td className="px-2 py-2">
                      <input
                        value={row.remarks}
                        onChange={(e) =>
                          onUpdateRow(row.row_id, "remarks", e.target.value)
                        }
                        className={tableInputClass}
                        placeholder="Remarks"
                      />
                    </td>

                    <td className="px-2 py-2 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => onRemoveRow(row.row_id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t bg-muted/20 px-5 py-3">
          <Button type="button" size="sm" onClick={onClose} className="h-8 px-4">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddAdditionalCostMasterModal({
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  form: {
    cost_name: string;
    cost_code: string;
    description: string;
    is_taxable: boolean;
    tax_pct: string;
  };
  saving: boolean;
  onChange: (field: keyof typeof form, value: any) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">New Additional Cost Type</h3>
            <p className="text-xs text-muted-foreground">
              Add logistic, loading, unloading or other cost type.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Cost Name *</label>
            <input
              value={form.cost_name}
              onChange={(e) => onChange("cost_name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Freight / Loading / Packaging"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Cost Code</label>
            <input
              value={form.cost_code}
              onChange={(e) => onChange("cost_code", e.target.value)}
              className={inputClass}
              placeholder="e.g. FREIGHT"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Description</label>
            <input
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              className={inputClass}
              placeholder="Optional remarks"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_taxable}
              onChange={(e) => onChange("is_taxable", e.target.checked)}
              className="rounded border"
            />
            Tax applicable
          </label>

          {form.is_taxable && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Tax %</label>
              <input
                type="number"
                value={form.tax_pct}
                onChange={(e) => onChange("tax_pct", e.target.value)}
                className={inputClass}
                placeholder="18"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t bg-muted/20 px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
