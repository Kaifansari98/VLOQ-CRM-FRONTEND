"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

interface TabItem {
  value: string;
  label: string;
  count?: number;
  dotColor?: string;
}

interface CustomTabsProps {
  tabs: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function CustomTabs({
  tabs,
  value,
  onChange,
  className,
}: CustomTabsProps) {
  const [internalValue, setInternalValue] = useState(value || tabs[0]?.value);
  const active = value ?? internalValue;

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
  };

  return (
    <div
      className={clsx(
        "relative flex items-center bg-muted rounded-lg p-1 w-fit min-h-[35px]",
        "transition-colors",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => handleChange(tab.value)}
            className={clsx(
              "relative px-3 py-1.5 flex items-center gap-2 text-xs rounded-md font-medium transition-all"
            )}
          >
            {/* ACTIVE INDICATOR */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                className="absolute inset-0 bg-background dark:bg-foreground/10 rounded-md"
              />
            )}

            {/* TAB CONTENT */}
            <div className="relative flex items-center gap-2 z-10">
              {tab.dotColor && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tab.dotColor }}
                ></span>
              )}

              <span>{tab.label}</span>

              {tab.count !== undefined && <span>{tab.count}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
