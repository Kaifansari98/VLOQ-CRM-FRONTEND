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
  icon?: ReactNode;                   // icon is optional
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
  icon,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${sizeClasses[size]} max-h-[90vh] p-0 gap-0 overflow-hidden`}
      >
        {(title || description) && (
          <DialogHeader className="flex flex-row items-center gap-4 px-6 py-4 border-b bg-muted/30">
            {icon}

            <div className="space-y-1 overflow-hidden">
              {title && (
                <DialogTitle className="text-base font-semibold leading-tight truncate">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-sm text-muted-foreground leading-snug truncate">
                  {description}
                </DialogDescription>
              )}
            </div>
          </DialogHeader>
        )}

        <ScrollArea className="max-h-[calc(90vh-80px)] p-0 m-0">
          {children}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BaseModal;
