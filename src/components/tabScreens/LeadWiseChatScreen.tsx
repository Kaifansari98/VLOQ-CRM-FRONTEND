"use client";

import { useCreateLeadChatRoom, useLeadChatRoom } from "@/hooks/useLeadChatRoom";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import LeadWiseChatNavbar from "@/components/tabScreens/LeadWiseChatNavbar";
import LeadWiseChatEmptyState from "@/components/tabScreens/LeadWiseChatEmptyState";
import ChatInputComponent from "@/components/tabScreens/ChatInputComponent";
import ChatMessagesComponent from "@/components/tabScreens/ChatMessagesComponent";

interface LeadWiseChatScreenProps {
  leadId: number;
}

export default function LeadWiseChatScreen({
  leadId,
}: LeadWiseChatScreenProps) {
  const { data, isLoading, isError } = useLeadChatRoom(leadId);
  const queryClient = useQueryClient();
  const createChatRoomMutation = useCreateLeadChatRoom();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  if (isLoading) {
    return (
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          Checking chat room for lead_id: {leadId}...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4">
        <p className="text-sm text-destructive">
          Failed to check chat room for lead_id: {leadId}.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-150px)] flex-col">
      <LeadWiseChatNavbar leadId={leadId} />

      <div className="flex-1 overflow-y-auto">
        {!data?.exists ? (
          <LeadWiseChatEmptyState
            leadId={leadId}
            isCreating={createChatRoomMutation.isPending}
            isDisabled={!userId || createChatRoomMutation.isPending}
            onGetStarted={() => {
              if (!userId) {
                return;
              }
              createChatRoomMutation.mutate(
                { leadId, userId },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries({
                      queryKey: ["leadChatRoom", leadId],
                    });
                  },
                }
              );
            }}
          />
        ) : (
          <ChatMessagesComponent
            leadId={leadId}
            vendorId={vendorId ?? 0}
            userId={userId ?? 0}
          />
        )}
      </div>

      <ChatInputComponent leadId={leadId} disabled={!data?.exists} />
    </div>
  );
}
