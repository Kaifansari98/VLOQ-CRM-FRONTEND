"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type StageId =
  | "details"
  | "measurement"
  | "designing"
  | "booking"
  | "finalMeasurement"
  | "clientdocumentation"
  | "clientApproval"
  | "techcheck"
  | "orderLogin"
  | "production"
  | "readyToDispatch";

type GroupKey = "leads" | "project" | "production";

interface GroupedSmoothTabProps {
  groups: Record<
    GroupKey,
    ReadonlyArray<{ id: StageId; title: string; component: React.ReactNode }>
  >;
  defaultTabId: StageId;
  onChange?: (tabId: StageId) => void;
}

const groupLabels: Record<GroupKey, string> = {
  leads: "Leads",
  project: "Project",
  production: "Production",
};

export default function GroupedSmoothTab({
  groups,
  defaultTabId,
  onChange,
}: GroupedSmoothTabProps) {
  const [activeTab, setActiveTab] = React.useState<StageId>(defaultTabId);
  const [activeGroup, setActiveGroup] = React.useState<GroupKey>(() => {
    return (
      ((Object.keys(groups) as GroupKey[]).find((g) =>
        groups[g].some((i) => i.id === defaultTabId)
      ) as GroupKey) || "leads"
    );
  });
  const [hoveredGroup, setHoveredGroup] = React.useState<GroupKey | null>(null);

  const allItems = React.useMemo(
    () => [...groups.leads, ...groups.project, ...groups.production],
    [groups]
  );

  const activeComponent = React.useMemo(
    () => allItems.find((i) => i.id === activeTab)?.component,
    [allItems, activeTab]
  );

  const handleSelect = (g: GroupKey, id: StageId) => {
    setActiveGroup(g);
    setActiveTab(id);
    setHoveredGroup(null);
    onChange?.(id);
  };

  const getActiveTabTitle = () => {
    return allItems.find((i) => i.id === activeTab)?.title || "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* ShadCN-style tabs with hover dropdowns */}
      <div className="flex items-center gap-2 border-b px-1">
        {(Object.keys(groups) as GroupKey[]).map((g) => {
          const isActive = activeGroup === g;
          const isHovered = hoveredGroup === g;
          const items = groups[g];

          return (
            <div
              key={g}
              className="relative"
              onMouseEnter={() => setHoveredGroup(g)}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <Button
                variant="ghost"
                className={cn(
                  "relative px-4 h-10 rounded-none border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {groupLabels[g]}
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      isHovered && "rotate-180"
                    )}
                  />
                </span>
              </Button>

              {/* Dropdown menu on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-popover rounded-md border shadow-md z-50"
                  >
                    <div className="p-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(g, item.id)}
                          className={cn(
                            "relative w-full px-2 py-1.5 text-sm rounded-sm text-left transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus:bg-accent focus:text-accent-foreground outline-none",
                            activeTab === item.id &&
                              "bg-accent text-accent-foreground font-medium"
                          )}
                        >
                          {item.title}
                          {activeTab === item.id && (
                            <motion.div
                              layoutId="active-indicator"
                              className="absolute inset-0 bg-accent rounded-sm -z-10"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                              }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Active tab indicator badge */}
        <div className="ml-auto py-1 px-3 rounded-2xl flex items-center justify-center gap-2 bg-muted text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <p className="rounded-md text-foreground font-medium">
            {getActiveTabTitle()}
          </p>
        </div>
      </div>

      {/* Active content with smooth transitions */}
      <div className="relative flex-1 mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeComponent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
