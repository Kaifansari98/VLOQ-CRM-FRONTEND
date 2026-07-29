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
  ArrowRight,
  Clock,
  Sparkles,
  User,
  Paperclip,
  Video,
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
  const fileCount = activeBroadcast.attachments?.length || 0;
  const videoCount = activeBroadcast.videoLinks?.length || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-2xl bg-card text-card-foreground border border-border/80 shadow-2xl rounded-3xl overflow-hidden p-7 sm:p-8"
        >
          {/* Top Progress Timer Bar (Black/Grey Gradient) */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted/40 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100"
              initial={{ width: "100%" }}
              animate={{ width: `${timerPercentage}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>

          {/* 1. Title at Top */}
          <div className="pt-1 mb-3 pr-10">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground line-clamp-2 leading-snug">
              {activeBroadcast.title}
            </h2>
          </div>

          {/* 2. Badges Below Title */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" /> New Broadcast
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-muted text-foreground border border-border/60">
              {activeBroadcast.type === "circular" ? (
                <Megaphone className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {activeBroadcast.type}
            </span>

            {activeBroadcast.type === "document" && activeBroadcast.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
                {activeBroadcast.category}
              </span>
            )}

            {/* File Attachments Count Badge */}
            {fileCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                <Paperclip className="w-3.5 h-3.5" />
                +{fileCount} {fileCount === 1 ? "File" : "Files"}
              </span>
            )}

            {/* Video Attachments Count Badge */}
            {videoCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
                <Video className="w-3.5 h-3.5" />
                +{videoCount} {videoCount === 1 ? "Video" : "Videos"}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground ml-auto">
              <Clock className="w-3.5 h-3.5" /> {timeLeft}s
            </span>
          </div>

          {/* Author & Date metadata */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
            <User className="w-4 h-4 text-primary" />
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
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 mb-6 overflow-hidden max-h-48 overflow-y-auto">
            <p className="text-sm text-muted-foreground leading-relaxed break-words">
              {contentSnippet || "New announcement details are available to read."}
            </p>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
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
