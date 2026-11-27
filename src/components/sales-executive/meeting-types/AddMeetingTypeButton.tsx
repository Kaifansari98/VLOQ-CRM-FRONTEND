"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { Loader2, Plus } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toastManager } from "@/components/ui/toast";
import { useCreateMeetingType } from "@/hooks/designing-stage/use-meeting-types";
import { MeetingTypeMaster } from "@/types/designing-stage-types";

/** "+ Add" next to a Meeting Type label. Shown to super-admins only. */
export function AddMeetingTypeButton({
  vendorId,
  onCreated,
}: {
  vendorId: number;
  /** Called with the new meeting type, e.g. to select it. */
  onCreated?: (type: MeetingTypeMaster) => void;
}) {
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const isSuperAdmin =
    String(userType ?? "").trim().toLowerCase().replace(/[_\s]+/g, "-") === "super-admin";
  const create = useCreateMeetingType(vendorId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  if (!isSuperAdmin) return null;

  const submit = async () => {
    const type = name.trim();
    if (!type || create.isPending) return;
    try {
      const created = await create.mutateAsync(type);
      toastManager.add({ title: `“${created.type}” added`, type: "success" });
      onCreated?.(created);
      setName("");
      setOpen(false);
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : null;
      toastManager.add({
        title: typeof message === "string" && message ? message : "Couldn't add the meeting type.",
        type: "error",
      });
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setName("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" /> Add
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="mb-2 text-xs font-semibold">New meeting type</p>
        <div className="flex gap-2">
          <Input
            autoFocus
            value={name}
            maxLength={100}
            placeholder="e.g. Site Visit"
            className="h-8 text-sm"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Enter must not submit the surrounding meeting form.
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                void submit();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={!name.trim() || create.isPending}
            onClick={() => void submit()}
          >
            {create.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
