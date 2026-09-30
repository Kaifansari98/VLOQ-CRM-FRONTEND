"use client";

import * as React from "react";
import { Clock3, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomTimePickerProps {
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
}

const hours = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const toDisplayTime = (value?: string) => {
  if (!value) return "";
  const [hourValue, minuteValue] = value.split(":").map(Number);
  if (
    !Number.isFinite(hourValue) ||
    !Number.isFinite(minuteValue) ||
    hourValue < 0 ||
    hourValue > 23 ||
    minuteValue < 0 ||
    minuteValue > 59
  ) {
    return value;
  }

  const date = new Date();
  date.setHours(hourValue, minuteValue, 0, 0);
  return format(date, "hh:mm a");
};

const from24HourTime = (
  value?: string,
): { hour: string; minute: string; meridiem: "AM" | "PM" } => {
  if (!value) {
    return { hour: "", minute: "", meridiem: "AM" as "AM" | "PM" };
  }

  const [hourValue, minuteValue] = value.split(":").map(Number);
  if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) {
    return { hour: "", minute: "", meridiem: "AM" as "AM" | "PM" };
  }

  const meridiem = hourValue >= 12 ? "PM" : "AM";
  const normalizedHour = hourValue % 12 || 12;

  return {
    hour: String(normalizedHour).padStart(2, "0"),
    minute: String(minuteValue).padStart(2, "0"),
    meridiem,
  };
};

const to24HourTime = (
  hour: string,
  minute: string,
  meridiem: "AM" | "PM",
) => {
  if (!hour || !minute) return undefined;

  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  if (!Number.isFinite(parsedHour) || !Number.isFinite(parsedMinute)) {
    return undefined;
  }

  let hour24 = parsedHour % 12;
  if (meridiem === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${String(parsedMinute).padStart(
    2,
    "0",
  )}`;
};

export default function CustomTimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
}: CustomTimePickerProps) {
  const parsedValue = React.useMemo(() => from24HourTime(value), [value]);
  const [hour, setHour] = React.useState(parsedValue.hour);
  const [minute, setMinute] = React.useState(parsedValue.minute);
  const [meridiem, setMeridiem] = React.useState<"AM" | "PM">(
    parsedValue.meridiem,
  );

  React.useEffect(() => {
    setHour(parsedValue.hour);
    setMinute(parsedValue.minute);
    setMeridiem(parsedValue.meridiem);
  }, [parsedValue.hour, parsedValue.minute, parsedValue.meridiem]);

  const syncValue = React.useCallback(
    (
      nextHour: string,
      nextMinute: string,
      nextMeridiem: "AM" | "PM",
    ) => {
      onChange(to24HourTime(nextHour, nextMinute, nextMeridiem));
    },
    [onChange],
  );

  const handleReset = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setHour("");
    setMinute("");
    setMeridiem("AM");
    onChange(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start rounded-md border-border/70 bg-background px-3 text-left shadow-xs"
          >
            <Clock3 className="mr-2 h-4 w-4 text-muted-foreground" />
            {value ? (
              <span className="font-medium">{toDisplayTime(value)}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 rounded-full p-0"
              onClick={handleReset}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[320px] rounded-md border-border/70 p-4 shadow-md"
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Meeting Time</p>
            <p className="text-xs text-muted-foreground">
              Choose an hour, minute, and meridiem.
            </p>
          </div>

          <div className="flex flex-row items-center gap-2">
            <Select
              value={hour}
              onValueChange={(nextHour) => {
                setHour(nextHour);
                syncValue(nextHour, minute, meridiem);
              }}
            >
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hourOption) => (
                  <SelectItem key={hourOption} value={hourOption}>
                    {hourOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={minute}
              onValueChange={(nextMinute) => {
                setMinute(nextMinute);
                syncValue(hour, nextMinute, meridiem);
              }}
            >
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {minutes.map((minuteOption) => (
                  <SelectItem key={minuteOption} value={minuteOption}>
                    {minuteOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={meridiem}
              onValueChange={(nextMeridiem: "AM" | "PM") => {
                setMeridiem(nextMeridiem);
                syncValue(hour, minute, nextMeridiem);
              }}
            >
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
