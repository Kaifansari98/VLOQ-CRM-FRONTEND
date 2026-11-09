"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2, Save } from "lucide-react";
import { type FMResponse, updateSavedFMValues } from "@/api/fm-requirements";
import { useFMRequirements } from "@/hooks/useFMRequirements";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import BaseModal from "@/components/utils/baseModal";
import { getErrorMessage } from "@/lib/utils";
import FMRequirementsForm from "./FMRequirementsForm";

export default function EditFMRequirementsModal({
  vendorId,
  leadId,
  response,
  onClose,
  onReload,
}: {
  vendorId: number;
  leadId: number;
  response: FMResponse;
  onClose: () => void;
  onReload: () => Promise<void>;
}) {
  const model = useFMRequirements(vendorId, leadId, true, response);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (answers: FMResponse["answers"]) =>
      updateSavedFMValues(
        vendorId,
        leadId,
        response.product_type_id,
        answers,
        response.updated_at,
      ),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["fm-requirement-lead", vendorId, leadId],
      });
      void client.invalidateQueries({
        queryKey: ["finalMeasurementLead", vendorId, leadId],
      });
      void client.invalidateQueries({ queryKey: ["allLeadDocuments"] });
      toastManager.add({ title: "FM values updated", type: "success" });
      onClose();
    },
  });
  const busy = save.isPending || model.isUploading;
  const conflict =
    isAxiosError(save.error) && save.error.response?.status === 409;
  return (
    <BaseModal
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      title={`Edit Final Measurement · ${response.productType?.type ?? "Product type"}`}
      description="Update the recorded checklist values for this lead."
      size="xxl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Saving changes keeps the lead in its current stage.
          </p>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy || model.query.isFetching || model.query.isError}
              onClick={() => {
                const groups = model.prepare(!response.is_complete);
                if (groups?.[0]) save.mutate(groups[0].answers);
              }}
            >
              {save.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 bg-muted/20 p-4 sm:p-6">
        <FMRequirementsForm
          model={model}
          mode="edit"
          disabled={save.isPending || model.query.isFetching}
        />
        {save.error && (
          <div
            role="alert"
            className="space-y-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm"
          >
            <p>
              {getErrorMessage(save.error) || "Unable to update FM values."}
            </p>
            {conflict && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || model.query.isFetching}
                onClick={() => {
                  if (
                    window.confirm(
                      "Discard your unsaved edits and reload the latest saved values?",
                    )
                  )
                    void onReload();
                }}
              >
                Reload saved values
              </Button>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
