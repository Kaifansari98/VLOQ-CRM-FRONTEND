"use client";

import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/slices/authSlice";
import { logoutActivityApi } from "@/api/auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChangePassword } from "@/api/auth";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const strengthRequirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
];

function getStrengthColor(score: number) {
  if (score === 0) return "bg-border";
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score === 3) return "bg-amber-500";
  return "bg-emerald-500";
}

function getStrengthText(score: number) {
  if (score === 0) return "Enter a password";
  if (score <= 2) return "Weak password";
  if (score === 3) return "Medium password";
  return "Strong password";
}

export default function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const passwordFieldId = useId();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const dispatch = useDispatch();
  const { mutateAsync, isPending } = useChangePassword();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const newPasswordValue = form.watch("newPassword");

  const strength = strengthRequirements.map((req) => ({
    met: req.regex.test(newPasswordValue),
    text: req.text,
  }));

  const strengthScore = useMemo(
    () => strength.filter((r) => r.met).length,
    [strength]
  );

  const onSubmit = async (values: FormValues) => {
    try {
      await mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed! Logging you out...");
      await logoutActivityApi().catch(() => {});
      dispatch(logout());
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound size={18} className="text-primary" />
          </div>
          <div>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold leading-tight">
                Change Password
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update your password to keep your account secure.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="px-6 pb-5 space-y-5"
          >
            {/* Current Password */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Current Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrent ? "text" : "password"}
                        placeholder="Enter current password"
                        className="pe-9 h-9"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        {showCurrent ? (
                          <EyeOffIcon size={15} />
                        ) : (
                          <EyeIcon size={15} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* New Password with strength indicator */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id={passwordFieldId}
                        aria-describedby={`${passwordFieldId}-desc`}
                        type={showNew ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pe-9 h-9"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        aria-label={showNew ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        {showNew ? (
                          <EyeOffIcon size={15} />
                        ) : (
                          <EyeIcon size={15} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />

                  {/* Strength bar */}
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuenow={strengthScore}
                    aria-label="Password strength"
                    className="mt-2 mb-2 h-1 w-full overflow-hidden rounded-full bg-border"
                  >
                    <div
                      className={`h-full transition-all duration-500 ease-out ${getStrengthColor(strengthScore)}`}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>

                  <p
                    id={`${passwordFieldId}-desc`}
                    className="text-xs font-medium text-foreground mb-1.5"
                  >
                    {getStrengthText(strengthScore)}
                  </p>

                  <ul className="space-y-1">
                    {strength.map((req) => (
                      <li
                        key={req.text}
                        className="flex items-center gap-2"
                      >
                        {req.met ? (
                          <CheckIcon size={13} className="text-emerald-500 shrink-0" />
                        ) : (
                          <XIcon size={13} className="text-muted-foreground/60 shrink-0" />
                        )}
                        <span
                          className={`text-xs ${req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {req.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Confirm New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        className="pe-9 h-9"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        {showConfirm ? (
                          <EyeOffIcon size={15} />
                        ) : (
                          <EyeIcon size={15} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex items-center gap-2 pt-4 border-t mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
                <ShieldCheck size={13} />
                <span>You'll be logged out after saving.</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || strengthScore < 4}>
                {isPending ? "Saving..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
