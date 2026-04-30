"use client";

import { useAppSelector } from "@/redux/store";
import SalesExecutiveDashboard from "./SalesExecutiveDashboard";
import { FadeInProvider } from "../framer-motion/FadeInProvider";
import AdminDashboard from "./AdminDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";
import SiteSupervisorDashboard from "./SiteSupervisorDashboard";
import HeadSiteSupervisorDashboard from "./HeadSiteSupervisorDashboard";
import FactoryDashboard from "./FactoryDashboard";
import PreProdDashboard from "./PreProdDashboard";
import ComingSoon from "../generics/ComingSoon";

export default function DashboardWrapper() {
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const normalizedUserType = userType?.toLowerCase().replace("_", "-");

  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const franchiseId = useAppSelector((state) => state.auth.franchise_id);

  console.log("[AdminDashboard] ids", {
    user_id: userId,
    franchise_id: franchiseId,
    vendor_id: vendorId,
  });

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

  if (normalizedUserType === "super-admin") {
    return (
      <FadeInProvider>
        <SuperAdminDashboard />
      </FadeInProvider>
    );
  }

  if (normalizedUserType === "site-supervisor") {
    return (
      <FadeInProvider>
        <SiteSupervisorDashboard />
      </FadeInProvider>
    );
  }

  if (normalizedUserType === "head-site-supervisor") {
    return (
      <FadeInProvider>
        <HeadSiteSupervisorDashboard />
      </FadeInProvider>
    );
  }

  if (normalizedUserType === "factory") {
    return (
      <FadeInProvider>
        <FactoryDashboard />
      </FadeInProvider>
    );
  }

  if (normalizedUserType === "pre-prod") {
    return (
      <FadeInProvider>
        <PreProdDashboard />
      </FadeInProvider>
    );
  }

  // Default dashboard (fallback: under development)
  return (
    <FadeInProvider>
      <div className="flex items-center justify-center min-h-screen">
        <ComingSoon
          heading="Dashboard is under development"
          description="We're working on building your dashboard. Check back soon!"
        />
      </div>
    </FadeInProvider>
  );
}
