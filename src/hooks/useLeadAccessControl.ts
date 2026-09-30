import { useAppSelector } from "@/redux/store";
import { useLeadBlockStatus } from "@/hooks/useLeadsQueries";
import { formatBlockedAt } from "@/lib/utils";

interface UseLeadAccessControlProps {
  leadId?: number;
  userType?: string;
  lead?: {
    is_blocked?: boolean;
    lead_blocked_at?: string | null;
  };
}

export const useLeadAccessControl = ({
  leadId,
  userType,
  lead,
}: UseLeadAccessControlProps) => {
  const vendorId = useAppSelector(
    (state) => state.auth.user?.vendor_id,
  );

  const {
    data: leadBlockStatus,
    isLoading,
    isFetching,
    isPending,
    refetch,
  } = useLeadBlockStatus(
    leadId,
    vendorId,
  );

  const isLeadBlocked =
    leadBlockStatus?.is_blocked ??
    !!lead?.is_blocked;

  const blockedAt =
    leadBlockStatus?.lead_blocked_at ??
    lead?.lead_blocked_at;

  const normalizedUserType =
    userType?.trim().toLowerCase() || "";

  const isSuperAdmin =
    normalizedUserType === "super-admin";

  const isPrivilegedUser =
    isSuperAdmin;

  const shouldDisableBlockedActions =
    isLeadBlocked;

  const blockedTooltip = shouldDisableBlockedActions
    ? blockedAt
      ? `This lead has been blocked at ${formatBlockedAt(blockedAt)}`
      : "Lead is blocked"
    : "";

  return {
    // status
    isLeadBlocked,
    blockedAt,
    blockedTooltip,
    isSuperAdmin,
    isPrivilegedUser,

    // permissions
    shouldDisableBlockedActions,

    // query state
    isLoading,
    isFetching,
    isPending,

    // raw response
    leadBlockStatus,

    // helpers
    refetch,
  };
};
