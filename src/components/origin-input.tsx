"use client";

import { forwardRef } from "react";
import { CircleXIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ClearInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const ClearInput = forwardRef<HTMLInputElement, ClearInputProps>(
  ({ value, onChange, placeholder = "Type something...", type, className, ...props }, ref) => {
    const handleClearInput = () => {
      if (onChange) {
        // Empty value pass karega react-hook-form ko
        onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <div className="relative flex items-center">
        <Input
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn("ps-9 pe-9", className)}
          placeholder={placeholder}
          type={type}
          {...props}
        />
        <div className="absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-search"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.34-4.34" />
          </svg>
        </div>
        {value && (
          <button
            type="button"
            className="text-muted-foreground/80 hover:text-foreground absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md"
            aria-label="Clear input"
            onClick={handleClearInput}
          >
            <CircleXIcon size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

ClearInput.displayName = "ClearInput";
export default ClearInput;
