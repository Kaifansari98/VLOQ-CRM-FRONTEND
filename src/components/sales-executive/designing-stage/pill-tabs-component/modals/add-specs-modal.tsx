"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import { cn } from "@/lib/utils";
import { Box, PanelsTopLeft, Sparkles, Wrench } from "lucide-react";

export type SpecFormId = "carcass" | "shutter" | "others" | "hardware";

interface AddSpecsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectForm: (form: SpecFormId) => void;
}

const SPEC_FORM_CARDS: {
  id: SpecFormId;
  label: string;
  description: string;
  icon: typeof Box;
  comingSoon?: boolean;
}[] = [
  {
    id: "carcass",
    label: "Carcass Form",
    description: "Carcass type, material & finish",
    icon: Box,
  },
  {
    id: "shutter",
    label: "Shutter Form",
    description: "Shutter type, material & finish",
    icon: PanelsTopLeft,
  },
  {
    id: "others",
    label: "Others Form",
    description: "Lights, stone, appliances & more",
    icon: Sparkles,
    comingSoon: true,
  },
  {
    id: "hardware",
    label: "Hardware Form",
    description: "Legs, skirting & colors",
    icon: Wrench,
    comingSoon: true,
  },
];

const AddSpecsModal: React.FC<AddSpecsModalProps> = ({
  open,
  onOpenChange,
  onSelectForm,
}) => {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Specifications"
      description="Choose which specification form you want to fill out."
      size="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
        {SPEC_FORM_CARDS.map(({ id, label, description, icon: Icon, comingSoon }) => (
          <button
            key={id}
            type="button"
            disabled={comingSoon}
            onClick={() => !comingSoon && onSelectForm(id)}
            className={cn(
              "group relative flex flex-col items-start gap-3 rounded-xl border border-border p-5 text-left transition-colors",
              comingSoon
                ? "cursor-not-allowed opacity-60"
                : "hover:border-primary/50 hover:bg-accent/40",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{label}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
            {comingSoon && (
              <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </span>
            )}
          </button>
        ))}
      </div>
    </BaseModal>
  );
};

export default AddSpecsModal;
