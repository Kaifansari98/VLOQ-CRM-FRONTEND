"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, TriangleAlert } from "lucide-react";

interface FastProductionTermsModalProps {
  open: boolean;
  onAgree: () => void;
  onOpenChange: (open: boolean) => void;
}

const TERMS = [
  "Pre-Approval has to be taken from Mr. Tejas Agarwal and Mr. Nakul Jindal, via Mail, to consider order as Fast Production.",
  "100% payment to be cleared at HO, at the time of order login.",
  "Timeline starts only from the date full payment is received at Head Office.",
  "Timelines may vary depending on real-time production loads and raw-material availability, which will be pre notified. Please ensure availability is pre-confirmed before committing to the client.",
  "No changes can be done post Order Booking, in case of Fast Production Client.",
  "Dispatch cannot be held at the Head Office for more than 5 days once the committed delivery date has passed, post which Rs. 500 will be charged per day.",
  "QC rejections may occur, which can only be identified at the final stage of production. In such cases, replacement production may lead to unexpected delays which will be communicated at last moment.",
  "Dealers are advised to keep a buffer while committing timelines to clients to prevent last-minute pressure or disappointment.",
  "Any non-standard (pre-approved) Design or specification will extend the timeline, and fast production cannot be guaranteed in such cases.",
  "Any delays caused by external factors (transport issues, strikes, natural calamities, supplier delays, global situation etc.) are beyond our control and may impact timelines.",
  "These are Manufacturing Timelines; Fast production does not include Dispatch or Installation timelines. Dispatch & Installation scheduling depends on site readiness and team availability.",
  "In case of mixed-finish orders, the timeline of the longest-lead finish will apply.",
];

const FastProductionTermsModal: React.FC<FastProductionTermsModalProps> = ({
  open,
  onAgree,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-[96vw] p-0 sm:max-w-4xl overflow-hidden gap-0">
        <DialogHeader className="border-b bg-background px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 items-center justify-center rounded-lg border bg-muted/40 text-foreground">
              <ShieldCheck className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-normal">
                Terms & Conditions
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Read and accept the terms before raising a fast production
                request.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[62vh]">
          <div className="px-6 py-5">
            <div className="mb-4 flex items-start gap-3 rounded-xl border bg-muted/20 px-3.5 py-3">
              <TriangleAlert className="mt-0.5 size-4 text-foreground/70" />
              <p className="text-xs leading-5 text-muted-foreground">
                Fast Production should be committed only after internal approval,
                payment confirmation, and availability validation.
              </p>
            </div>

            <ol className="space-y-3.5 text-sm leading-7 text-foreground/95">
              {TERMS.map((term, index) => (
                <li key={index} className="flex gap-3">
                  <span className="min-w-6 pt-0.5 text-right font-medium text-foreground/70">
                    {index + 1}.
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ol>
          </div>
        </ScrollArea>

        <div className="border-t bg-background px-6 py-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              By clicking <span className="font-medium text-foreground">I Agree</span>,
              you confirm that you have read and accepted these terms.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg px-5"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-10 rounded-lg px-5"
                onClick={onAgree}
              >
                I Agree
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FastProductionTermsModal;
