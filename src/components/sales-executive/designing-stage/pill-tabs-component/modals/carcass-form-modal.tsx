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
  useCarcassTypes,
  useCarcasMaterials,
  useCarcassMaterialFinishes,
} from "@/hooks/useTypesMaster";

const carcassFormSchema = z.object({
  carcass_type_id: z.string().min(1, "Carcas Type is required"),
  carcas_material_id: z.string().min(1, "Carcas Material is required"),
  carcass_finish_id: z.string().min(1, "Carcass Finish is required"),
});

type CarcassFormValues = z.infer<typeof carcassFormSchema>;

interface CarcassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CarcassFormModal: React.FC<CarcassFormModalProps> = ({
  open,
  onOpenChange,
}) => {
  const form = useForm<CarcassFormValues>({
    resolver: zodResolver(carcassFormSchema),
    defaultValues: {
      carcass_type_id: "",
      carcas_material_id: "",
      carcass_finish_id: "",
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({
        carcass_type_id: "",
        carcas_material_id: "",
        carcass_finish_id: "",
      });
    }
  }, [open, form]);

  const { data: carcassTypesData, isLoading: isLoadingTypes } =
    useCarcassTypes();
  const carcassTypes = carcassTypesData?.data ?? [];

  const { data: carcasMaterialsData, isLoading: isLoadingMaterials } =
    useCarcasMaterials();
  const carcasMaterials = carcasMaterialsData?.data ?? [];

  const selectedMaterialId = form.watch("carcas_material_id");
  const { data: finishesData, isLoading: isLoadingFinishes } =
    useCarcassMaterialFinishes(
      selectedMaterialId ? Number(selectedMaterialId) : undefined,
    );
  const finishes = finishesData?.data ?? [];

  const onSubmit = (data: CarcassFormValues) => {
    // TODO: wire up persistence once the specification storage schema is finalized.
    console.log("Carcass Form submitted:", data);
    toastManager.add({ title: "Carcass specifications saved!", type: "success" });
    onOpenChange(false);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={(state) => {
        if (!state) form.reset();
        onOpenChange(state);
      }}
      title="Carcass Form"
      description="Select the carcass type, material, and finish."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          <FormField
            control={form.control}
            name="carcass_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carcas Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingTypes ? "Loading..." : "Select carcas type"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {carcassTypes.map((type) => (
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
            name="carcas_material_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carcas Material *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("carcass_finish_id", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingMaterials
                            ? "Loading..."
                            : "Select carcas material"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {carcasMaterials.map((material) => (
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
            name="carcass_finish_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carcass Finish (Dependant on Carcass Material) *</FormLabel>
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
                              : "Select carcass finish"
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

export default CarcassFormModal;
