"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { useAppSelector } from "@/redux/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import {
  useMoveToBookingStage,
  useHeadSiteSupervisors,
  useBookingLeadById,
} from "@/hooks/booking-stage/use-booking";
import { BookingPayload, assignTaskBooking } from "@/api/booking";
import { LeadProductStructureInstance } from "@/api/leads";
import { createLeadChatRoom } from "@/api/lead-chats";
import { toastManager } from "@/components/ui/toast";
import { useISMPaymentInfo } from "@/hooks/booking-stage/use-booking";
import SelectDocumentModal from "@/components/modal/select-doc-modal";
import type { LinkedDocMeta } from "@/components/modal/select-doc-modal";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { formatCurrencyINR } from "@/utils/formatCurrency";
import CurrencyInput from "@/components/custom/CurrencyInput";
import BaseModal from "@/components/utils/baseModal";
import {
  useHeadSiteSupervisorFranchiseMapping,
  useFranchisesByVendorId,
} from "@/api/franchise";
import {
  useDesignsDoc,
  useQuotationDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import AssignToPicker from "@/components/assign-to-picker";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { urlToFile } from "@/utils/file.utils";

// ✅ Enhanced Zod schema with proper file validation
const bookingSchema = z
  .object({
    final_documents: z
      .array(z.any())
      .max(20, "You can upload up to 20 documents")
      .default([]),

    mrp_value: z.number().positive("MRP value must be greater than 0"),

    amount_received: z
      .number()
      .nonnegative("Amount cannot be negative")
      .default(0),

    final_booking_amount: z
      .number()
      .positive("Booking amount must be greater than 0"),

    payment_details_document: z
      .array(z.any())
      .max(20, "You can upload up to 20 documents")
      .default([]),

    payment_text: z.string().default(""),

    assign_to: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasPaymentText = !!data.payment_text.trim();
    const hasPaymentDoc =
      Array.isArray(data.payment_details_document) &&
      data.payment_details_document.length > 0;
    const hasPaymentInfo = hasPaymentText || hasPaymentDoc;

    // ✅ Rule 1
    if (data.amount_received > data.final_booking_amount) {
      ctx.addIssue({
        code: "custom",
        path: ["amount_received"],
        message:
          "Booking Advance Received should not be greater than Total Booking Value.",
      });
    }

    // ✅ Rule 2
    if (hasPaymentInfo && data.amount_received <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount_received"],
        message:
          "Booking Advance Received is required when entering payment details or uploading payment document.",
      });
    }

    // ✅ Rule 3
    if (data.amount_received > 0) {
      if (!hasPaymentText) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_text"],
          message:
            "Payment details text is required when Booking Advance Received is entered.",
        });
      }
      if (!hasPaymentDoc) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_details_document"],
          message:
            "At least one payment document is required when Booking Advance Received is entered.",
        });
      }
    }

    // ✅ Rule: Total Booking Value cannot be greater than MRP Value
    if (data.final_booking_amount > data.mrp_value) {
      ctx.addIssue({
        code: "custom",
        path: ["final_booking_amount"],
        message: "Total Booking Value cannot be greater than MRP Value.",
      });
    }
  });

// ✅ Proper type inference from schema
type BookingFormValues = z.infer<typeof bookingSchema>;
const bookingResolver = zodResolver(bookingSchema) as unknown as any;
const defaultBookingValues: BookingFormValues = {
  final_documents: [],
  amount_received: 0,
  final_booking_amount: 0,
  payment_details_document: [],
  payment_text: "",
  assign_to: "",
  mrp_value: 0,
};
type BookingProductTypeTab = {
  productTypeId: number;
  label: string;
  instanceIds: number[];
  instanceTitles: string[];
};
type BookingDraftMap = Record<number, BookingFormValues>;
type PersistedDocRef =
  | {
      kind: "linked-doc";
      docId: number;
      docType: "quotation" | "design";
    }
  | {
      kind: "inline";
      name: string;
      mimeType: string;
      dataUrl: string;
    };
type PersistedBookingDraft = Omit<
  BookingFormValues,
  "final_documents" | "payment_details_document"
