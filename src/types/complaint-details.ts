import type {
  ComplaintClientType,
  ComplaintComponent,
  ComplaintPriority,
  ComplaintRegistrationChannel,
  ComplaintStatus,
} from "./client-complaints";

export type ComplaintPerson = { id: number; user_name: string };
type CycleRecord = { id: number; cycle_id: number };
type Amount = string | number;
export interface ComplaintAttachment extends CycleRecord {
  original_name: string;
  mime_type: string;
  size_bytes: number;
  media_type: "PHOTO" | "VIDEO" | "DOCUMENT";
  category: string;
  url: string | null;
  created_at: string;
  uploadedBy: ComplaintPerson | null;
  visit_id: number | null;
  inspection_report_id: number | null;
  execution_id: number | null;
  decision_id: number | null;
}
export interface ComplaintCycle {
  id: number;
  cycle_number: number;
  reopened_reason: string | null;
  opened_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  ended_at: string | null;
  end_reason: string | null;
  openedBy: ComplaintPerson | null;
}
export interface ComplaintDecision extends CycleRecord {
  decision_type: string;
  outcome: string;
  remarks: string | null;
  remote_instructions: string | null;
  client_response: string | null;
  actor_type: string;
  acting_on_behalf_of_client: boolean;
  decided_at: string;
  quotation_id: number | null;
  visit_id: number | null;
  performedBy: ComplaintPerson | null;
}
export interface ComplaintVisit extends CycleRecord {
  visit_number: number;
  purpose: string;
  status: string;
  charge_mode: string;
  standard_fee?: Amount;
  currency?: string;
  team_details: string | null;
  repeat_of_visit_id: number | null;
  repeat_remarks: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
  reschedule_count: number;
  remarks: string | null;
  assignedSS: ComplaintPerson | null;
}
export interface ComplaintInspection extends CycleRecord {
  visit_id: number;
  actual_visit_date: string;
  client_available: boolean;
  issue_observed: string;
  root_cause: string;
  affected_product: string;
  affected_unit_number: string;
  responsibility: string;
  responsibility_remarks: string | null;
  repair_actions: string[];
  material_required: boolean;
  remarks: string | null;
  estimated_work_days: number | null;
  expected_completion_date: string | null;
  additional_visit_required: boolean;
  further_approval_required: boolean;
  submitted_at: string;
  submittedBy: ComplaintPerson;
  materials: {
    id: number;
    material_name: string;
    quantity: Amount;
    unit: string | null;
    specification: string | null;
    finish_colour: string | null;
    estimated_cost?: Amount | null;
    remarks: string | null;
  }[];
}
export interface ComplaintQuotation extends CycleRecord {
  quotation_number: number;
  revision: number;
  status: string;
  currency: string;
  subtotal: Amount;
  tax_amount: Amount;
  warranty_covered_amount: Amount;
  client_payable_amount: Amount;
  total_amount: Amount;
  shared_at: string | null;
  created_at: string;
  createdBy: ComplaintPerson;
  items: {
    id: number;
    category: string;
    description: string;
    quantity: Amount;
    unit: string | null;
    unit_rate: Amount;
    line_total: Amount;
    warranty_covered_amount: Amount;
    client_payable_amount: Amount;
    chargeable_reason: string | null;
  }[];
}
export interface ComplaintCharge extends CycleRecord {
  charge_type: string;
  visit_id: number | null;
  quotation_id: number | null;
  amount: Amount;
  currency: string;
  status: string;
  due_at: string | null;
}
export interface ComplaintPayment extends CycleRecord {
  amount: Amount;
  currency: string;
  method: string;
  transaction_reference: string;
  payment_date: string;
  status: string;
  proof_attachment_id: number;
  verified_at: string | null;
  verifiedBy: ComplaintPerson | null;
  rejection_remarks: string | null;
  refunded_at: string | null;
  refund_remarks: string | null;
  allocations: { id: number; charge_id: number; amount: Amount }[];
}
export interface ComplaintExecution extends CycleRecord {
  status: string;
  material_required: boolean;
  purchase_order_reference: string | null;
  material_expected_date: string | null;
  material_received_date: string | null;
  team_details: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  material_used: string | null;
  replacement_details: string | null;
  client_remarks: string | null;
  completion_remarks: string | null;
  pending_work: string | null;
  assignedSS: ComplaintPerson | null;
  completedBy: ComplaintPerson | null;
}
export interface ComplaintMaterial {
  id: number;
  complaint_execution_id: number | null;
  problem_description: string;
  reorder_material_details: string;
  quantity: number | null;
  cost?: number | null;
  misc_approved: boolean | null;
  expected_ready_date: string | null;
  required_delivery_date: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  supervisor_remark: string | null;
  solution: string | null;
  type: { name: string };
}
export interface ComplaintCommunication {
  id: number;
  cycle_id: number | null;
  event: string;
  channel: string;
  recipient_type: string;
  recipient_address: string | null;
  delivery_status: string;
  failure_reason?: string | null;
  sent_at: string | null;
  created_at: string;
  recipientUser: ComplaintPerson | null;
}
export interface ComplaintClosure extends CycleRecord {
  status: string;
  client_confirmation_status: string;
  no_response_reason: string | null;
  completion_verified_at: string | null;
  financial_verified_at: string | null;
  closed_at: string | null;
  closure_remarks: string | null;
  closedBy: ComplaintPerson | null;
}
export type ComplaintVerificationAction =
  | "START_REVIEW"
  | "INFORMATION_RECEIVED"
  | "RESUME"
  | "DECIDE"
  | "SET_PRIORITY"
  | "REASSIGN";

