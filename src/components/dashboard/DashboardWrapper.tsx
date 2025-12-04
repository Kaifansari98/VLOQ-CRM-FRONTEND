"use client";

import { useAppSelector } from "@/redux/store";
import SalesExecutiveDashboard from "./SalesExecutiveDashboard";
import { FadeInProvider } from "../framer-motion/FadeInProvider";

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  // Conditionally render special dashboard
  if (userType?.toLowerCase() === "sales-executive") {
    return (
      <FadeInProvider>
        <SalesExecutiveDashboard />
      </FadeInProvider>
    );
  }

  // Default dashboard (fallback: existing layout)
  return <FadeInProvider>{children}</FadeInProvider>;
}
