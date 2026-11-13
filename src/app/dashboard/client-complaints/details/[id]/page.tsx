"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useComplaintDetail } from "@/api/client-complaints";
import { ComplaintDetailsView } from "@/components/client-complaints/ComplaintDetailsView";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function ComplaintDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id ?? undefined;
  const enabled = user?.vendor?.is_client_complaints_enabled === true;
  const complaintId = Number(id);
  const validId =
    /^\d+$/.test(id) && Number.isSafeInteger(complaintId) && complaintId > 0;
  const { data, isPending, error, refetch, isFetching } = useComplaintDetail(
    enabled && validId ? vendorId : undefined,
    complaintId,
  );
  useEffect(() => {
    if (!enabled) router.replace("/dashboard");
  }, [enabled, router]);
  if (!enabled || !vendorId) return null;
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const unavailable = !validId || status === 404 || status === 403;
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Link
            href="/dashboard/client-complaints"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Complaints
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="truncate text-sm font-semibold">
            {data?.complaint_code || "Details"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>
      <main className="min-w-0 flex-1 space-y-5 p-4 sm:p-6">
        <div className="flex justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/client-complaints">
              <ArrowLeft className="size-4" />
              All complaints
            </Link>
          </Button>
          {data && !error && (
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <RefreshCw
                className={isFetching ? "size-4 animate-spin" : "size-4"}
              />
              Refresh
            </Button>
          )}
        </div>
        {unavailable ? (
          <div role="alert" className="rounded-2xl border p-10 text-center">
            <h1 className="text-lg font-semibold">Complaint unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This complaint could not be found or you don’t have access to it.
            </p>
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border p-10 text-center">
            <h1 className="text-lg font-semibold">
              Couldn’t load this complaint
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try again.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        ) : isPending ? (
          <div
            role="status"
            className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="size-5 animate-spin" />
            Loading complaint…
          </div>
        ) : data ? (
          <ComplaintDetailsView
            key={data.id}
            complaint={data}
            vendorId={vendorId}
          />
        ) : null}
      </main>
    </>
  );
}
