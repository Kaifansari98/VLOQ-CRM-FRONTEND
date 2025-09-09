"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import TextAreaInput from "@/components/origin-text-area";
import { useSubmitSelection } from "@/hooks/designing-stage/designing-leads-hooks";
import { useDetails } from "../details-context";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/store";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const selectionTypes = ["Carcas", "Shutter", "Handles"] as const;

// ✅ Schema
const formSchema = z.object({
  selections: z
    .array(
      z.object({
        type: z.enum(selectionTypes),
        desc: z.string().min(1, "Description is required"),
      })
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddSelectionsModal: React.FC<ModalProps> = ({ open, onOpenChange }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selections: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections",
  });

  const { mutate, isPending } = useSubmitSelection();
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  // ✅ Toggle selection
  const toggleSelection = (type: (typeof selectionTypes)[number]) => {
    const existingIndex = fields.findIndex((f) => f.type === type);
    if (existingIndex !== -1) {
      remove(existingIndex);
    } else {
      append({ type, desc: "" });
    }
  };

  const isSelected = (type: (typeof selectionTypes)[number]) =>
    fields.some((f) => f.type === type);

  const onSubmit = (values: FormValues) => {
    if (!values.selections) return;

    values.selections.forEach((sel) => {
      mutate(
        {
          desc: sel.desc,
          type: sel.type,
          vendor_id: vendorId!,
          lead_id: leadId,
          user_id: userId!,
          account_id: accountId,
        },
        {
          onSuccess: () => {
            toast.success(`$selection saved successfully!`);
            form.reset();
            onOpenChange(false);
          },
          onError: () => {
            toast.error("Failed to save selection!");
          },
        }
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] md:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Add Selections</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                {selectionTypes.map((type, index) => {
                  const fieldIndex = fields.findIndex((f) => f.type === type);
                  return (
                    <div key={index} className="space-y-1">
                      {/* Checkbox */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={type}
                          checked={isSelected(type)}
                          onCheckedChange={() => toggleSelection(type)}
                        />
                        <FormLabel htmlFor={type}>{type}</FormLabel>
                      </div>

                      {/* TextArea if selected */}
                      {fieldIndex !== -1 && (
                        <FormField
                          control={form.control}
                          name={`selections.${fieldIndex}.desc`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Description
                              </FormLabel>
                              <FormControl>
                                <TextAreaInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder={`Enter ${type} details`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  );
                })}

                <Button type="submit">Save Selections</Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddSelectionsModal;
