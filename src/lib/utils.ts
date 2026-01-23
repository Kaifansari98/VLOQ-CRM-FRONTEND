import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { ColumnFiltersState, FilterFn, SortingFn } from "@tanstack/react-table";

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

    // Skip empty values
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    // ==========================================
    // 🔥 FIXED: DATE RANGE HANDLING (OBJECT FORMAT)
    // ==========================================
    if (id === "createdAt") {
      if (typeof value === "object" && !Array.isArray(value)) {
        const dateValue = value as { from?: Date; to?: Date };

        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        if (dateValue.from || dateValue.to) {
          payload.date_range = {
            from: dateValue.from ? formatLocalDate(dateValue.from) : undefined,
            to: dateValue.to ? formatLocalDate(dateValue.to) : undefined,
          };
        }
      }

      // legacy array support
      else if (Array.isArray(value)) {
        const [from, to] = value;

        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        payload.date_range = {
          from: from ? formatLocalDate(new Date(from)) : undefined,
          to: to ? formatLocalDate(new Date(to)) : undefined,
        };
      }

      return;
    }

    // ==========================================
    // EXISTING FIELD MAPPINGS
    // ==========================================
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

      case "sales_executive":
        payload.assign_to = value;
        break;

      case "status":
        payload.stagetag = value;
        break;
    }
  });

  return payload;
}

export function mapTaskTableFiltersToPayload(filters: ColumnFiltersState) {
  const payload: Record<string, any> = {};

  console.log("🔍 ALL FILTERS RECEIVED:", JSON.stringify(filters, null, 2));

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  filters.forEach(({ id, value }) => {
    console.log(
      `🔍 Processing Filter ID: ${id}, Value:`,
      value,
      `Type: ${typeof value}`,
    );

    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      value === ""
    ) {
      console.log(`⚠️ SKIPPED ${id} - empty value`);
      return;
    }

    switch (id) {
      case "dueDate":
        if (value === "today" || value === "upcoming" || value === "overdue") {
          payload.due_filter = value;
          console.log("✅ SET due_filter:", value);
        }
        // ✅ HANDLE OBJECT FORMAT (from custom date picker)
        else if (typeof value === "object" && !Array.isArray(value)) {
          const dateValue = value as { from?: Date; to?: Date };
          console.log("🔍 dueDate dateValue (object):", dateValue);

          if (dateValue.from || dateValue.to) {
            payload.date_range = {
              from: dateValue.from
                ? formatLocalDate(dateValue.from)
                : undefined,
              to: dateValue.to ? formatLocalDate(dateValue.to) : undefined,
            };
            console.log("✅ SET date_range:", payload.date_range);
          }
        }
        // ✅ HANDLE ARRAY FORMAT (from DataTableDateFilter)
        else if (Array.isArray(value) && value.length === 2) {
          const [fromTimestamp, toTimestamp] = value;
          console.log(
            "🔍 dueDate timestamps (array):",
            fromTimestamp,
            toTimestamp,
          );

          if (fromTimestamp || toTimestamp) {
            payload.date_range = {
              from: fromTimestamp
                ? formatLocalDate(new Date(fromTimestamp))
                : undefined,
              to: toTimestamp
                ? formatLocalDate(new Date(toTimestamp))
                : undefined,
            };
            console.log("✅ SET date_range:", payload.date_range);
          }
        }
        break;

      case "assignedAt":
        console.log("🔍 assignedAt raw value:", value);

        // ✅ HANDLE OBJECT FORMAT (from custom date picker)
        if (typeof value === "object" && !Array.isArray(value)) {
          const dateValue = value as { from?: Date; to?: Date };
          console.log("🔍 assignedAt dateValue (object):", dateValue);

          if (dateValue.from || dateValue.to) {
            payload.assignat_range = {
              from: dateValue.from
                ? formatLocalDate(dateValue.from)
                : undefined,
              to: dateValue.to ? formatLocalDate(dateValue.to) : undefined,
            };
            console.log("✅ SET assignat_range:", payload.assignat_range);
          }
        }
        // ✅ HANDLE ARRAY FORMAT (from DataTableDateFilter) - THIS WAS MISSING!
        else if (Array.isArray(value) && value.length === 2) {
          const [fromTimestamp, toTimestamp] = value;
          console.log(
            "🔍 assignedAt timestamps (array):",
            fromTimestamp,
            toTimestamp,
          );

          if (fromTimestamp || toTimestamp) {
            payload.assignat_range = {
              from: fromTimestamp
                ? formatLocalDate(new Date(fromTimestamp))
                : undefined,
              to: toTimestamp
                ? formatLocalDate(new Date(toTimestamp))
                : undefined,
            };
            console.log("✅ SET assignat_range:", payload.assignat_range);
          }
        }
        break;

      case "site_map_link":
        payload.site_map_link = value;
        break;

      case "siteType":
        payload.site_type = Array.isArray(value) ? value : [value];
        break;

      case "furnitureType":
        payload.product_type = Array.isArray(value) ? value : [value];
        break;

      case "furnitueStructures":
        payload.product_structure = Array.isArray(value) ? value : [value];
        break;

      case "taskType":
        payload.task_type = Array.isArray(value) ? value : [value];
        break;

      case "assignedToName":
        const assignToValue = Array.isArray(value)
          ? value.map((v) => (typeof v === "string" ? parseInt(v, 10) : v))
          : typeof value === "string"
            ? parseInt(value, 10)
            : value;
        payload.assign_to = assignToValue;
        break;

      case "assignedByName":
        const assignByValue = Array.isArray(value)
          ? value.map((v) => (typeof v === "string" ? parseInt(v, 10) : v))
          : typeof value === "string"
            ? parseInt(value, 10)
            : value;
        payload.assign_by = assignByValue;
        break;

      default:
        console.log(`⚠️ Unknown filter ID: ${id}`);
        break;
    }
  });

  console.log("🎯 FINAL PAYLOAD:", payload);
  return payload;
}
