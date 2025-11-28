"use client"

import { useId, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface PasswordInputProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

export default function PasswordInput({
  value,
  onChange,
  required,
}: PasswordInputProps) {
  const id = useId()
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible((prev) => !prev)

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          placeholder="Enter your password"
          className="pe-9"
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-e-md outline-none transition"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      </div>
    </div>
  )
}
