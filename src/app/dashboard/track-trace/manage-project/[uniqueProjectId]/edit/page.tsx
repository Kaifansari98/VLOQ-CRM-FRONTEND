"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import TrackTraceProjectForm from "@/components/track-trace/TrackTraceProjectForm";

function EditProjectContent() {
  const params = useParams<{ uniqueProjectId: string }>();
  const searchParams = useSearchParams();
  const fabrication =
    searchParams.get("fabrication")?.toUpperCase() === "METALWORK"
      ? "METALWORK"
      : undefined;

  return (
    <main className="p-4 md:p-6">
      <TrackTraceProjectForm
        mode="edit"
        uniqueProjectId={params.uniqueProjectId}
        initialFabrication={fabrication}
      />
    </main>
  );
}

export default function EditTrackTraceProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Loading project...
        </div>
      }
    >
      <EditProjectContent />
    </Suspense>
  );
}