"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import AddQuotationModal from "./pill-tabs-component/modals/add-quotation-modal";
import DesignsModal from "./pill-tabs-component/modals/designs-modal";
import AddMeetingsModal from "./pill-tabs-component/modals/add-meetings-modal";

// Tab type
type TabItemType = {
  id: string;
  leadId?: number | null;
  label: string;
  content?: React.ReactNode;
};

type PillTabsProps = {
  tabs: TabItemType[];
  defaultActiveId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
};

const PillTabs = React.forwardRef<HTMLDivElement, PillTabsProps>(
  ({ tabs, defaultActiveId = tabs[0]?.id, onTabChange, className }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultActiveId);
    const [openQuotationModal, setOpenQuotationModal] =
      useState<boolean>(false);
    const [openDesignsModal, setOpenDesignsModal] = useState<boolean>(false);
    const [openMeetingsModal, setOpenMeetingsModal] = useState<boolean>(false);
    const handleClick = (id: string) => {
      setActiveTab(id);
      onTabChange?.(id);
    };

    const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

    return (
      <div ref={ref} className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div
            className={cn(
              "flex items-center gap-1 p-1 bg-background rounded-full border w-fit",
              className
            )}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleClick(tab.id)}
                className={cn(
                  "relative px-4 py-2 rounded-full transition touch-none",
                  "text-xs font-medium",
                  activeTab === tab.id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="pill-tabs-active-pill"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === "quotation" && (
            <Button onClick={() => setOpenQuotationModal(true)}>
              <Plus size={20} />
              Add Quotation
            </Button>
          )}
          {activeTab === "meetings" && (
            <Button onClick={() => setOpenMeetingsModal(true)}>
              <Plus size={20} />
              Add Meeting
            </Button>
          )}
          {activeTab === "designs" && (
            <Button onClick={() => setOpenDesignsModal(true)}>
              <Plus size={20} />
              Add Design
            </Button>
          )}
          {activeTab === "selections" && (
            <Button>
              <Plus size={20} />
              Add Selection
            </Button>
          )}
        </div>

        <div className="mt-4">{activeContent}</div>

        <AddQuotationModal
          open={openQuotationModal}
          onOpenChange={setOpenQuotationModal}
        />

        <DesignsModal
          open={openDesignsModal}
          onOpenChange={setOpenDesignsModal}
        />

        <AddMeetingsModal
          open={openMeetingsModal}
          onOpenChange={setOpenMeetingsModal}
        />
      </div>
    );
  }
);

PillTabs.displayName = "PillTabs";

export default PillTabs;
