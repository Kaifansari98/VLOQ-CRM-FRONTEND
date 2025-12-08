import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";

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
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}


export function getInitials(name:string) {
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
    return first + second;   // Return two initials
  }

  return first;              // Return only one initial
}