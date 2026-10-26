"use client";

import React from "react";

import { StudioButton } from "./StudioButton";
import { CadbidNavButton } from "./CadbidNavButton";
import { isCadbidEnabled } from "@/hooks/useCadbid";

interface CadbidHeaderGroupProps {
  className?: string;
}

export const CadbidHeaderGroup: React.FC<CadbidHeaderGroupProps> = ({
  className = "",
}) => {
  if (!isCadbidEnabled) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <StudioButton />
      <CadbidNavButton />
    </div>
  );
};
