
export const canReassingLead = (userType: string | undefined) => {
    if(!userType) return false;
    const allowRoles = ["admin", "super_admin"];
    return allowRoles.includes(userType);
}