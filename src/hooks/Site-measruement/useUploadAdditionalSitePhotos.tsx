import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadAdditionalSitePhotosAPI } from "@/api/measurment-leads";
import { toastManager } from "@/components/ui/toast";

export const useUploadAdditionalSitePhotosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, FormData>({
    mutationFn: (formData) => uploadAdditionalSitePhotosAPI(formData),

    onSuccess: (_, variables) => {
      toastManager.add({ title: "Site photos uploaded successfully!", type: "success" });

      const leadId = variables.get("lead_id");
      const accountId = variables.get("account_id");

      // Refresh query to immediately show updated site photos
      queryClient.invalidateQueries({
        queryKey: ["siteMeasurementLeadDetails", Number(leadId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["allLeadDocuments", Number(accountId)],
      });
    },
    onError: (error) => {
      toastManager.add({
        title: "Error uploading photos",
        description: error.message || "Failed to upload photos",
        type: "error",
      });
    },
  });
};
