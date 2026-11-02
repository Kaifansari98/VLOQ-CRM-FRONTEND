import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import flags from "react-phone-number-input/flags";
import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  AsYouType,
} from "libphonenumber-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateIndianMobileRisk } from "@/utils/phoneRiskValidator";

export type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> & {
  value?: string | null;
  onChange?: (value: string) => void;
  validateIndianNumber?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  showError?: boolean;
  country?: CountryCode;
  defaultCountry?: CountryCode;
  international?: boolean;
  withCountryCallingCode?: boolean;
};

// All international calling codes sorted longest-first to match greedily
const ALL_CALLING_CODES = Array.from(
  new Set(getCountries().map((c) => getCountryCallingCode(c))),
).sort((a, b) => b.length - a.length);

// Extract national digits by stripping any country calling code
function extractNationalDigits(val?: string | null, activeCountry: CountryCode = "IN"): { country: CountryCode; digits: string } {
  if (!val) return { country: activeCountry, digits: "" };
  const str = String(val).trim();
  if (!str) return { country: activeCountry, digits: "" };

  // 1. If starts with '+', parse with libphonenumber-js to detect country and national number
  if (str.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(str);
    if (parsed && parsed.country && parsed.nationalNumber) {
      return {
        country: parsed.country as CountryCode,
        digits: String(parsed.nationalNumber).slice(0, 15),
      };
    }

    // Partial international number starting with '+'
    const digitsOnly = str.replace(/\D/g, "");
    for (const code of ALL_CALLING_CODES) {
      if (digitsOnly.startsWith(code)) {
        return {
          country: activeCountry,
          digits: digitsOnly.slice(code.length).slice(0, 15),
        };
      }
    }
    return { country: activeCountry, digits: digitsOnly.slice(0, 15) };
  }

  // 2. No '+' sign: clean non-digits
  let digits = str.replace(/\D/g, "");
  if (!digits) return { country: activeCountry, digits: "" };

  if (activeCountry === "IN") {
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.slice(1);
    } else if (digits.length > 10) {
      digits = digits.slice(-10);
    }
    return { country: "IN", digits: digits.slice(0, 10) };
  }

  return { country: activeCountry, digits: digits.slice(0, 15) };
}

// Format national number without country code (e.g. "82082 71588" for India)
function formatNationalNumber(digits: string, country: CountryCode = "IN"): string {
  if (!digits) return "";
  if (country === "IN") {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  }
  try {
    const ayt = new AsYouType(country);
    ayt.input(digits);
    const formatted = ayt.getNumber()?.formatNational();
    return formatted || digits;
  } catch {
    return digits;
  }
}

