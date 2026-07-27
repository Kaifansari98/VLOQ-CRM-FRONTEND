"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModernDateTimePickerProps {
  value: string; // ISO or YYYY-MM-DDTHH:mm string
  onChange: (val: string) => void;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const ModernDateTimePicker: React.FC<ModernDateTimePickerProps> = ({
  value,
  onChange,
}) => {
  // Parse initial date
  const parsedDate = value ? new Date(value) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const [currentMonth, setCurrentMonth] = useState(validDate.getMonth());
  const [currentYear, setCurrentYear] = useState(validDate.getFullYear());
  const [selectedDay, setSelectedDay] = useState(validDate.getDate());

  // Time state (12-hour format for UI display)
  const rawHours = validDate.getHours();
  const [hour12, setHour12] = useState(() => {
    const h = rawHours % 12;
    return h === 0 ? 12 : h;
  });
  const [minutes, setMinutes] = useState(validDate.getMinutes());
  const [seconds, setSeconds] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">(rawHours >= 12 ? "PM" : "AM");

  // Prevent past dates/months selection helper
  const now = new Date();
  const todayDateMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const isPrevMonthDisabled =
    currentYear < now.getFullYear() ||
    (currentYear === now.getFullYear() && currentMonth <= now.getMonth());

  const isDayInPast = (day: number) => {
    const targetDate = new Date(currentYear, currentMonth, day);
    return targetDate < todayDateMidnight;
  };

  // Sync internal state if external value changes
  useEffect(() => {
    if (!value) return;
    let d = new Date(value);
    if (isNaN(d.getTime()) || d < new Date()) {
      d = new Date();
    }
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
    setSelectedDay(d.getDate());
    const h = d.getHours();
    setHour12(h % 12 === 0 ? 12 : h % 12);
    setMinutes(d.getMinutes());
    setAmpm(h >= 12 ? "PM" : "AM");
  }, [value]);

  // Update parent with YYYY-MM-DDTHH:mm format
  const applyDateTime = (
    day: number,
    month: number,
    year: number,
    h12: number,
    m: number,
    period: "AM" | "PM"
  ) => {
    let militaryHour = h12 % 12;
    if (period === "PM") militaryHour += 12;

    const currentTime = new Date();
    let targetDate = new Date(year, month, day, militaryHour, m);

    // If target date/time is in the past, clamp to current present time
    if (targetDate < currentTime) {
      targetDate = new Date();
      day = targetDate.getDate();
      month = targetDate.getMonth();
      year = targetDate.getFullYear();
      const h = targetDate.getHours();
      militaryHour = h;
      h12 = h % 12 === 0 ? 12 : h % 12;
      m = targetDate.getMinutes();
      period = h >= 12 ? "PM" : "AM";

      // Sync local component state to clamped time
      setSelectedDay(day);
      setCurrentMonth(month);
      setCurrentYear(year);
      setHour12(h12);
      setMinutes(m);
      setAmpm(period);
    }

    const formattedYear = String(year);
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const formattedHour = String(militaryHour).padStart(2, "0");
    const formattedMinute = String(m).padStart(2, "0");

    const isoString = `${formattedYear}-${formattedMonth}-${formattedDay}T${formattedHour}:${formattedMinute}`;
    onChange(isoString);
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    if (isDayInPast(day)) return;
    setSelectedDay(day);
    applyDateTime(day, currentMonth, currentYear, hour12, minutes, ampm);
  };

  const incrementHour = () => {
    const nextH = hour12 === 12 ? 1 : hour12 + 1;
    setHour12(nextH);
    applyDateTime(selectedDay, currentMonth, currentYear, nextH, minutes, ampm);
  };

  const decrementHour = () => {
    const prevH = hour12 === 1 ? 12 : hour12 - 1;
    setHour12(prevH);
    applyDateTime(selectedDay, currentMonth, currentYear, prevH, minutes, ampm);
  };

  const incrementMinutes = () => {
    const nextM = (minutes + 1) % 60;
    setMinutes(nextM);
    applyDateTime(selectedDay, currentMonth, currentYear, hour12, nextM, ampm);
  };

  const decrementMinutes = () => {
    const prevM = minutes < 1 ? 59 : minutes - 1;
    setMinutes(prevM);
    applyDateTime(selectedDay, currentMonth, currentYear, hour12, prevM, ampm);
  };

  const toggleAmpm = (newAmpm: "AM" | "PM") => {
    setAmpm(newAmpm);
    applyDateTime(selectedDay, currentMonth, currentYear, hour12, minutes, newAmpm);
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-4 p-5 rounded-3xl bg-neutral-50 border border-neutral-200/80 shadow-inner font-sans">
      {/* ─── 1. CALENDAR CARD ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-[260px] bg-white rounded-2xl p-5 border border-neutral-200/60 shadow-sm flex flex-col justify-between">
        <div>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isPrevMonthDisabled}
              className={cn(
                "p-2 rounded-xl border border-neutral-200 text-neutral-800 transition-colors",
                isPrevMonthDisabled
                  ? "opacity-30 cursor-not-allowed bg-neutral-100"
                  : "hover:bg-neutral-100"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm text-neutral-900 tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-neutral-100 transition-colors border border-neutral-200 text-neutral-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for prev month offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-full" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = dayNum === selectedDay;
              const isPast = isDayInPast(dayNum);
              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => !isPast && handleSelectDay(dayNum)}
                  className={cn(
                    "h-9 w-full rounded-xl text-xs font-semibold flex items-center justify-center transition-all",
                    isPast
                      ? "text-neutral-400/70 bg-neutral-100/60 cursor-not-allowed pointer-events-none font-normal"
                      : isSelected
                      ? "bg-black text-white font-extrabold shadow-md shadow-neutral-900/30 scale-105"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar Card Bottom Actions */}
        <div className="flex items-center mt-6 pt-4 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const nowDate = new Date();
              setCurrentMonth(nowDate.getMonth());
              setCurrentYear(nowDate.getFullYear());
              setSelectedDay(nowDate.getDate());
              const h = nowDate.getHours();
              const h12 = h % 12 === 0 ? 12 : h % 12;
              const m = nowDate.getMinutes();
              const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
              setHour12(h12);
              setMinutes(m);
              setAmpm(period);
              applyDateTime(nowDate.getDate(), nowDate.getMonth(), nowDate.getFullYear(), h12, m, period);
            }}
            className="w-full rounded-xl text-xs font-bold h-9 text-neutral-700 border-neutral-200 hover:bg-neutral-50"
          >
            Today
          </Button>
        </div>
      </div>

      {/* ─── 2. TIME SELECTOR CARD ────────────────────────────────────────── */}
      <div className="flex-1 min-w-[240px] bg-white rounded-2xl p-5 border border-neutral-200/60 shadow-sm flex flex-col justify-between">
        <div>
          <div className="text-center font-extrabold text-sm text-neutral-900 mb-4 tracking-tight">
            Time
          </div>

          {/* Time Spinner Columns */}
          <div className="flex items-center justify-center gap-4 my-2">
            {/* Hours Column */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementHour}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-2xl font-black text-neutral-900 my-2">
                {String(hour12).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                hour
              </span>
              <button
                type="button"
                onClick={decrementHour}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors mt-2"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <span className="text-2xl font-bold text-neutral-300 -mt-4">:</span>

            {/* Minutes Column */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementMinutes}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-2xl font-black text-neutral-900 my-2">
                {String(minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                min
              </span>
              <button
                type="button"
                onClick={decrementMinutes}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors mt-2"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <span className="text-2xl font-bold text-neutral-300 -mt-4">:</span>

            {/* Seconds Column */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setSeconds((s) => (s + 15) % 60)}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-2xl font-black text-neutral-900 my-2">
                {String(seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                sec
              </span>
              <button
                type="button"
                onClick={() => setSeconds((s) => (s < 15 ? 45 : s - 15))}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-800 transition-colors mt-2"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AM / PM Segmented Switch */}
          <div className="flex items-center justify-center my-4">
            <div className="p-1 bg-neutral-100 rounded-xl flex items-center gap-1 border border-neutral-200/60 w-full max-w-[180px]">
              <button
                type="button"
                onClick={() => toggleAmpm("AM")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center",
                  ampm === "AM"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => toggleAmpm("PM")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center",
                  ampm === "PM"
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="text-center font-mono font-extrabold text-xs text-neutral-700 bg-neutral-100/80 py-2 rounded-xl border border-neutral-200/50">
            {String(hour12).padStart(2, "0")} : {String(minutes).padStart(2, "0")} : {String(seconds).padStart(2, "0")} {ampm}
          </div>
        </div>
      </div>
    </div>
  );
};
