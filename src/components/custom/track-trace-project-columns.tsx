import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Link } from "lucide-react";
import { useLeadSearch, useLinkLeadToProject } from "@/hooks/track-trace/useProjectCutList";
import { toastManager } from "@/components/ui/toast";

// ─── Lead Search Popup ────────────────────────────────────────────────────────

interface LeadSearchPopupProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  vendorId: number;
  currentLeadCode?: string;
  onLeadLinked?: () => void;
}

function LeadSearchPopup({
  open,
  onClose,
  projectId,
  vendorId,
  currentLeadCode,
  onLeadLinked,
}: LeadSearchPopupProps) {
  const { query, setQuery, leads, isSearching, error, reset } = useLeadSearch(vendorId);

  const { mutate: linkLead, isPending: isLinking, variables } = useLinkLeadToProject({
    vendorId,
    onSuccess: () => {
      toastManager.add({ title: "Lead linked successfully", type: "success" });
      handleClose();
    },
    onError: () => {
      toastManager.add({ title: "Failed to link lead. Please try again.", type: "error" });
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectLead = (leadId: number) => {
    linkLead({ project_id: projectId, lead_id: leadId, vendor_id: vendorId });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Link Lead to Project
          </DialogTitle>
          {currentLeadCode && (
            <p className="text-sm text-muted-foreground">
              Current lead:{" "}
              <span className="font-medium text-foreground">{currentLeadCode}</span>
            </p>
          )}
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by lead code or name…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results */}
        <div className="mt-1 max-h-64 overflow-y-auto rounded-md border bg-background">
          {error && (
            <p className="p-4 text-sm text-destructive text-center">{error}</p>
          )}

          {!error && !isSearching && query && leads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No leads found for &ldquo;{query}&rdquo;
            </p>
          )}

          {!query && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              Start typing to search leads…
            </p>
          )}

          {leads && leads.length > 0 &&
            leads.map((lead) => {
              const isThisLinking = isLinking && variables?.lead_id === lead.id;
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{lead.lead_code}</span>
                    {(lead.firstname || lead.lastname) && (
                      <span className="text-xs text-muted-foreground">
                        {[lead.firstname, lead.lastname].filter(Boolean).join(" ")}
                      </span>
                    )}
                    {lead.lead_name && (
                      <span className="text-xs text-muted-foreground">{lead.lead_name}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isLinking}
                    onClick={() => handleSelectLead(lead.id)}
                  >
                    {isThisLinking ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Select"
                    )}
                  </Button>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Cell ────────────────────────────────────────────────────────────────

interface LeadCellProps {
  projectId: number;
  vendorId: number;
  leadCode?: string;
  onLeadLinked?: () => void;
}

function LeadCell({ projectId, vendorId, leadCode, onLeadLinked }: LeadCellProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        className="cursor-pointer text-primary underline-offset-2 hover:underline"
        onClick={() => setOpen(true)}
        title="Click to link a lead"
      >
        {leadCode ?? (
          <span className="text-muted-foreground text-xs italic">+ Add Lead</span>
        )}
      </span>

      <LeadSearchPopup
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        vendorId={vendorId}
        currentLeadCode={leadCode}
        onLeadLinked={onLeadLinked}
      />
    </>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export const getTrackTraceProjectColumns = (
  vendorId: number,
  onLeadLinked?: () => void
): ColumnDef<TrackTraceProject>[] => [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "project_name",
      header: "Project Name",
    },
    {
      accessorKey: "unique_project_id",
      header: "Project Code",
    },
    {
      id: "lead",
      header: "Lead#",
      cell: ({ row }) => (
        <LeadCell
          projectId={row.original.id}
          vendorId={vendorId}
          leadCode={row.original.lead?.lead_code}
          onLeadLinked={onLeadLinked}
        />
      ),
    },
    {
      accessorKey: "track_trace_status",
      header: "Status",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md text-xs bg-muted">
          {row.original.track_trace_status}
        </span>
      ),
    },
  ];