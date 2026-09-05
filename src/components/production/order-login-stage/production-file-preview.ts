import ExcelJS, { type Cell } from "exceljs";
import { fetchProducts } from "@/api/inventory/product";

export const REQUIRED_PRODUCTION_HEADERS = ["Type", "Category", "Qty.", "Unit", "Name", "Article Code"] as const;
export const PRODUCTION_TEMPLATE_HEADERS = [
  "Sr.", ...REQUIRED_PRODUCTION_HEADERS, "Edgeband", "Size", "Description", "Vendor Code",
  "Area", "Face Coat 1", "Face Coat 2", "Alternate Unit Qty.", "Minimum Order Qty.",
  "Unit", "Cost", "Amt.", "Tax Amt.", "Total",
];
export type PreviewLog = { level: "error" | "warning" | "success"; source: string; message: string };
export type InventoryProduct = {
  id: number; vendor_id: number; article_code: string | null; product_name: string;
  current_stock: string | number | null; active: string;
  unit_of_measure?: string | null;
  stockUnit?: { unit_name: string } | null;
  primaryUnit?: { unit_name: string; short_name?: string | null } | null;
};
export type ProductionPreviewRow = {
  key: string; source: string; type: string; category: string; qty: number; unit: string;
  name: string; articleCode: string; errors: string[]; product?: InventoryProduct;
  status: "invalid" | "unmatched" | "ambiguous" | "inactive" | "unknown" | "shortage" | "ready";
  available?: number; shortage?: number; stockUnit?: string;
};
export type ProductionPreview = { rows: ProductionPreviewRow[]; logs: PreviewLog[]; fileCount: number };
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

function cellText(cell: Cell): string {
  // Preserve formatted numeric article codes (e.g. 000123), rich text and cached formula values.
  if (typeof cell.value === "number" && /^0+$/.test(cell.numFmt)) {
    return String(cell.value).padStart(cell.numFmt.length, "0");
  }
  return cell.text.trim();
}

export async function parseProductionFiles(files: File[]): Promise<ProductionPreview> {
  const preview: ProductionPreview = { rows: [], logs: [], fileCount: files.length };
  for (const [fileIndex, file] of files.entries()) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      preview.logs.push({ level: "error", source: file.name, message: "Only .xlsx Excel files are accepted. Save your file as an Excel workbook and try again." });
      continue;
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheets = workbook.worksheets.filter((sheet) => sheet.actualRowCount > 0);
      if (!sheets.length) throw new Error("The workbook is empty.");
      for (const sheet of sheets) {
        const source = `${file.name} · ${sheet.name}`;
        const columns = new Map<string, number>();
        const duplicates = new Set<string>();
        sheet.getRow(1).eachCell((cell, index) => {
          const header = normalize(cellText(cell));
          if (columns.has(header)) duplicates.add(header);
          else columns.set(header, index);
        });
        const missing = REQUIRED_PRODUCTION_HEADERS.filter((header) => !columns.has(normalize(header)));
        // The supplied template has a second optional Unit column. The first is the required quantity unit.
        const ambiguous = REQUIRED_PRODUCTION_HEADERS.filter((header) => header !== "Unit" && duplicates.has(normalize(header)));
        if (missing.length || ambiguous.length) {
          preview.logs.push({ level: "error", source, message: [
            missing.length ? `Missing required columns: ${missing.join(", ")}.` : "",
            ambiguous.length ? `Repeated required columns: ${ambiguous.join(", ")}. Keep one of each.` : "",
            "Use the template headers in the first row. Extra columns are allowed.",
          ].filter(Boolean).join(" ") });
          continue;
        }
        let rowCount = 0;
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          let hasData = false;
          row.eachCell((cell) => { if (cellText(cell)) hasData = true; });
          if (!hasData) return;
          rowCount++;
          const values = REQUIRED_PRODUCTION_HEADERS.map((header) => cellText(row.getCell(columns.get(normalize(header))!)));
          const [type, category, quantity, unit, name, articleCode] = values;
          const errors = REQUIRED_PRODUCTION_HEADERS.filter((_, i) => !values[i]).map((header) => `${header} is required`);
          const qty = Number(quantity);
          if (quantity && (!Number.isFinite(qty) || qty <= 0)) errors.push("Qty. must be a number greater than zero");
          const rowSource = `${source} · row ${rowNumber}`;
          preview.rows.push({ key: `${fileIndex}:${sheet.id}:${rowNumber}`, source: rowSource, type, category,
            qty, unit, name, articleCode, errors, status: errors.length ? "invalid" : "unmatched" });
          if (errors.length) preview.logs.push({ level: "error", source: rowSource, message: errors.join("; ") });
        });
        preview.logs.push({ level: rowCount ? "success" : "error", source,
          message: rowCount ? `All six required columns found. ${rowCount} data rows read; extra columns are allowed.` : "No data rows found. Add at least one product below the headers." });
      }
    } catch (error) {
      console.error("Failed to parse production file", file.name, error);
      const message = error instanceof Error ? error.message : String(error);
      preview.logs.push({ level: "error", source: file.name, message: message === "The workbook is empty."
        ? message : `This workbook could not be read (${message}). Upload a valid, unprotected .xlsx file.` });
    }
  }
  return preview;
}

