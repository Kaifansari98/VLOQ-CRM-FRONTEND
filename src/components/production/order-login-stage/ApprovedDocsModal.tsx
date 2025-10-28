"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApprovedTechCheckDocuments } from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";

interface ApprovedDocsModalProps {
  leadId: number;
}

const ApprovedDocsModal: React.FC<ApprovedDocsModalProps> = ({ leadId }) => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const [open, setOpen] = useState(false);

  // ✅ Run query only after modal is opened (better UX)
  const { data, isLoading, isError, refetch } = useApprovedTechCheckDocuments(
    vendorId,
    leadId
  );

  // When modal opens, refetch data
  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (val && vendorId && leadId) {
      refetch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Approved Docs
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Approved Tech Check Documents</DialogTitle>
        </DialogHeader>

        {/* --- Status Handling --- */}
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        )}
        {isError && (
          <p className="text-sm text-red-500">
            Failed to fetch approved documents.
          </p>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">
            No approved documents found.
          </p>
        )}

        {/* --- Documents List --- */}
        {data && data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {data.map((doc: any) => (
              <div
                key={doc.id}
                className="border rounded-lg p-3 shadow-sm hover:shadow-md transition"
              >
                <p className="font-medium text-sm truncate">
                  {doc.doc_og_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                </p>
                <a
                  href={doc.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-primary text-xs underline"
                >
                  View / Download
                </a>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApprovedDocsModal;
