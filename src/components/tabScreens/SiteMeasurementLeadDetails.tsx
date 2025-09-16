"use client";

import { useAppSelector } from "@/redux/store";
import { motion } from "framer-motion";

import { DetailsProvider } from "../sales-executive/designing-stage/pill-tabs-component/details-context";
import PillTabs from "../sales-executive/designing-stage/pill-tabs";
import QuotationTab from "../sales-executive/designing-stage/pill-tabs-component/quotation";
import DesigningTab from "../sales-executive/designing-stage/pill-tabs-component/designs";
import MeetingsTab from "../sales-executive/designing-stage/pill-tabs-component/meetings";
import ViewSelection from "../sales-executive/designing-stage/pill-tabs-component/view-selection";

type OpenLeadDetailsProps = {
  lead: any;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

export default function SiteMeasurementLeadDetails({
  lead,
}: OpenLeadDetailsProps) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const leadId = lead.leadId;
  const accountId = lead.accountId;

  if (!lead) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500">No lead details found.</p>
      </div>
    );
  }

  const InfoField = ({ label, value, icon: Icon }: any) => (
    <motion.div variants={itemVariants} className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      <p className="text-gray-900 pl-6">{value || "—"}</p>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border h-full overflow-hidden"
    >
      <main className="flex-1 h-full w-full p-6">
        <DetailsProvider value={{ leadId, accountId }}>
          <PillTabs
            addButtons={false}
            tabs={[
              {
                id: "quotation",
                label: "Quotation",
                content: <QuotationTab />,
              },
              { id: "meetings", label: "Meetings", content: <MeetingsTab /> },
              { id: "designs", label: "Designs", content: <DesigningTab /> },
              {
                id: "selections",
                label: "Selections",
                content: <ViewSelection />,
              },
            ]}
          />
        </DetailsProvider>
      </main>
    </motion.div>
  );
}
