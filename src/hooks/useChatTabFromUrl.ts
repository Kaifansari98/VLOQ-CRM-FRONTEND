"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

export const useChatTabFromUrl = (
  setActiveTab: (tab: string) => void,
  chatTabValue: string = "chats"
) => {
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    const tabParam = searchParams.get("tab");
    if (tabParam === chatTabValue) {
      setActiveTab(chatTabValue);
      initializedRef.current = true;
    }
  }, [chatTabValue, searchParams, setActiveTab]);
};

export const useIsChatNotification = (chatTabValue: string = "chats") => {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const tabParam = searchParams.get("tab");
    const messageId = searchParams.get("messageId");

    return tabParam === chatTabValue || Boolean(messageId);
  }, [chatTabValue, searchParams]);
};
