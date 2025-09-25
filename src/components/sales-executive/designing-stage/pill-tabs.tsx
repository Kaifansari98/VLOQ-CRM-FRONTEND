"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CloudUpload, Plus } from "lucide-react";
import React, { useState } from "react";
import AddQuotationModal from "./pill-tabs-component/modals/add-quotation-modal";
import DesignsModal from "./pill-tabs-component/modals/designs-modal";
import AddMeetingsModal from "./pill-tabs-component/modals/add-meetings-modal";
import BookingModal from "./booking-modal";
import { useAppSelector } from "@/redux/store";
import { useDetails } from "./pill-tabs-component/details-context";

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
  bookingBtn?: boolean;
};

const PillTabs = React.forwardRef<HTMLDivElement, PillTabsProps>(
  (
    { tabs, defaultActiveId = tabs[0]?.id, onTabChange, className, bookingBtn=true },
    ref
  ) => {
    const { leadId, accountId } =
      useDetails();
    const [activeTab, setActiveTab] = React.useState(defaultActiveId);
    const [openQuotationModal, setOpenQuotationModal] = useState(false);
    const [openDesignsModal, setOpenDesignsModal] = useState(false);
    const [openMeetingsModal, setOpenMeetingsModal] = useState(false);
    const [openBookingModal, setOpenBookingModal] = useState(false);

    const vendorId = useAppSelector((state) => state.auth?.user?.vendor_id);

    const handleClick = (id: string) => {
      setActiveTab(id);
      onTabChange?.(id);
    };

    const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

    return (
      <div ref={ref} className="flex flex-col gap-4">
        {/* Tabs + Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tabs wrapper (scrollable on mobile) */}
          <div
            className={cn(
              "flex items-center gap-1 p-1 bg-background rounded-full border",
              "max-w-full sm:max-w-none",
              className
            )}
          >
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleClick(tab.id)}
                  className={cn(
                    "relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition touch-none flex-shrink-0",
                    "text-xs sm:text-sm font-medium",
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
                  <span className="relative z-10 whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Button */}

          <div className="flex justify-start gap-2">
            {activeTab === "quotation" && (
              <Button
                size="sm"
                variant="secondary"
                className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                onClick={() => setOpenQuotationModal(true)}
              >
                <CloudUpload size={16} className="sm:mr-1" />
                <span>Upload Quotations</span>
              </Button>
            )}
            {activeTab === "meetings" && (
              <Button
                size="sm"
                className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                onClick={() => setOpenMeetingsModal(true)}
              >
                <CloudUpload size={16} className="sm:mr-1" />
                <span>Upload Meetings</span>
              </Button>
            )}
            {activeTab === "designs" && (
              <Button
                size="sm"
                className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                onClick={() => setOpenDesignsModal(true)}
              >
                <CloudUpload size={16} className="sm:mr-1" />
                <span>Upload Designs</span>
              </Button>
            )}

            {bookingBtn && (
              <Button
                size="sm"
                className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                onClick={() => setOpenBookingModal(true)}
              >
                <Plus size={16} />
                <span>Booking Stage</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Content */}
        <div className="mt-2 sm:mt-4">{activeContent}</div>

        {/* Modals */}
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

        <BookingModal
          open={openBookingModal}
          onOpenChange={setOpenBookingModal}
          data={{ id: leadId, accountId }}
        />
      </div>
    );
  }
);

PillTabs.displayName = "PillTabs";
export default PillTabs;
