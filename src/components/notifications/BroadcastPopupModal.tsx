"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import {
  useBroadcasts,
  getReadBroadcastIds,
  markBroadcastAsReadLocal,
  stripHtmlAndEntities,
} from "@/api/broadcast";
import { BroadcastItem } from "@/types/broadcast";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  FileText,
  X,
  ArrowRight,
  Clock,
  Sparkles,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const POPUP_DURATION_SECONDS = 15;

export function BroadcastPopupModal() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id;
  const vendorId = user?.vendor_id;

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const roleName = (
      user.user_type?.user_type ||
      user.user_role ||
      ""
    ).toLowerCase().trim();
    return (
      roleName === "super-admin" ||
      roleName === "superadmin" ||
      roleName === "super admin" ||
      roleName === "super_admin"
    );
  }, [user]);

  // Fetch broadcasts for current user every 10 seconds (disabled for super admins)
  const { data: broadcasts = [] } = useBroadcasts({
    vendorId: isSuperAdmin ? undefined : (vendorId ?? undefined),
    forMe: true,
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastItem | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(POPUP_DURATION_SECONDS);

  // Sync read and dismissed IDs from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !userId || isSuperAdmin) return;

    const loadLocalState = () => {
      setReadIds(getReadBroadcastIds(userId));
      try {
        const storedDismissed = localStorage.getItem(`dismissed_popup_ids_${userId}`);
        setDismissedIds(storedDismissed ? JSON.parse(storedDismissed) : []);
      } catch (e) {
        setDismissedIds([]);
      }
    };

    loadLocalState();
    window.addEventListener("broadcasts-read-updated", loadLocalState);
    window.addEventListener("storage", loadLocalState);

    return () => {
      window.removeEventListener("broadcasts-read-updated", loadLocalState);
      window.removeEventListener("storage", loadLocalState);
    };
  }, [userId, isSuperAdmin]);

  // Find candidate unread & undismissed published broadcast
  useEffect(() => {
    if (isSuperAdmin || !broadcasts || broadcasts.length === 0 || !userId) return;

    const publishedBroadcasts = broadcasts.filter(
      (b) => b.status === "published"
    );

    const pendingBroadcast = publishedBroadcasts.find((b) => {
      const numIdStr = String(b.numericId ?? "");
      const fullIdStr = String(b.id ?? "");

      const isRead = readIds.includes(numIdStr) || readIds.includes(fullIdStr);
      const isDismissed =
        dismissedIds.includes(numIdStr) || dismissedIds.includes(fullIdStr);

      return !isRead && !isDismissed;
    });

    if (pendingBroadcast) {
      if (!activeBroadcast || activeBroadcast.id !== pendingBroadcast.id) {
        setActiveBroadcast(pendingBroadcast);
        setTimeLeft(POPUP_DURATION_SECONDS);
      }
    } else {
      setActiveBroadcast(null);
    }
  }, [broadcasts, readIds, dismissedIds, userId, activeBroadcast, isSuperAdmin]);

  // 15-second Countdown timer
  useEffect(() => {
    if (isSuperAdmin || !activeBroadcast) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBroadcast, isSuperAdmin]);

  const handleDismiss = () => {
    if (!activeBroadcast || !userId) return;

    const bId = String(activeBroadcast.numericId || activeBroadcast.id);
    const updated = Array.from(new Set([...dismissedIds, bId, activeBroadcast.id]));

    setDismissedIds(updated);
    try {
      localStorage.setItem(`dismissed_popup_ids_${userId}`, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setActiveBroadcast(null);
  };

  const handleViewBroadcast = () => {
    if (!activeBroadcast) return;

    const targetId = activeBroadcast.id;
    const numericId = activeBroadcast.numericId || activeBroadcast.id;

    // Mark as read & dismiss popup
    markBroadcastAsReadLocal(numericId, userId);
    handleDismiss();

    // Navigate directly to broadcast page with target ID query param
    router.push(`/dashboard/broadcast?id=${targetId}`);
  };

  if (isSuperAdmin || !activeBroadcast || !user) return null;

  const contentSnippet = stripHtmlAndEntities(activeBroadcast.content || "");
  const timerPercentage = (timeLeft / POPUP_DURATION_SECONDS) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg bg-card text-card-foreground border border-border/80 shadow-2xl rounded-3xl overflow-hidden p-6"
        >
          {/* Top Progress Timer Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted/40 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500"
              initial={{ width: "100%" }}
              animate={{ width: `${timerPercentage}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>

          {/* Close X Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Close popup"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Badges */}
          <div className="flex items-center gap-2 mb-3 pr-8 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" /> New Broadcast
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-muted text-foreground border border-border/60">
              {activeBroadcast.type === "circular" ? (
                <Megaphone className="w-3 h-3" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
              {activeBroadcast.type}
            </span>

            {activeBroadcast.type === "document" && activeBroadcast.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
                {activeBroadcast.category}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground ml-auto">
              <Clock className="w-3 h-3" /> {timeLeft}s
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-extrabold tracking-tight text-foreground line-clamp-2 mb-2">
            {activeBroadcast.title}
          </h2>

          {/* Author & Date metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>
              Created by{" "}
              <strong className="text-foreground font-semibold">
                {activeBroadcast.updatedBy?.name || "Super Admin"}
              </strong>
            </span>
            <span>•</span>
            <span>{activeBroadcast.publishDate || activeBroadcast.updatedAt}</span>
          </div>

          {/* Preview Snippet */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-6">
            {contentSnippet || "New announcement details are available to read."}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="rounded-xl h-9 text-xs px-4 border-border/60"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleViewBroadcast}
              className="rounded-xl h-9 text-xs px-4 gap-1.5 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              View Broadcast <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
