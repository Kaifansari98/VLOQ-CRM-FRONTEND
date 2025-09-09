"use client";

import { useId } from "react";
import { Textarea } from "@/components/ui/textarea";

interface TextAreaInputProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  placeholder: string;
  readOnly?: boolean;
}

export default function TextAreaInput({
  value = "",
  onChange,
  maxLength = 1000,
  placeholder,
  readOnly = false,

}: TextAreaInputProps) {
  const id = useId();
  const characterCount = value?.length || 0;

  return (
    <div className="*:not-first:mt-2">
      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value)}
        aria-describedby={`${id}-description`}
        placeholder={placeholder}
        rows={2}
        readOnly={readOnly}
      />
      <p
        id={`${id}-description`}
        className="text-muted-foreground mt-2 text-right text-xs"
        role="status"
        aria-live="polite"
      >
        <span className="tabular-nums">{maxLength - characterCount}</span>{" "}
        characters left
      </p>
    </div>
  );
}
