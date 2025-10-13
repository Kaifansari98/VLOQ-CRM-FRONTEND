import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/redux/store";
import { useCallback, useMemo } from "react";
import { useVendorUserLeadsOpen } from "@/hooks/useLeadsQueries";

export function LeadStatusTabs({
  tab,
  setTab,
  counts,
}: {
  tab: "open" | "onHold" | "lostApproval" | "lost";
  setTab: (t: "open" | "onHold" | "lostApproval" | "lost") => void;
  counts: {
    total: number;
    open: number;
    onHold: number;
    lostApproval: number;
    lost: number;
  };
}) {
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: myOpenLeads } = useVendorUserLeadsOpen(vendorId!, userId!);

  const isAdmin = useMemo(
    () =>
      userType?.toLowerCase() === "admin" ||
      userType?.toLowerCase() === "super_admin",
    [userType]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setTab(value as "open" | "onHold" | "lostApproval" | "lost");
    },
    [setTab]
  );

  return (
    <div className="flex items-center justify-start my-2">
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="w-fit py-1.5"
      >
        <TabsList className="flex items-center gap-2 rounded-lg px-1.5 py-1 bg-muted border border-border shadow-inner h-11">
          {/* 🔹 Open (My Leads Only) */}
          <TabsTrigger
            value="open"
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
              data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-xs font-medium">Open</span>
              <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full min-w-[20px] text-center">
                {myOpenLeads?.count ?? 0}
              </span>
            </div>
          </TabsTrigger>

          {/* 🔹 On Hold */}
          <TabsTrigger
            value="onHold"
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all 
              data-[state=active]:bg-white data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-xs font-medium">On Hold</span>
              <span className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded-full min-w-[20px] text-center">
                {counts.onHold}
              </span>
            </div>
          </TabsTrigger>

          {/* 🔹 Lost Approval */}
          {isAdmin && (
            <TabsTrigger
              value="lostApproval"
              className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all 
                data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-xs font-medium">Lost Approval</span>
                <span className="px-1 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full min-w-[20px] text-center">
                  {counts.lostApproval}
                </span>
              </div>
            </TabsTrigger>
          )}

          {/* 🔹 Lost */}
          {isAdmin && (
            <TabsTrigger
              value="lost"
              className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all 
                data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs font-medium">Lost</span>
                <span className="px-1 py-0.5 text-xs bg-red-100 text-red-600 rounded-full min-w-[20px] text-center">
                  {counts.lost}
                </span>
              </div>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}
