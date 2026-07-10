"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toastManager } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useShutterTypes,
  useShutterMaterials,
  useShutterMaterialFinishes,
} from "@/hooks/useTypesMaster";

const shutterFormSchema = z.object({
  shutter_type_id: z.string().min(1, "Shutter Type is required"),
  shutter_material_id: z.string().min(1, "Shutter Material is required"),
  shutter_inner_finish_id: z.string().min(1, "Shutter Inner Finish is required"),
});

type ShutterFormValues = z.infer<typeof shutterFormSchema>;

interface ShutterFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShutterFormModal: React.FC<ShutterFormModalProps> = ({
  open,
  onOpenChange,
}) => {
  const form = useForm<ShutterFormValues>({
    resolver: zodResolver(shutterFormSchema),
    defaultValues: {
      shutter_type_id: "",
      shutter_material_id: "",
      shutter_inner_finish_id: "",
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({
        shutter_type_id: "",
        shutter_material_id: "",
        shutter_inner_finish_id: "",
      });
    }
  }, [open, form]);

  const { data: shutterTypesData, isLoading: isLoadingTypes } =
    useShutterTypes();
  const shutterTypes = shutterTypesData?.data ?? [];

  const { data: shutterMaterialsData, isLoading: isLoadingMaterials } =
    useShutterMaterials();
  const shutterMaterials = shutterMaterialsData?.data ?? [];

  const selectedMaterialId = form.watch("shutter_material_id");
  const { data: finishesData, isLoading: isLoadingFinishes } =
    useShutterMaterialFinishes(
      selectedMaterialId ? Number(selectedMaterialId) : undefined,
    );
  const finishes = finishesData?.data ?? [];

  const onSubmit = (data: ShutterFormValues) => {
    // TODO: wire up persistence once the specification storage schema is finalized.
    console.log("Shutter Form submitted:", data);
    toastManager.add({ title: "Shutter specifications saved!", type: "success" });
    onOpenChange(false);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={(state) => {
        if (!state) form.reset();
        onOpenChange(state);
      }}
      title="Shutter Form"
      description="Select the shutter type, material, and inner finish."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          <FormField
            control={form.control}
            name="shutter_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shutter Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingTypes ? "Loading..." : "Select shutter type"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shutterTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shutter_material_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shutter Material *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("shutter_inner_finish_id", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingMaterials
                            ? "Loading..."
                            : "Select shutter material"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shutterMaterials.map((material) => (
                      <SelectItem key={material.id} value={String(material.id)}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shutter_inner_finish_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Shutter Inner Finish (Dependant on Shutter Material) *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedMaterialId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !selectedMaterialId
                            ? "Select a material first"
                            : isLoadingFinishes
                              ? "Loading..."
                              : "Select shutter inner finish"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {finishes.map((finish) => (
                      <SelectItem key={finish.id} value={String(finish.id)}>
                        {finish.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default ShutterFormModal;
