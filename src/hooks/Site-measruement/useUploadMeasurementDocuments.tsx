import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadMeasurementDocumentsAPI } from "@/api/measurment-leads";
import { toastManager } from "@/components/ui/toast";

export const useUploadMeasurementDocumentsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, FormData>({
    mutationFn: (formData) => uploadMeasurementDocumentsAPI(formData),

    onSuccess: (_, variables) => {
      toastManager.add({ title: "Measurement documents uploaded successfully!", type: "success" });

      const leadId = variables.get("lead_id");
      const accountId = variables.get("account_id");

      // Refresh query to immediately show updated documents
      queryClient.invalidateQueries({
        queryKey: ["siteMeasurementLeadDetails", Number(leadId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["allLeadDocuments", Number(accountId)],
      });
    },
    onError: (error) => {
      toastManager.add({
        title: "Error uploading documents",
        description: error.message || "Failed to upload documents",
        type: "error",
      });
    },
  });
};
