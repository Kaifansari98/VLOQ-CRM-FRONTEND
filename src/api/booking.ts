import { apiClient } from "@/lib/apiClient";
import { BookingLeadById, BookingLeadResponse } from "@/types/booking-types";

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
  mrpValue: number;
}

export const moveToBookingStage = async (payload: BookingPayload) => {
  const formData = new FormData();
  formData.append("lead_id", payload.lead_id.toString());
  formData.append("account_id", payload.account_id.toString());
  formData.append("vendor_id", payload.vendor_id.toString());
  formData.append("created_by", payload.created_by.toString());
  formData.append("client_id", payload.client_id.toString());
  formData.append("bookingAmount", payload.bookingAmount.toString());
  formData.append("mrpValue", payload.mrpValue.toString());
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

export const getBookingLeads = async (
  vendorId: number,
  userId: number
): Promise<BookingLeadResponse> => {
  const { data } = await apiClient.get<BookingLeadResponse>(
    `/leads/bookingStage/status4-leads/${vendorId}?userId=${userId}`
  );
  return data;
};

export interface EditBookingPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  created_by: number;
  client_id: number;
  bookingAmount?: number;
  finalBookingAmount?: number;
  siteSupervisorId?: number;
  bookingAmountPaymentDetailsText?: string;
}

export const EditBookingForm = async (payload: EditBookingPayload) => {
  const { data } = await apiClient.put(`/leads/bookingStage/edit`, payload);
  return data;
};

export const getBookingLeadById = async (
  vendorId: number,
  leadId: number
): Promise<BookingLeadById> => {
  const { data } = await apiClient.get(
    `/leads/bookingStage/vendor/${vendorId}/lead/${leadId}`
  );
  return data?.data;
};

export interface UploadBookintPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  created_by: number;
  final_documents: File[];
}

export const UploadBookingDoc = async (payload: UploadBookintPayload) => {
  const formData = new FormData();
  formData.append("lead_id", payload.lead_id.toString());
  formData.append("account_id", payload.account_id.toString());
  formData.append("vendor_id", payload.vendor_id.toString());
  formData.append("created_by", payload.created_by.toString());
  payload.final_documents.forEach((file) => {
    formData.append("final_documents", file);
  });
  const { data } = await apiClient.post(
    `/leads/bookingStage/add-more-files`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
};

export interface PaymentLog {
  id: number;
  amount: number;
  payment_text: string;
  payment_date: string;
  entry_date: string;
  entered_by_id: number;
  entered_by: string;
  payment_file_id?: number | null;
  payment_file?: string | null;
}

export interface PaymentOverview {
  total_project_amount: number;
  pending_amount: number;
  booking_amount: number;
  mrp_value?: number;
}

export interface PaymentLogsResponse {
  payment_logs: PaymentLog[];
  project_finance: PaymentOverview;
}

export const getPaymentLogs = async (leadId: number, vendorId: number): Promise<PaymentLogsResponse> => {
  const response = await apiClient.get(`/leads/bookingStage/payment-records/leadId/${leadId}/payments?vendorId=${vendorId}`);
  return response.data;
};

export interface ProjectFinance {
  total_project_amount: number;
  pending_amount: number;
  booking_amount: number;
}

export interface AddPaymentPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  client_id: number; // fixed as 1 for now
  created_by: number;
  amount: number;
  payment_text: string;
  payment_date: string;
  payment_file?: File | null;
}

export const addAdditionalPayment = async (payload: AddPaymentPayload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== "payment_file") {
      formData.append(key, String(value));
    }
  });

  if (payload.payment_file) {
    formData.append("payment_file", payload.payment_file);
  }

  const response = await apiClient.post("/leads/bookingStage/add-additional-payment", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};