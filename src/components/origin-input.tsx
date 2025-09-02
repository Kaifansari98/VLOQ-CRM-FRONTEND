"use client";

import { forwardRef } from "react";
import { CircleXIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface ClearInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const ClearInput = forwardRef<HTMLInputElement, ClearInputProps>(
  ({ value, onChange, placeholder = "Type something...", type, ...props }, ref) => {
    const handleClearInput = () => {
      if (onChange) {
        // Empty value pass karega react-hook-form ko
        onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={onChange}
          className="pe-9"
          placeholder={placeholder}
          type={type}
          {...props}
        />
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
