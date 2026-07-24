"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { FadeInProvider } from "@/components/framer-motion/FadeInProvider";
import { BroadcastItem } from "@/types/broadcast";
import { SuperAdminBroadcastView } from "@/components/broadcast/SuperAdminBroadcastView";
import { UserBroadcastView } from "@/components/broadcast/UserBroadcastView";
import { CreateBroadcastView } from "@/components/broadcast/CreateBroadcastView";
import { BroadcastDetailSheet } from "@/components/broadcast/BroadcastDetailSheet";
import { BroadcastDetailView } from "@/components/broadcast/BroadcastDetailView";
import {
  useBroadcasts,
  useCreateBroadcastMutation,
  useUpdateBroadcastMutation,
  useDeleteBroadcastMutation,
  useMarkBroadcastReadMutation,
  markBroadcastAsReadLocal,
  CreateBroadcastPayload,
  stripHtmlAndEntities,
} from "@/api/broadcast";
import { useAppSelector } from "@/redux/store";
import { useRouter, useSearchParams } from "next/navigation";

export default function BroadcastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const isHoUser = useAppSelector((state) => state.auth.is_ho_user);

  const isBroadcastEnabled = user?.vendor?.is_broadcast_enabled === true;

  useEffect(() => {
    if (!isBroadcastEnabled) {
      router.replace("/dashboard");
    }
  }, [isBroadcastEnabled, router]);

  // Check if current user is Super Admin or Head Office User
  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    // The backend stores the role in user.user_type.user_type (e.g. "super-admin")
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

  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<BroadcastItem | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BroadcastItem | null>(null);

  // Ensure non-super admin users can never enter creation mode
  useEffect(() => {
    if (!isSuperAdmin) {
      setIsCreating(false);
      setEditingBroadcast(null);
    }
  }, [isSuperAdmin]);

  // Fetch broadcasts from backend API with audience filtering parameter for non-super admins
  const { data: apiBroadcasts, isLoading: isApiLoading, refetch: refetchBroadcasts } = useBroadcasts({
    forMe: !isSuperAdmin,
  });
  const createBroadcastMutation = useCreateBroadcastMutation();
  const updateBroadcastMutation = useUpdateBroadcastMutation();
  const deleteBroadcastMutation = useDeleteBroadcastMutation();
  const markBroadcastReadMutation = useMarkBroadcastReadMutation();

  // Sync API data when fetched from backend - always update, even if empty array
  useEffect(() => {
    if (apiBroadcasts !== undefined) {
      setBroadcasts(apiBroadcasts);
    }
  }, [apiBroadcasts]);

  // Handle URL query parameter ?id=BD-XXXXX to open detail view directly
  useEffect(() => {
    const targetId = searchParams.get("id") || searchParams.get("broadcastId");
    if (!targetId || broadcasts.length === 0) return;

    const matched = broadcasts.find(
      (b) =>
        b.id.toLowerCase() === targetId.toLowerCase() ||
        String(b.numericId) === targetId
    );

    if (matched) {
      setSelectedItem(matched);
      setDetailSheetOpen(true);
    }
  }, [searchParams, broadcasts]);

  // Handle creating or updating broadcast to backend API & local state
  const handleSaveBroadcast = async ({
    broadcast: newBroadcast,
    backendPayload,
    isEditing,
    editId,
  }: {
    broadcast: Partial<BroadcastItem>;
    backendPayload: CreateBroadcastPayload;
    isEditing?: boolean;
    editId?: number;
  }) => {
    try {
      if (isEditing && editId && editId > 0) {
        await updateBroadcastMutation.mutateAsync({
          id: editId,
          payload: backendPayload,
        });
      } else {
        await createBroadcastMutation.mutateAsync(backendPayload);
      }
      
      await refetchBroadcasts();
      setIsCreating(false);
      setEditingBroadcast(null);
    } catch (err: any) {
      console.error("Failed to save broadcast in backend:", err);
      alert(`Error saving broadcast: ${err.response?.data?.message || err.message}`);
    }
  };

  // Toggle bookmark for user view
  const handleToggleBookmark = (id: string) => {
    setBroadcasts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, bookmarked: !b.bookmarked } : b))
    );
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, bookmarked: !prev.bookmarked } : null));
    }
  };

  // Delete item from backend API & local state
  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this broadcast?")) {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      if (!isNaN(numericId)) {
        try {
          await deleteBroadcastMutation.mutateAsync(numericId);
        } catch (err) {
          console.warn("Backend delete request error:", err);
        }
      }

      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      if (selectedItem?.id === id) {
        setDetailSheetOpen(false);
        setSelectedItem(null);
        router.push("/dashboard/broadcast");
      }
    }
  };

  // View detail handler
  const handleViewItem = (item: BroadcastItem) => {
    // We let the useEffect handle the actual state update so it's fully driven by the URL
    router.push(`/dashboard/broadcast?id=${item.id}`);
  };

  // Deep linking: Automatically open a broadcast if an ID is present in the URL
  // Also close it if the ID is removed (e.g. hitting back button)
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl && broadcasts.length > 0) {
      if (selectedItem?.id !== idFromUrl) {
        const match = broadcasts.find((b) => String(b.id) === idFromUrl);
        if (match) {
          setSelectedItem(match);
          setDetailSheetOpen(true);
          const numId = match.numericId || parseInt(String(match.id).replace(/\D/g, ""), 10);
          if (numId && !isNaN(numId)) {
            markBroadcastReadMutation.mutate(numId);
          }
          markBroadcastAsReadLocal(numId || match.id, user?.id);
        }
      }
    } else if (!idFromUrl && selectedItem) {
      setSelectedItem(null);
      setDetailSheetOpen(false);
    }
  }, [searchParams, broadcasts, selectedItem, markBroadcastReadMutation, user?.id]);

  if (!isBroadcastEnabled) return null;

  return (
    <>
      {/* Dashboard Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">
                  {isCreating ? "Create Broadcast" : "Broadcast"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex flex-1 flex-col p-6 space-y-6">
        <FadeInProvider>
          {isSuperAdmin && isCreating ? (
            <CreateBroadcastView
              onBack={() => {
                setIsCreating(false);
                setEditingBroadcast(null);
              }}
              onSubmitBroadcast={handleSaveBroadcast}
              editingBroadcast={editingBroadcast}
            />
          ) : selectedItem ? (
            <BroadcastDetailView
              item={selectedItem}
              onBack={() => {
                router.push("/dashboard/broadcast");
              }}
              onToggleBookmark={handleToggleBookmark}
              isSuperAdmin={isSuperAdmin}
            />
          ) : isSuperAdmin ? (
            <SuperAdminBroadcastView
              broadcasts={broadcasts}
              onCreateOpen={() => {
                setEditingBroadcast(null);
                setIsCreating(true);
              }}
              onEditItem={(item) => {
                setEditingBroadcast(item);
                setIsCreating(true);
              }}
              onViewItem={handleViewItem}
              onDeleteItem={handleDeleteItem}
            />
          ) : (
            <UserBroadcastView
              broadcasts={broadcasts}
              onViewItem={handleViewItem}
              onToggleBookmark={handleToggleBookmark}
              userId={user?.id}
            />
          )}
        </FadeInProvider>
      </main>
    </>
  );
}
