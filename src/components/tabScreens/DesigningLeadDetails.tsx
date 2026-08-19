"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { DetailsProvider } from "../sales-executive/designing-stage/pill-tabs-component/details-context";
import PillTabs from "../sales-executive/designing-stage/pill-tabs";
import QuotationTab from "../sales-executive/designing-stage/pill-tabs-component/quotation";
import MeetingsTab from "../sales-executive/designing-stage/pill-tabs-component/meetings";
import DesigningTab from "../sales-executive/designing-stage/pill-tabs-component/designs";
import SpecificationsTab from "../sales-executive/designing-stage/pill-tabs-component/specifications";
import CostingFileTab from "../sales-executive/designing-stage/pill-tabs-component/costing-file";
import ElectricalPlumbingTab from "../sales-executive/designing-stage/pill-tabs-component/electrical-plumbing";
import FinalIsmUploadTab from "../sales-executive/designing-stage/pill-tabs-component/final-ism-upload";
import MaterialConfigurationTab from "../sales-executive/designing-stage/pill-tabs-component/material-configuration";
import ClientReceivedFilesTab from "../sales-executive/designing-stage/pill-tabs-component/client-received-files";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
import {
  FileText,
  Calendar,
  Palette,
  ClipboardList,
  Receipt,
  Zap,
  Upload,
  Paperclip,
  Sliders,
} from "lucide-react";
import { useFranchisesByVendorId } from "@/api/franchise";
import ComingSoon from "@/components/generics/ComingSoon";

type props = {
  leadId: number;
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

export default function DesigningLeadsDetails({ leadId }: props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type?.toLowerCase(),
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const { data: leadData } = useLeadById(leadId, vendorId, userId);
  const accountId = leadData?.data?.lead?.account_id ?? leadId;
  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );
  const lead = leadData?.data?.lead;
  const isB2b = React.useMemo(() => {
    const leadFranchise = franchisesForB2b.find(
      (franchise: any) => franchise.id === lead?.franchise_id,
    );
    return leadFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, lead?.franchise_id]);

  const tabs = React.useMemo(() => {
    const baseTabs = [
      {
        id: "quotation",
        label: "Quotation",
        icon: FileText,
        content: <QuotationTab />,
        customPrivilegeCode: "leads.designing_stage.quotation.view",
      },
      ...(!isB2b
        ? [
            {
              id: "meetings",
              label: "Meetings",
              icon: Calendar,
              content: <MeetingsTab />,
              customPrivilegeCode: "leads.designing_stage.meetings.view",
            },
          ]
        : []),
      {
        id: "designs",
        label: "Designs",
        icon: Palette,
        content: <DesigningTab />,
        customPrivilegeCode: "leads.designing_stage.designs.view",
      },
      ...(handlesLargeScaleProjects
        ? [
            {
              id: "specifications",
              label: "Specifications",
              icon: ClipboardList,
              content: <SpecificationsTab />,
              customPrivilegeCode: "leads.designing_stage.specifications.view",
            },
            {
              id: "costing-file",
              label: "Costing File",
              icon: Receipt,
              content: <CostingFileTab />,
              customPrivilegeCode: "leads.designing_stage.costing_file.view",
            },
            {
              id: "electrical-plumbing",
              label: "Electrical & Plumbing",
              icon: Zap,
              content: <ElectricalPlumbingTab />,
              customPrivilegeCode:
                "leads.designing_stage.electrical_plumbing.view",
            },
            {
              id: "final-ism-upload",
              label: "Revised ISM",
              icon: Upload,
              content: <FinalIsmUploadTab />,
              customPrivilegeCode: "leads.designing_stage.final_ism_upload.view",
            },
          ]
        : []),
    ];

    const gatedTabs =
      userType !== "custom"
        ? baseTabs.map(({ customPrivilegeCode, ...tab }) => tab)
        : baseTabs
            .filter((tab) => customPrivilegeCodes.includes(tab.customPrivilegeCode))
            .map(({ customPrivilegeCode, ...tab }) => tab);

    const activeTabs = [...gatedTabs];

    if (isB2b) {
      activeTabs.unshift({
        id: "client-received-files",
        label: "Client Received Files",
        icon: Paperclip,
        content: <ClientReceivedFilesTab />,
      });
      activeTabs.push({
        id: "material-configuration",
        label: "Material Configuration",
        icon: Sliders,
        content: <MaterialConfigurationTab />,
      });
    }

    return activeTabs;
  }, [customPrivilegeCodes, userType, handlesLargeScaleProjects, isB2b]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg w-full h-full py-4 bg-[#fff] dark:bg-[#0a0a0a]"
    >
      <DetailsProvider value={{ leadId, accountId }}>
        <PillTabs
          bookingBtn={false}
          tabs={tabs}
        />
      </DetailsProvider>
    </motion.div>
  );
}
