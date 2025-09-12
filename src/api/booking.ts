import { apiClient } from "@/lib/apiClient";

export interface BookingPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  created_by: number;
  client_id: number;
  bookingAmount: number;
  bookingAmountPaymentDetailsText: string;
  finalBookingAmount: number;
  siteSupervisorId: number;
  final_documents: File[];
  booking_payment_file: File[];
}

export const moveToBookingStage = async (payload: BookingPayload) => {
  const formData = new FormData();
  formData.append("lead_id", payload.lead_id.toString());
  formData.append("account_id", payload.account_id.toString());
  formData.append("vendor_id", payload.vendor_id.toString());
  formData.append("created_by", payload.created_by.toString());
  formData.append("client_id", payload.client_id.toString());
  formData.append("bookingAmount", payload.bookingAmount.toString());
  formData.append(
    "bookingAmountPaymentDetailsText",
    payload.bookingAmountPaymentDetailsText.toString()
  );
  formData.append("finalBookingAmount", payload.finalBookingAmount.toString());
  formData.append("siteSupervisorId", payload.siteSupervisorId.toString());
  payload.booking_payment_file.forEach((file) => {
    formData.append("booking_payment_file", file);
  });
  payload.final_documents.forEach((file) => {
    formData.append("final_documents", file);
  });

  const { data } = await apiClient.post(
    `/leads/bookingStage/onboard`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const getAllSiteSuperVisors = async (vendorId: number) => {
  const { data } = await apiClient.get(
    `/leads/site-supervisor/vendor/${vendorId}`
  );
  return data;
};

export const getBookingLeads = async (vendorId: number) => {
  const { data } = await apiClient.get(
    `/leads/bookingStage/status4-leads/${vendorId}`
  );
  return data;
};
