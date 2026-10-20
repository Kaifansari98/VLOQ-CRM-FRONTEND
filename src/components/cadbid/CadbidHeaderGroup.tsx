"use client";

import React from "react";

import { StudioButton } from "./StudioButton";
import { CadbidNavButton } from "./CadbidNavButton";

interface CadbidHeaderGroupProps {
  className?: string;
}

export const CadbidHeaderGroup: React.FC<CadbidHeaderGroupProps> = ({
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <StudioButton />
      <CadbidNavButton />
    </div>
  );
};
