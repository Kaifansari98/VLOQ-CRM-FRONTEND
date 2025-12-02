"use client";

import { motion } from "framer-motion";
import ProjectFinanceSummary from "../payment-screen/ProjectFinanceSummary";
import PaymentLogs from "../payment-screen/PaymentLogs";
import { useParams } from "next/navigation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};



interface PaymentInformationProps {
  accountId: number;
}

// 🔹 Wrapper
export default function PaymentInformation({
  accountId,
}: PaymentInformationProps) {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-2 gap-2 pb-4 max-h-[100vh]"
    >
      <PaymentLogs />
      <ProjectFinanceSummary
        leadId={leadIdNum}
        accountId={accountId}
      />
    </motion.div>
  );
}