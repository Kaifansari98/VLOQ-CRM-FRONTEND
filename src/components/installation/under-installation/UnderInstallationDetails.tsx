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
import { canViewAndWorkUnderInstallationStage } from "@/components/utils/privileges";
import CustomeTooltip from "@/components/cutome-tooltip";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { useQueryClient } from "@tanstack/react-query";

export default function UnderInstallationDetails({
  leadId,
  accountId,
}: {
  leadId: number;
  accountId?: number;
  name?: string;
}) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  // 🔹 Fetch installation data
  const { data: details } = useUnderInstallationDetails(vendorId, leadId);
  const { data: mappedInstallers } = useMappedInstallers(vendorId, leadId);
  const { data: installerUsers } = useInstallerUsers(vendorId);

  // 🔹 Mutations
  const postMutation = useAddInstallersAndEndDate();
  const putMutation = useUpdateInstallationDetails();
  const updateCompletionMutation = useUpdateInstallationCompletion();
  const queryClient = useQueryClient();
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  // 🔹 State
  const [endDate, setEndDate] = useState<string | undefined>();
  const [installerSelections, setInstallerSelections] = useState<Option[]>([]);
  const [confirmState, setConfirmState] = useState<{
    type: "carcass" | "shutter" | null;
    current: boolean;
  } | null>(null);

  const installationStarted = !!details?.actual_installation_start_date;

  // 🔹 Privileges & Permissions
  const canWork = canViewAndWorkUnderInstallationStage(userType, leadStatus);
  const isSupervisor = userType === "site-supervisor";
  const hasAssignedData = mappedInstallers?.length > 0;

  const isDateLocked = canWork && hasAssignedData && isSupervisor;
  const isInstallersLocked = canWork && hasAssignedData && isSupervisor;

  // 🔹 Convert installers to options
  const installerOptions: Option[] =
    installerUsers?.data?.map((i: any) => ({
      value: String(i.id),
      label: i.installer_name,
    })) ?? [];



  // 🔹 Initialize data
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
    if (details?.actual_installation_start_date) {
      console.log(
        "Installation start date",
        details?.actual_installation_start_date
      );
    }
  }, [mappedInstallers, details]);

  // 🔹 Save handler
  const onSave = () => {
    if (!endDate) {
      toast.error("Please select expected end date");
      return;
    }
    if (installerSelections.length === 0) {
      toast.error("Please select at least one installer");
      return;
    }

    const payload = {
      updated_by: userId!,
      expected_installation_end_date: endDate,
      installers: installerSelections.map((i) => ({
        installer_id: Number(i.value),
      })),
    };

    if (hasAssignedData) {
      putMutation.mutate(
        {
          vendorId: vendorId!,
          leadId,
          payload,
        },
        {
          onSuccess: () => {
            toast.success("Installation details updated."),
              queryClient.invalidateQueries({
                queryKey: ["usableHandoverReady"],
              });
          },
        }
      );
    } else {
      postMutation.mutate(
        {
          vendorId: vendorId!,
          leadId,
          payload,
        },
        {
          onSuccess: () => {
            toast.success("Installers added successfully.");
            queryClient.invalidateQueries({
              queryKey: ["usableHandoverReady"],
            });
          },
        }
      );
    }
  };

  // 🔹 Format date helper
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

  // 🔹 Reusable Date Picker Component
  const renderDatePicker = () => {
    if (!canWork) {
      return (
        <CustomeDatePicker
          value={endDate}
          onChange={() => {}}
          restriction="futureOnly"
          disabledReason="You do not have permission to modify installation details."
        />
      );
    }

    if (isDateLocked) {
      return (
        <CustomeDatePicker
          value={endDate}
          onChange={() => {}}
          restriction="futureOnly"
          disabledReason="Site Supervisor modify the expected installation date once it has been set."
        />
      );
    }

    return (
      <CustomeDatePicker
        value={endDate}
        onChange={setEndDate}
        restriction="futureOnly"
        minDate={details?.actual_installation_start_date}
      />
    );
  };

  // 🔹 Reusable Multi-Selector Component
  const renderMultiSelector = () => {
    const isDisabled = !canWork || isInstallersLocked;
    const tooltipMessage = !canWork
      ? "You do not have permission to modify installers."
      : "Site Supervisor cannot modify installers once assigned.";

    if (isDisabled) {
      return (
        <CustomeTooltip
          truncateValue={
            <div className="w-full opacity-70 cursor-not-allowed">
              <MultipleSelector
                value={installerSelections}
                onChange={() => {}}
                options={installerOptions}
                placeholder={!canWork ? "No permission" : "Installers assigned"}
                hidePlaceholderWhenSelected
                disabled={true}
              />
            </div>
          }
          value={tooltipMessage}
        />
      );
    }

    return (
      <MultipleSelector
        value={installerSelections}
        onChange={setInstallerSelections}
        options={installerOptions}
        placeholder="Select installers"
        hidePlaceholderWhenSelected
        disabled={false}
      />
    );
  };

  // 🔹 Reusable Checkbox Component
  const renderCheckbox = (
    id: string,
    label: string,
    isChecked: boolean,
    completionDate: string | null,
    type: "carcass" | "shutter"
  ) => {
    // Check if THIS specific checkbox has data (completion date exists)
    const hasCompletionData = !!completionDate;

    // Checkbox is locked only if:
    // 1. User doesn't have permission (!canWork), OR
    // 2. User is supervisor AND this specific checkbox already has completion data
    const isCheckboxLocked = !canWork || (isSupervisor && hasCompletionData);

    const tooltipMessage = !canWork
      ? "You do not have permission to modify completion status."
      : "Site Supervisor cannot modify completion status once it has been marked.";

    const checkboxElement = (
      <div className="flex items-start gap-3 w-full">
        <Checkbox
          id={id}
          checked={isChecked}
          onCheckedChange={() =>
            !isCheckboxLocked &&
            setConfirmState({
              type,
              current: isChecked,
            })
          }
          disabled={isCheckboxLocked}
        />
        <div className="flex flex-col">
          <label
            htmlFor={id}
            className={`font-medium text-sm ${
              isCheckboxLocked
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer"
            }`}
          >
            {label}
          </label>
          {completionDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatInstallationDate(completionDate)}
            </p>
          )}
        </div>
      </div>
    );

    // Show tooltip if checkbox is locked (either no permission OR supervisor with existing data)
    if (isCheckboxLocked) {
      return (
        <CustomeTooltip
          truncateValue={checkboxElement}
          value={tooltipMessage}
        />
      );
    }

    return checkboxElement;
  };

  return (
    <div className="px-2 bg-[#fff] dark:bg-[#0a0a0a]">
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
            {canWork && (
              <Button onClick={onSave} size="sm">
                {hasAssignedData ? "Update" : "Save"}
              </Button>
            )}
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Date Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Expected Installation Completion Date *
              </label>
              {renderDatePicker()}
            </div>

            {/* Installers Multi-Select */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Assign Installers *</label>
              {renderMultiSelector()}
            </div>
          </div>
        </div>
      )}

      {/* Day-wise Reports */}
      {installationStarted && (
        <InstallationDayWiseReports
          vendorId={vendorId}
          leadId={leadId}
          accountId={accountId}
          accessBtn={canWork}
        />
      )}

      {/* Installation Completion */}
      {installationStarted && (
        <div className="mt-10 border-t pt-6">
          <h3 className="text-lg font-semibold">Installation Completion</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Update the completion status for carcass and shutter installation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Carcass Checkbox */}
            {renderCheckbox(
              "carcass",
              "Carcass Installation Completed",
              details?.is_carcass_installation_completed || false,
              details?.carcass_installation_completion_date || null,
              "carcass"
            )}

            {/* Shutter Checkbox */}
            {renderCheckbox(
              "shutter",
              "Shutter Installation Completed",
              details?.is_shutter_installation_completed || false,
              details?.shutter_installation_completion_date || null,
              "shutter"
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
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
