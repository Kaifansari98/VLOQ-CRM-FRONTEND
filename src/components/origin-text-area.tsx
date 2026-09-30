"use client";

import { useId } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextAreaInputProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  placeholder: string;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  isError?: boolean;
  errorMessage?: string;
}

export default function TextAreaInput({
  value = "",
  onChange,
  maxLength = 1000,
  placeholder,
  readOnly = false,
  disabled = false,
  className,
  isError = false,
  errorMessage,
}: TextAreaInputProps) {
  const id = useId();
  const characterCount = value?.length || 0;

  return (
    <div>
      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value)}
        aria-describedby={`${id}-description`}
        placeholder={placeholder}
        rows={2}
        readOnly={readOnly}
        disabled={disabled}
        className={cn(
          isError && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 ring-1 ring-red-500/20",
          className
        )}
      />
      <div
        id={`${id}-description`}
        className="flex items-center justify-between mt-1.5"
        role="status"
        aria-live="polite"
      >
        {errorMessage ? (
          <p className="text-xs font-medium text-red-500">{errorMessage}</p>
        ) : (
          <span />
        )}
        <p className="text-muted-foreground text-xs tabular-nums">
          {maxLength - characterCount} characters left
        </p>
      </div>
    </div>
  );
}