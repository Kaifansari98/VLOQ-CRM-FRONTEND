"use client";

import React, { useEffect } from "react";
import {
  useEditSelectionData,
  useLeadStatus,
  useSelectionData,
  useSubmitSelection,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "react-toastify";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DesignSelection } from "@/types/designing-stage-types";
import { useQueryClient } from "@tanstack/react-query";
import { canUpdateDessingStageSelectionInputs } from "@/components/utils/privileges";
import TextAreaInput from "@/components/origin-text-area"; // 👈 your component
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ---------- Zod ---------- */
const formSchema = z
  .object({
    carcas: z.string().optional(),
    shutter: z.string().optional(),
    handles: z.string().optional(),
  })
  .refine(
    (d) => !!d.carcas?.trim() || !!d.shutter?.trim() || !!d.handles?.trim(),
    { message: "At least one selection is required", path: ["carcas"] }
  );

type FormValues = z.infer<typeof formSchema>;

/* ---------- Component ---------- */
const SelectionsTab: React.FC = () => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);

  const { leadId, accountId } = useDetails();
  const queryClient = useQueryClient();

  const { mutate: createSelection, isPending: isCreating } =
    useSubmitSelection();
  const { mutate: editSelection, isPending: isEditing } =
    useEditSelectionData();
  const {
    data: selectionsData,
    isLoading,
    isError,
    refetch,
  } = useSelectionData(vendorId!, leadId!);

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const canUpdateInput = canUpdateDessingStageSelectionInputs(
    userType,
    leadStatus
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { carcas: "", shutter: "", handles: "" },
    mode: "onBlur",
  });

  /* existing selections map */
  const [existingSelections, setExistingSelections] = React.useState<{
    carcas?: DesignSelection;
    shutter?: DesignSelection;
    handles?: DesignSelection;
  }>({});

  useEffect(() => {
    if (!selectionsData?.success || !Array.isArray(selectionsData.data)) return;

    const byType = (t: string) => selectionsData.data.find((i) => i.type === t);

    const carcas = byType("Carcas");
    const shutter = byType("Shutter");
    const handles = byType("Handles");

    setExistingSelections({ carcas, shutter, handles });

    form.reset({
      carcas: carcas?.desc && carcas.desc !== "NULL" ? carcas.desc : "",
      shutter: shutter?.desc && shutter.desc !== "NULL" ? shutter.desc : "",
      handles: handles?.desc && handles.desc !== "NULL" ? handles.desc : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionsData?.data]);

  /* -------- helpers -------- */
  const normalizeValue = (v?: string) =>
    v?.trim() && v.trim() !== "" ? v.trim() : "NULL";

  const upsertSelection = async (
    type: "Carcas" | "Shutter" | "Handles",
    descRaw?: string
  ) => {
    const desc = normalizeValue(descRaw);
    const existing =
      existingSelections[type.toLowerCase() as keyof typeof existingSelections];

    if (existing) {
      return new Promise<void>((resolve, reject) =>
        editSelection(
          {
            selectionId: existing.id,
            payload: { type, desc, updated_by: userId! },
          },
          {
            onSuccess: () => {
              toast.success(`${type} updated`);
              resolve();
            },
            onError: (e: any) => {
              toast.error(`Failed to update ${type}: ${e?.message || ""}`);
              reject(e);
            },
          }
        )
      );
    }
    return new Promise<void>((resolve, reject) =>
      createSelection(
        {
          type,
          desc,
          vendor_id: vendorId!,
          lead_id: leadId!,
          user_id: userId!,
          account_id: accountId!,
        },
        {
          onSuccess: () => {
            toast.success(`${type} created`);
            resolve();
          },
          onError: (e: any) => {
            toast.error(`Failed to create ${type}: ${e?.message || ""}`);
            reject(e);
          },
        }
      )
    );
  };

  /* -------- submit -------- */
  const onSubmit = async (values: FormValues) => {
    const dirtyFields = form.formState.dirtyFields;
    const promises: Promise<void>[] = [];

    if (dirtyFields.carcas)
      promises.push(upsertSelection("Carcas", values.carcas));
    if (dirtyFields.shutter)
      promises.push(upsertSelection("Shutter", values.shutter));
    if (dirtyFields.handles)
      promises.push(upsertSelection("Handles", values.handles));

    if (promises.length === 0) {
      toast.info("No changes detected");
      return;
    }

    try {
      await Promise.all(promises);
      await refetch();
      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });
    } catch {
      toast.error("Some selections failed to update");
    }
  };

  const isPending = isCreating || isEditing;

  /* -------- UI states -------- */
  if (isLoading)
    return (
      <div className="px-6 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="px-6 py-4">
        <div className="text-red-500 text-center py-8">
          <p>Error loading selections data</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );

  const tooltipContent = !canUpdateInput
    ? userType === "sales-executive"
      ? "This lead has progressed, and updates are no longer allowed."
      : "You do not have permission to update selections."
    : null;

  /* -------- render -------- */
  return (
    <div className="">
      <div
        className="
      bg-[#fff] dark:bg-[#0A0A0A]
      rounded-2xl 
      border border-border 
      shadow-soft 
      overflow-hidden
    "
      >
        {/* Header */}
        <div
          className="
        px-5 py-3 
        border-b border-border 
        bg-[#fff] dark:bg-[#0A0A0A]
        flex items-center justify-between
      "
        >
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Design Selections
            </h1>
            <p className="text-xs text-muted-foreground">
              Choose / Update Carcas, Shutter & Handle selections.
            </p>
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="submit"
                    disabled={!canUpdateInput || isPending}
                    className="px-6 h-10"
                    onClick={form.handleSubmit(onSubmit)}
                  >
                    {isPending ? "Processing..." : "Save Selections"}
                  </Button>
                </span>
              </TooltipTrigger>
              {tooltipContent && (
                <TooltipContent className="dark px-2 py-1 text-xs leading-snug">
                  {tooltipContent}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Body */}
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* CARCAS */}
                <FormField
                  control={form.control}
                  name="carcas"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium">Carcas</FormLabel>
                        {existingSelections.carcas && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40">
                            Existing
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <TextAreaInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder={
                            existingSelections.carcas?.desc &&
                            existingSelections.carcas.desc !== "NULL"
                              ? "Enter Carcas selection..."
                              : "This Field is Empty"
                          }
                          disabled={!canUpdateInput || isPending}
                          className="h-28"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SHUTTER */}
                <FormField
                  control={form.control}
                  name="shutter"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium">Shutter</FormLabel>
                        {existingSelections.shutter && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40">
                            Existing
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <TextAreaInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder={
                            existingSelections.shutter?.desc &&
                            existingSelections.shutter.desc !== "NULL"
                              ? "Enter Shutter details..."
                              : "This Field is Empty"
                          }
                          disabled={!canUpdateInput || isPending}
                          className="h-28"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* HANDLES */}
                <FormField
                  control={form.control}
                  name="handles"
                  render={({ field }) => (
                    <FormItem className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium">Handles</FormLabel>
                        {existingSelections.handles && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40">
                            Existing
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <TextAreaInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder={
                            existingSelections.handles?.desc &&
                            existingSelections.handles.desc !== "NULL"
                              ? "Enter Handles details..."
                              : "This Field is Empty"
                          }
                          disabled={!canUpdateInput || isPending}
                          className="h-28"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SelectionsTab;
