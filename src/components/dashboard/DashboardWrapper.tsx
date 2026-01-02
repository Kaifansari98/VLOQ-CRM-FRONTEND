"use client";

import { useAppSelector } from "@/redux/store";
import SalesExecutiveDashboard from "./SalesExecutiveDashboard";
import { FadeInProvider } from "../framer-motion/FadeInProvider";
import AdminDashboard from "./AdminDashboard";

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const normalizedUserType = userType?.toLowerCase().replace("_", "-");

  // Conditionally render special dashboard
  if (normalizedUserType === "sales-executive") {
    return (
      <FadeInProvider>
        <SalesExecutiveDashboard />
      </FadeInProvider>
    );
  }

  if (normalizedUserType === "admin") {
    return (
      <FadeInProvider>
        <AdminDashboard />
      </FadeInProvider>
    );
  }

  // Default dashboard (fallback: existing layout)
  return <FadeInProvider>{children}</FadeInProvider>;
}
