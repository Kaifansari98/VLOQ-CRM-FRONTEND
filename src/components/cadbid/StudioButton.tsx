"use client";

import React from "react";
import { DraftingCompass, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCadbidStatus, useLaunchStudio } from "@/hooks/useCadbid";

interface StudioButtonProps {
  className?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const StudioButton: React.FC<StudioButtonProps> = ({
  className = "",
  variant = "outline",
  size = "sm",
}) => {
  const { data: status, isLoading } = useCadbidStatus();
  const { launchStudio, isLaunching } = useLaunchStudio();

  if (isLoading || !status?.connected || !status?.studioAccess) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={launchStudio}
      disabled={isLaunching}
      className={`h-9 gap-1.5 border-[#2b7fff] bg-[#2b7fff] text-white hover:bg-[#2b7fff] hover:border-[#2b7fff] hover:text-white dark:border-[#2b7fff] dark:bg-[#2b7fff] dark:text-white dark:hover:bg-[#2b7fff] dark:hover:text-white font-medium transition-all ${className}`}
      title="Launch CADX Studio"
      aria-label="Launch CADX Studio"
    >
      {isLaunching ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : (
        <DraftingCompass className="h-4 w-4 text-current" />
      )}
      <span className="hidden sm:inline font-medium">Studio</span>
    </Button>
  );
};
