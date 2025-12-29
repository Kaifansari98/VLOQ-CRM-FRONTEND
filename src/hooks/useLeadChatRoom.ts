import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
  checkLeadChatRoom,
  createLeadChatRoom,
  getLeadChatMembers,
  getLeadChatMessages,
  sendLeadChatMessage,
} from "@/api/lead-chats";
import { toastError } from "@/lib/utils";

export const useLeadChatRoom = (leadId?: number) => {
  return useQuery({
    queryKey: ["leadChatRoom", leadId],
    queryFn: () => checkLeadChatRoom(leadId!),
    enabled: !!leadId,
    refetchOnWindowFocus: false,
  });
};

export const useCreateLeadChatRoom = () => {
  return useMutation({
    mutationFn: ({ leadId, userId }: { leadId: number; userId: number }) =>
      createLeadChatRoom(leadId, userId),
  });
};

export const useLeadChatMembers = (leadId?: number, vendorId?: number) => {
  return useQuery({
    queryKey: ["leadChatMembers", leadId, vendorId],
    queryFn: () => getLeadChatMembers(leadId!, vendorId!),
    enabled: !!leadId && !!vendorId,
    refetchOnWindowFocus: false,
  });
};

export const useSendLeadChatMessage = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      vendorId,
      userId,
      messageText,
      files,
      mentionUserIds,
    }: {
      leadId: number;
      vendorId: number;
      userId: number;
      messageText?: string;
      files?: File[];
      mentionUserIds?: number[];
    }) =>
      sendLeadChatMessage({
        leadId,
        vendorId,
        userId,
        messageText,
        files,
        mentionUserIds,
      }),
    onError: (error: unknown) => {
      toastError(error);
    },
  });
};

export const useLeadChatMessages = (
  leadId?: number,
  vendorId?: number,
  limit: number = 50
) => {
  return useInfiniteQuery({
    queryKey: ["leadChatMessages", leadId, vendorId, limit],

    initialPageParam: 1, // ✅ REQUIRED IN v5

    queryFn: async ({ pageParam }) => {
      const data = await getLeadChatMessages({
        leadId: leadId!,
        vendorId: vendorId!,
        page: pageParam,
        limit,
      });

      return {
        ...data,
        page: pageParam,
        limit,
      };
    },

    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total
        ? lastPage.page + 1
        : undefined,

    enabled: !!leadId && !!vendorId,
    refetchOnWindowFocus: false,
  });
};
