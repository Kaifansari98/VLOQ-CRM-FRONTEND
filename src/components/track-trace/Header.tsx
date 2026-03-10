"use client";

import { useEffect, useState } from "react";
import { Printer, CalendarDays } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 17) return "🌤️";
  if (hour >= 17 && hour < 21) return "🌇";
  return "🌙";
}

export default function Header() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [greeting, setGreeting] = useState("");
  const [emoji, setEmoji] = useState("");

  const userName = useAppSelector((state) => state.auth.user?.user_name);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );

  useEffect(() => {
    const update = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );

      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      );

      setGreeting(getGreeting());
      setEmoji(getGreetingEmoji());
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0  z-50 w-full  border-border bg-background/95 backdrop-blur-sm no-print">
      <div className="p-5 h-16 flex items-center justify-between gap-4">
        {/* LEFT — Greeting + User */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-tight">{emoji}</span>
            <span className="text-base font-semibold text-foreground truncate">
              {greeting}
              {userName ? (
                <>
                  ,{" "}
                  <span className="text-muted-foreground font-medium">
                    {userName}
                  </span>
                </>
              ) : null}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            Track & Trace Dashboard
            {/* {userType && (
              <span className="ml-2 inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {userType}
              </span>
            )} */}
          </p>
        </div>

        {/* RIGHT — Live dot + Date/Time + Print */}
        <div className="flex items-center gap-3 shrink-0">
          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Date & Time */}
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>{currentDate}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums tracking-tight">
              {currentTime}
            </span>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Export Button */}
          <Button
            variant="default"
            size="sm"
            onClick={() => window.print()}
            className="gap-2 text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
