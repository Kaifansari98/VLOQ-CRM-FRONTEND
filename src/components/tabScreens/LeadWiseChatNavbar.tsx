"use client";

import { useLeadById } from "@/hooks/useLeadsQueries";
import { useLeadChatMembers } from "@/hooks/useLeadChatRoom";
import { useAppSelector } from "@/redux/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Search, Users } from "lucide-react";

interface LeadWiseChatNavbarProps {
  leadId: number;
}

export default function LeadWiseChatNavbar({
  leadId,
}: LeadWiseChatNavbarProps) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: leadData } = useLeadById(leadId, vendorId, userId);
  const { data: membersData } = useLeadChatMembers(leadId, vendorId);

  const lead = leadData?.data?.lead;
  const leadName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const leadEmail = lead?.email?.trim();
  const leadPhone = `${lead?.country_code ?? ""} ${lead?.contact_no ?? ""}`.trim();
  const leadSubtext = leadEmail || leadPhone;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm font-semibold">
            {getInitials(leadName || "Lead")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {leadName || "Lead"}
          </p>
          <p className="text-xs text-muted-foreground">
            {leadSubtext || "No contact info"}
          </p>
        </div>
      </div>

      <div className="flex flex-row gap-5 items-center">
        <div className="flex -space-x-2">
          {(membersData?.data ?? []).map((member) => (
            <Avatar key={member.id} className="h-9 w-9 ring-2 ring-background">
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(member.user_name || "User")}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
