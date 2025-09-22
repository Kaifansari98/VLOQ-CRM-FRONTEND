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
