import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateInitialSiteMeasurement } from "@/api/measurment-leads";
import { toastManager } from "@/components/ui/toast";

interface MutationVariables {
  paymentId: number;
  formData: FormData;
}

export const useUpdateSiteMeasurementMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, MutationVariables>({
    mutationFn: ({ paymentId, formData }) =>
      UpdateInitialSiteMeasurement(paymentId, formData),

    onSuccess: (_, variables) => {
      const hasImages = variables.formData.has("current_site_photos");
      const hasPaymentDetailsPhotos = variables.formData.has(
        "payment_detail_photos",
      );
      const hasPaymentInfo =
        variables.formData.has("amount") ||
        variables.formData.has("payment_text") ||
        variables.formData.has("payment_date");

      // Show dynamic toast
      if (hasImages && hasPaymentDetailsPhotos && hasPaymentInfo) {
        toastManager.add({ title: "Payment info, site photos & payment details photos updated!", type: "success" });
      } else if (hasImages && hasPaymentInfo) {
        toastManager.add({ title: "Payment info & site photos updated successfully!", type: "success" });
      } else if (hasImages) {
        toastManager.add({ title: "Site photos uploaded successfully!", type: "success" });
      } else if (hasPaymentDetailsPhotos) {
        toastManager.add({ title: "Payment details photos uploaded successfully!", type: "success" });
      } else if (hasPaymentInfo) {
        toastManager.add({ title: "Payment information updated successfully!", type: "success" });
      }

      // Refresh query
      queryClient.invalidateQueries({ queryKey: ["siteMeasurementLeads"] });
      queryClient.invalidateQueries({ queryKey: ["csp-booking-photos"] });
    },

    onError: (error: any) => {
      toastManager.add({ title: "Something went wrong. Please try again!", type: "error" });
      console.error("Error updating site measurement:", error);
    },
  });
};
