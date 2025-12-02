"use client";

import { useAppSelector } from "@/redux/store";
import SalesExecutiveDashboard from "./SalesExecutiveDashboard";

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const userType = useAppSelector((state) => state.auth.user?.user_type.user_type);

  // Conditionally render special dashboard
  if (userType?.toLowerCase() === "sales-executive") {
    return <SalesExecutiveDashboard />;
  }

  // Default dashboard (fallback: existing layout)
  return <>{children}</>;
}
