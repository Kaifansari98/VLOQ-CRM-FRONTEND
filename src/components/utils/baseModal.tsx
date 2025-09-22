"use client";

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "smd";
}

const sizeClasses = {
  sm: "max-w-sm w-[95vw] md:max-w-md",
  md: "max-w-md w-[95vw] md:max-w-lg",
  smd: "max-w-md w-[95vw] md:max-w-xl",
  lg: "max-w-lg w-[95vw] md:max-w-2xl lg:max-w-3xl",
  xl: "max-w-xl w-[95vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl",
};

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "lg",
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClasses[size]} max-h-[90vh] p-0 gap-0`}>
        {(title || description) && (
          <DialogHeader className="flex items-start justify-between px-6 py-4 border-b">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        <ScrollArea className="max-h-[calc(90vh-80px)]">{children}</ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BaseModal;
