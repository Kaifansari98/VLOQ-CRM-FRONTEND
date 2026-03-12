"use client";

import { ToastProvider as BaseToastProvider } from "@/components/ui/toast";

export function ToastProvider() {
  return <BaseToastProvider position="top-center" />;
}
