import { apiClient } from "@/lib/apiClient";

export type PaymentScheduleStatus =
  | "Pending"
  | "PartiallyPaid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export type PaymentMode =
  | "Cash"
  | "BankTransfer"
  | "Cheque"
  | "UPI"
  | "RTGS"
  | "NEFT";

export const listPaymentRequisitionsApi = async (
  vendorId: number,
  params: {
    page?: number;
    search?: string;
    status?: string;
    due?: string;
    supplier_id?: number;
  }
) => {
  const q = new URLSearchParams();

  if (params.page) q.set("page", String(params.page));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.due) q.set("due", params.due);
  if (params.supplier_id) q.set("supplier_id", String(params.supplier_id));

  const { data } = await apiClient.get(
    `/inventory/payment-requisitions/${vendorId}?${q.toString()}`
  );

  return data.data;
};

export const getPaymentRequisitionByIdApi = async (
  vendorId: number,
  id: number
) => {
  const { data } = await apiClient.get(
    `/inventory/payment-requisitions/${vendorId}/${id}`
  );

  return data.data;
};

export const reschedulePaymentRequisitionApi = async (
  vendorId: number,
  id: number,
  payload: {
    user_id: number;
    due_date: string;
    remarks?: string;
  }
) => {
  const { data } = await apiClient.patch(
    `/inventory/payment-requisitions/${vendorId}/${id}/reschedule`,
    payload
  );

  return data.data;
};

export const markPaymentDoneApi = async (
  vendorId: number,
  id: number,
  payload: {
    user_id: number;
    amount: number;
    payment_date: string;
    payment_mode: PaymentMode;
    reference_no?: string;
    remarks?: string;
  }
) => {
  const { data } = await apiClient.post(
    `/inventory/payment-requisitions/${vendorId}/${id}/payments`,
    payload
  );

  return data.data;
};