"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VehicleNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function VehicleNumberInput({
  value,
  onChange,
  placeholder = "e.g. MH 04 JE 7172",
  required = false,
  disabled = false,
}: VehicleNumberInputProps) {
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Step definitions
  // Format = AA 00 AA 0000 (2 letters, 2 digits, 2 letters, 4 digits)
  const segmentRules = [
    { type: "alpha", length: 2 },
    { type: "digit", length: 2 },
    { type: "alpha", length: 2 },
    { type: "digit", length: 4 },
  ];

  const validateVehicle = (formatted: string) => {
    const regex = /^[A-Z]{2}\s\d{2}\s[A-Z]{2}\s\d{4}$/;
    return regex.test(formatted);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase();
    raw = raw.replace(/\s+/g, ""); // remove spaces for processing

    let formatted = "";
    let index = 0;

    for (const segment of segmentRules) {
      const remaining = raw.slice(index);
      if (!remaining) break;

      if (segment.type === "alpha") {
        const letters = remaining.match(/[A-Z]+/)?.[0] || "";
        formatted += letters.slice(0, segment.length);
        index += letters.slice(0, segment.length).length;
      } else {
        const digits = remaining.match(/[0-9]+/)?.[0] || "";
        formatted += digits.slice(0, segment.length);
        index += digits.slice(0, segment.length).length;
      }

      if (formatted.length < 13) formatted += " "; // add space after each valid part
    }

    formatted = formatted.trim();

    // Validate pattern
    if (formatted && !validateVehicle(formatted)) {
      setError("Format: MH 04 JE 7172");
    } else {
      setError("");
    }

    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];

    if (allowedKeys.includes(e.key)) return;

    const currentValue = inputRef.current?.value || "";
    const noSpaces = currentValue.replace(/\s/g, "");

    const segmentIndex = segmentRules.findIndex((segment, i) => {
      const totalLength = segmentRules
        .slice(0, i)
        .reduce((sum, s) => sum + s.length, 0);
      return (
        noSpaces.length >= totalLength &&
        noSpaces.length < totalLength + segment.length
      );
    });

    if (segmentIndex === -1) {
      e.preventDefault();
      return;
    }

    const segment = segmentRules[segmentIndex];

    if (segment.type === "alpha" && !/^[A-Za-z]$/.test(e.key)) {
      e.preventDefault();
    }

    if (segment.type === "digit" && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">
        Vehicle Number {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={13}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
