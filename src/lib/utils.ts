import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { ColumnFiltersState, FilterFn, SortingFn } from "@tanstack/react-table";
import { LeadColumn } from "@/components/utils/column/column-type";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// utils/errorLogger.ts

// utils/getErrorMessage.ts
export function getErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong";

  // Axios error message
  const axiosMessage =
    (error as any)?.response?.data?.message ||
    (error as any)?.response?.data?.error;

  if (axiosMessage) return axiosMessage;

  // Native JS error
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function logError(context: string, err: unknown) {
  console.error(`${context}:`, getErrorMessage(err), err);
}

export function toastError(err: unknown) {
  toast.error(getErrorMessage(err));
}

export function getCssVariable(name: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export function getInitials(name: string) {
  if (!name || typeof name !== "string") return "";

  // Remove special chars except spaces
  const clean = name.replace(/[^a-zA-Z\s]/g, " ").trim();

  // Split words
  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";

  // First initial
  const first = parts[0][0].toUpperCase();

  // Check if second word is alphabet-only (true last name)
  if (parts.length > 1 && /^[A-Za-z]+$/.test(parts[1])) {
    const second = parts[1][0].toUpperCase();
    return first + second; // Return two initials
  }

  return first; // Return only one initial
}

export function extractTitleText(input: string = ""): string {
  if (!input) return "";

  const index = input.indexOf("-");

  // extract left side
  const leftText = index !== -1 ? input.slice(0, index).trim() : input.trim();

  // replace spaces between words with hyphens
  return leftText.replace(/\s+/g, "-");
}

export function normalize(val: string) {
  return val.trim().replace(/\s+/g, "-").toLowerCase();
}

export const tableMultiValueFilter: FilterFn<any> = (
  row,
  columnId,
  filterValue,
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }

  const cellValue = row.getValue(columnId);

  if (!cellValue) return false;

  const values = String(cellValue)
    .split(",")
    .map((v) => v.trim());

  return filterValue.some((val) => values.includes(val));
};

export const tableTextSearchFilter = <T>(): FilterFn<T> => {
  return (row, columnId, filterValue) => {
    if (!filterValue) return true;

    const cellValue = row.getValue(columnId);

    if (!cellValue) return false;

    return String(cellValue)
      .toLowerCase()
      .includes(String(filterValue).toLowerCase());
  };
};

export const siteMapLinkSort = <T>(): SortingFn<T> => {
  return (rowA, rowB, columnId) => {
    const a = rowA.getValue(columnId) as string;
    const b = rowB.getValue(columnId) as string;

    const aHasLink =
      typeof a === "string" &&
      (a.startsWith("http://") || a.startsWith("https://"));

    const bHasLink =
      typeof b === "string" &&
      (b.startsWith("http://") || b.startsWith("https://"));

    // ✅ Move rows WITH link on top
    if (aHasLink && !bHasLink) return -1;
    if (!aHasLink && bHasLink) return 1;

    // Both same → keep original order
    return 0;
  };
};

export const tableSingleValueMultiSelectFilter: FilterFn<any> = (
  row,
  columnId,
  filterValue,
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }

  const cellValue = row.getValue(columnId);

  if (!cellValue) return false;

  const rowValue = String(cellValue).trim().toLowerCase();

  return filterValue.some(
    (val) => String(val).trim().toLowerCase() === rowValue,
  );
};

// Column filter mapping utility
export function mapTableFiltersToPayload(filters: ColumnFiltersState) {
  const payload: Record<string, any> = {};

  filters.forEach((filter) => {
    const { id, value } = filter;

    if (!value || (Array.isArray(value) && value.length === 0)) return;

    switch (id) {
      case "lead_code":
        payload.filter_lead_code = value;
        break;

      case "name":
        payload.filter_name = value;
        break;

      case "contact":
        payload.contact = value;
        break;

      case "altContact":
        payload.alt_contact_no = value;
        break;

      case "email":
        payload.email = value;
        break;

      case "siteAddress":
        payload.site_address = value;
        break;

      case "architechName":
        payload.archetech_name = value;
        break;

      case "designerRemark":
        payload.designer_remark = value;
        break;

      case "furnitureType":
        payload.furniture_type = value;
        break;

      case "furnitueStructures":
        payload.furniture_structure = value;
        break;

      case "siteType":
        payload.site_type = value;
        break;

      case "source":
        payload.source = value;
        break;

      case "assign_to":
        payload.assign_to = value;
        break;

      case "site_map_link":
        payload.site_map_link = value;
        break;
    }
  });

  return payload;
}
