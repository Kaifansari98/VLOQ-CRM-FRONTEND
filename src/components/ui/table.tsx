"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const ele = containerRef.current;
    if (!ele) return;

    const target = e.target as HTMLElement;
    // Don't interfere if clicking on interactive elements
    if (target.closest('button, a, input, select, textarea, [role="button"], [role="checkbox"]')) {
      return;
    }

    isDragging.current = false;
    ele.style.cursor = "grabbing";
    ele.style.userSelect = "none";

    const startX = e.clientX;
    const scrollLeft = ele.scrollLeft;

    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      const dx = mouseMoveEvent.clientX - startX;
      // Mark as dragging if moved more than 5px
      if (Math.abs(dx) > 5) {
        isDragging.current = true;
      }
      ele.scrollLeft = scrollLeft - dx;
    };

    const handleMouseUp = () => {
      ele.style.cursor = "";
      ele.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      
      // Delay resetting isDragging so the click event can be intercepted
      setTimeout(() => {
        isDragging.current = false;
      }, 0);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onClickCapture={handleClickCapture}
      data-slot="table-container"
      className="relative w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      tabIndex={0}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
