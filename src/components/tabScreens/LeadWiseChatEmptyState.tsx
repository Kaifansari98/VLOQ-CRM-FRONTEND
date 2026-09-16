"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, ArrowRight, Zap } from "lucide-react";

interface LeadWiseChatEmptyStateProps {
  leadId: number;
  onGetStarted: () => void;
  isCreating: boolean;
  isDisabled: boolean;
}

export default function LeadWiseChatEmptyState({
  leadId,
  onGetStarted,
  isCreating,
  isDisabled,
}: LeadWiseChatEmptyStateProps) {
  return (
    <div className="flex w-full items-center justify-center py-6">
      <div className="relative w-full h-full">
        {/* Background Gradient Blurs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        {/* Main Card */}
        <div className="relative overflow-hidden rounded-xl bg-card">
          {/* Subtle top accent line */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="px-8 py-12 text-center">
            {/* Icon Container with pulse animation */}
            <div className="relative mx-auto mb-6 inline-flex">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/20 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <MessageCircle className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
            </div>

            {/* Heading */}
            <h3 className="mb-3 text-xl font-semibold tracking-tight text-foreground">
              Start Lead Conversation
            </h3>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-muted-foreground">
              Create a dedicated space for seamless communication, real-time updates, 
              and streamlined approvals throughout the lead journey.
            </p>

            {/* Feature Pills */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Zap className="h-3 w-3" />
                Instant Updates
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Quick Decisions
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                Team Collaboration
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="default"
                className="group relative gap-2 overflow-hidden"
                disabled={isDisabled || isCreating}
                onClick={onGetStarted}
              >
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                <span>{isCreating ? "Creating Conversation..." : "Get Started"}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Helper text */}
              <p className="text-xs text-muted-foreground">
                Takes less than a minute to set up
              </p>
            </div>
          </div>

          {/* Bottom decorative element */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Floating decorative elements */}
        <div className="pointer-events-none absolute -right-4 top-8 h-2 w-2 rounded-full bg-primary/40 blur-sm" />
        <div className="pointer-events-none absolute -left-2 bottom-12 h-1.5 w-1.5 rounded-full bg-primary/30 blur-sm" />
      </div>
    </div>
  );
}