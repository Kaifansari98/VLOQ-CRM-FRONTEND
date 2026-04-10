"use client";

import ServiceSchedulesBoard from "./ServiceSchedulesBoard";

export default function AmcServicingDetails({ leadId }: { leadId: number }) {
  return (
    <ServiceSchedulesBoard
      leadId={leadId}
      serviceType="amc"
      title="AMC Servicing"
      description="View and manage scheduled AMC service visits for this project."
    />
  );
}
