import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
    validateIndianNumber?: boolean; // ✅ NEW PROP
    onValidationChange?: (isValid: boolean) => void;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    (
      {
        className,
        onChange,
        value,
        validateIndianNumber = false,
        onValidationChange,
        ...props
      },
      ref,
    ) => {
      const [error, setError] = React.useState<string>("");

      const handleChange = (val: RPNInput.Value | undefined) => {
        const finalVal = val || ("" as RPNInput.Value);

        if (validateIndianNumber) {
          const digitsOnly = finalVal.replace(/\D/g, "");
          const nationalNumber = digitsOnly.replace(/^91/, "");
          const totalDigits = nationalNumber.length;

          if (totalDigits === 0) {
            setError("");
            onValidationChange?.(false);
          } else if (!/^[6-9]/.test(nationalNumber)) {
            setError("Mobile number must start with 6, 7, 8 or 9");
            onValidationChange?.(false);
          } else if (totalDigits !== 10) {
            setError("Enter a 10 digit mobile number");
            onValidationChange?.(false);
          } else {
            setError("");
            onValidationChange?.(true);
          }
        }

        onChange?.(finalVal);
      };

      const formattedValue = React.useMemo(() => {
        if (!value) return undefined;
        const strVal = String(value).trim();
        if (!strVal) return undefined;
        if (strVal.startsWith("+")) return strVal as RPNInput.Value;
        const digits = strVal.replace(/\D/g, "");
        if (!digits) return undefined;
        return `+91${digits}` as RPNInput.Value;
      }, [value]);

      return (
        <div className="flex flex-col gap-1">
          <RPNInput.default
            ref={ref}
            className={cn("flex", className)}
            flagComponent={FlagComponent}
            countrySelectComponent={CountrySelect}
            inputComponent={InputComponent}
            smartCaret={true}
            value={formattedValue}
            onChange={handleChange}
            {...props}
          />
          {/* ✅ Error message yahan dikhega */}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      );
    },
  );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, onKeyDown, onPaste, ...props }, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;

    // Count only digits (ignore spaces)
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
      onKeyDown?.(e);
      return;
    }

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      onKeyDown?.(e);
      return;
    }

    // Block typing if already 10 digits
    if (digitsOnly.length >= 10) {
      e.preventDefault();
    }

    onKeyDown?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("Text");
    const trimmed = pasted.trim();
    const currentDigits = e.currentTarget.value.replace(/\D/g, "");

    if (!/^\d+$/.test(trimmed)) {
      e.preventDefault();
      onPaste?.(e);
      return;
    }

    if (currentDigits.length + trimmed.length > 10) {
      e.preventDefault();
    }

    onPaste?.(e);
  };

  return (
    <Input
      type="tel"
      inputMode="numeric"
      className={cn("rounded-e-lg rounded-s-none", className)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      {...props}
      ref={ref}
    />
  );
});
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open) => {
        setIsOpen(open);
        open && setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
          disabled={true}
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <ChevronsUpDown
            className={cn(
              "-mr-2 size-4 opacity-50",
              disabled ? "hidden" : "opacity-100",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    "[data-radix-scroll-area-viewport]",
                  );
                  if (viewportElement) {
                    viewportElement.scrollTop = 0;
                  }
                }
              }, 0);
            }}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={onChange}
                      onSelectComplete={() => setIsOpen(false)}
                    />
                  ) : null,
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
  onSelectComplete: () => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country);
    onSelectComplete();
  };

  return (
    <CommandItem className="gap-2" onSelect={handleSelect}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${country === selectedCountry ? "opacity-100" : "opacity-0"}`}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