export type ComplaintVerificationOutcome =
  | "APPROVED_FOR_VISIT"
  | "MORE_INFORMATION_REQUIRED"
  | "REMOTE_RESOLUTION"
  | "REJECTED"
  | "ON_HOLD";

export type ComplaintVisitAction =
  | "ACCEPT_CHARGE"
  | "DECLINE_CHARGE"
  | "WAIVE_CHARGE"
  | "RECORD_PAYMENT"
  | "APPROVE_FREE"
  | "DECLINE_FREE"
  | "SCHEDULE"
  | "CONFIRM"
  | "RESCHEDULE"
  | "COMPLETE"
  | "CLIENT_NOT_AVAILABLE"
  | "SITE_NOT_ACCESSIBLE"
  | "CANCEL";

export interface ComplaintVisitPermissions {
  // Vendor's current fee for a new visit; open visits carry their own `fee`.
  visit_fee: number;
  can_create_visit: boolean;
  repeatable_visits: { id: number; visit_number: number }[];
  // Keyed by visit id; only visits that are still open appear here.
  visit_actions: Record<
    string,
    {
      actions: ComplaintVisitAction[];
      fee: number;
      outstanding: number;
      payment_pending_verification: boolean;
    }
  >;
  verifiable_payment_ids: number[];
}

export interface ComplaintInspectionPermissions {
  can_set_warranty: boolean;
  // Completed visit whose inspection report is still due.
  report_visit: { id: number; visit_number: number; completed_at: string | null } | null;
  // HO decides how a submitted inspection proceeds.
  after_inspection: { material_required: boolean } | null;
}

export interface ComplaintQuotationPermissions {
  latest_id: number | null;
  can_edit: boolean;
  edit_from_id: number | null;
  can_review: boolean;
  can_share: boolean;
  can_record_client_response: boolean;
  repair_charge: {
    charge_id: number;
    amount: number;
    outstanding: number;
    payment_pending_verification: boolean;
    can_record: boolean;
    can_waive: boolean;
  } | null;
}

export type ComplaintExecutionAction =
  | "MATERIAL_ORDERED"
  | "MATERIAL_RECEIVED"
  | "MATERIAL_READY"
  | "SCHEDULE_REPAIR"
  | "RESCHEDULE_REPAIR"
  | "START_WORK"
  | "COMPLETE_WORK";

export interface ComplaintExecutionPermissions {
  id: number;
  status: string;
  material_required: boolean;
  scheduled_for: string | null;
  actions: ComplaintExecutionAction[];
}

export interface ComplaintClosurePermissions {
  can_record_client_confirmation: boolean;
  can_close_without_response: boolean;
  ho_closure: { financial_issues: string[] } | null;
  can_cancel: boolean;
}

export interface ComplaintAssigneeOption {
  id: number;
  name: string;
  in_franchise: boolean;
}

export interface ComplaintDetails {
  id: number;
  complaint_code: string;
  registration_channel: ComplaintRegistrationChannel;
  client_type: ComplaintClientType;
  client_name: string;
  client_mobile: string;
  client_alternate_mobile: string | null;
  client_email: string | null;
  site_address: string;
  city: string | null;
  product_type: string | null;
  component: ComplaintComponent;
  description: string;
  additional_remarks: string | null;
  preferred_visit_date: string | null;
  installation_date: string | null;
  usable_handover_date: string | null;
  final_handover_date: string | null;
  priority: ComplaintPriority | null;
  warranty_status: string;
  exceptional_reason: string | null;
  possible_duplicate: boolean;
  duplicate_reviewed_at: string | null;
  duplicate_review_remarks: string | null;
  status: ComplaintStatus;
  status_changed_at: string;
  current_cycle_id: number | null;
  version: number;
  created_at: string;
  updated_at: string;
  category: { id: number; name: string };
  lead: { id: number; lead_code: string } | null;
  externalClient: { id: number; external_client_code: string } | null;
  assignedSS: ComplaintPerson | null;
  assignedHSS: ComplaintPerson | null;
  raisedBy: ComplaintPerson | null;
  cycles: ComplaintCycle[];
  permissions: {
    can_view_financial: boolean;
    actions: ComplaintVerificationAction[];
    visits: ComplaintVisitPermissions;
    inspection: ComplaintInspectionPermissions;
    quotation: ComplaintQuotationPermissions | null;
    execution: ComplaintExecutionPermissions | null;
    closure: ComplaintClosurePermissions;
  };
  attachments: ComplaintAttachment[];
  assignments: (CycleRecord & {
    role: string;
    reason: string | null;
    assigned_at: string;
    previousUser: ComplaintPerson | null;
    newUser: ComplaintPerson;
    assignedBy: ComplaintPerson | null;
  })[];
  decisions: ComplaintDecision[];
  visits: ComplaintVisit[];
  inspections: ComplaintInspection[];
  quotations: ComplaintQuotation[];
  charges: ComplaintCharge[];
  payments: ComplaintPayment[];
  executions: ComplaintExecution[];
  materials: ComplaintMaterial[];
  communications: ComplaintCommunication[];
  closures: ComplaintClosure[];
  task_counts: Record<string, number>;
}
export interface ComplaintActivity extends CycleRecord {
  action: string;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus | null;
  actor_type: string;
  acting_on_behalf_of_client: boolean;
  remarks: string | null;
  created_at: string;
  actor: ComplaintPerson | null;
  cycle: { cycle_number: number };
}
export interface ComplaintActivityParams {
  page: number;
  limit: number;
  cycle_id?: number;
  search?: string;
}
export interface ComplaintActivityResponse {
  rows: ComplaintActivity[];
  total: number;
  page: number;
  limit: number;
}
