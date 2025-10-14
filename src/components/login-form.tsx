"use client";

import { useState, useEffect } from "react";
import { useLogin } from "@/hooks/useLogin";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "@/redux/slices/authSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { RootState } from "@/redux/store";
import { PhoneInput } from "@/components/ui/phone-input";
import PasswordInput from "@/components/password-input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // 🟢 Email first by default
  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLogin();
  const dispatch = useDispatch();
  const router = useRouter();

  const { user, token } = useSelector((state: RootState) => state.auth);

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (user && token) {
      router.replace("/dashboard/sales-executive/leadstable");
    }
  }, [user, token, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please enter your credentials");
      return;
    }
    loginMutation.mutate({ identifier, password });
  };

  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      dispatch(
        setCredentials({
          user: loginMutation.data.user,
          token: loginMutation.data.token,
        })
      );
      toast.success("Login successful 🎉");
      router.push("/dashboard/sales-executive/leadstable");
    }
  }, [loginMutation.isSuccess, loginMutation.data, dispatch, router]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      
      {/* <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your credentials below to login to your Furnix dashboard.
        </p>
      </div> */}

      {/* 🔹 Tabs for Email / Phone selection */}
      <Tabs
        value={loginType}
        onValueChange={(val) => setLoginType(val as any)}
        className="w-full"
      >
        {/* 🧭 Email first */}
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="email">Login with Email</TabsTrigger>
          <TabsTrigger value="phone">Login with Number</TabsTrigger>
        </TabsList>

        {/* 🔹 Email Login Tab */}
        <TabsContent value="email">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>
        </TabsContent>

        {/* 🔹 Phone Login Tab */}
        <TabsContent value="phone">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                defaultCountry="IN"
                id="phone"
                placeholder="Enter phone number"
                value={identifier}
                onChange={(value) => setIdentifier(value)}
                required
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 🔹 Password Field */}
      <div className="grid gap-3">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* 🔹 Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Logging in..." : "Login"}
      </Button>
   {/* <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
    <span className="bg-background text-muted-foreground relative z-10 px-2">
      Or continue with
    </span>
  </div>
  <Button variant="outline" className="w-full">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="55px"
      height="55px"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
    Login with Google
  </Button>
<div className="text-center text-sm">
  Don&apos;t have an account?{" "}
  <a href="#" className="underline underline-offset-4">
    Sign up
  </a>
</div> */}
    </form>
  );
}

{
}
