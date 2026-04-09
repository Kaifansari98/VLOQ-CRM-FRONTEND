"use client";

import ServiceSchedulesBoard from "./ServiceSchedulesBoard";

export default function ServicingDetails({ leadId }: { leadId: number }) {
  return (
    <ServiceSchedulesBoard
      leadId={leadId}
      serviceType="free"
      title="Free Servicing"
      description="View and manage scheduled free service visits for this project."
    />
  );
}
