export const canReassingLead = (userType: string | undefined) => {
  if (!userType) return false;
  const allowRoles = ["super_admin", "admin"];
  return allowRoles.includes(userType);
};

export const canDeleteLead = (userType: string | undefined) => {
  if (!userType) return false;
  const allowDeleteRoles = ["super_admin", "admin"];
  return allowDeleteRoles.includes(userType);
};

export const canCreateLead = (userType: string | undefined) => {
  if (!userType) return false;
  const allowCreateRoles = ["super_admin", "admin", "sales-executive"];
  return allowCreateRoles.includes(userType.toLowerCase());
};

export const canAssignISM = (userType: string | undefined) => {
  if (!userType) return false;
  const allowCreateRoles = ["super_admin", "admin", "sales-executive"];
  return allowCreateRoles.includes(userType.toLowerCase());
};

export const canAssignFM = (userType: string | undefined) => {
  if (!userType) return false;
  const allowCreateRoles = ["super_admin", "admin", "sales-executive"];
  return allowCreateRoles.includes(userType.toLowerCase());
};

export const canUploadISM = (userType: string | undefined) => {
  if (!userType) return false;
  const allowCreateRoles = ["super_admin", "admin", "sales-executive"];
  return allowCreateRoles.includes(userType.toLowerCase());
};

export const canMoveToBookingStage = (userType: string | undefined) => {
  if (!userType) return false;
  const allowCreateRoles = ["super_admin", "admin", "sales-executive"];
  return allowCreateRoles.includes(userType.toLowerCase());
};

export const formatDateTime = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const canTechCheck = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "tech-check"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canMoveToOrderLogin = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "tech-check"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canUploadFinalMeasurements = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "site-supervisor"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canUploadClientDocumentation = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canUploadMoreClientDocumentationFiles = (
  userType: string | undefined
) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canUploadRevisedClientDocumentationFiles = (
  userType: string | undefined
) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canUploadClientApproval = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canRequestToTeckCheck = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canViewThreeVerticalDocsOptionInTechCheck = (
  userType: string | undefined
) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canOrderLogin = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "backend", "tech-check"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canAssignSR = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canDoSR = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "site-supervisor"];
  return allowedRoles.includes(userType.toLowerCase());
};

// utils/privilege.ts
export function canUploadOrDeleteBookingDone(
  role: string,
  stage: string
): boolean {
  return (
    role === "admin" ||
    role === "super_admin" ||
    (role === "sales-executive" && stage === "booking-stage")
  );
}

export function canUploadOrDeleteOrderLogin(
  role: string,
  stage: string
): boolean {
  return (
    role === "admin" ||
    role === "super-admin" ||
    (role === "tech-check" && stage === "order-login-stage")
  );
}

export const canDoDispatchPlanning = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};
export const canMoveToProduction = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "backend"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canViewToOrderLoginDetails = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = [
    "super_admin",
    "admin",
    "backend",
    "tech-check",
    "factory",
  ];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canViewAndWorkProductionDetails = (
  userType: string | undefined
) => {
  if (!userType) return false;
  const allowedRoles = [
    "super_admin",
    "admin",
    "backend",
    "tech-check",
    "factory",
    "sales-executive",
    "site-supervisor",
  ];
  return allowedRoles.includes(userType.toLowerCase());
};

export const handledproductionDefaultTab = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = [
    "super_admin",
    "admin",
    "backend",
    "tech-check",
    "factory",
    "sales-executive",
    "site-supervisor",
  ];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canMoveToReadyToDispatch = (userType: string | undefined) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "factory"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canUploadReadyToDispatchDocuments = (
  userType: string | undefined
) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "sales-executive"];
  return allowedRoles.includes(userType.toLowerCase());
};

export function canAccessAddNewSectionButton(
  role: string,
  stage: string
): boolean {
  const allowedRoles = ["super_admin", "admin", "backend"];
  return stage === "order-login-stage" && allowedRoles.includes(role);
}

export function canAccessSaveOrderLoginButton(
  role: string,
  stage: string
): boolean {
  return (
    role === "admin" ||
    role === "super-admin" ||
    (role === "backend" && stage === "order-login-stage")
  );
}

export function canAccessInputField(role: string, stage: string): boolean {
  return (
    role === "admin" ||
    role === "super-admin" ||
    (role === "backend" && stage === "order-login-stage")
  );
}

export function canViewAndWorkProductionStage(
  role: string,
  stage: string
): boolean {
  // 1. Admins always have access
  if (role === "admin" || role === "super-admin") return true;

  // 2. Factory has access only in production stage
  if (role === "factory") return stage === "production-stage";

  // 3. Backend and Tech-check never have access "can view only"
  if (
    role === "backend" ||
    role === "tech-check" ||
    role === "sales-executive" ||
    role === "site-supervisor"
  )
    return false;

  // 4. Everyone else has access by default
  return true;
}

export function canViewAndWorkEditProcutionExpectedDate(role: string): boolean {
  // 1. Admins always have access
  if (role === "admin" || role === "super-admin" || role === "factory")
    return true;

  // 3. "can view only"
  if (
    role === "backend" ||
    role === "tech-check" ||
    role === "sales-executive" ||
    role === "site-supervisor"
  )
    return false;

  // 4. Everyone else has access by default
  return true;
}

export const canViewDefaultSubTabProductionStage = (role: string) => {
  if (role === "sales-executive" || role === "site-supervisor") return false;
  return true;
};

export function canViewAndWorkSiteRedinessStage(
  role: string,
  stage: string
): boolean {
  return (
    role === "admin" ||
    role === "super_admin" ||
    (role === "site-supervisor" && stage === "site-readiness-stage")
  );
}

export function canViewAndWorkDispatchPlanningStage(
  role: string,
  stage: string
): boolean {
  return (
    role === "admin" ||
    role === "super_admin" ||
    (role === "sales-executive" && stage === "dispatch-planning-stage")
  );
}

export function canViewAndWorkDispatchStage(
  role: string,
  stage: string
): boolean {
  return (
    role === "admin" ||
    role === "super_admin" ||
    (role === "factory" && stage === "dispatch-stage")
  );
}

export function canEditLeadForSalesExecutiveButton(role: string): boolean {
  return (
    role === "admin" || role === "super_admin" || role === "sales-executive"
  );
}

export function canDeleteLedForSalesExecutiveButton(role: string): boolean {
  return (
    role === "admin" || role === "super_admin" || role === "sales-executive"
  );
}

export function canEditLeadButton(role: string): boolean {
  return (
    role === "admin" || role === "super_admin"
  );
}

export function canDeleteLeadButton(role: string): boolean {
  return (
    role === "admin" || role === "super_admin"
  );
}

export function canReassignLeadButton(role: string): boolean {
  return role === "admin" || role === "super_admin";
}
