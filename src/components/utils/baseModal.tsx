"use client";

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "xxl" | "smd";
  icon?: ReactNode; // icon is optional
  modal?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm w-[95vw] md:max-w-md",
  md: "max-w-md w-[95vw] md:max-w-lg",
  smd: "max-w-md w-[95vw] md:max-w-xl",
  lg: "max-w-lg w-[95vw] md:max-w-2xl lg:max-w-3xl",
  xl: "max-w-lg w-[95vw] md:max-w-2xl lg:max-w-4xl",
  xxl: "max-w-[95vw] w-[95vw] md:max-w-[90vw] lg:max-w-[90vw] xl:max-w-[90vw]",
};

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "lg",
  icon,
  modal = true,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={modal}>
      <DialogContent
        className={`${sizeClasses[size]} max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col`}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        {(title || description) && (
          <DialogHeader className="flex flex-row items-center gap-4 px-6 py-4 border-b bg-muted/30 shrink-0">
            {icon}

            <div className="space-y-1 min-w-0 flex-1 pr-12">
              {title && (
                <DialogTitle className="text-base text-left font-semibold leading-normal break-words">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-left text-xs md:text-sm text-muted-foreground leading-snug break-words whitespace-normal">
                  {description}
                </DialogDescription>
              )}
            </div>
          </DialogHeader>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-0 m-0">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-background shrink-0">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BaseModal;
