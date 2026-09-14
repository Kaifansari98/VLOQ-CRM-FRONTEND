import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toastManager } from "@/components/ui/toast";
import { ColumnFiltersState, FilterFn, SortingFn } from "@tanstack/react-table";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// utils/errorLogger.ts

// utils/getErrorMessage.ts
export function getErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong";

  const responseData = (error as any)?.response?.data;
  const details = responseData?.details;

  if (Array.isArray(details) && details.length > 0) {
    const detailMessage = details
      .map((detail) => {
        if (typeof detail === "string") return detail;
        if (detail?.field && detail?.message) {
          return `${detail.field}: ${detail.message}`;
        }
        if (detail?.message) return detail.message;
        return "";
      })
      .filter(Boolean)
      .join(", ");

    if (detailMessage) return detailMessage;
  }

  if (details && typeof details === "object" && "message" in details) {
    const detailMessage = (details as { message?: unknown }).message;
    if (typeof detailMessage === "string" && detailMessage.trim()) {
      return detailMessage;
    }
  }

  if (typeof details === "string" && details.trim()) {
    return details;
  }

  // Axios error message
  const axiosMessage = responseData?.message || responseData?.error;

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

export const toastError = (error: any) => {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong";

  toastManager.add({
    title: message,
    type: "error",
  });
};

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

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-rose-500",
];

export function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0];
  const charCodeSum = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[charCodeSum % AVATAR_COLORS.length];
}

export function extractTitleText(input: string = ""): string {
  if (!input) return "";

  const match = input.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : "";
}

export function sanitizeRemark(input: string = ""): string {
  if (!input) return "";

  // remove patterns like ||OL:37|| , ||ANYTHING||
  return input.replace(/\|\|.*?\|\|/g, "").trim();
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

      case "priority":
        payload.priority = (Array.isArray(value) ? value : [value])
          .map((item) => String(item).trim())
          .filter(Boolean);
        break;

      case "sales_executive":
        payload.assign_to = value;
        break;

      case "status":
        payload.stagetag = value;
        break;

      case "site_map_link":
        payload.site_map_link = value;
        break;
    }
  });

  return payload;
}

export function mapTaskTableFiltersToPayload(filters: ColumnFiltersState) {
  const payload: Record<string, any> = {};

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  filters.forEach(({ id, value }) => {
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      value === ""
    ) {
      return;
    }

    switch (id) {
      case "dueDate":
        if (
          value === "today" ||
          value === "upcoming" ||
          value === "overdue" ||
          value === "completed"
        ) {
          payload.due_filter = value;
        }
        // ✅ HANDLE OBJECT FORMAT (from custom date picker)
        else if (typeof value === "object" && !Array.isArray(value)) {
          const dateValue = value as { from?: Date; to?: Date };

          if (dateValue.from || dateValue.to) {
            payload.date_range = {
              from: dateValue.from
                ? formatLocalDate(dateValue.from)
                : undefined,
              to: dateValue.to ? formatLocalDate(dateValue.to) : undefined,
            };
          }
        }
        // ✅ HANDLE ARRAY FORMAT (from DataTableDateFilter)
        else if (Array.isArray(value) && value.length === 2) {
          const [fromTimestamp, toTimestamp] = value;

          if (fromTimestamp || toTimestamp) {
            payload.date_range = {
              from: fromTimestamp
                ? formatLocalDate(new Date(fromTimestamp))
                : undefined,
              to: toTimestamp
                ? formatLocalDate(new Date(toTimestamp))
                : undefined,
            };
          }
        }
        break;

      case "assignedAt":
        // ✅ HANDLE OBJECT FORMAT (from custom date picker)
        if (typeof value === "object" && !Array.isArray(value)) {
          const dateValue = value as { from?: Date; to?: Date };

          if (dateValue.from || dateValue.to) {
            payload.assignat_range = {
              from: dateValue.from
                ? formatLocalDate(dateValue.from)
                : undefined,
              to: dateValue.to ? formatLocalDate(dateValue.to) : undefined,
            };
          }
        }
        // ✅ HANDLE ARRAY FORMAT (from DataTableDateFilter) - THIS WAS MISSING!
        else if (Array.isArray(value) && value.length === 2) {
          const [fromTimestamp, toTimestamp] = value;

          if (fromTimestamp || toTimestamp) {
            payload.assignat_range = {
              from: fromTimestamp
                ? formatLocalDate(new Date(fromTimestamp))
                : undefined,
              to: toTimestamp
                ? formatLocalDate(new Date(toTimestamp))
                : undefined,
            };
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
        break;
    }
  });

  return payload;
}




export const formatBlockedAt = (value?: string | null) => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsedDate);
};

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let formattedUrl = url.trim();
  if (!formattedUrl) return null;

  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const parsed = new URL(formattedUrl);
    const hostname = parsed.hostname.toLowerCase();

    const isYouTube =
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be") ||
      hostname.includes("youtube-nocookie.com");

    if (isYouTube) {
      const v = parsed.searchParams.get("v");
      if (v && v.length >= 11) return `https://www.youtube.com/embed/${v.substring(0, 11)}`;

      const pathSegments = parsed.pathname.split("/").filter(Boolean);

      if (pathSegments[0] === "embed" && pathSegments[1]) {
        return `https://www.youtube.com/embed/${pathSegments[1].substring(0, 11)}`;
      }

      if (pathSegments[0] === "shorts" && pathSegments[1]) {
        return `https://www.youtube.com/embed/${pathSegments[1].substring(0, 11)}`;
      }

      if ((pathSegments[0] === "live" || pathSegments[0] === "v") && pathSegments[1]) {
        return `https://www.youtube.com/embed/${pathSegments[1].substring(0, 11)}`;
      }

      if (hostname.includes("youtu.be") && pathSegments[0]) {
        return `https://www.youtube.com/embed/${pathSegments[0].substring(0, 11)}`;
      }
    }
  } catch (e) {
    // ignore
  }

  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/;
  const match = formattedUrl.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  return null;
}

export function formatSalesExecutiveName(assignedTo: any): string {
  if (!assignedTo || !assignedTo.user_name) return "";
  const name = String(assignedTo.user_name).trim();
  const lowerName = name.toLowerCase();
  const role = String(
    assignedTo.user_type?.user_type || assignedTo.user_role || assignedTo.role || ""
  ).trim().toLowerCase();

  if (
    lowerName === "super admin" ||
    lowerName.includes("super admin") ||
    role === "super-admin" ||
    role === "admin"
  ) {
    return "";
  }
  return name;
}
