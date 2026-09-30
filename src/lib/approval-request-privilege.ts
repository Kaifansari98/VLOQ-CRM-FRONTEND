export interface LeadStageContext {
  status_id?: number | null;
  statusType?: {
    tag?: string | null;
    type?: string | null;
  } | null;
  status?: string | null;
  stage?: string | null;
}

/**
 * Returns the exact privilege code string required for "Approval Request" task assignment
 * based on the lead's status/stage context.
 */
export function getApprovalRequestPrivilegeCode(
  lead?: LeadStageContext | null,
  stageProp?: string | null,
): string {
  const statusId = lead?.status_id;
  const tag = (lead?.statusType?.tag || "").toLowerCase();
  const typeName = (lead?.statusType?.type || "").toLowerCase();
  const rawStatus = (typeof lead?.status === "string" ? lead?.status : "").toLowerCase();
  const stage = (stageProp || "").toLowerCase();

  const hasKeyword = (...keywords: string[]) => {
    return keywords.some(
      (kw) =>
        tag.includes(kw) ||
        typeName.includes(kw) ||
        rawStatus.includes(kw) ||
        stage.includes(kw),
    );
  };

  // 1. Open Leads
  if (
    statusId === 1 ||
    tag.includes("type 1") ||
    hasKeyword("open_leads", "open leads", "open-leads", "open")
  ) {
    return "leads.open_leads.assign_task.approval_request";
  }

  // 2. Initial Site Measurement
  if (
    statusId === 2 ||
    tag.includes("type 2") ||
    hasKeyword("initial_site_measurement", "initial site measurement", "ism")
  ) {
    return "leads.initial_site_measurement.assign_task.approval_request";
  }

  // 3. Designing Stage
  if (
    statusId === 3 ||
    tag.includes("type 3") ||
    hasKeyword("designing_stage", "designing stage", "designing")
  ) {
    return "leads.designing_stage.assign_task.approval_request";
  }

  // 4. Booking Stage
  if (
    statusId === 4 ||
    tag.includes("type 4") ||
    hasKeyword("booking_stage", "booking stage", "booking done", "booking")
  ) {
    return "leads.booking_stage.assign_task.approval_request";
  }

  // 5. Final Measurement
  if (
    statusId === 5 ||
    tag.includes("type 5") ||
    hasKeyword("final_measurement", "final measurement")
  ) {
    return "project.final_measurement.assign_task.approval_request";
  }

  // 6. Client Documentation
  if (
    statusId === 6 ||
    tag.includes("type 6") ||
    hasKeyword("client_documentation", "client documentation")
  ) {
    return "project.client_documentation.assign_task.approval_request";
  }

  // 7. Client Approval
  if (
    statusId === 7 ||
    tag.includes("type 7") ||
    hasKeyword("client_approval", "client approval")
  ) {
    return "project.client_approval.assign_task.approval_request";
  }

  // 8. Tech Check
  if (
    statusId === 8 ||
    tag.includes("type 8") ||
    hasKeyword("tech_check", "tech check")
  ) {
    return "production.tech_check.assign_task.approval_request";
  }

  // 9. Order Login
  if (
    statusId === 9 ||
    tag.includes("type 9") ||
    hasKeyword("order_login", "order login")
  ) {
    return "production.order_login.assign_task.approval_request";
  }

  // 10. Production / Pre-Post Prod
  if (
    statusId === 10 ||
    tag.includes("type 10") ||
    hasKeyword("pre-post-prod", "production")
  ) {
    return "production.production.assign_task.approval_request";
  }

  // 11. Ready to Dispatch
  if (
    statusId === 11 ||
    tag.includes("type 11") ||
    hasKeyword("ready_to_dispatch", "ready to dispatch")
  ) {
    return "production.ready_to_dispatch.assign_task.approval_request";
  }

  // 12. Site Readiness
  if (
    statusId === 12 ||
    tag.includes("type 12") ||
    hasKeyword("site_readiness", "site readiness")
  ) {
    return "installation.site_readiness.assign_task.approval_request";
  }

  // 13. Dispatch Planning
  if (
    statusId === 13 ||
    tag.includes("type 13") ||
    hasKeyword("dispatch_planning", "dispatch planning")
  ) {
    return "installation.dispatch_planning.assign_task.approval_request";
  }

  // 14. Dispatch Stage
  if (
    statusId === 14 ||
    tag.includes("type 14") ||
    hasKeyword("dispatch stage", "dispatch")
  ) {
    return "installation.dispatch.assign_task.approval_request";
  }

  // 15. Under Installation
  if (
    statusId === 15 ||
    tag.includes("type 15") ||
    hasKeyword("under_installation", "under installation")
  ) {
    return "installation.under_installation.assign_task.approval_request";
  }

  // 16. Final Handover
  if (
    statusId === 16 ||
    tag.includes("type 16") ||
    hasKeyword("final_handover", "final handover")
  ) {
    return "installation.final_handover.assign_task.approval_request";
  }

  return "leads.open_leads.assign_task.approval_request";
}

/**
 * Checks whether Approval Request option should be displayed for the user based on custom privileges and stage.
 */
