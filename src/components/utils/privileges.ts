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
  const allowedRoles = ["super-admin", "admin"];
  return allowedRoles.includes(userType.toLowerCase());
};

export const canUploadRevisedClientDocumentationFiles = (
  userType: string | undefined
) => {
  if (!userType) return false;
  const allowedRoles = ["super-admin", "admin", "sales-executive"];
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

export const canOrderLogin = (
  userType: string | undefined
) => {
  if (!userType) return false;
  const allowedRoles = ["super_admin", "admin", "backend"];
  return allowedRoles.includes(userType.toLowerCase());
};
