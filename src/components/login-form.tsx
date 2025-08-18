"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useLogin } from "@/hooks/useLogin"
import { useDispatch, useSelector } from "react-redux"
import { setCredentials } from "@/redux/slices/authSlice"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { RootState } from "@/redux/store" // adjust path if different

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const loginMutation = useLogin()
  const dispatch = useDispatch()
  const router = useRouter()

  const { user, token } = useSelector((state: RootState) => state.auth)

  // ✅ If already logged in, redirect immediately
  useEffect(() => {
    if (user && token) {
      console.log(user && token);
      router.replace("/dashboard") // replace so user can't go back
    }
  }, [user, token, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ user_contact: phone, password })
  }

  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      dispatch(setCredentials({
        user: loginMutation.data.user,
        token: loginMutation.data.token
      }))
      toast.success("Login successful 🎉")
      router.push("/dashboard")
    }
  }, [loginMutation.isSuccess, loginMutation.data, dispatch, router])

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your phone number below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 000 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
        {loginMutation.isError && (
          <p className="text-red-500 text-sm">
            {loginMutation.error instanceof Error
              ? loginMutation.error.message
              : "Login failed"}
          </p>
        )}
      </div>
    </form>
  )
}