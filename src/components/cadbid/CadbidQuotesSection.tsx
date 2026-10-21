"use client";

import React from "react";
import {
  AlertTriangle,
  CalendarDays,
  DraftingCompass,
  FileText,
  Hash,
  Loader2,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { CadbidQuote } from "@/api/cadbid";
import { useCadbidLeadQuotes } from "@/hooks/useCadbid";

interface CadbidQuotesSectionProps {
  leadId: number;
  className?: string;
}

const formatAmount = (value: number | null) =>
  value == null
    ? "—"
    : `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

// Cadbid sends "YYYY-MM-DD HH:mm:ss" without a timezone
const formatCreatedAt = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CadbidQuoteCard: React.FC<{ quote: CadbidQuote }> = ({ quote }) => (
  <div className="rounded-xl border border-border bg-[#fff] p-4 dark:bg-[#09090b] space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-semibold">
          {quote.sDocumentNo || `Quotation #${quote.nQuotationId}`}
        </span>
      </div>
      {quote.sStage && (
        <Badge variant="outline" className="shrink-0 text-[11px]">
          {quote.sStage}
        </Badge>
      )}
    </div>

    <div>
      <p className="text-xs text-muted-foreground">Total Amount</p>
      <p className="text-lg font-semibold">{formatAmount(quote.nTotalAmt)}</p>
      {!!quote.nDiscountAmt && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Discount {formatAmount(quote.nDiscountAmt)}
        </p>
      )}
    </div>

    <div className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
      {quote.sRefNo && (
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Ref: {quote.sRefNo}</span>
        </div>
      )}
      {quote.sUserName && (
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{quote.sUserName}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>{formatCreatedAt(quote.dtCreated)}</span>
      </div>
    </div>
  </div>
);

// Renders nothing unless the user has Cadbid linked and the lead has a Cadbid customer
export const CadbidQuotesSection: React.FC<CadbidQuotesSectionProps> = ({
  leadId,
  className = "",
}) => {
  const { data, isLoading, error } = useCadbidLeadQuotes(leadId);

  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading quotations from Cadbid...
      </div>
    );
  }

  const errorMessage = error
    ? (error as any)?.response?.data?.message ||
      "We couldn't load the quotations from Cadbid. Please try again later."
    : null;

  if (!errorMessage && (!data?.connected || !data?.linked)) {
    return null;
  }

  const quotes = data?.quotes ?? [];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DraftingCompass className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Cadbid Quotations</h3>
        </div>
        {!errorMessage && (
          <span className="text-xs font-medium text-muted-foreground">
            {quotes.length} {quotes.length === 1 ? "Quotation" : "Quotations"}
          </span>
        )}
      </div>

      {errorMessage ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : quotes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No quotations have been created in Cadbid for this lead yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <CadbidQuoteCard key={quote.nQuotationId} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
};
