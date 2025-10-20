"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInputINR } from "@/utils/formatCurrency";

interface CurrencyInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [displayValue, setDisplayValue] = useState("");

  // ✅ Set display value — but keep empty if 0 or undefined
  useEffect(() => {
    if (value === undefined || value === null || value === 0) {
      setDisplayValue("");
    } else {
      setDisplayValue(formatCurrencyInputINR(value, false)); // No ₹ inside input field
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");

    // ✅ Allow empty → undefined
    if (raw.trim() === "") {
      setDisplayValue("");
      onChange(undefined);
      return;
    }

    // ✅ Allow numeric only
    const num = Number(raw);
    if (isNaN(num)) return;

    // ✅ Format properly (so typing '9' or '90' works fine)
    setDisplayValue(formatCurrencyInputINR(num, false));
    onChange(num);
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder || "Enter amount"}
    />
  );
};

export default CurrencyInput;
