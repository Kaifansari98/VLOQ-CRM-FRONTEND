"use client";

import React, { useState } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCadbidStatus } from "@/hooks/useCadbid";
import { CadbidConnectionModal } from "./CadbidConnectionModal";

interface CadbidNavButtonProps {
  className?: string;
  showText?: boolean;
}

export const CadbidNavButton: React.FC<CadbidNavButtonProps> = ({
  className = "",
  showText = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: status } = useCadbidStatus();

  return (
    <>
      <Button
        variant="ghost"
        size={showText ? "sm" : "icon"}
        onClick={() => setModalOpen(true)}
        className={`relative h-9 gap-1.5 rounded-sm bg-accent text-foreground hover:bg-accent/80 ${className}`}
        title={
          status?.connected
            ? `Cadbid Connected (${status.cadbidUser?.companyName || "Active"})`
            : "Connect Cadbid"
        }
        aria-label="Cadbid Connection"
      >
        <KeyRound className="h-4 w-4" />
        {showText && <span className="text-xs">Cadbid</span>}
        {status?.connected && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </Button>

      <CadbidConnectionModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