// Calculate caret position after target number of digits
function getCursorAfterDigits(formatted: string, targetDigits: number): number {
  if (targetDigits <= 0) return 0;
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      count++;
      if (count === targetDigits) return i + 1;
    }
  }
  return formatted.length;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      onChange,
      value,
      validateIndianNumber = false,
      onValidationChange,
      showError = true,
      country,
      defaultCountry = "IN",
      international,
      withCountryCallingCode,
      placeholder = "Enter contact number",
      disabled,
      onKeyDown,
      onPaste,
      onBlur,
      ...domProps
    },
    ref,
  ) => {
    const initial = React.useMemo(
      () => extractNationalDigits(value ?? (domProps.defaultValue as string), country || defaultCountry || "IN"),
      [], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(initial.country);
    const [internalDigits, setInternalDigits] = React.useState<string>(initial.digits);
    const [error, setError] = React.useState<string>("");

    const internalInputRef = React.useRef<HTMLInputElement | null>(null);
    React.useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);

    const runValidation = React.useCallback(
      (digits: string, activeCountry: CountryCode, showErrorIfIncomplete = true) => {
        if (digits.length === 0) {
          setError("");
          onValidationChange?.(false);
          return;
        }

        if (activeCountry === "IN") {
          if (!/^[6-9]/.test(digits)) {
            setError("Mobile number must start with 6, 7, 8 or 9");
            onValidationChange?.(false);
            return;
          }

          if (digits.length < 10) {
            if (showErrorIfIncomplete) {
              setError("Enter a 10 digit mobile number");
            } else {
              setError("");
            }
            onValidationChange?.(false);
            return;
          }

          if (validateIndianNumber) {
            const riskResult = validateIndianMobileRisk(digits);
            if (!riskResult.isValid) {
              setError(riskResult.reason || "Invalid or fake phone number");
              onValidationChange?.(false);
              return;
            }
          }

          setError("");
          onValidationChange?.(true);
          return;
        }

        // Foreign countries validation
        try {
          const callingCode = getCountryCallingCode(activeCountry);
          const fullNumber = `+${callingCode}${digits}`;
          const isValid = isValidPhoneNumber(fullNumber, activeCountry);
          if (!isValid) {
            if (showErrorIfIncomplete) {
              setError("Enter a valid phone number");
            } else {
              setError("");
            }
            onValidationChange?.(false);
          } else {
            setError("");
            onValidationChange?.(true);
          }
        } catch {
          setError("");
          onValidationChange?.(true);
        }
      },
      [validateIndianNumber, onValidationChange],
    );

    // Sync external value when changed (e.g. opening edit modal or updating from DB)
    React.useEffect(() => {
      if (value !== undefined) {
        const parsed = extractNationalDigits(value, selectedCountry);
        if (parsed.country !== selectedCountry) {
          setSelectedCountry(parsed.country);
        }
        setInternalDigits((prev) => (prev !== parsed.digits ? parsed.digits : prev));
        runValidation(parsed.digits, parsed.country, false);
      }
    }, [value, runValidation]); // eslint-disable-line react-hooks/exhaustive-deps

    // Initial mount validation
    React.useEffect(() => {
      runValidation(initial.digits, initial.country, false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const applyDigitsChange = (
      newDigits: string,
      targetDigitsBeforeCursor?: number,
      activeCountry: CountryCode = selectedCountry,
    ) => {
      setInternalDigits(newDigits);
      const formatted = formatNationalNumber(newDigits, activeCountry);
      const callingCode = getCountryCallingCode(activeCountry);
      const e164 = newDigits ? `+${callingCode}${newDigits}` : "";
      onChange?.(e164);
      runValidation(newDigits, activeCountry, true);

      if (targetDigitsBeforeCursor !== undefined && internalInputRef.current) {
        const newCursor = getCursorAfterDigits(formatted, targetDigitsBeforeCursor);
        requestAnimationFrame(() => {
          if (internalInputRef.current) {
            internalInputRef.current.setSelectionRange(newCursor, newCursor);
          }
        });
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const rawValue = input.value;

      // If user typed something starting with '+'
      if (rawValue.startsWith("+")) {
        const parsed = extractNationalDigits(rawValue, selectedCountry);
        if (parsed.country !== selectedCountry) {
          setSelectedCountry(parsed.country);
        }
        applyDigitsChange(parsed.digits, parsed.digits.length, parsed.country);
        return;
      }

      const cursor = input.selectionStart ?? rawValue.length;
      const digitsBeforeCursor = rawValue.slice(0, cursor).replace(/\D/g, "").length;
      const parsed = extractNationalDigits(rawValue, selectedCountry);
      applyDigitsChange(parsed.digits, digitsBeforeCursor, selectedCountry);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const digitsOnly = input.value.replace(/\D/g, "");

      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Home",
        "End",
      ];

      if (e.ctrlKey || e.metaKey) {
        onKeyDown?.(e);
        return;
      }

      if (allowedKeys.includes(e.key)) {
        // Backspace right after space (e.g. 82082 |71588 -> delete 5th digit)
        if (e.key === "Backspace" && input.selectionStart === input.selectionEnd) {
          const cursor = input.selectionStart ?? 0;
          if (cursor > 0 && input.value[cursor - 1] === " ") {
            e.preventDefault();
            const { digits } = extractNationalDigits(input.value, selectedCountry);
            const newDigits = digits.slice(0, 4) + digits.slice(5);
            applyDigitsChange(newDigits, 4, selectedCountry);
            return;
          }
        }
        // Delete key right before space (e.g. 82082| 71588 -> delete 6th digit)
        if (e.key === "Delete" && input.selectionStart === input.selectionEnd) {
          const cursor = input.selectionStart ?? 0;
          if (cursor < input.value.length && input.value[cursor] === " ") {
            e.preventDefault();
            const { digits } = extractNationalDigits(input.value, selectedCountry);
            const newDigits = digits.slice(0, 5) + digits.slice(6);
            applyDigitsChange(newDigits, 5, selectedCountry);
            return;
          }
        }
        onKeyDown?.(e);
        return;
      }

      // Allow '+' only as first character
      if (e.key === "+" && (input.selectionStart === 0 || input.value === "")) {
        onKeyDown?.(e);
        return;
      }

      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        onKeyDown?.(e);
        return;
      }

      const isReplacingSelection =
        input.selectionStart !== null &&
        input.selectionEnd !== null &&
        input.selectionStart !== input.selectionEnd;

      const maxLen = selectedCountry === "IN" ? 10 : 15;
      if (digitsOnly.length >= maxLen && !isReplacingSelection) {
        e.preventDefault();
      }

      onKeyDown?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").trim();
      if (!pasted) return;

      // 1. If pasting an international number starting with '+' (e.g. "+82 10 1234 5678" or "+1 202 555 0123")
      if (pasted.startsWith("+")) {
        const parsed = parsePhoneNumberFromString(pasted);
        if (parsed && parsed.country && parsed.nationalNumber) {
          const newCountry = parsed.country as CountryCode;
          const newDigits = String(parsed.nationalNumber);
          setSelectedCountry(newCountry);
          applyDigitsChange(newDigits, newDigits.length, newCountry);
          onPaste?.(e);
          return;
        }
      }

      // 2. Pasting without '+': extract digits and apply to current selected country
      const { digits: pastedDigits } = extractNationalDigits(pasted, selectedCountry);
      if (!pastedDigits) return;

      const input = e.currentTarget;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;

      if (start === 0 && end === input.value.length) {
        applyDigitsChange(pastedDigits, pastedDigits.length, selectedCountry);
        onPaste?.(e);
        return;
      }

      const digitsBefore = input.value.slice(0, start).replace(/\D/g, "");
      const digitsAfter = input.value.slice(end).replace(/\D/g, "");
      const maxLen = selectedCountry === "IN" ? 10 : 15;
      const combined = (digitsBefore + pastedDigits + digitsAfter).slice(0, maxLen);
      const targetCaretDigits = (digitsBefore + pastedDigits).slice(0, maxLen).length;
      applyDigitsChange(combined, targetCaretDigits, selectedCountry);
      onPaste?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      runValidation(internalDigits, selectedCountry, true);
      onBlur?.(e);
    };

    const displayValue = formatNationalNumber(internalDigits, selectedCountry);
    const Flag = flags[selectedCountry] || flags["IN"];

    return (
      <div className="flex flex-col gap-1 w-full">
        <div className={cn("flex", className)}>
          {/* Dynamic Country Flag Indicator */}
          <Button
            type="button"
            variant="outline"
            className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10 bg-background pointer-events-none cursor-default select-none"
            disabled={true}
            tabIndex={-1}
            aria-hidden="true"
            title={selectedCountry}
          >
            <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
              {Flag && <Flag title={selectedCountry} />}
            </span>
            <ChevronsUpDown className="-mr-2 size-4 opacity-50" />
          </Button>

          {/* National Number Input (No country calling code shown inside) */}
          <Input
            ref={internalInputRef}
            type="tel"
            inputMode="numeric"
            className="rounded-e-lg rounded-s-none"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            {...domProps}
          />
        </div>
        {showError && error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
