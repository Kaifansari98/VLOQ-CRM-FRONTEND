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