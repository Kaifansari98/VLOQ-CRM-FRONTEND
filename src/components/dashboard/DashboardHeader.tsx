"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { getGreeting } from "@/utils/greetingmsg";

// Helper → Get ordinal suffix (st, nd, rd, th)
function getOrdinalSuffix(day: number) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
      
  }
}

// Helper → Format full date like: Tuesday, 22nd March 2025
function formatFullDate(date: Date) {
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);

  const weekday = date.toLocaleDateString("en-IN", { weekday: "long" });
  const month = date.toLocaleDateString("en-IN", { month: "long" });
  const year = date.getFullYear();

  return `${weekday}, ${day}${suffix} ${month} ${year}`;
}

export default function DashboardHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const username = user?.user_name || "User";

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const today = useMemo(() => formatFullDate(new Date()), []);

  return (
    <div className="border-none bg-transparent">
      <CardContent className="px-0 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        
        {/* LEFT: greeting + name */}
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <span>👋</span> {greeting}
          </span>

          <span className="text-lg font-semibold leading-tight capitalize">
            {username}
          </span>
        </div>

        {/* RIGHT: Date + Time */}
        <div className="flex flex-col items-end">
          <div className="w-full flex justify-between items-end">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Date & Time
            </span>
            <span className="text-sm text-muted-foreground">
              {currentTime}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-primary/70" />
            <span>{today}</span>
          </div>
        </div>

      </CardContent>
    </div>
  );
}
