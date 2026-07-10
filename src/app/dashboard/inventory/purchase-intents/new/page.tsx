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

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAppSelector } from "@/redux/store";

import {
  Plus,
  Trash2,
  Loader2,
  Send,
  Search,
  Package,
  IndianRupee,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  "h-9 w-full rounded-lg border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300";

const tableInputClass =
  "h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300";

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

export default function RaisePurchaseIntentPage() {
  const [supplierPicker, setSupplierPicker] = useState<{
    rowIndex: number;
    vendorIndex: number;
  } | null>(null);
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const router = useRouter();



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
    if (!vendorId) return;

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
  }, [vendorId]);

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
      const result = await fetchPIProducts(
        vendorId,
        undefined,
        search
      );

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
    const isSameState = Number(supplier.state_id) === Number(stateId);

    if (isSameState) {
      entry.cgst_pct = String(product.cgst_rate || 0);
      entry.sgst_pct = String(product.sgst_rate || 0);
      entry.igst_pct = "0";
      entry.tax_pct = String(
        Number(product.cgst_rate || 0) + Number(product.sgst_rate || 0)
      );
    } else {
      entry.cgst_pct = "0";
      entry.sgst_pct = "0";
      entry.igst_pct = String(product.tax_pct || product.igst_rate || 0);
      entry.tax_pct = String(product.tax_pct || product.igst_rate || 0);
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

    /**
     * ProductSupplierMapping.amount is supplier purchase rate.
     */
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
      [rowId]: `${product.product_name}${product.article_code ? ` - ${product.article_code}` : ""
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

      if (field === "vendor" as any) {
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
        title: "Purchase Intent created successfully",
        type: "success",
      });

      router.push("/dashboard/inventory/purchase-intents");
    } catch (error) {
      toastManager.add({
        title: "Failed to create purchase intent",
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/inventory/purchase-intents">
                  Purchase Intents
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Raise Intent</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold">Raise Purchase Intent</h1>
            <p className="text-sm text-muted-foreground">
              Add products and supplier quotation in a simple table.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/inventory/purchase-intents")}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              Submit Intent
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-xl border bg-card p-4">
              <div className="mb-4 rounded-xl border bg-card p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PIPriority)}
                      className={inputClass}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Total
                    </label>
                    <div className="flex h-9 items-center rounded-lg border bg-muted/30 px-3 text-sm font-bold text-indigo-600">
                      {toMoney(finalGrandTotal)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold">
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
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Products & Suppliers</p>
                <p className="text-xs text-muted-foreground">
                  Use one product row and add supplier rows below it.
                </p>
              </div>

              <Button type="button" size="sm" onClick={addProductRow}>
                <Plus size={14} className="mr-1" />
                Add Product Row
              </Button>
            </div>

            {rows.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center">
                <Package size={32} className="mb-2 text-muted-foreground/40" />
                <p className="text-sm font-semibold">No product added</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Click Add Product Row to start.
                </p>
                <Button type="button" size="sm" onClick={addProductRow}>
                  <Plus size={14} className="mr-1" />
                  Add Product Row
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((row, rowIndex) => (
                  <div
                    key={row.row_id}
                    className="overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="border-b bg-muted/30 p-3">
                      <div className="grid gap-2 md:grid-cols-[2fr_120px_1fr_40px]">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold">
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
                          <label className="mb-1 block text-[11px] font-semibold">
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
                          <label className="mb-1 block text-[11px] font-semibold">
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
                            className="h-9 w-9 p-0 text-red-600"
                            onClick={() => removeProductRow(rowIndex)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1100px] text-xs">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-2 py-2 text-left">Supplier *</th>
                            <th className="px-2 py-2 text-left">Payment Term</th>
                            <th className="px-2 py-2 text-left">Qty *</th>
                            <th className="px-2 py-2 text-left">Req. Date</th>
                            <th className="px-2 py-2 text-left">MRP</th>
                            <th className="px-2 py-2 text-left">Disc %</th>
                            <th className="px-2 py-2 text-left">Rate *</th>
                            <th className="px-2 py-2 text-left">GST %</th>
                            <th className="px-2 py-2 text-left">Tax Amt</th>
                            <th className="px-2 py-2 text-left">Total</th>
                            <th className="px-2 py-2 text-left">Remark</th>
                            <th className="px-2 py-2 text-center">Charges</th>
                            <th className="px-2 py-2 text-center">Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {row.vendor_entries.length === 0 ? (
                            <tr>
                              <td
                                colSpan={13}
                                className="px-3 py-8 text-center text-muted-foreground"
                              >
                                No supplier added.
                              </td>
                            </tr>
                          ) : (
                            row.vendor_entries.map((entry, vendorIndex) => {
                              const usedVendorIds = row.vendor_entries
                                .map((e, index) =>
                                  index === vendorIndex ? null : e.vendor.id
                                )
                                .filter(Boolean);

                              const availableVendors = allVendors.filter(
                                (vendor) => !usedVendorIds.includes(vendor.id)
                              );

                              const availablePaymentTerms = paymentTerms.filter(
                                (term) =>
                                  term.company_vendor_id === null ||
                                  Number(term.company_vendor_id) ===
                                  Number(entry.vendor.id)
                              );

                              return (
                                <tr
                                  key={`${entry.vendor.id}-${vendorIndex}`}
                                  className="border-t"
                                >
                                  <td className="px-2 py-2">
                                    <button
                                      type="button"
                                      onClick={() => openSupplierPicker(rowIndex, vendorIndex)}
                                      className="flex h-8 w-[240px] items-center justify-between rounded-md border bg-background px-2 text-left text-xs outline-none hover:bg-muted/50"
                                    >
                                      <span className="truncate">
                                        {entry.vendor?.company_name
                                          ? `${entry.vendor.company_name} - ${entry.vendor.vendor_code}`
                                          : "Select supplier"}
                                      </span>

                                      <Search size={13} className="ml-2 shrink-0 text-muted-foreground" />
                                    </button>
                                  </td>

                                  <td className="px-2 py-2">
                                    <select
                                      value={entry.payment_term_id || ""}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "payment_term_id" as keyof VendorEntry,
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    >
                                      <option value="">Select</option>
                                      {availablePaymentTerms.map((term) => (
                                        <option key={term.id} value={term.id}>
                                          {term.term_name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2">
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
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="date"
                                      value={entry.required_by_date}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "required_by_date",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
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
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
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
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
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
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={entry.tax_pct}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "tax_pct",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2 font-semibold">
                                    {toMoney(entry.tax_amount)}
                                  </td>

                                  <td className="px-2 py-2 font-bold text-indigo-600">
                                    {toMoney(entry.total_amount)}
                                  </td>

                                  <td className="px-2 py-2">
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

                                  <td className="px-2 py-2 text-center">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-1 whitespace-nowrap"
                                      onClick={() =>
                                        setCostPopup({
                                          company_vendor_id: Number(entry.vendor.id),
                                          company_name: `${entry.vendor.company_name} - ${entry.vendor.vendor_code}`,
                                        })
                                      }
                                    >
                                      <IndianRupee size={13} />
                                      Charges
                                      {getSupplierCostTotal(Number(entry.vendor.id)) > 0 && (
                                        <span className="ml-1 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
                                          {toMoney(getSupplierCostTotal(Number(entry.vendor.id)))}
                                        </span>
                                      )}
                                    </Button>
                                  </td>


                                  <td className="px-2 py-2 text-center">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600"
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

                    <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addSupplierRow(rowIndex)}
                      >
                        <Plus size={13} className="mr-1" />
                        Add Supplier
                      </Button>

                      <p className="text-sm font-bold">
                        Product Total:{" "}
                        <span className="text-indigo-600">
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

            <div className="mt-5 flex items-center justify-between rounded-xl border bg-card px-4 py-3">
              <p className="text-sm font-semibold">
                Grand Total:{" "}
                <span className="text-lg font-bold text-indigo-600">
                  {toMoney(finalGrandTotal)}
                </span>
              </p>

              <Button
                type="button"
                disabled={submitting || rows.length === 0}
                onClick={handleSubmit}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Submit Intent
              </Button>
            </div>
          </>
        )}
      </main>
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
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <input
          value={value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search product by name/code..."
          className="h-9 w-full rounded-lg border bg-background pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-background shadow-xl">
          {loading ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              Searching...
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              Type to search products
            </div>
          ) : (
            options.map((product) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(product);
                }}
                className="w-full border-b px-3 py-2 text-left hover:bg-muted"
              >
                <p className="text-xs font-semibold">
                  {product.product_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {[product.article_code, product.unit_of_measure, product.hsn_code]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
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

  if (!open) return null;

  const usedVendorIds = row.vendor_entries
    .map((entry, index) => (index === vendorIndex ? null : entry.vendor.id))
    .filter(Boolean);

  const q = search.trim().toLowerCase();

  const filteredVendors = allVendors
    .filter((vendor) => {
      const notAlreadyUsed = !usedVendorIds.includes(vendor.id);

      if (!q) return notAlreadyUsed;

      return (
        String(vendor.company_name || "").toLowerCase().includes(q) ||
        String(vendor.vendor_code || "").toLowerCase().includes(q)
      );
    })
    .slice(0, 50);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-bold">Select Supplier</p>
            <p className="text-xs text-muted-foreground">
              Search by supplier name or supplier code.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="border-b p-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier..."
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2">
          {filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm font-semibold">No supplier found</p>
              <p className="text-xs">Try searching with another name/code.</p>
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(vendor);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {vendor.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vendor.vendor_code}
                  </p>
                </div>

                <span className="rounded-full border px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  Select
                </span>
              </button>
            ))
          )}
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
  onUpdateRow: (
    rowId: string,
    field: keyof SupplierAdditionalCostRow,
    value: any
  ) => void;
  onRemoveRow: (rowId: string) => void;
  onOpenAddMaster: () => void;
}) {
  if (!open) return null;

  const total = costs.reduce((sum, row) => sum + toNum(row.total_amount), 0);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-bold">Additional Charges</p>
            <p className="text-xs text-muted-foreground">
              {supplierName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 border-b bg-muted/20 p-4 md:grid-cols-3">
          <div className="rounded-xl border bg-background p-3">
            <p className="text-xs text-muted-foreground">Supplier Base Amount</p>
            <p className="text-base font-bold">{toMoney(baseAmount)}</p>
          </div>

          <div className="rounded-xl border bg-background p-3">
            <p className="text-xs text-muted-foreground">Additional Charges</p>
            <p className="text-base font-bold text-amber-600">
              {toMoney(total)}
            </p>
          </div>

          <div className="rounded-xl border bg-background p-3">
            <p className="text-xs text-muted-foreground">Supplier Final Total</p>
            <p className="text-base font-bold text-indigo-600">
              {toMoney(baseAmount + total)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Add logistic, loading, unloading, freight or other supplier-wise charges.
          </p>

          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onOpenAddMaster}>
              <Plus size={13} className="mr-1" />
              New Cost Master
            </Button>

            <Button type="button" size="sm" onClick={onAddRow}>
              <Plus size={13} className="mr-1" />
              Add Charge
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[950px] text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-2 py-2 text-left">Charge Type</th>
                <th className="px-2 py-2 text-left">Calculation</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-right">%</th>
                <th className="px-2 py-2 text-right">Tax %</th>
                <th className="px-2 py-2 text-right">Taxable</th>
                <th className="px-2 py-2 text-right">Tax Amt</th>
                <th className="px-2 py-2 text-right">Total</th>
                <th className="px-2 py-2 text-left">Remarks</th>
                <th className="px-2 py-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {costs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">
                    No additional charges added for this supplier.
                  </td>
                </tr>
              ) : (
                costs.map((row) => (
                  <tr key={row.row_id} className="border-t">
                    <td className="px-2 py-2">
                      <select
                        value={row.additional_cost_id}
                        onChange={(e) =>
                          onUpdateRow(
                            row.row_id,
                            "additional_cost_id",
                            e.target.value ? Number(e.target.value) : ""
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
                      />
                    </td>

                    <td className="px-2 py-2 text-right font-semibold">
                      {toMoney(row.taxable_amount)}
                    </td>

                    <td className="px-2 py-2 text-right font-semibold">
                      {toMoney(row.tax_amount)}
                    </td>

                    <td className="px-2 py-2 text-right font-bold text-indigo-600">
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
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => onRemoveRow(row.row_id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t bg-muted/20 px-5 py-4">
          <Button type="button" onClick={onClose}>
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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-bold">New Additional Cost</p>
            <p className="text-xs text-muted-foreground">
              Add logistic, loading, unloading or other cost type.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold">Cost Name *</label>
            <input
              value={form.cost_name}
              onChange={(e) => onChange("cost_name", e.target.value)}
              className={inputClass}
              placeholder="Logistic / Loading / Unloading"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Cost Code</label>
            <input
              value={form.cost_code}
              onChange={(e) => onChange("cost_code", e.target.value)}
              className={inputClass}
              placeholder="LOGISTIC"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Description</label>
            <input
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.is_taxable}
              onChange={(e) => onChange("is_taxable", e.target.checked)}
            />
            Tax applicable
          </label>

          {form.is_taxable && (
            <div>
              <label className="mb-1 block text-xs font-semibold">Tax %</label>
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

        <div className="flex justify-end gap-2 border-t bg-muted/20 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}