export function canUserShowApprovalRequest({
  isCustomUser,
  customPrivilegeCodes,
  isApprovalTaskEnabled,
  lead,
  stageProp,
}: {
  isCustomUser: boolean;
  customPrivilegeCodes: string[];
  isApprovalTaskEnabled?: boolean | null;
  lead?: LeadStageContext | null;
  stageProp?: string | null;
}): boolean {
  if (isCustomUser) {
    const code = getApprovalRequestPrivilegeCode(lead, stageProp);
    return customPrivilegeCodes.includes(code);
  }
  return isApprovalTaskEnabled !== false;
}

/**
 * Returns the exact privilege code string required for "Follow Up" task assignment
 * based on the lead's status/stage context.
 */
export function getFollowUpPrivilegeCode(
  lead?: LeadStageContext | null,
  stageProp?: string | null,
): string {
  const statusId = lead?.status_id;
  const tag = (lead?.statusType?.tag || "").toLowerCase();
  const typeName = (lead?.statusType?.type || "").toLowerCase();
  const rawStatus = (typeof lead?.status === "string" ? lead?.status : "").toLowerCase();
  const stage = (stageProp || "").toLowerCase();

  const hasKeyword = (...keywords: string[]) => {
    return keywords.some(
      (kw) =>
        tag.includes(kw) ||
        typeName.includes(kw) ||
        rawStatus.includes(kw) ||
        stage.includes(kw),
    );
  };

  // 1. Open Leads
  if (
    statusId === 1 ||
    tag.includes("type 1") ||
    hasKeyword("open_leads", "open leads", "open-leads", "open")
  ) {
    return "leads.open_leads.follow_up";
  }

  // 2. Initial Site Measurement
  if (
    statusId === 2 ||
    tag.includes("type 2") ||
    hasKeyword("initial_site_measurement", "initial site measurement", "ism")
  ) {
    return "leads.initial_site_measurement.follow_up";
  }

  // 3. Designing Stage
  if (
    statusId === 3 ||
    tag.includes("type 3") ||
    hasKeyword("designing_stage", "designing stage", "designing")
  ) {
    return "leads.designing_stage.follow_up";
  }

  // 4. Booking Stage
  if (
    statusId === 4 ||
    tag.includes("type 4") ||
    hasKeyword("booking_stage", "booking stage", "booking done", "booking")
  ) {
    return "leads.booking_stage.follow_up";
  }

  // 5. Final Measurement
  if (
    statusId === 5 ||
    tag.includes("type 5") ||
    hasKeyword("final_measurement", "final measurement")
  ) {
    return "project.final_measurement.follow_up";
  }

  // 6. Client Documentation
  if (
    statusId === 6 ||
    tag.includes("type 6") ||
    hasKeyword("client_documentation", "client documentation")
  ) {
    return "project.client_documentation.follow_up";
  }

  // 7. Client Approval
  if (
    statusId === 7 ||
    tag.includes("type 7") ||
    hasKeyword("client_approval", "client approval")
  ) {
    return "project.client_approval.follow_up";
  }

  // 8. Tech Check
  if (
    statusId === 8 ||
    tag.includes("type 8") ||
    hasKeyword("tech_check", "tech check")
  ) {
    return "production.tech_check.follow_up";
  }

  // 9. Order Login
  if (
    statusId === 9 ||
    tag.includes("type 9") ||
    hasKeyword("order_login", "order login")
  ) {
    return "production.order_login.follow_up";
  }

  // 10. Production / Pre-Post Prod
  if (
    statusId === 10 ||
    tag.includes("type 10") ||
    hasKeyword("pre-post-prod", "production")
  ) {
    return "production.production.follow_up";
  }

  // 11. Ready to Dispatch
  if (
    statusId === 11 ||
    tag.includes("type 11") ||
    hasKeyword("ready_to_dispatch", "ready to dispatch")
  ) {
    return "production.ready_to_dispatch.follow_up";
  }

  // 12. Site Readiness
  if (
    statusId === 12 ||
    tag.includes("type 12") ||
    hasKeyword("site_readiness", "site readiness")
  ) {
    return "installation.site_readiness.follow_up";
  }

  // 13. Dispatch Planning
  if (
    statusId === 13 ||
    tag.includes("type 13") ||
    hasKeyword("dispatch_planning", "dispatch planning")
  ) {
    return "installation.dispatch_planning.follow_up";
  }

  // 14. Dispatch Stage
  if (
    statusId === 14 ||
    tag.includes("type 14") ||
    hasKeyword("dispatch stage", "dispatch")
  ) {
    return "installation.dispatch.follow_up";
  }

  // 15. Under Installation
  if (
    statusId === 15 ||
    tag.includes("type 15") ||
    hasKeyword("under_installation", "under installation")
  ) {
    return "installation.under_installation.follow_up";
  }

  // 16. Final Handover
  if (
    statusId === 16 ||
    tag.includes("type 16") ||
    hasKeyword("final_handover", "final handover")
  ) {
    return "installation.final_handover.follow_up";
  }

  return "leads.open_leads.follow_up";
}

/**
 * Checks whether Follow Up option should be displayed for the user based on custom privileges and stage.
 */
export function canUserShowFollowUp({
  isCustomUser,
  customPrivilegeCodes,
  lead,
  stageProp,
}: {
  isCustomUser: boolean;
  customPrivilegeCodes: string[];
  lead?: LeadStageContext | null;
  stageProp?: string | null;
}): boolean {
  if (isCustomUser) {
    const code = getFollowUpPrivilegeCode(lead, stageProp);
    return customPrivilegeCodes.includes(code);
  }
  return true;
}
