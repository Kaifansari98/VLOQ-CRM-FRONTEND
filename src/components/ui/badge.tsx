import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        success: "bg-green-500 text-white border-transparent",
        warning: "bg-yellow-500 text-black border-transparent",
        info: "bg-blue-500 text-white border-transparent",
        destructive: "bg-destructive text-white border-transparent",
      },
      appearance: {
        solid: "", // default
        light: "bg-opacity-20 text-inherit border-transparent",
        outline: "bg-transparent border current text-current",
      },
      shape: {
        rounded: "rounded-md px-2 py-0.5",
        circle: "rounded-full min-w-5 h-5 px-1 py-0 text-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      appearance: "solid",
      shape: "rounded",
    },
  }
)

function Badge({
  className,
  variant,
  appearance,
  shape,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, appearance, shape }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
