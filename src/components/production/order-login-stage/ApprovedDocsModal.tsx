"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApprovedTechCheckDocuments } from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import {
  RefreshCcw,
  FileText,
  ExternalLink,
  FolderOpen,
  Loader2,
} from "lucide-react";

interface ApprovedDocsSectionProps {
  leadId: number;
}

export default function ApprovedDocsSection({
  leadId,
}: ApprovedDocsSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data, isLoading, isError, refetch, isFetching } =
    useApprovedTechCheckDocuments(vendorId, leadId);

  const hasDocs = Array.isArray(data) && data.length > 0;

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Approved Tech-Check Documents
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          {isFetching ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <RefreshCcw size={16} />
          )}
          Refresh
        </Button>
      </div>

      {/* Body */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading documents...
          </div>
        ) : isError ? (
          <div className="p-8 border border-dashed rounded-lg text-center bg-muted/30">
            <p className="text-sm text-red-500">
              Failed to fetch approved documents.
            </p>
          </div>
        ) : !hasDocs ? (
          <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No approved documents found.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[480px] pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.map((doc: any) => (
                <div
                  key={doc.id}
                  className="group border rounded-lg p-3 bg-card shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-2">
                    <FileText
                      size={20}
                      className="text-primary shrink-0 group-hover:scale-110 transition-transform"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {doc.doc_og_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded on{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <a
                    href={doc.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline inline-flex items-center gap-1 mt-2 font-medium"
                  >
                    <ExternalLink size={14} /> View / Download
                  </a>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
