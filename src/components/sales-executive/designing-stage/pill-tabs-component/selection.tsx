"use client";

import React, { useEffect } from "react";
import {
  useEditSelectionData,
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
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { DesignSelection } from "@/types/designing-stage-types";
import { useQueryClient } from "@tanstack/react-query";

// Zod schema for individual selections
const formSchema = z
  .object({
    carcas: z.string().optional(),
    shutter: z.string().optional(),
    handles: z.string().optional(),
  })
  .refine(
    (data) =>
      !!data.carcas?.trim() || !!data.shutter?.trim() || !!data.handles?.trim(),
    {
      message: "At least one selection is required",
      path: ["carcas"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

const SelectionsTab: React.FC = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carcas: "",
      shutter: "",
      handles: "",
    },
  });

  // Store existing selection IDs for editing
  const [existingSelections, setExistingSelections] = React.useState<{
    carcas?: DesignSelection;
    shutter?: DesignSelection;
    handles?: DesignSelection;
  }>({});

  useEffect(() => {
    if (selectionsData?.success && Array.isArray(selectionsData?.data)) {
      const carcasSelection = selectionsData.data.find(
        (item) => item.type === "Carcas"
      );
      const shutterSelection = selectionsData.data.find(
        (item) => item.type === "Shutter"
      );
      const handlesSelection = selectionsData.data.find(
        (item) => item.type === "Handles"
      );

      setExistingSelections({
        carcas: carcasSelection,
        shutter: shutterSelection,
        handles: handlesSelection,
      });

      const normalizeDisplay = (val?: string) => {
        if (!val || val === "NULL") return "This Field is Empty";
        return val;
      };

      const values: FormValues = {
        carcas: normalizeDisplay(carcasSelection?.desc),
        shutter: normalizeDisplay(shutterSelection?.desc),
        handles: normalizeDisplay(handlesSelection?.desc),
      };

      form.reset(values);
    }
  }, [selectionsData?.data, form]);

  const handleCreateOrUpdate = async (type: string, desc: string) => {
    if (!desc?.trim()) return;

    const existingSelection =
      existingSelections[type.toLowerCase() as keyof typeof existingSelections];

    try {
      if (existingSelection) {
        // Update existing selection
        await new Promise<void>((resolve, reject) => {
          editSelection(
            {
              selectionId: existingSelection.id,
              payload: {
                type,
                desc,
                updated_by: userId!,
              },
            },
            {
              onSuccess: () => {
                toast.success(`${type} updated successfully`);
                resolve();
              },
              onError: (error: any) => {
                toast.error(`Failed to update ${type}: ${error.message}`);
                reject(error);
              },
            }
          );
        });
      } else {
        // Create new selection
        await new Promise<void>((resolve, reject) => {
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
                toast.success(`${type} created successfully`);
                resolve();
              },
              onError: (error: any) => {
                toast.error(`Failed to create ${type}: ${error.message}`);
                reject(error);
              },
            }
          );
        });
      }
    } catch (error) {
      console.error(`Error handling ${type}:`, error);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const promises: Promise<void>[] = [];

    // Detect dirty fields
    const dirtyFields = form.formState.dirtyFields;

    // Utility function for safe string handling
    const normalizeValue = (val?: string) =>
      val?.trim() && val !== "This Field is Empty" ? val.trim() : "NULL";

    const tryUpdate = async (type: string, desc: string) => {
      const existingSelection =
        existingSelections[
          type.toLowerCase() as keyof typeof existingSelections
        ];

      if (existingSelection) {
        await new Promise<void>((resolve, reject) => {
          editSelection(
            {
              selectionId: existingSelection.id,
              payload: {
                type,
                desc: normalizeValue(desc),
                updated_by: userId!,
              },
            },
            {
              onSuccess: () => {
                toast.success(`${type} updated successfully`);
                resolve();
              },
              onError: (error: any) => {
                toast.error(`Failed to update ${type}: ${error.message}`);
                reject(error);
              },
            }
          );
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          createSelection(
            {
              type,
              desc: normalizeValue(desc),
              vendor_id: vendorId!,
              lead_id: leadId!,
              user_id: userId!,
              account_id: accountId!,
            },
            {
              onSuccess: () => {
                toast.success(`${type} created successfully`);
                resolve();
              },
              onError: (error: any) => {
                toast.error(`Failed to create ${type}: ${error.message}`);
                reject(error);
              },
            }
          );
        });
      }
    };

    // Process only fields that changed
    if (dirtyFields.carcas) promises.push(tryUpdate("Carcas", values.carcas!));
    if (dirtyFields.shutter)
      promises.push(tryUpdate("Shutter", values.shutter!));
    if (dirtyFields.handles)
      promises.push(tryUpdate("Handles", values.handles!));

    try {
      if (promises.length === 0) {
        toast.info("No changes detected");
        return;
      }

      await Promise.all(promises);
      await refetch();

      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });

      toast.success("Selections updated successfully!");
    } catch (error) {
      console.error("Error processing selections:", error);
      toast.error("Some selections failed to update");
    }
  };

  const isPending = isCreating || isEditing;

  if (isLoading) {
    return (
      <div className="px-6 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
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
  }

  return (
    <div className="">
      <div
        className="
      bg-[#fff] dark:bg-[#0a0a0a] 
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
        bg-[#fff] dark:bg-[#0a0a0a]
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

          <Button type="submit" disabled={isPending} className="px-6 h-10">
            {isPending ? "Processing..." : "Save Selections"}
          </Button>
        </div>

        {/* Body */}
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Carcas / Shutter / Handles grid */}
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
                          <span
                            className="
                          text-xs px-2 py-0.5 rounded-full 
                          bg-blue-100 text-blue-700 
                          dark:bg-blue-900/40 dark:text-blue-300
                          border border-blue-300/40
                        "
                          >
                            Existing
                          </span>
                        )}
                      </div>

                      <FormControl>
                        <textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter Carcas selection..."
                          disabled={isPending}
                          className="
                        w-full h-28 resize-none
                        rounded-xl px-3 py-2
                        bg-[#fff] dark:bg-[#0a0a0a]
                        border border-border
                        focus:ring-2 focus:ring-blue-500/40 
                        focus:border-blue-500/40 
                        outline-none
                        transition
                        text-sm
                      "
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
                          <span
                            className="
                          text-xs px-2 py-0.5 rounded-full 
                          bg-blue-100 text-blue-700 
                          dark:bg-blue-900/40 dark:text-blue-300
                          border border-blue-300/40
                        "
                          >
                            Existing
                          </span>
                        )}
                      </div>

                      <FormControl>
                        <textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter Shutter details..."
                          disabled={isPending}
                          className="
                        w-full h-28 resize-none
                        rounded-xl px-3 py-2
                        bg-[#fff] dark:bg-[#0a0a0a]
                        border border-border
                        focus:ring-2 focus:ring-blue-500/40 
                        focus:border-blue-500/40 
                        outline-none
                        text-sm transition
                      "
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
                          <span
                            className="
                          text-xs px-2 py-0.5 rounded-full 
                          bg-blue-100 text-blue-700 
                          dark:bg-blue-900/40 dark:text-blue-300
                          border border-blue-300/40
                        "
                          >
                            Existing
                          </span>
                        )}
                      </div>

                      <FormControl>
                        <textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter Handles details..."
                          disabled={isPending}
                          className="
                        w-full h-28 resize-none
                        rounded-xl px-3 py-2
                        bg-[#fff] dark:bg-[#0a0a0a]
                        border border-border
                        focus:ring-2 focus:ring-blue-500/40 
                        focus:border-blue-500/40 
                        outline-none 
                        text-sm transition
                      "
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
