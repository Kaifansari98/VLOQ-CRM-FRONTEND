"use client";

import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  IndianRupee,
  MapPin,
  PhoneCall,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { useClientVisits } from "@/hooks/useLeadsQueries";
import { Button } from "@/components/ui/button";

interface SiteVisitsTabProps {
  leadId: number;
}

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

const getExtension = (fileName?: string | null) =>
  fileName?.split(".").pop()?.toLowerCase() ?? "";

const formatVisitType = (visitType: "physical_visit" | "follow_up_call") =>
  visitType === "physical_visit" ? "Physical Visit" : "Follow Up Call";

const CompactDocList = ({
  title,
  icon,
  docs,
}: {
  title: string;
  icon: React.ReactNode;
  docs: Array<{
    id: number;
    original_name: string;
    signedUrl: string;
    created_at: string;
  }>;
}) => {
  if (docs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs font-semibold">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {docs.map((doc) => {
          const ext = getExtension(doc.original_name);
          const isImage = IMAGE_EXTENSIONS.has(ext);

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {doc.original_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ext ? ext.toUpperCase() : "FILE"} · Uploaded on{" "}
                  {formatDate(doc.created_at, {
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() =>
                    window.open(doc.signedUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">
                    {isImage ? "View image" : "Preview document"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = doc.signedUrl;
                    link.download = doc.original_name;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download document</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SiteVisitsTab({ leadId }: SiteVisitsTabProps) {
  const { data: visits = [], isLoading, isError } = useClientVisits(leadId);

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading site visits...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load site visits.
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        No site visits added yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <div
          key={visit.id}
          className="rounded-xl border border-border bg-card p-3"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {visit.meeting_type?.type || "Meeting"}
              </h3>
              <span className="text-xs text-muted-foreground line-clamp-1">
                Added on{" "}
                {formatDate(visit.created_at, {
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="text-xs text-muted-foreground flex items-end flex-col-reverse">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{visit.created_by?.user_name || "Unknown User"}</span>
              </div>
              <p className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    visit.visit_type === "physical_visit"
                      ? "bg-green-500"
                      : "bg-orange-500"
                  }`}
                />
                {formatVisitType(visit.visit_type)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <CalendarDays className="h-4 w-4" />
                <p className="text-xs text-muted-foreground">
                  {formatDate(visit.date, { month: "short" })}
                </p>
              </div>
            </div>

            {visit.visit_type === "physical_visit" && (
              <div className="rounded-lg bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <IndianRupee className="h-4 w-4" />
                  <p className="text-xs text-muted-foreground">
                    {visit.expense_incurred != null
                      ? visit.expense_incurred
                      : "—"}
                  </p>
                </div>
              </div>
            )}

            {visit.location && (
              <div
                className={`rounded-lg bg-muted/30 px-3 py-2 ${
                  visit.visit_type === "physical_visit"
                    ? "xl:col-span-2"
                    : "md:col-span-2 xl:col-span-3"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-medium">
                  <MapPin className="h-4 w-4" />
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {visit.location}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 rounded-lg bg-muted/30 px-3 py-2">
            <div className="flex items-start gap-2 text-xs font-medium">
              Remark
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
              {visit.remark}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2 p-2 border rounded-lg bg-muted/30">
            <CompactDocList
              title="Supporting Documents"
              icon={<FileText className="h-4 w-4" />}
              docs={visit.supporting_documents}
            />
            <CompactDocList
              title="Payment Proof Documents"
              icon={<IndianRupee className="h-4 w-4" />}
              docs={visit.payment_proof_documents}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
