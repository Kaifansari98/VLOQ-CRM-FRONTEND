"use client";

import React, { useEffect, useState } from "react";
import { Hammer } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import {
  useUnderInstallationDetails,
  useMappedInstallers,
  useAddInstallersAndEndDate,
  useUpdateInstallationDetails,
  useInstallerUsers,
  useUpdateInstallationCompletion,
  useSetInstallationCompletion,
} from "@/api/installation/useUnderInstallationStageLeads";

import CustomeDatePicker from "@/components/date-picker";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import InstallationDayWiseReports from "./InstallationDayWiseReports";

export default function UnderInstallationDetails({
  leadId,
  accountId,
  name,
}: {
  leadId: number;
  accountId?: number;
  name?: string;
}) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id);

  // 🔹 Fetch installation meta (start-date)
  const { data: details } = useUnderInstallationDetails(vendorId, leadId);

  // 🔹 Fetch existing installers
  const { data: mappedInstallers } = useMappedInstallers(vendorId, leadId);

  const installationStarted = !!details?.actual_installation_start_date;

  const postMutation = useAddInstallersAndEndDate();
  const putMutation = useUpdateInstallationDetails();

  const { data: installerUsers } = useInstallerUsers(vendorId);

  const [confirmState, setConfirmState] = useState<{
    type: "carcass" | "shutter" | null;
    current: boolean;
  } | null>(null);

  // 🔹 Convert installers to Option[]
  const installerOptions: Option[] =
    installerUsers?.data?.map((i: any) => ({
      value: String(i.id), // installer id
      label: i.installer_name, // name
    })) ?? [];

  useEffect(() => {
    if (mappedInstallers) {
      setInstallerSelections(
        mappedInstallers.map((i: any) => ({
          value: String(i.installer_id),
          label: i.installer_name,
        }))
      );
    }

    if (details?.expected_installation_end_date) {
      setEndDate(details.expected_installation_end_date);
    }
    if(details?.actual_installation_start_date) {
        console.log("Installation start date", details?.actual_installation_start_date);
    }
  }, [mappedInstallers, details]);

  // 🔹 State: date + selected installers
  const [endDate, setEndDate] = useState<string | undefined>();
  const [installerSelections, setInstallerSelections] = useState<Option[]>([]);

  const setCompletionMutation = useSetInstallationCompletion();
  const updateCompletionMutation = useUpdateInstallationCompletion();

  const onSave = () => {
    if (!endDate) {
      toast.error("Please select expected end date");
      return;
    }
    if (installerSelections.length === 0) {
      toast.error("Please select at least one installer");
      return;
    }

    const installersForAPI = installerSelections.map((i) => ({
      installer_id: Number(i.value),
    }));

    const payload = {
      updated_by: userId!,
      expected_installation_end_date: endDate,
      installers: installersForAPI,
    };

    // If installer already exist → UPDATE (PUT)
    if (mappedInstallers?.length > 0) {
      putMutation.mutate(
        {
          vendorId: vendorId!,
          leadId,
          payload,
        },
        {
          onSuccess: () => toast.success("Installation details updated."),
        }
      );
    } else {
      // Otherwise → CREATE (POST)
      postMutation.mutate(
        {
          vendorId: vendorId!,
          leadId,
          payload,
        },
        {
          onSuccess: () => toast.success("Installers added successfully."),
        }
      );
    }
  };

  function formatInstallationDate(dateString: string) {
    const date = new Date(dateString);

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    const fullDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${time} – ${dayName}, ${fullDate}`;
  }

  return (
    <div className="py-4 px-2">
      {/* 🚫 Not started UI */}
      {!installationStarted && (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="p-4 bg-muted/40 rounded-full mb-4">
            <Hammer size={40} className="text-muted-foreground" />
          </div>

          <h2 className="text-xl font-semibold mb-2">
            Installation Not Started
          </h2>

          <p className="text-sm text-muted-foreground max-w-sm">
            Once installation starts, you can assign installers and set the
            expected completion date.
          </p>
        </div>
      )}

      {/* ✅ Installation Started → show form */}
      {installationStarted && (
        <div className="w-full space-y-6">
          {/* Header + Save Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Installation Details</h3>
              <p className="text-sm text-muted-foreground">
                Assign installers & set expected installation completion date.
              </p>
            </div>

            <Button onClick={onSave} size="sm">
              {mappedInstallers?.length > 0 ? "Update" : "Save"}
            </Button>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Expected Installation Completion Date *
              </label>
              <CustomeDatePicker
                value={endDate}
                onChange={setEndDate}
                restriction="futureOnly"
              />
            </div>

            {/* Installers Multi-Select */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Assign Installers *</label>

              <MultipleSelector
                value={installerSelections}
                onChange={(selected) => setInstallerSelections(selected)}
                options={installerOptions} // ⭐ FIX
                placeholder="Select installers"
                hidePlaceholderWhenSelected
                className="min-h-[40px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add this NEW section */}
      {installationStarted && (
        <InstallationDayWiseReports
          vendorId={vendorId}
          leadId={leadId}
          accountId={accountId}
        />
      )}

      {/* ------------------------------- */}
      {/*   INSTALLATION COMPLETION UI   */}
      {/* ------------------------------- */}

      {installationStarted && (
      <div className="mt-10 border-t pt-6">
        <h3 className="text-lg font-semibold">Installation Completion</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Update the completion status for carcass and shutter installation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carcass Section */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="carcass"
              checked={details?.is_carcass_installation_completed || false}
              onCheckedChange={() =>
                setConfirmState({
                  type: "carcass",
                  current: details?.is_carcass_installation_completed || false,
                })
              }
            />

            <div className="flex flex-col">
              <label
                htmlFor="carcass"
                className="font-medium text-sm cursor-pointer"
              >
                Carcass Installation Completed
              </label>

              {/* Date */}
              {details?.carcass_installation_completion_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatInstallationDate(
                    details.carcass_installation_completion_date
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Shutter Section */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="shutter"
              checked={details?.is_shutter_installation_completed || false}
              onCheckedChange={() =>
                setConfirmState({
                  type: "shutter",
                  current: details?.is_shutter_installation_completed || false,
                })
              }
            />

            <div className="flex flex-col">
              <label
                htmlFor="shutter"
                className="font-medium text-sm cursor-pointer"
              >
                Shutter Installation Completed
              </label>

              {/* Date */}
              {details?.shutter_installation_completion_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatInstallationDate(
                    details.shutter_installation_completion_date
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      <AlertDialog
        open={!!confirmState}
        onOpenChange={() => setConfirmState(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmState?.current
                ? "Mark as Incomplete?"
                : "Mark as Completed?"}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to{" "}
            {confirmState?.current
              ? "mark this as incomplete"
              : "mark this as completed"}
            ?
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (!confirmState) return;

                updateCompletionMutation.mutate({
                  vendorId,
                  leadId,
                  updated_by: userId!,
                  is_carcass_installation_completed:
                    confirmState.type === "carcass"
                      ? !confirmState.current
                      : undefined,
                  is_shutter_installation_completed:
                    confirmState.type === "shutter"
                      ? !confirmState.current
                      : undefined,
                });

                setConfirmState(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
