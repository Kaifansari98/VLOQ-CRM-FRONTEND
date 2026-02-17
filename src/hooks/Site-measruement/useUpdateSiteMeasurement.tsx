import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateInitialSiteMeasurement } from "@/api/measurment-leads";
import { toast } from "react-toastify";

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
        toast.success(
          "Payment info, site photos & payment details photos updated!",
        );
      } else if (hasImages && hasPaymentInfo) {
        toast.success("Payment info & site photos updated successfully!");
      } else if (hasImages) {
        toast.success("Site photos uploaded successfully!");
      } else if (hasPaymentDetailsPhotos) {
        toast.success("Payment details photos uploaded successfully!");
      } else if (hasPaymentInfo) {
        toast.success("Payment information updated successfully!");
      }

      // Refresh query
      queryClient.invalidateQueries({ queryKey: ["siteMeasurementLeads"] });
      queryClient.invalidateQueries({ queryKey: ["csp-booking-photos"] });
    },

    onError: (error: any) => {
      toast.error("Something went wrong. Please try again!");
      console.error("Error updating site measurement:", error);
    },
  });
};
