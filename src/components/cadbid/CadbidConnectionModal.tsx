"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  KeyRound,
  Building2,
  User,
  Mail,
  Loader2,
  Unlink,
  DraftingCompass,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { VerifyTokenData } from "@/api/cadbid";
import {
  useCadbidStatus,
  useVerifyCadbid,
  useConnectCadbid,
  useDisconnectCadbid,
} from "@/hooks/useCadbid";

interface CadbidConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CadbidConnectionModal: React.FC<CadbidConnectionModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: status, isLoading: isStatusLoading } = useCadbidStatus();
  const verifyMutation = useVerifyCadbid();
  const connectMutation = useConnectCadbid();
  const disconnectMutation = useDisconnectCadbid();

  const [secretKey, setSecretKey] = useState("");
  const [verifiedData, setVerifiedData] = useState<VerifyTokenData | null>(
    null,
  );
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSecretKey("");
      setVerifiedData(null);
      setShowConfirmDisconnect(false);
    }
    onOpenChange(nextOpen);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) return;

    try {
      const data = await verifyMutation.mutateAsync(secretKey.trim());
      setVerifiedData(data);
    } catch {
      setVerifiedData(null);
    }
  };

  const handleConnect = async () => {
    if (!secretKey.trim()) return;

    try {
      await connectMutation.mutateAsync(secretKey.trim());
      setSecretKey("");
      setVerifiedData(null);
    } catch {}
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      setShowConfirmDisconnect(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Cadbid Connection
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Connect your Cadbid account to unlock CADX Studio and integrated
                quoting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isStatusLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : status?.connected && status?.cadbidUser ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">
                  Cadbid Account Connected
                </span>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
              >
                Active
              </Badge>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Linked Account
                </span>
                {status.studioAccess ? (
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-primary/20">
                    <DraftingCompass className="mr-1 h-3 w-3" />
                    Studio Access Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Studio Inactive
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm pt-1">
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{status.cadbidUser.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{status.cadbidUser.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{status.cadbidUser.companyName}</span>
                </div>
              </div>
            </div>

            {showConfirmDisconnect ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs space-y-3">
                <p className="text-destructive font-medium">
                  Are you sure you want to disconnect your Cadbid account? You
                  will lose direct access to CADX Studio from Furnix.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirmDisconnect(false)}
                    disabled={disconnectMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      "Confirm Disconnect"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
                  onClick={() => setShowConfirmDisconnect(true)}
                >
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  Disconnect
                </Button>
                <Button size="sm" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <form onSubmit={handleVerify} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cadbid-key" className="text-xs font-medium">
                  Cadbid Secret Key
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cadbid-key"
                    type="password"
                    placeholder="Enter your Cadbid secret key"
                    value={secretKey}
                    onChange={(e) => {
                      setSecretKey(e.target.value);
                      if (verifiedData) setVerifiedData(null);
                    }}
                    disabled={
                      verifyMutation.isPending || connectMutation.isPending
                    }
                    className="font-mono text-sm"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={!secretKey.trim() || verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Verifying
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Find your secret key in your Cadbid Profile settings under API
                  / Integrations.
                </p>
              </div>
            </form>

            {verifyMutation.isError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>
                  {(verifyMutation.error as any)?.response?.data?.message ||
                    verifyMutation.error.message ||
                    "Invalid secret key. Please check and try again."}
                </span>
              </div>
            )}

            {verifiedData && (
              <div className="rounded-lg border bg-muted/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Key Verified
                  </span>
                  {verifiedData.studioAccess ? (
                    <Badge className="bg-primary/15 text-primary border-primary/20 text-[11px]">
                      <DraftingCompass className="mr-1 h-3 w-3" />
                      Studio Eligible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px]">
                      No Studio Access
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">
                      {verifiedData.cadbidUser.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span>{verifiedData.cadbidUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{verifiedData.cadbidUser.companyName}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-2"
                  onClick={handleConnect}
                  disabled={connectMutation.isPending}
                >
                  {connectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect This Account"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
