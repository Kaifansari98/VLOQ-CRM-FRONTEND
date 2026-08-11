"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Check, ChevronDown, Search, Sparkles, Palette, Layers, Paintbrush, Sparkle, Tag, FolderOpen, Star, Package, Shield, Ruler, Scale, Layers3, Boxes, Coins, Cpu, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface SelectOption {
  id: number | string
  name: string
}

export type SelectType =
  | "category"
  | "subcategory"
  | "brand"
  | "coreproduct"
  | "grade"
  | "finish"
  | "size"
  | "unit"
  | "producttype"
  | "itemgroup"
  | "costing"
  | "itemtype"
  | "hsn"
  | "general"

interface AppSelectProps {
  options: SelectOption[]
  value: number | string | null | undefined
  onChange: (value: any) => void
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  type?: SelectType
}

// Visual category-themed gradients and icons
const getSelectIcon = (name: string, type: SelectType = "general") => {
  const normalized = name.toLowerCase();

  switch (type) {
    case "finish":
      if (normalized.includes("acrylic gloss")) {
        return (
          <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 shadow-xs border border-white/10">
            <Sparkles className="size-3 text-white animate-pulse" />
          </div>
        );
      }
      if (normalized.includes("glossy laminate")) {
        return (
          <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 shadow-xs border border-white/10">
            <Sparkle className="size-3 text-white" />
          </div>
        );
      }
      if (normalized.includes("matte laminate")) {
        return (
          <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xs border border-white/10">
            <Layers className="size-3 text-white" />
          </div>
        );
      }
      if (normalized.includes("pu paint gloss")) {
        return (
          <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-violet-600 shadow-xs border border-white/10">
            <Paintbrush className="size-3 text-white" />
          </div>
        );
      }
      if (normalized.includes("pu paint matte")) {
        return (
          <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 shadow-xs border border-white/10">
            <Paintbrush className="size-3 text-white" />
          </div>
        );
      }
      if (normalized.includes("mat")) {
        return (
          <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gray-300 to-slate-500 shadow-xs border border-white/10">
            <Layers className="size-3 text-white" />
          </div>
        );
      }
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 shadow-xs border border-white/10">
          <Palette className="size-3 text-white" />
        </div>
      );

    case "category":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-xs border border-white/10">
          <Tag className="size-3 text-white" />
        </div>
      );

    case "subcategory":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-xs border border-white/10">
          <FolderOpen className="size-3 text-white" />
        </div>
      );

    case "brand":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-xs border border-white/10">
          <Star className="size-3 text-white" />
        </div>
      );

    case "coreproduct":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-xs border border-white/10">
          <Package className="size-3 text-white" />
        </div>
      );

    case "grade":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600 shadow-xs border border-white/10">
          <Shield className="size-3 text-white" />
        </div>
      );

    case "size":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-xs border border-white/10">
          <Ruler className="size-3 text-white" />
        </div>
      );

    case "unit":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-amber-600 shadow-xs border border-white/10">
          <Scale className="size-3 text-white" />
        </div>
      );

    case "producttype":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 shadow-xs border border-white/10">
          <Cpu className="size-3 text-white" />
        </div>
      );

    case "itemgroup":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 shadow-xs border border-white/10">
          <Boxes className="size-3 text-white" />
        </div>
      );

    case "costing":
    case "itemtype":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xs border border-white/10">
          <Coins className="size-3 text-white" />
        </div>
      );

    case "hsn":
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 shadow-xs border border-white/10">
          <FileText className="size-3 text-white" />
        </div>
      );

    default:
      return (
        <div className="relative flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 shadow-xs border border-white/10">
          <Palette className="size-3 text-white" />
        </div>
      );
  }
};

export function AppSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  loading = false,
  disabled = false,
  type = "general",
}: AppSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Filter options instantly
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Reset activeIndex when query changes
  React.useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // Focus search input when popover opens
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  const selectedOption = React.useMemo(() => {
    if (value === null || value === undefined) return null;
    return options.find((opt) => String(opt.id) === String(value));
  }, [options, value]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (loading || filteredOptions.length === 0) {
      if (e.key === "Escape") {
        setOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case "Enter":
        e.preventDefault();
        const selected = filteredOptions[activeIndex];
        if (selected) {
          onChange(selected.id);
          setOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Scroll active item into view
  React.useEffect(() => {
    if (open && containerRef.current) {
      const activeEl = containerRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, open]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-all duration-200",
            "hover:bg-slate-50/50 hover:border-slate-300",
            "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 focus:border-[#2563EB]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200",
            open && "ring-2 ring-[#2563EB]/15 border-[#2563EB]"
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {selectedOption ? (
              <>
                {getSelectIcon(selectedOption.name, type)}
                <span className="truncate text-slate-900 font-medium">{selectedOption.name}</span>
              </>
            ) : (
              <span className="text-slate-400 font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-400 transition-transform duration-200 ease-out",
              open && "rotate-180 text-[#2563EB]"
            )}
          />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] min-w-[260px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] outline-none",
            "animate-in fade-in-0 zoom-in-95 duration-200 ease-out",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${type !== "general" ? type : "option"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Options Container */}
          <ScrollArea className="max-h-[220px] overflow-y-auto">
            <div ref={containerRef} className="space-y-0.5 p-1">
              {loading ? (
                // Premium Animated Skeleton Loader
                <div className="space-y-1 py-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="size-6 animate-pulse rounded-lg bg-slate-100" />
                      <div className="h-4 w-28 animate-pulse rounded-md bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : filteredOptions.length === 0 ? (
                // Empty state
                <div className="py-8 text-center text-sm text-slate-400 font-medium">
                  No {type !== "general" ? type : "option"} found.
                </div>
              ) : (
                // Filtered options list
                filteredOptions.map((option, index) => {
                  const isSelected = String(option.id) === String(value);
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={option.id}
                      data-index={index}
                      type="button"
                      onClick={() => {
                        onChange(option.id);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 text-left outline-none",
                        isSelected
                          ? "bg-[#EEF4FF] text-[#2563EB]"
                          : isActive
                          ? "bg-[#F3F8FF] text-slate-800"
                          : "text-slate-700 hover:text-slate-800",
                        "cursor-pointer select-none"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getSelectIcon(option.name, type)}
                        <span>{option.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-[#2563EB]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