export async function matchProductionInventory(
  preview: ProductionPreview, vendorId: number, cancelled: () => boolean = () => false,
): Promise<ProductionPreview> {
  const codes = [...new Set(preview.rows.filter((row) => !row.errors.length).map((row) => row.articleCode))];
  const matches = new Map<string, InventoryProduct[]>();
  let cursor = 0;
  // Reuse the vendor-scoped catalog endpoint, including every page and both active states.
  await Promise.all(Array.from({ length: Math.min(4, codes.length) }, async () => {
    while (cursor < codes.length && !cancelled()) {
      const code = codes[cursor++];
      const found = new Map<number, InventoryProduct>();
      for (const active of ["Yes", "No"] as const) {
        let page = 1;
        let totalPages = 1;
        do {
          if (cancelled()) return;
          const result = await fetchProducts(vendorId, { search: code, page, page_size: 100, active });
          for (const product of result.products as InventoryProduct[]) {
            if (product.vendor_id === vendorId && product.article_code?.trim() === code) found.set(product.id, product);
          }
          totalPages = result.total_pages;
          page++;
        } while (page <= totalPages);
      }
      matches.set(code, [...found.values()]);
    }
  }));
  return applyInventoryMatches(preview, matches);
}

export function applyInventoryMatches(preview: ProductionPreview, matches: Map<string, InventoryProduct[]>): ProductionPreview {
  const remaining = new Map<number, number>();
  const logs = [...preview.logs];
  const rows = preview.rows.map((original): ProductionPreviewRow => {
    const row = { ...original };
    if (row.errors.length) return row;
    const products = matches.get(row.articleCode) ?? [];
    let message = "";
    if (products.length !== 1) {
      row.status = products.length ? "ambiguous" : "unmatched";
      message = products.length ? "Multiple products have this article code. Review the catalog match." : "No product found for this article code in your vendor’s catalog.";
    } else {
      const product = products[0];
      row.product = product;
      row.stockUnit = product.stockUnit?.unit_name || product.unit_of_measure || product.primaryUnit?.unit_name || undefined;
      const stock = product.current_stock == null || product.current_stock === "" ? NaN : Number(product.current_stock);
      if (product.active !== "Yes") {
        row.status = "inactive";
        message = "This catalog product is inactive.";
      } else if (!Number.isFinite(stock)) {
        row.status = "unknown";
        message = "Inventory quantity is unavailable for this product.";
      } else {
        const available = remaining.get(product.id) ?? Math.max(0, stock);
        row.available = available;
        row.shortage = Math.max(0, Math.round((row.qty - available) * 1e8) / 1e8);
        remaining.set(product.id, Math.max(0, Math.round((available - row.qty) * 1e8) / 1e8));
        row.status = row.shortage > 0 ? "shortage" : "ready";
        if (row.shortage) message = `Short by ${row.shortage} ${row.unit}. Available stock accounts for earlier rows in this selection.`;
      }
    }
    if (message) logs.push({ level: "warning", source: row.source, message: `${row.articleCode}: ${message}` });
    return row;
  });
  return { ...preview, rows, logs };
}
