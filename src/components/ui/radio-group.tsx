"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

export const RadioGroup: React.FC<RadioGroupProps> = ({
  className,
  value,
  onValueChange,
  children,
  ...props
}) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("grid gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { value: string }
>(({ className, value, id, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext);
  const checked = context.value === value;

  return (
    <input
      type="radio"
      ref={ref}
      id={id}
      checked={checked}
      onChange={() => context.onValueChange?.(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 accent-primary cursor-pointer",
        className
      )}
      {...props}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";
