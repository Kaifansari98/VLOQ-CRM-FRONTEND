"use client";

import { ChevronsUpDown, Eye, KeyRound, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { toastManager } from "@/components/ui/toast";
import { logout } from "@/redux/slices/authSlice";
import { useAppSelector } from "@/redux/store";
import { deactiveToken } from "@/api/notifications";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import { logoutActivityApi } from "@/api/auth";
export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userInitials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const handleLogout = async () => {
    let tokenKey: string | undefined;
    try {
      setIsLoggingOut(true);
      setMenuOpen(false);
      setOpen(false);

      const deviceId = localStorage.getItem("pushDeviceId");

      tokenKey = Object.keys(localStorage).find((k) =>
        k.startsWith("pushToken:"),
      );

      const token = tokenKey ? tokenKey.split("pushToken:")[1] : undefined;

      // 🔴 Call backend to deactivate this device
      if (vendorId && userId && (deviceId || token)) {
        await deactiveToken({
          vendor_id: vendorId,
          user_id: userId,
          device_id: deviceId ?? undefined,
          token: token ?? "",
        }).catch(() => {});
      }

      // 🔴 Log logout activity
      await logoutActivityApi().catch(() => {});

      toastManager.add({ title: "You have been logged out", type: "success" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logout());
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("pushDeviceId");
      localStorage.removeItem("activeTheme");
      if (tokenKey) localStorage.removeItem(tokenKey);

      setIsLoggingOut(false);
      window.location.href = "/login";
    }
  };



  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback
                    className="rounded-lg"
                    style={{
                      backgroundColor: "var(--theme-badge-bg)",
                      color: "var(--theme-badge-text)",
                    }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup> */}

              {/* <DropdownMenuSeparator /> */}

              {/* <DropdownMenuGroup> */}
              {/* <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Payment
                </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem> */}
              {/* </DropdownMenuGroup> */}


              {/* 🔹 Open logout confirmation */}
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => {
                  setMenuOpen(false);
                  setTimeout(() => setChangePasswordOpen(true), 0);
                }}
              >
                <KeyRound />
                Change Password
              </DropdownMenuItem>
                <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  setTimeout(() => setOpen(true), 0);
                }}
                className="cursor-pointer"
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      {/* 🔹 Logout confirmation dialog */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account. You can log in again
              anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Log out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
