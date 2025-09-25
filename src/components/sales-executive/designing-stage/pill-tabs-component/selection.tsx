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

      const values: FormValues = {
        carcas: carcasSelection?.desc || "",
        shutter: shutterSelection?.desc || "",
        handles: handlesSelection?.desc || "",
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

    // Handle each selection type
    if (values.carcas?.trim()) {
      promises.push(handleCreateOrUpdate("Carcas", values.carcas));
    }
    if (values.shutter?.trim()) {
      promises.push(handleCreateOrUpdate("Shutter", values.shutter));
    }
    if (values.handles?.trim()) {
      promises.push(handleCreateOrUpdate("Handles", values.handles));
    }

    try {
      await Promise.all(promises);

      // Refetch data to get updated selections
      await refetch();

      toast.success("All selections processed successfully!");
    } catch (error) {
      console.error("Error processing selections:", error);
      toast.error("Some selections failed to process");
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
    <div className="px-6 py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="carcas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Carcas
                  {existingSelections.carcas && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Existing
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <TextAreaInput
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Carcas details"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shutter"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Shutter
                  {existingSelections.shutter && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Existing
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <TextAreaInput
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Shutter details"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="handles"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Handles
                  {existingSelections.handles && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Existing
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <TextAreaInput
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Handles details"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 pt-4 w-1/4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Processing..." : "Save Selections"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SelectionsTab;
