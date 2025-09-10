"use client";

import React, { useEffect } from "react";
import {
  useEditSelectionData,
  useSelectionData,
  useSubmitSelection,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useForm, Controller } from "react-hook-form";
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

  const { mutate, isPending } = useSubmitSelection();
  const { mutate: editMutate, isPending: editPending } = useEditSelectionData();
  const { data, isLoading, isError } = useSelectionData(vendorId!, leadId!);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carcas: "",
      shutter: "",
      handles: "",
    },
  });

  useEffect(() => {
    if (data && Array.isArray(data?.data)) {
      const values: FormValues = {
        carcas: data?.data.find((item) => item.type === "Carcas")?.desc || "",
        shutter: data?.data.find((item) => item.type === "Shutter")?.desc || "",
        handles: data?.data.find((item) => item.type === "Handles")?.desc || "",
      };
      form.reset(values);
    }
  }, [data?.data, form]);

  const onSubmit = (values: FormValues) => {};

  return (
    <div className="px-6 py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          <FormField
            control={form.control}
            name="carcas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carcas</FormLabel>
                <FormControl>
                  <TextAreaInput
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Carcas details"
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
                <FormLabel>Shutter</FormLabel>
                <FormControl>
                  <TextAreaInput
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Shutter details"
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
                <FormLabel>Handles</FormLabel>
                <FormControl>
                  <TextAreaInput
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Handles details"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {editPending ? "updating..." : "Edit Selections"}
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Submit Selections"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SelectionsTab;