> & {
  final_documents: PersistedDocRef[];
  payment_details_document: PersistedDocRef[];
};
type PersistedBookingDraftMap = Record<number, PersistedBookingDraft>;

const BOOKING_DRAFT_STORAGE_PREFIX = "booking-modal-drafts";

const getBookingDraftStorageKey = (vendorId?: number, leadId?: number) =>
  vendorId && leadId
    ? `${BOOKING_DRAFT_STORAGE_PREFIX}:${vendorId}:${leadId}`
    : null;

const getMimeTypeFromFileName = (fileName: string) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (lower.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  return "application/octet-stream";
};

const getLinkedDocMeta = (file: File): LinkedDocMeta | undefined =>
  (file as File & { __linkedDocMeta?: LinkedDocMeta }).__linkedDocMeta;

const dataUrlToFile = async (
  dataUrl: string,
  fileName: string,
  mimeType: string,
) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
};

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    accountId: number;
  };
}

const BookingModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorCustomUserTypeMode = useAppSelector(
    (state) => state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only
  );
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const [openSelectDocModal, setOpenSelectDocModal] = useState(false);
  const [activeProductTypeId, setActiveProductTypeId] = useState<number | null>(
    null,
  );
  const [bookingDrafts, setBookingDrafts] = useState<BookingDraftMap>({});
  const leadId = data?.id;
  const accountId = data?.accountId;
  const router = useRouter();
  const queryClient = useQueryClient();

  console.log("LeadId :- ", leadId);
  const { data: ismPaymentInfo } = useISMPaymentInfo(leadId);
  console.log("PaymentInfo :- ", ismPaymentInfo);
  console.log("Amount :- ", ismPaymentInfo?.amount);
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
    open,
  );
  const { data: quotationData } = useQuotationDoc(vendorId, leadId);
  const { data: designData } = useDesignsDoc(vendorId ?? 0, leadId ?? 0);
  useBookingLeadById(vendorId, leadId);
  const structureInstances: LeadProductStructureInstance[] = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data],
  );
  const productTypeTabs = React.useMemo<BookingProductTypeTab[]>(() => {
    if (!handlesLargeScaleProjects) {
      return [];
    }

    const tabs = new Map<number, BookingProductTypeTab>();

    for (const instance of structureInstances) {
      const productTypeId =
        instance.productType?.id ??
        instance.productItemCode?.productStructure?.productType?.id;
      const productTypeLabel =
        instance.productType?.type ||
        instance.productItemCode?.productStructure?.productType?.type;

      if (!productTypeId || !productTypeLabel) {
        continue;
      }

      const existing = tabs.get(productTypeId);
      if (existing) {
        existing.instanceIds.push(instance.id);
        if (instance.title && !existing.instanceTitles.includes(instance.title)) {
          existing.instanceTitles.push(instance.title);
        }
        continue;
      }

      tabs.set(productTypeId, {
        productTypeId,
        label: productTypeLabel,
        instanceIds: [instance.id],
        instanceTitles: instance.title ? [instance.title] : [],
      });
    }

    return Array.from(tabs.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [handlesLargeScaleProjects, structureInstances]);
  const activeProductTypeTab = React.useMemo(
    () =>
      productTypeTabs.find(
        (tab) => tab.productTypeId === activeProductTypeId,
      ) ?? null,
    [activeProductTypeId, productTypeTabs],
  );

  const { data: headSiteSupervisors, isLoading } =
    useHeadSiteSupervisors(vendorId!);
  const vendorUser = headSiteSupervisors?.data?.head_site_supervisors || [];
  const hasMultipleSupervisors = vendorUser.length > 1;
  const { data: headSupervisorMapping } =
    useHeadSiteSupervisorFranchiseMapping(
      vendorId,
      franchiseId ?? undefined,
      hasMultipleSupervisors
    );
  const { data: franchises = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId
  );
  const headOfficeFranchiseId = React.useMemo(
    () => franchises.find((f) => f.is_head_office)?.id,
    [franchises]
  );
  const isMultiGroupBooking = productTypeTabs.length > 1;
  const { mutateAsync, isPending } = useMoveToBookingStage();
  const form = useForm<BookingFormValues>({
    resolver: bookingResolver,
    defaultValues: defaultBookingValues,
    mode: "onChange",
  });

  const buildDefaultBookingValues = React.useCallback(
    (assignTo = ""): BookingFormValues => ({
      ...defaultBookingValues,
      assign_to: assignTo,
    }),
    [],
  );

  const getCurrentDraft = React.useCallback(
    (): BookingFormValues => ({
      final_documents: form.getValues("final_documents") || [],
      amount_received: form.getValues("amount_received") ?? 0,
      final_booking_amount: form.getValues("final_booking_amount") ?? 0,
      payment_details_document: form.getValues("payment_details_document") || [],
      payment_text: form.getValues("payment_text") || "",
      assign_to: form.getValues("assign_to") || "",
      mrp_value: form.getValues("mrp_value") ?? 0,
    }),
    [form],
  );

  const linkedDocsByKey = React.useMemo(() => {
    const map = new Map<string, { id: number; doc_og_name: string; signedUrl: string }>();
    const quotations = quotationData?.data?.documents || [];
    const designs = designData?.data?.documents || [];

    for (const doc of quotations) {
      map.set(`quotation:${doc.id}`, {
        id: doc.id,
        doc_og_name: doc.doc_og_name,
        signedUrl: doc.signedUrl,
      });
    }

    for (const doc of designs) {
      map.set(`design:${doc.id}`, {
        id: doc.id,
        doc_og_name: doc.doc_og_name,
        signedUrl: doc.signedUrl,
      });
    }

    return map;
  }, [designData?.data?.documents, quotationData?.data?.documents]);

  const validateBookingValues = React.useCallback(
    (values: BookingFormValues) => {
      const result = bookingSchema.safeParse(values);
      if (!result.success) {
        return false;
      }

      if (
        vendorCustomUserTypeMode !== true &&
        (!values.assign_to || values.assign_to.trim() === "")
      ) {
        return false;
      }

      const hasFileError =
        values.payment_details_document?.some((file: any) => file?.error) ||
        values.final_documents?.some((file: any) => file?.error);

      if (hasFileError) {
        return false;
      }

      return true;
    },
    [vendorCustomUserTypeMode],
  );

  const persistDraft = React.useCallback(
    (productTypeId: number, values: BookingFormValues) => {
      setBookingDrafts((prev) => {
        const next = { ...prev };

        for (const key of Object.keys(next)) {
          const numericKey = Number(key);
          next[numericKey] = {
            ...next[numericKey],
            assign_to: values.assign_to,
          };
        }

        next[productTypeId] = {
          ...values,
        };

        return next;
      });
    },
    [],
  );

  const serializeFiles = React.useCallback(async (files: File[]) => {
    const serialized = await Promise.all(
      files.map(async (file): Promise<PersistedDocRef> => {
        const linkedMeta = getLinkedDocMeta(file);
        if (linkedMeta) {
          return {
            kind: "linked-doc",
            docId: linkedMeta.docId,
            docType: linkedMeta.docType,
          };
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        return {
          kind: "inline",
          name: file.name,
          mimeType: file.type || getMimeTypeFromFileName(file.name),
          dataUrl,
        };
      }),
    );

    return serialized;
  }, []);

  const persistDraftsToStorage = React.useCallback(
    async (drafts: BookingDraftMap) => {
      const storageKey = getBookingDraftStorageKey(vendorId, leadId);
      if (!storageKey || typeof window === "undefined") return;

      const entries = await Promise.all(
        Object.entries(drafts).map(async ([productTypeId, values]) => [
          productTypeId,
          {
            ...values,
            final_documents: await serializeFiles(values.final_documents || []),
            payment_details_document: await serializeFiles(
              values.payment_details_document || [],
            ),
          },
        ]),
      );

      window.localStorage.setItem(
        storageKey,
        JSON.stringify(Object.fromEntries(entries)),
      );
    },
    [leadId, serializeFiles, vendorId],
  );

  const hydratePersistedFiles = React.useCallback(
    async (refs: PersistedDocRef[]) => {
      const restored = await Promise.all(
        refs.map(async (ref) => {
          if (ref.kind === "linked-doc") {
            const match = linkedDocsByKey.get(`${ref.docType}:${ref.docId}`);
            if (!match) {
              return null;
            }

            const file = await urlToFile(
              match.signedUrl,
              match.doc_og_name,
              getMimeTypeFromFileName(match.doc_og_name),
            );
            Object.assign(file, {
              __linkedDocMeta: {
                docId: ref.docId,
                docType: ref.docType,
              } satisfies LinkedDocMeta,
            });
            return file;
          }

          return dataUrlToFile(ref.dataUrl, ref.name, ref.mimeType);
        }),
      );

      return restored.filter((file): file is File => file instanceof File);
    },
    [linkedDocsByKey],
  );

  const tabCompletion = React.useMemo(() => {
    const completion = new Map<number, boolean>();

    for (const tab of productTypeTabs) {
      const values =
        tab.productTypeId === activeProductTypeId
          ? getCurrentDraft()
          : bookingDrafts[tab.productTypeId] ||
            buildDefaultBookingValues(form.getValues("assign_to") || "");

      completion.set(tab.productTypeId, validateBookingValues(values));
    }

    return completion;
  }, [
    activeProductTypeId,
    bookingDrafts,
    buildDefaultBookingValues,
    form,
    getCurrentDraft,
    productTypeTabs,
    validateBookingValues,
  ]);

  const completedGroupCount = React.useMemo(
    () =>
      productTypeTabs.filter((tab) => tabCompletion.get(tab.productTypeId))
        .length,
    [productTypeTabs, tabCompletion],
  );

  React.useEffect(() => {
    if (!open) return;
    if (productTypeTabs.length === 0) {
      setActiveProductTypeId(null);
      return;
    }

    setBookingDrafts((prev) => {
      const assignTo = form.getValues("assign_to") || "";
      const next: BookingDraftMap = {};

      for (const tab of productTypeTabs) {
        next[tab.productTypeId] =
          prev[tab.productTypeId] || buildDefaultBookingValues(assignTo);
      }

      return next;
    });

    setActiveProductTypeId((current) =>
      current &&
      productTypeTabs.some((tab) => tab.productTypeId === current)
        ? current
        : productTypeTabs[0].productTypeId,
    );
  }, [buildDefaultBookingValues, form, open, productTypeTabs]);

  React.useEffect(() => {
    const storageKey = getBookingDraftStorageKey(vendorId, leadId);
    if (
      !open ||
      !storageKey ||
      typeof window === "undefined" ||
      productTypeTabs.length === 0
    ) {
      return;
    }

    const rawDrafts = window.localStorage.getItem(storageKey);
    if (!rawDrafts) {
      return;
    }

    let isCancelled = false;

    const hydrateDrafts = async () => {
      try {
        const parsed = JSON.parse(rawDrafts) as PersistedBookingDraftMap;
        const nextDrafts: BookingDraftMap = {};

        for (const tab of productTypeTabs) {
          const persisted = parsed[tab.productTypeId];
          if (!persisted) continue;

          nextDrafts[tab.productTypeId] = {
            ...defaultBookingValues,
            ...persisted,
            final_documents: await hydratePersistedFiles(
              persisted.final_documents || [],
            ),
            payment_details_document: await hydratePersistedFiles(
              persisted.payment_details_document || [],
            ),
          };
        }

        if (isCancelled || Object.keys(nextDrafts).length === 0) {
          return;
        }

        setBookingDrafts((prev) => ({
          ...prev,
          ...nextDrafts,
        }));
      } catch (error) {
        console.error("Failed to hydrate booking drafts", error);
      }
    };

    void hydrateDrafts();

    return () => {
      isCancelled = true;
    };
  }, [
    hydratePersistedFiles,
    leadId,
    open,
    productTypeTabs,
    vendorId,
  ]);

  React.useEffect(() => {
    if (!open || !activeProductTypeId || productTypeTabs.length === 0) return;

    const assignTo = form.getValues("assign_to") || "";
    const nextDraft =
      bookingDrafts[activeProductTypeId] || buildDefaultBookingValues(assignTo);

    form.reset(nextDraft);
  }, [
    activeProductTypeId,
    bookingDrafts,
    buildDefaultBookingValues,
    form,
    open,
    productTypeTabs.length,
  ]);

  React.useEffect(() => {
    if (!open) return;
    if (vendorCustomUserTypeMode === true) return;
    if (!vendorUser.length) {
      // console.log(
      //   "[BookingModal] auto-select failed: no head site supervisors available"
      // );
      return;
    }

    // 3. Auto-select logic if we have multiple site supervisors but only one mapped for the franchise
    let selected: any = vendorUser.length === 1 ? vendorUser[0] : undefined;

    if (!selected && hasMultipleSupervisors) {
      let mappedUserId = null;
      if (Array.isArray(headSupervisorMapping) && headSupervisorMapping.length === 1) {
        mappedUserId = headSupervisorMapping[0]?.id;
      } else if (headSupervisorMapping && !Array.isArray(headSupervisorMapping)) {
        mappedUserId = headSupervisorMapping.user_id;
      }

      if (mappedUserId) {
        selected = vendorUser.find((user: any) => user.id === mappedUserId);
      }
    }

    if (!selected && hasMultipleSupervisors && headOfficeFranchiseId) {
      selected = vendorUser.find(
        (user: any) => user.franchise_id === headOfficeFranchiseId
      );
    }

    if (!selected) {
      selected = vendorUser[0];
    }

    if (!selected) {
      // console.log(
      //   "[BookingModal] auto-select failed: no matching head site supervisor"
      // );
      return;
    }

    form.setValue("assign_to", String(selected.id), {
      shouldValidate: true,
    });
    if (productTypeTabs.length > 0) {
      setBookingDrafts((prev) => {
        const next = { ...prev };

        for (const tab of productTypeTabs) {
          next[tab.productTypeId] = {
            ...(next[tab.productTypeId] || buildDefaultBookingValues()),
            assign_to: String(selected.id),
          };
        }

        return next;
      });
    }
    // console.log(
    //   "[BookingModal] auto-selected head site supervisor",
    //   selected.user_name
    // );
  }, [
    open,
    form,
    vendorUser,
    hasMultipleSupervisors,
    headSupervisorMapping,
    headOfficeFranchiseId,
    productTypeTabs,
    buildDefaultBookingValues,
  ]);

  const submitSingleBooking = React.useCallback(
    async (values: BookingFormValues, productTypeId?: number) => {
      if (!leadId || !accountId || !vendorId || !userId) {
        throw new Error("Missing booking identifiers");
      }

      const payload: BookingPayload = {
        lead_id: leadId,
        account_id: accountId,
        vendor_id: vendorId,
        created_by: userId,
        product_type_id: productTypeId,
        bookingAmount: values.amount_received,
        bookingAmountPaymentDetailsText: values.payment_text,
        finalBookingAmount: values.final_booking_amount,
        mrpValue: values.mrp_value,
        booking_payment_file: values.payment_details_document,
        final_documents: values.final_documents,
      };

      if (
        vendorCustomUserTypeMode !== true &&
        values.assign_to &&
        values.assign_to.trim() !== ""
      ) {
        payload.siteSupervisorId = Number(values.assign_to);
      }

      await mutateAsync(payload);
    },
    [
      accountId,
      leadId,
      mutateAsync,
      userId,
      vendorCustomUserTypeMode,
      vendorId,
    ],
  );

  const onSubmit: SubmitHandler<BookingFormValues> = async (values) => {
    if (vendorCustomUserTypeMode !== true && (!values.assign_to || values.assign_to.trim() === "")) {
      form.setError("assign_to", { type: "manual", message: "Site supervisor is required." });
      return;
    }

    if (values.amount_received > values.final_booking_amount) {
      toastManager.add({ title: "Booking Advance Received should not be greater than Total Booking Value", type: "error" });
      return;
    }

    if (!leadId || !accountId || !vendorId || !userId) {
      console.error("❌ Missing IDs in booking payload");
      return;
    }

    if (productTypeTabs.length > 0 && !activeProductTypeTab) {
      toastManager.add({
        title: "Please select a product type before submitting.",
        type: "error",
      });
      return;
    }

    // 🚨 check file errors
    const hasFileError =
      values.payment_details_document?.some((f: any) => f.error) ||
      values.final_documents?.some((f: any) => f.error);

    if (hasFileError) {
      toastManager.add({ title: "Please fix file upload errors before submitting.", type: "error" });
      return;
    }

    if (values.final_booking_amount > values.mrp_value) {
      toastManager.add({ title: "Total Booking Value cannot be greater than MRP Value", type: "error" });
      return;
    }

    try {
      if (isMultiGroupBooking) {
        if (!activeProductTypeTab) {
          toastManager.add({
            title: "Please select an item group before submitting.",
            type: "error",
          });
          return;
        }

        persistDraft(activeProductTypeTab.productTypeId, values);

        const mergedDrafts: BookingDraftMap = {
          ...bookingDrafts,
          [activeProductTypeTab.productTypeId]: values,
        };

        const incompleteTab = productTypeTabs.find(
          (tab) => !validateBookingValues(mergedDrafts[tab.productTypeId]),
        );

        if (incompleteTab) {
          if (incompleteTab.productTypeId !== activeProductTypeTab.productTypeId) {
            setActiveProductTypeId(incompleteTab.productTypeId);
          }
          toastManager.add({
            title: `Complete booking details for ${incompleteTab.label} before final submission.`,
            type: "error",
          });
          return;
        }

        for (const tab of productTypeTabs) {
          await submitSingleBooking(mergedDrafts[tab.productTypeId], tab.productTypeId);
        }

        const storageKey = getBookingDraftStorageKey(vendorId, leadId);
        if (storageKey && typeof window !== "undefined") {
          window.localStorage.removeItem(storageKey);
        }
      } else {
        await submitSingleBooking(
          values,
          handlesLargeScaleProjects ? activeProductTypeTab?.productTypeId : undefined,
        );
      }

      toastManager.add({ title: "Booking saved successfully!", type: "success" });

      createLeadChatRoom(leadId!, userId!).catch(() => {});

      if (values.assign_to) {
        const today = new Date().toISOString().split("T")[0];
        assignTaskBooking(leadId!, {
          task_type: "Assign a Site Supervisor",
          due_date: today,
          user_id: Number(values.assign_to),
          created_by: userId!,
        }).catch(() => {});
      }

      queryClient.invalidateQueries({
        queryKey: ["leadStats", vendorId, userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["universal-stage-leads"],
        exact: false,
      });

      onOpenChange(false);
      form.reset(defaultBookingValues);
      setBookingDrafts({});

      router.push("/dashboard/leads/booking-stage");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
      console.error("❌ Booking error:", err);
    }
  };

  const handleReset = () => {
    if (isMultiGroupBooking && activeProductTypeId) {
      const assignTo = form.getValues("assign_to") || "";
      const nextValues = buildDefaultBookingValues(assignTo);
      form.reset(nextValues);
      persistDraft(activeProductTypeId, nextValues);
      void persistDraftsToStorage({
        ...bookingDrafts,
        [activeProductTypeId]: nextValues,
      });
      return;
    }

    form.reset(buildDefaultBookingValues(form.getValues("assign_to") || ""));
  };

  const handleTabChange = (nextProductTypeId: number) => {
    if (nextProductTypeId === activeProductTypeId) return;
    if (activeProductTypeId) {
      const currentDraft = getCurrentDraft();
      const nextDrafts = {
        ...bookingDrafts,
        [activeProductTypeId]: currentDraft,
      };
      persistDraft(activeProductTypeId, currentDraft);
      void persistDraftsToStorage(nextDrafts);
    }
    setActiveProductTypeId(nextProductTypeId);
  };

  const handleSaveCurrentGroup = async () => {
    const isValid = await form.trigger();
    if (!isValid || !activeProductTypeTab) {
      return;
    }

    const values = getCurrentDraft();
    persistDraft(activeProductTypeTab.productTypeId, values);
    await persistDraftsToStorage({
      ...bookingDrafts,
      [activeProductTypeTab.productTypeId]: values,
    });

    const nextIncompleteTab = productTypeTabs.find(
      (tab) =>
        tab.productTypeId !== activeProductTypeTab.productTypeId &&
        !tabCompletion.get(tab.productTypeId),
    );

    toastManager.add({
      title: `${activeProductTypeTab.label} booking details saved.`,
      type: "success",
    });

    if (nextIncompleteTab) {
      setActiveProductTypeId(nextIncompleteTab.productTypeId);
    }
  };



  console.log("vendorCustomUserTypeMode..........", vendorCustomUserTypeMode)
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Booking Form"
      description="Complete the booking details and attach all required documents."
      size="lg"
    > 
      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center p-6 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading booking details...
          </span>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              const errorKeys = Object.keys(errors);
              if (errorKeys.length > 0) {
                const firstErrorKey = errorKeys[0];
                const el = document.querySelector(`[data-name="${firstErrorKey}"]`);
                if (el) {
                  const isHidden = el.getBoundingClientRect().height === 0;
                  const targetScrollEl = isHidden ? (el.parentElement || el) : el;
                  targetScrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
                  const focusable = el.querySelector("input, select, textarea, button");
                  if (focusable instanceof HTMLElement) {
                    focusable.focus({ preventScroll: true });
                  }
                }
              }
            })}
            className="space-y-6 p-5"
          >
            {productTypeTabs.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Item Group</p>
                  <p className="text-xs text-muted-foreground">
                    Complete each item group before final booking submission.
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full px-2 py-1">
                  {completedGroupCount}/{productTypeTabs.length} completed
                </Badge>
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {productTypeTabs.map((tab) => (
                  <div
                    key={tab.productTypeId}
                    className={cn(
                      "relative shrink-0 rounded-xl border transition-all",
                      activeProductTypeId === tab.productTypeId
                        ? "border-primary/30 bg-background"
                        : "border-border/60 bg-background/70 hover:border-border hover:bg-background",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleTabChange(tab.productTypeId)}
                      className={cn(
                        "min-w-[180px] px-4 py-3 text-left focus-visible:outline-none",
                        "focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-sm font-semibold",
                              activeProductTypeId === tab.productTypeId
                                ? "text-foreground"
                                : "text-foreground/90",
                            )}
                          >
                            {tab.label}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tab.instanceIds.length}{" "}
                            {tab.instanceIds.length === 1
                              ? "instance"
                              : "instances"}
                          </p>
                        </div>
                        {tabCompletion.get(tab.productTypeId) ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <CircleDashed className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            tabCompletion.get(tab.productTypeId)
                              ? "default"
                              : "outline"
                          }
                          className="rounded-full"
                        >
                          {tabCompletion.get(tab.productTypeId)
                            ? "Complete"
                            : "Pending"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {tab.instanceIds.length} linked
                        </span>
                      </div>
                      {activeProductTypeId === tab.productTypeId && (
                        <span className="mt-3 block h-1 rounded-full bg-primary/80" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {isMultiGroupBooking && (
                <div className="mt-3 rounded-xl border border-dashed border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                  {completedGroupCount === productTypeTabs.length
                    ? "All item groups are complete. Final submit will now move the lead to booking stage."
                    : `Complete all ${productTypeTabs.length} item groups before final submit. The modal will stay open until every group is filled.`}
                </div>
              )}
            </div>
          )}

          {/* File Upload Section */}

          <FormField
            control={form.control}
            name="final_documents"
            render={({ field }) => (
              <FormItem data-name="final_documents">
                <FormLabel className="text-sm flex  justify-between">
                  Booking Documents (Quotations + Design) *
                  {vendorCustomUserTypeMode !== true && (
                    <Button
                      type="button"
                      onClick={() => setOpenSelectDocModal(true)}
                    >
                      Select Documents
                    </Button>
                  )}
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".pptx.,.ppt, .pdf, .jpg, .jpeg, .png, .pyo"
                    isUploadDeniedAndSelectEnabled={
                      vendorCustomUserTypeMode === true
                    }
                    onSelectEnabledClick={() => setOpenSelectDocModal(true)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Amount fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="mrp_value"
                render={({ field }) => (
                  <FormItem data-name="mrp_value">
                    <FormLabel className="text-sm">MRP Value *</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) => field.onChange(val ?? 0)}
                        placeholder="Enter MRP Value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="final_booking_amount"
                render={({ field }) => (
                  <FormItem data-name="final_booking_amount">
                    <FormLabel className="text-sm">
                      Total Booking Value *
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={
                          (val) => field.onChange(val ?? 0) // fallback to 0 if undefined
                        }
                        placeholder="Enter Total Booking Value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_received"
                render={({ field }) => (
                  <FormItem data-name="amount_received">
                    <FormLabel className="text-sm">
                      Booking Advance Received
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) =>
                          field.onChange(val ? Number(val) : 0)
                        }
                        placeholder="Enter received amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {vendorCustomUserTypeMode !== true && hasMultipleSupervisors && (
                <FormField
                  control={form.control}
                  name="assign_to"
                  render={({ field }) => (
                    <FormItem data-name="assign_to">
                      <FormLabel className="text-sm">Assign Head Site Supervisor *</FormLabel>
                      <AssignToPicker
                        data={vendorUser.map((u: any) => ({ id: u.id, label: u.user_name }))}
                        value={field.value ? Number(field.value) : undefined}
                        onChange={(val) => field.onChange(val ? String(val) : "")}
                        placeholder="Search site supervisor..."
                        emptyLabel="Select an option"
                        className="h-9"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {ismPaymentInfo?.amount && (
              <p className="text-sm">
                <span className="font-bold">
                  {formatCurrencyINR(ismPaymentInfo.amount)}
                </span>{" "}
                ISM amount has already been paid by the client.
              </p>
            )}
          </div>

          {/* Payment Details fields */}
          <FormField
            control={form.control}
            name="payment_details_document"
            render={({ field }) => (
              <FormItem data-name="payment_details_document">
                <FormLabel className="text-sm">
                  Booking Amount Payment Details Document
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".jpg,.jpeg,.png"
                    multiple={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_text"
            render={({ field }) => (
              <FormItem data-name="payment_text">
                <FormLabel className="text-sm">Payment Details</FormLabel>
                <FormControl>
                  <TextAreaInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter your payment details"
                  />
                </FormControl>
                <FormMessage className="-mt-7" />
              </FormItem>
            )}
          />

            <div className="flex justify-end space-x-3 pt-4 ">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="rounded-md"
              >
                Reset
              </Button>
              {isMultiGroupBooking && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  disabled={isPending || form.formState.isSubmitting}
                  onClick={handleSaveCurrentGroup}
                >
                  Save This Group
                </Button>
              )}
              <Button
                type="submit"
                className="rounded-md"
                disabled={isPending || form.formState.isSubmitting}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : isMultiGroupBooking ? (
                  "Submit All Groups"
                ) : (
                  "Submit Booking"
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <SelectDocumentModal
        open={openSelectDocModal}
        onOpenChange={setOpenSelectDocModal}
        leadId={leadId!}
        onSelectDocs={(files) => {
          const nextFiles =
            vendorCustomUserTypeMode === true
              ? files
              : [...(form.getValues("final_documents") || []), ...files];

          form.setValue("final_documents", nextFiles, {
            shouldValidate: true,
          });

          if (isMultiGroupBooking && activeProductTypeId) {
            const nextValues = {
              ...getCurrentDraft(),
              final_documents: nextFiles,
            };
            const nextDrafts = {
              ...bookingDrafts,
              [activeProductTypeId]: nextValues,
            };
            persistDraft(activeProductTypeId, nextValues);
            void persistDraftsToStorage(nextDrafts);
          }
        }}
      />
    </BaseModal>
  );
};

export default BookingModal;
