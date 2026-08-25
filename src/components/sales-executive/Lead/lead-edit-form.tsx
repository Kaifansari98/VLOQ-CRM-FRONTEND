"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  useSourceTypes,
  useSiteTypes,
  useProductStructureTypes,
  useProductTypes,
} from "@/hooks/useTypesMaster";
import {
  updateLead,
  getLeadById,
  EditLeadPayload,
  updateLeadProductType,
  clearLeadProductStructures,
  deleteLeadProductStructureInstance,
  createLeadProductStructureInstance,
  getLeadProductStructureInstances,
  LeadProductStructureInstance,
  unshortenUrl,
} from "@/api/leads";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import StructureQuantityCards from "@/components/sales-executive/Lead/structure-quantity-cards";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parsePhoneNumber } from "libphonenumber-js";
import TextAreaInput from "@/components/origin-text-area";
import MapPicker from "@/components/MapPicker";
import { MapPin, Loader2 } from "lucide-react";
import CustomeDatePicker from "@/components/date-picker";
import AssignToPicker from "@/components/assign-to-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastError } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useClients } from "@/hooks/useClientMaster";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

// ✅ Utility: Normalize phone numbers to E.164 format
const toE164 = (number?: string, countryCode?: string): string => {
  if (!number) return "";

  // Already in E.164 format
  if (number.startsWith("+")) return number;

  // Has country code from backend
  if (countryCode) return `${countryCode}${number}`;

  // Fallback to India (adjust if needed for your use case)
  return `+91${number}`;
};

const priorityOptions = [
  { id: "High", label: "High" },
  { id: "Medium", label: "Medium" },
  { id: "Low", label: "Low" },
] as const;

const isPhoneValueValid = (value?: string) => {
  if (!value || value.trim() === "") return false;
  try {
    const parsed = parsePhoneNumber(value);
    return Boolean(parsed && parsed.isValid());
  } catch (error) {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length >= 10;
  }
};

const requiredPhoneField = z
  .string()
  .min(1, "Phone number is required")
  .refine(isPhoneValueValid, "Please enter a valid phone number");

const optionalPhoneField = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.trim() === "" || isPhoneValueValid(value),
    {
      message: "Please enter a valid alternate phone number",
    },
  );

const optionalArchitectPhoneField = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.trim() === "" || isPhoneValueValid(value),
    {
      message: "Please enter a valid architect number",
    },
  );

const optionalDateField = z
  .string()
  .optional();

const completeFormSchema = (isB2b: boolean, referenceSourceIds: string[]) =>
  z
    .object({
      firstname: z.string().trim().min(1, "First name is required").max(300),
      lastname: z
        .string()
        .trim()
        .min(1, isB2b ? "Project name is required" : "Last name is required")
        .max(300),
      contact_no: isB2b
        ? z.string().optional().or(z.literal(""))
        : requiredPhoneField,
      email: z
        .string()
        .trim()
        .email("Please enter a valid email")
        .or(z.literal("")),
      site_type_id: isB2b
        ? z.string().optional().or(z.literal(""))
        : z.string().min(1, "Please select a site type"),
      site_address: isB2b
        ? z
            .string()
            .optional()
            .or(z.literal(""))
            .refine(
              (val) => !val || !/^(https?:\/\/[^\s]+)/i.test(val.trim()),
              { message: "Invalid link" },
            )
        : z
            .string()
            .min(1, "Site Address is required")
            .max(2000)
            .refine(
              (val) => !/^(https?:\/\/[^\s]+)/i.test(val.trim()),
              { message: "Invalid link" },
            ),
      site_map_link: z.string().optional().or(z.literal("")),
      source_id: z.string().min(1, "Please select a source"),
      refered_by: z.string().max(300).optional().or(z.literal("")),
      client_id: isB2b
        ? z.string().min(1, "Please select a client")
        : z.string().optional().or(z.literal("")),
      order_number: z.string().max(100).optional().or(z.literal("")),
      priority: z.enum(["High", "Medium", "Low"]),
      alt_contact_no: optionalPhoneField,
      archetech_name: z.string().max(300).optional(),
      archetech_number: optionalArchitectPhoneField,
      designer_remark: z.string().max(2000).optional(),
      product_types: z.array(z.string()).optional(),
      product_structures: z.array(z.string()).optional(),
      initial_site_measurement_date: optionalDateField,
    })
    .refine(
      (data) => {
        if (data.product_types && data.product_types.length > 0) {
          return data.product_structures && data.product_structures.length > 0;
        }
        return true;
      },
      {
        message: "Please select at least one Furniture Structure",
        path: ["product_structures"],
      },
    )
    .superRefine((values, ctx) => {
      const requiresReferenceField =
        isB2b &&
        typeof values.source_id === "string" &&
        referenceSourceIds.includes(values.source_id);

      if (requiresReferenceField && !values.refered_by?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["refered_by"],
          message: "Please enter referred by",
        });
      }
    });

const draftFormSchema = (isB2b: boolean, referenceSourceIds: string[]) =>
  z
    .object({
      firstname: z.string().max(300).optional(),
      lastname: z.string().max(300).optional(),
      contact_no: z
        .string()
        .optional()
        .refine(
          (value) => !value || value.trim() === "" || isPhoneValueValid(value),
          {
            message: "Please enter a valid phone number",
          },
        ),
      email: z
        .string()
        .trim()
        .email("Please enter a valid email")
        .or(z.literal("")),
      site_type_id: z.string().optional(),
      site_address: z
        .string()
        .optional()
        .refine(
          (val) => !val || !/^(https?:\/\/[^\s]+)/i.test(val.trim()),
          { message: "Invalid link" },
        ),
      site_map_link: z.string().optional().or(z.literal("")),
      source_id: isB2b
        ? z.string().min(1, "Please select a source")
        : z.string().optional(),
      refered_by: z.string().max(300).optional().or(z.literal("")),
      client_id: isB2b
        ? z.string().min(1, "Please select a client")
        : z.string().optional().or(z.literal("")),
      order_number: z.string().max(100).optional().or(z.literal("")),
      priority: z.enum(["High", "Medium", "Low"]).or(z.literal("")),
      alt_contact_no: optionalPhoneField,
      archetech_name: z.string().max(300).optional(),
      archetech_number: optionalArchitectPhoneField,
      designer_remark: z.string().max(2000).optional(),
      product_types: z.array(z.string()).optional(),
      product_structures: z.array(z.string()).optional(),
      initial_site_measurement_date: optionalDateField,
    })
    .refine(
      (data) => {
        if (data.product_types && data.product_types.length > 0) {
          return data.product_structures && data.product_structures.length > 0;
        }
        return true;
      },
      {
        message: "Please select at least one Furniture Structure",
        path: ["product_structures"],
      },
    )
    .superRefine((values, ctx) => {
      const requiresReferenceField =
        isB2b &&
        typeof values.source_id === "string" &&
        referenceSourceIds.includes(values.source_id);

      if (requiresReferenceField && !values.refered_by?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["refered_by"],
          message: "Please enter referred by",
        });
      }
    });

type FormValues = z.infer<ReturnType<typeof draftFormSchema>>;

interface EditLeadFormProps {
  leadData: any;
  onClose: () => void;
}

export default function EditLeadForm({ leadData, onClose }: EditLeadFormProps) {
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [isDraftLead, setIsDraftLead] = useState(false);
  const [leadStage, setLeadStage] = useState("");
  const [leadFranchiseId, setLeadFranchiseId] = useState<number | null>(null);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const createdBy = useAppSelector((state) => state.auth.user?.id);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isCustomVendorFlow = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );
  const isB2b = useMemo(() => {
    const leadFranchise = franchisesForB2b.find(
      (franchise) => franchise.id === leadFranchiseId,
    );
    return leadFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, leadFranchiseId]);

  const { data: clientsData, isLoading: isClientsLoading } = useClients({
    vendor_id: vendorId,
    limit: 200,
    activeOnly: true,
  });
  const clientsList = clientsData?.data?.data ?? [];
  const [mapOpen, setMapOpen] = useState(false);
  const [savedMapLocation, setSavedMapLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const handleAddressChange = async (value: string, onChangeField: (v: string) => void) => {
    onChangeField(value);

    const isUrl = /^(https?:\/\/[^\s]+)/i.test(value.trim());
    if (!isUrl) {
      form.clearErrors("site_address");
      if (savedMapLocation) {
        setSavedMapLocation((prev) =>
          prev ? { ...prev, address: value } : null
        );
      }
      return;
    }

    const isGoogleMapsUrl = /^(https?:\/\/)?(www\.)?(google\.[a-z.]{2,6}\/maps|maps\.google\.[a-z.]{2,6}|maps\.app\.goo\.gl|goo\.gl\/maps|share\.google)/i.test(value.trim());
    if (!isGoogleMapsUrl) {
      form.setError("site_address", { type: "manual", message: "Invalid link" });
      return;
    }

    setIsResolvingAddress(true);
    form.clearErrors("site_address");

    try {
      let targetUrl = value.trim();
      if (/maps\.app\.goo\.gl|goo\.gl\/maps|share\.google/i.test(targetUrl)) {
        try {
          targetUrl = await unshortenUrl(targetUrl);
        } catch (e) {
          form.setError("site_address", { type: "manual", message: "Invalid link" });
          setIsResolvingAddress(false);
          return;
        }
      }
      let lat: number | null = null;
      let lng: number | null = null;

      const atMatch = targetUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      const llMatch = targetUrl.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);

      if (atMatch) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
      } else if (llMatch) {
        lat = parseFloat(llMatch[1]);
        lng = parseFloat(llMatch[2]);
      }

      let searchQuery: string | null = null;
      const placeNameMatch = targetUrl.match(/\/place\/([^\/]+)/);
      const qQueryMatch = targetUrl.match(/[?&]q=([^&]+)/);

      if (placeNameMatch) {
        const decoded = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
        if (!/^-?\d+\.\d+,-?\d+\.\d+$/.test(decoded.trim())) {
          searchQuery = decoded;
        }
      }
      if (!searchQuery && qQueryMatch) {
        const decoded = decodeURIComponent(qQueryMatch[1].replace(/\+/g, ' '));
        if (!/^-?\d+\.\d+,-?\d+\.\d+$/.test(decoded.trim())) {
          searchQuery = decoded;
        }
      }

      if (typeof window === "undefined" || !(window as any).google?.maps) {
        form.setError("site_address", { type: "manual", message: "Maps API not loaded" });
        setIsResolvingAddress(false);
        return;
      }

      const geocoder = new (window as any).google.maps.Geocoder();

      if (searchQuery) {
        geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
          if (form.getValues("site_address") !== value) {
            setIsResolvingAddress(false);
            return;
          }
          if (status === "OK" && results?.[0]) {
            const address = results[0].formatted_address;
            const location = results[0].geometry.location;
            onChangeField(address);
            setSavedMapLocation({ lat: location.lat(), lng: location.lng(), address });
            form.setValue("site_map_link", `https://www.google.com/maps?q=${location.lat()},${location.lng()}`, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            form.clearErrors("site_address");
            setIsResolvingAddress(false);
          } else if (lat !== null && lng !== null) {
            // Fallback to coordinates
            geocoder.geocode({ location: { lat, lng } }, (res: any, st: any) => {
              if (form.getValues("site_address") !== value) return;
              if (st === "OK" && res?.[0]) {
                const address = res[0].formatted_address;
                onChangeField(address);
                setSavedMapLocation({ lat, lng, address });
                form.setValue("site_map_link", `https://www.google.com/maps?q=${lat},${lng}`, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                form.clearErrors("site_address");
              } else {
                form.setError("site_address", { type: "manual", message: "Invalid link" });
              }
              setIsResolvingAddress(false);
            });
          } else {
            form.setError("site_address", { type: "manual", message: "Invalid link" });
            setIsResolvingAddress(false);
          }
        });
      } else if (lat !== null && lng !== null) {
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (form.getValues("site_address") !== value) {
            setIsResolvingAddress(false);
            return;
          }
          if (status === "OK" && results?.[0]) {
            const address = results[0].formatted_address;
            onChangeField(address);
            setSavedMapLocation({ lat, lng, address });
            form.setValue("site_map_link", `https://www.google.com/maps?q=${lat},${lng}`, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            form.clearErrors("site_address");
          } else {
            form.setError("site_address", { type: "manual", message: "Invalid link" });
          }
          setIsResolvingAddress(false);
        });
      } else {
        form.setError("site_address", { type: "manual", message: "Invalid link" });
        setIsResolvingAddress(false);
      }
    } catch (error) {
      form.setError("site_address", { type: "manual", message: "Invalid link" });
      setIsResolvingAddress(false);
    }
  };

  // Product type & structure state
  const [structureInstanceDetails, setStructureInstanceDetails] = useState<
    { title: string; desc: string }[]
  >([]);
  const previousStructuresRef = useRef<string[]>([]);
  const [showMaxStructureTooltip, setShowMaxStructureTooltip] = useState(false);

  const [originalInitialDate, setOriginalInitialDate] = useState<string>("");
  const maxStructureTooltipTimerRef = useRef<number | null>(null);
  const [initialProductTypeId, setInitialProductTypeId] = useState<
    number | null
  >(null);
  const [initialStructureIds, setInitialStructureIds] = useState<string[]>([]);
  const [existingStructureInstanceIds, setExistingStructureInstanceIds] =
    useState<number[]>([]);

  const updateLeadMutation = useMutation({
    mutationFn: async (payload: EditLeadPayload) =>
      updateLead(payload, leadData.id, createdBy!),
  });

  const { data: sourceTypes, isLoading: isSourceTypesLoading } =
    useSourceTypes();
  const sourcePickerData = useMemo(
    () =>
      sourceTypes?.data?.map((source: any) => ({
        id: source.id,
        label: source.type,
      })) || [],
    [sourceTypes?.data],
  );
  const referenceSourceIds = useMemo(
    () =>
      sourceTypes?.data
        ?.filter(
          (source: any) =>
            String(source.type || "").trim().toLowerCase() === "reference",
        )
        .map((source: any) => String(source.id)) || [],
    [sourceTypes?.data],
  );

  const resolver = useMemo(
    () =>
      zodResolver(
        isDraftLead
          ? draftFormSchema(isB2b, referenceSourceIds)
          : completeFormSchema(isB2b, referenceSourceIds),
      ),
    [isDraftLead, isB2b, referenceSourceIds],
  );

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      firstname: "",
      lastname: "",
      contact_no: "",
      alt_contact_no: "",
      email: "",
      site_type_id: "",
      site_address: "",
      site_map_link: "",
      source_id: "",
      client_id: "",
      order_number: "",
      refered_by: "",
      priority: "Medium",
      archetech_name: "",
      archetech_number: "",
      designer_remark: "",
      initial_site_measurement_date: "",
      product_types: [],
      product_structures: [],
    },
    mode: "onChange",
  });

  const {
    formState: { dirtyFields },
  } = form;
  const watchedValues = form.watch();

  const shouldShowFurnitureFields = isDraftLead || leadStage === "open" || leadStage === "";
  const shouldShowSiteTypeField = isDraftLead || leadStage === "open" || leadStage === "";
  const requiresFurnitureSelection = !handlesLargeScaleProjects && !isB2b;

  const selectedClientId = form.watch("client_id");
  const selectedSourceId = form.watch("source_id");
  const selectedClient = useMemo(
    () => clientsList.find((c: any) => String(c.id) === selectedClientId),
    [clientsList, selectedClientId],
  );
  const showReferredByField =
    isB2b && !!selectedSourceId && referenceSourceIds.includes(selectedSourceId);

  useEffect(() => {
    if (!isB2b || !selectedClient) return;

    const companyName =
      selectedClient.company_name || selectedClient.name || "";
    if (form.getValues("firstname") !== companyName) {
      form.setValue("firstname", companyName, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    const digits = (selectedClient.contact || "").replace(/\D/g, "");
    const normalizedDigits =
      digits.length > 10 && digits.startsWith("91") ? digits.slice(2) : digits;
    const e164ContactNo = normalizedDigits ? `+91${normalizedDigits}` : "";
    if (form.getValues("contact_no") !== e164ContactNo) {
      form.setValue("contact_no", e164ContactNo, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    const clientEmail = selectedClient.email || "";
    if (form.getValues("email") !== clientEmail) {
      form.setValue("email", clientEmail, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [isB2b, selectedClient, form]);

  // Product type & structure hooks
  const { data: productStructures, isLoading: isStructuresLoading } =
    useProductStructureTypes();
  const { data: productTypes, isLoading: isProductTypesLoading } =
    useProductTypes();

  const selectedProductTypes = form.watch("product_types");
  const selectedProductStructures = form.watch("product_structures");

  const selectedTypeId = selectedProductTypes?.[0];
  const selectedTypeLabel =
    productTypes?.data?.find((type: any) => String(type.id) === selectedTypeId)
      ?.type || "";
  const normalizedType = selectedTypeLabel.toLowerCase();
  const hasSelectedFurnitureType = Boolean(selectedTypeId);

  let parentFilter: "Kitchen" | "Wardrobe" | "Others" | null = null;
  if (normalizedType.includes("kitchen")) {
    parentFilter = "Kitchen";
  } else if (normalizedType.includes("wardrobe")) {
    parentFilter = "Wardrobe";
  } else if (selectedTypeId) {
    parentFilter = "Others";
  }
  const allowDuplicatesForWardrobe =
    parentFilter === "Wardrobe" || parentFilter === "Others";
  const isKitchenStructureSingleSelect = parentFilter === "Kitchen";

  const structureOptions: Option[] = useMemo(
    () =>
      productStructures?.data
        ?.filter((p: any) => {
          if (!parentFilter) return true;
          const parent = String(p.parent || "").toLowerCase();
          if (parentFilter === "Kitchen") return parent === "kitchen";
          if (parentFilter === "Wardrobe") return parent === "wardrobe";
          return parent !== "kitchen" && parent !== "wardrobe";
        })
        ?.map((p: any) => ({
          value: String(p.id),
          label: p.type,
        })) ?? [],
    [parentFilter, productStructures?.data],
  );

  const buildStructureDetails = useCallback(
    (
      nextIds: string[],
      prevIds: string[],
      prevDetails: { title: string; desc: string }[],
    ) => {
      const buckets = new Map<string, { title: string; desc: string }[]>();
      prevIds.forEach((id, index) => {
        const detail = prevDetails[index];
        if (!detail) return;
        const list = buckets.get(id) || [];
        list.push(detail);
        buckets.set(id, list);
      });
      return nextIds.map((id) => {
        const list = buckets.get(id);
        if (list && list.length > 0) {
          return list.shift() as { title: string; desc: string };
        }
        const option = structureOptions.find((opt) => opt.value === id);
        return { title: option?.label || id, desc: "" };
      });
    },
    [structureOptions],
  );

  useEffect(() => {
    const nextIds = selectedProductStructures || [];
    const prevIds = previousStructuresRef.current;
    setStructureInstanceDetails((prevDetails) => {
      const nextDetails = buildStructureDetails(nextIds, prevIds, prevDetails);
      previousStructuresRef.current = nextIds;
      return nextDetails;
    });
  }, [buildStructureDetails, selectedProductStructures]);

  useEffect(() => {
    return () => {
      if (maxStructureTooltipTimerRef.current) {
        window.clearTimeout(maxStructureTooltipTimerRef.current);
      }
    };
  }, []);

  const buildStructureInstancesPayload = useCallback(() => {
    return (selectedProductStructures || []).map((id, index) => {
      const option = structureOptions.find((opt) => opt.value === id);
      const detail = structureInstanceDetails[index];
      const title = (detail?.title || option?.label || id).trim();
      const description = detail?.desc?.trim() || "";
      return {
        product_structure_id: Number(id),
        title,
        description: description || undefined,
      };
    });
  }, [selectedProductStructures, structureInstanceDetails, structureOptions]);

  const structureQuantityItems = useMemo(
    () =>
      (selectedProductStructures || []).map((id, index) => {
        const option = structureOptions.find((opt) => opt.value === id);
        const detail = structureInstanceDetails[index];
        const defaultTitle = option?.label || id;
        return {
          id,
          label: option?.label || id,
          title: detail?.title || defaultTitle,
          desc: detail?.desc || "",
          key: `${id}-${index}`,
          index,
        };
      }),
    [selectedProductStructures, structureInstanceDetails, structureOptions],
  );

  useEffect(() => {
    if (requiresFurnitureSelection) return;

    form.setValue("product_types", [], {
      shouldDirty: false,
      shouldValidate: false,
    });
    form.setValue("product_structures", [], {
      shouldDirty: false,
      shouldValidate: false,
    });
    setStructureInstanceDetails([]);
    previousStructuresRef.current = [];
    setInitialProductTypeId(null);
    setInitialStructureIds([]);
    setExistingStructureInstanceIds([]);
  }, [form, requiresFurnitureSelection]);

  useEffect(() => {
    if (!isKitchenStructureSingleSelect) return;

    const currentStructures = form.getValues("product_structures") || [];
    if (currentStructures.length <= 1) return;

    form.setValue("product_structures", [currentStructures[0]], {
      shouldValidate: true,
    });
  }, [form, isKitchenStructureSingleSelect]);

  useEffect(() => {
    if (!hasSelectedFurnitureType) return;
    if (structureOptions.length !== 1) return;
    const onlyId = structureOptions[0].value;
    const current = form.getValues("product_structures") || [];
    const onlySelections = current.filter((id) => id === onlyId);
    if (allowDuplicatesForWardrobe) {
      if (onlySelections.length === 0) {
        form.setValue("product_structures", [onlyId], { shouldValidate: true });
      } else if (current.length !== onlySelections.length) {
        form.setValue("product_structures", onlySelections, {
          shouldValidate: true,
        });
      }
      return;
    }
    if (onlySelections.length !== 1 || current.length !== 1) {
      form.setValue("product_structures", [onlyId], { shouldValidate: true });
    }
  }, [
    allowDuplicatesForWardrobe,
    form,
    hasSelectedFurnitureType,
    structureOptions,
  ]);

  useEffect(() => {
    const fetchLeadData = async () => {
      if (!leadData?.id || !vendorId || !createdBy) return;

      try {
        setIsLoadingLead(true);
        const [response, instancesResponse] = await Promise.all([
          getLeadById(leadData.id, vendorId, createdBy),
          getLeadProductStructureInstances(vendorId, leadData.id),
        ]);
        const lead = response.data.lead;
        const structureInstances: LeadProductStructureInstance[] =
          instancesResponse.data || [];
        setIsDraftLead(Boolean(lead.is_draft));
        setLeadStage(lead.statusType?.type?.toLowerCase() || lead.status_type?.toLowerCase() || "");
        setLeadFranchiseId(lead.franchise_id ?? null);

        // ✅ Normalize phone numbers to E.164 format
        const formattedContactNo = toE164(lead.contact_no, lead.country_code);

        const formattedAltContactNo = toE164(
          lead.alt_contact_no,
          lead.country_code,
        );

        // Format date for input (YYYY-MM-DD)
        const formattedDate = lead.initial_site_measurement_date
          ? new Date(lead.initial_site_measurement_date)
            .toISOString()
            .split("T")[0]
          : "";
        setOriginalInitialDate(formattedDate);

        // Pre-fill product type
        const productTypeId =
          lead.productMappings?.[0]?.product_type_id ||
          lead.productMappings?.[0]?.productType?.id ||
          lead.productMappings?.[0]?.product_type?.id ||
          null;
        const productTypeIds: string[] = productTypeId
          ? [String(productTypeId)]
          : [];

        // Pre-fill product structures from instances so titles/descriptions stay aligned
        const structureIds = structureInstances.map((s) =>
          String(s.product_structure_id),
        );
        const instanceIds = structureInstances.map((s) => s.id);
        const instanceDetails = structureInstances.map((s) => ({
          title: s.title || "",
          desc: s.description || "",
        }));

        // ✅ Reset form with normalized values
        form.reset({
          firstname: lead.firstname || "",
          lastname: lead.lastname || "",
          contact_no: formattedContactNo,
          alt_contact_no: formattedAltContactNo,
          email: lead.email || "",
          site_type_id: lead.site_type_id ? String(lead.site_type_id) : "",
          site_address: lead.site_address || "",
          site_map_link: lead.site_map_link || "",
          source_id: lead.source_id ? String(lead.source_id) : "",
          client_id: lead.client_id ? String(lead.client_id) : "",
          order_number: lead.order_number || "",
          refered_by: lead.refered_by || "",
          priority: lead.priority || "Medium",
          archetech_name: lead.archetech_name || "",
          archetech_number: lead.archetech_number || "",
          designer_remark: lead.designer_remark || "",
          initial_site_measurement_date: formattedDate,
          product_types: requiresFurnitureSelection ? productTypeIds : [],
          product_structures: requiresFurnitureSelection ? structureIds : [],
        });

        // Store initial values for change detection
        setInitialProductTypeId(
          requiresFurnitureSelection && productTypeId
            ? Number(productTypeId)
            : null,
        );
        setInitialStructureIds(requiresFurnitureSelection ? structureIds : []);
        setExistingStructureInstanceIds(
          requiresFurnitureSelection ? instanceIds : [],
        );

        // Set structure instance details and sync ref
        setStructureInstanceDetails(
          requiresFurnitureSelection ? instanceDetails : [],
        );
        previousStructuresRef.current = requiresFurnitureSelection
          ? structureIds
          : [];

        // Handle map location
        if (lead.site_map_link && lead.site_map_link.includes("maps?q=")) {
          const coords = lead.site_map_link.match(
            /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          );
          if (coords) {
            setSavedMapLocation({
              lat: parseFloat(coords[1]),
              lng: parseFloat(coords[2]),
              address: lead.site_address || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching lead data:", error);
        toastManager.add({ title: "Failed to load lead data", type: "error" });
      } finally {
        setIsLoadingLead(false);
      }
    };

    fetchLeadData();
  }, [leadData?.id, vendorId, createdBy, form, requiresFurnitureSelection]);

  const isDraftReadyToConvert = useMemo(() => {
    if (!isDraftLead) return false;

    const hasRequiredTextFields =
      watchedValues.firstname?.trim() &&
      watchedValues.lastname?.trim() &&
      watchedValues.site_address?.trim() &&
      watchedValues.site_type_id?.trim() &&
      watchedValues.source_id?.trim() &&
      watchedValues.priority?.trim();

    return Boolean(
      hasRequiredTextFields &&
      isPhoneValueValid(watchedValues.contact_no) &&
      (!requiresFurnitureSelection ||
        (watchedValues.product_types?.length &&
          watchedValues.product_structures?.length)),
    );
  }, [isDraftLead, requiresFurnitureSelection, watchedValues]);

  if (isLoadingLead) {
    return (
      <div className="w-full max-w-none pt-3 pb-6 flex items-center justify-center">
        <div className="text-sm">Loading lead data...</div>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    if (!vendorId || !createdBy) {
      toastManager.add({
        title: "User authentication required",
        type: "error",
      });
      return;
    }

    // Build payload only with changed fields
    const payload: Partial<EditLeadPayload> = {};

    // Helper: check if a field was changed
    const isDirty = (field: keyof FormValues) => !!dirtyFields[field];

    // Handle each field conditionally
    if (isDirty("firstname") && values.firstname?.trim()) {
      payload.firstname = values.firstname;
    }
    if (isDirty("lastname") && values.lastname?.trim()) {
      payload.lastname = values.lastname;
    }

    if (isDirty("contact_no") && values.contact_no) {
      try {
        const parsed = parsePhoneNumber(values.contact_no);
        if (parsed) {
          payload.country_code = `+${parsed.countryCallingCode}`;
          payload.contact_no = parsed.nationalNumber.toString();
        }
      } catch (error: unknown) {
        toastError(error);
        return;
      }
    }

    if (isDirty("alt_contact_no") && values.alt_contact_no?.trim()) {
      try {
        const parsedAlt = parsePhoneNumber(values.alt_contact_no);
        if (parsedAlt) {
          payload.alt_contact_no = parsedAlt.nationalNumber.toString();
        }
      } catch {
        payload.alt_contact_no = values.alt_contact_no.replace(/\D/g, "");
      }
    } else if (isDirty("alt_contact_no")) {
      payload.alt_contact_no = "";
    }

    if (isDirty("email")) payload.email = values.email || "";
    if (isDirty("site_type_id") && values.site_type_id)
      payload.site_type_id = Number(values.site_type_id);
    if (isDirty("source_id") && values.source_id) {
      payload.source_id = Number(values.source_id);
    }
    if (isDirty("priority") && values.priority) {
      payload.priority = values.priority;
    }
    if (isDirty("site_address") && values.site_address?.trim()) {
      payload.site_address = values.site_address;
    }
    if (isDirty("site_map_link")) {
      payload.site_map_link = values.site_map_link?.trim() || "";
    }
    if (isDirty("client_id")) {
      payload.client_id =
        isB2b && values.client_id ? Number(values.client_id) : undefined;
    }
    if (isDirty("order_number")) {
      payload.order_number = values.order_number || "";
    }
    if (isDirty("refered_by")) {
      payload.refered_by = values.refered_by?.trim() || "";
    }
    if (isDirty("archetech_name"))
      payload.archetech_name = values.archetech_name || "";
    if (isDirty("archetech_number") && values.archetech_number?.trim()) {
      try {
        const parsedArchitect = parsePhoneNumber(values.archetech_number);
        if (parsedArchitect) {
          payload.archetech_number = parsedArchitect.nationalNumber.toString();
        }
      } catch {
        payload.archetech_number = values.archetech_number.replace(/\D/g, "");
      }
    } else if (isDirty("archetech_number")) {
      payload.archetech_number = "";
    }
    if (isDirty("designer_remark"))
      payload.designer_remark = values.designer_remark || "";
    if (
      isDirty("initial_site_measurement_date") &&
      values.initial_site_measurement_date
    ) {
      payload.initial_site_measurement_date = new Date(
        values.initial_site_measurement_date,
      ).toISOString();
    }

    // Always include updated_by
    payload.updated_by = createdBy!;

    // Detect product type / structure changes
    const currentProductTypeId = values.product_types?.[0]
      ? Number(values.product_types[0])
      : null;
    const currentStructureIds = values.product_structures || [];
    const productTypeChanged = requiresFurnitureSelection
      ? currentProductTypeId !== initialProductTypeId
      : false;
    const structuresChanged = requiresFurnitureSelection
      ? JSON.stringify(currentStructureIds) !== JSON.stringify(initialStructureIds)
      : false;

    const hasMainChanges = Object.keys(payload).length > 1;
    const hasAnyChanges =
      hasMainChanges || productTypeChanged || structuresChanged;

    if (!hasAnyChanges) {
      toastManager.add({ title: "No changes made", type: "info" });
      return;
    }

    try {
      const shouldConvertDraft =
        isDraftLead &&
        (!requiresFurnitureSelection || Boolean(currentProductTypeId)) &&
        isDraftReadyToConvert;

      // 1. Product type update
      if (productTypeChanged && currentProductTypeId) {
        const label = productTypes?.data?.find(
          (t: any) => t.id === currentProductTypeId,
        )?.type;
        if (label) {
          await updateLeadProductType(leadData.id, createdBy!, {
            productType: label,
          });
        }
      }

      // 2. Structure instances full replace
      if (structuresChanged) {
        await clearLeadProductStructures(vendorId!, leadData.id, createdBy!);

        const newInstances = buildStructureInstancesPayload();
        for (const instance of newInstances) {
          await createLeadProductStructureInstance(vendorId!, leadData.id, {
            product_structure_id: instance.product_structure_id,
            title: instance.title,
            description: instance.description,
            created_by: createdBy!,
          });
        }
      }

      // 3. Update scalar fields, or re-run draft completion after product changes
      if (hasMainChanges || isDraftLead) {
        await updateLeadMutation.mutateAsync(payload as EditLeadPayload);
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["lead", leadData.id, vendorId, createdBy],
        }),
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadData.id, vendorId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["universal-stage-leads"],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ["vendorUserLeads", vendorId, createdBy],
        }),
        queryClient.invalidateQueries({
          queryKey: ["vendorUserLeadsOpenuniversal-stage-leads"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["draft-lead-table-data"],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ["leadStats"],
          exact: false,
        }),
      ]);

      toastManager.add({
        title: shouldConvertDraft
          ? "Draft lead converted successfully!"
          : isDraftLead
            ? "Draft lead saved successfully!"
            : "Lead updated successfully!",
        type: "success",
      });
      onClose();

      if (shouldConvertDraft) {
        router.push("/dashboard/leads/leadstable");
      }
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to update lead",
        type: "error",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5">
        {/* Client / Project (B2B) or First Name & Last Name */}
        {isB2b ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => {
                  const pickerData = clientsList.map((c: any) => ({
                    id: c.id,
                    label: c.company_name || c.name,
                    subLabel: c.clientCode,
                  }));

                  return (
                    <FormItem>
                      <div className="w-full flex items-center justify-between">
                        <FormLabel className="text-sm">Select Client *</FormLabel>
                        <Link
                          href="/dashboard/masters-management/client-master"
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          New client
                        </Link>
                      </div>
                      {isClientsLoading ? (
                        <p className="text-xs text-muted-foreground">
                          Loading clients...
                        </p>
                      ) : (
                        <AssignToPicker
                          data={pickerData}
                          value={field.value ? Number(field.value) : undefined}
                          onChange={(selectedId: number | null) => {
                            field.onChange(selectedId ? String(selectedId) : "");
                          }}
                          placeholder="Search client..."
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter project name"
                        type="text"
                        className="text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="order_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Order Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter order number"
                      type="text"
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">First Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter first name"
                      type="text"
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Last Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter last name"
                      type="text"
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Contact Numbers - ✅ SIMPLIFIED */}
        {!isB2b && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <FormField
            control={form.control}
            name="contact_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Phone Number *</FormLabel>
                <FormControl>
                  <PhoneInput
                    defaultCountry="IN"
                    placeholder="Enter phone number"
                    className="text-sm"
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    onBlur={field.onBlur}
                    validateIndianNumber={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alt_contact_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Alt. Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    defaultCountry="IN"
                    placeholder="Enter alt number"
                    className="text-sm"
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    onBlur={field.onBlur}
                    validateIndianNumber={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        )}

        {/* Email & Furniture Type */}
        {!isB2b && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    className="text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        )}

        {/* Site Type & Priority */}
        {!isB2b && (
          <div className={`grid grid-cols-1 ${shouldShowSiteTypeField ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-3 items-start`}>
            {shouldShowSiteTypeField && (
              <FormField
                control={form.control}
                name="site_type_id"
                render={({ field }) => {
                const { data: siteTypes, isLoading } = useSiteTypes();

                const pickerData =
                  siteTypes?.data?.map((site: any) => ({
                    id: site.id,
                    label: site.type,
                  })) || [];

                return (
                  <FormItem>
                    <FormLabel className="text-sm">Site Type *</FormLabel>

                    {isLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Loading site types...
                      </p>
                    ) : (
                      <AssignToPicker
                        data={pickerData}
                        value={field.value ? Number(field.value) : undefined}
                        onChange={(selectedId: number | null) => {
                          field.onChange(selectedId ? String(selectedId) : "");
                        }}
                        placeholder="Search site type..."
                      />
                    )}

                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Priority *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Source (+ Phone Number for B2B) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <FormField
            control={form.control}
            name="source_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Source *</FormLabel>

                {isSourceTypesLoading ? (
                  <p className="text-xs text-muted-foreground">
                    Loading sources...
                  </p>
                ) : (
                  <AssignToPicker
                    data={sourcePickerData}
                    value={field.value ? Number(field.value) : undefined}
                    onChange={(selectedId: number | null) => {
                      field.onChange(selectedId ? String(selectedId) : "");
                    }}
                    placeholder="Search source..."
                  />
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          {isB2b && (
            <FormField
              control={form.control}
              name="alt_contact_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Phone Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="IN"
                      placeholder="Enter phone number"
                      className="text-sm"
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      onBlur={field.onBlur}
                      validateIndianNumber={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Site Address */}
        <FormField
          control={form.control}
          name="site_address"
          render={({ field }) => (
            <FormItem>
              <div className="w-full flex justify-between">
                <FormLabel className="text-sm">
                  {isB2b ? "Site Address" : "Site Address *"}
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMapOpen(true)}
                  className="flex items-center gap-1"
                >
                  <MapPin className="h-4 w-4" />
                  {savedMapLocation ? "Update Map" : "Open Map"}
                </Button>
              </div>
              <FormControl>
                <div className="w-full relative">
                  <TextAreaInput
                    value={field.value}
                    onChange={(value) => {
                      handleAddressChange(value, field.onChange);
                    }}
                    placeholder="Enter address or use map"
                    disabled={isResolvingAddress}
                    className={isResolvingAddress ? "text-transparent" : ""}
                  />
                  {isResolvingAddress && (
                    <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5 text-sm text-muted-foreground pointer-events-none">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Resolving address...</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />

              <MapPicker
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                savedLocation={savedMapLocation}
                onSelect={(address, link) => {
                  field.onChange(address);
                  const coords = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                  if (coords) {
                    setSavedMapLocation({
                      lat: parseFloat(coords[1]),
                      lng: parseFloat(coords[2]),
                      address,
                    });
                  }
                  form.setValue("site_map_link", link, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />
            </FormItem>
          )}
        />

        {showReferredByField && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="refered_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Referred By *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter referred by"
                      type="text"
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {requiresFurnitureSelection && shouldShowFurnitureFields && (
          <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <FormField
                    control={form.control}
                    name="product_types"
                    render={({ field }) => {
                      const pickerData =
                        productTypes?.data?.map((p: any) => ({
                          id: p.id,
                          label: p.type,
                        })) || [];

                      return (
                        <FormItem>
                          <FormLabel className="text-sm">Furniture Type</FormLabel>
                          {isProductTypesLoading ? (
                            <p className="text-xs text-muted-foreground">Loading...</p>
                          ) : (
                            <AssignToPicker
                              data={pickerData}
                              value={
                                field.value?.length ? Number(field.value[0]) : undefined
                              }
                              onChange={(selectedId) => {
                                field.onChange(selectedId ? [String(selectedId)] : []);
                                    form.setValue("product_structures", [], {
                                  shouldValidate: true,
                                });
                              }}
                              placeholder="Search furniture type..."
                            />
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="product_structures"
                    render={({ field }) => {
                      const selectedOptions = (field.value || [])
                        .filter((id) =>
                          structureOptions.some((opt) => opt.value === id),
                        )
                        .map((id) => {
                          const option = structureOptions.find(
                            (opt) => opt.value === id,
                          );
                          return option || { value: id, label: id };
                        });
                      const shouldShowMaxTooltip =
                        showMaxStructureTooltip && hasSelectedFurnitureType;
                      const tooltipMessage = !hasSelectedFurnitureType
                        ? "Select a furniture type first."
                        : isKitchenStructureSingleSelect && shouldShowMaxTooltip
                          ? "Kitchen allows only 1 furniture structure."
                          : shouldShowMaxTooltip
                            ? "Maximum limit is 10 per item."
                            : "";

                  return (
                    <FormItem>
                      <FormLabel className="text-sm">Furniture Structure</FormLabel>
                      <FormControl>
                        <Tooltip {...(shouldShowMaxTooltip ? { open: true } : {})}>
                          <TooltipTrigger asChild>
                            <div className="w-full">
                              <MultipleSelector
                                value={selectedOptions}
                                onChange={(opts) => {
                                  field.onChange(
                                    opts.map((opt) => opt.value),
                                  );
                                }}
                                options={structureOptions}
                                placeholder="Select furniture structures"
                                disabled={
                                  isStructuresLoading || !hasSelectedFurnitureType
                                }
                                maxSelected={
                                  isKitchenStructureSingleSelect ? 1 : undefined
                                }
                                hidePlaceholderWhenSelected
                                showSelectedOptionsInDropdown
                                allowDuplicateSelections={
                                  allowDuplicatesForWardrobe
                                }
                                onMaxSelected={() => {
                                  if (!isKitchenStructureSingleSelect) return;
                                  setShowMaxStructureTooltip(true);
                                  if (maxStructureTooltipTimerRef.current) {
                                    window.clearTimeout(
                                      maxStructureTooltipTimerRef.current,
                                    );
                                  }
                                  maxStructureTooltipTimerRef.current =
                                    window.setTimeout(() => {
                                      setShowMaxStructureTooltip(false);
                                    }, 1500);
                                }}
                                maxSelectedPerOption={10}
                                onMaxSelectedPerOption={() => {
                                  setShowMaxStructureTooltip(true);
                                  if (maxStructureTooltipTimerRef.current) {
                                    window.clearTimeout(
                                      maxStructureTooltipTimerRef.current,
                                    );
                                  }
                                  maxStructureTooltipTimerRef.current =
                                    window.setTimeout(() => {
                                      setShowMaxStructureTooltip(false);
                                    }, 1500);
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          {tooltipMessage && (
                            <TooltipContent side="top" sideOffset={6}>
                              {tooltipMessage}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <StructureQuantityCards
              items={structureQuantityItems}
              className="mt-2"
              onRemove={(removeIndex) => {
                const current = form.getValues("product_structures") || [];
                const next = current.filter((_, i) => i !== removeIndex);
                form.setValue("product_structures", next, {
                  shouldValidate: true,
                });
              }}
              onSave={(index, details) => {
                setStructureInstanceDetails((prev) => {
                  const next = [...prev];
                  next[index] = details;
                  return next;
                });
              }}
            />
          </>
        )}

        {!isB2b && (
        <div
          className={`grid grid-cols-1 gap-3 items-start ${isCustomVendorFlow ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
        >
          {/* Architect Name */}
          <FormField
            control={form.control}
            name="archetech_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Architect Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter architect name"
                    type="text"
                    className="text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isCustomVendorFlow && (
            <FormField
              control={form.control}
              name="archetech_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Architect Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="IN"
                      placeholder="Enter architect number"
                      className="text-sm"
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      onBlur={field.onBlur}
                      validateIndianNumber={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="initial_site_measurement_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Initial Site Measurement Date
                </FormLabel>
                <FormControl>
                  <CustomeDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    restriction="futureOnly"
                    minDate={originalInitialDate || undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        )}

        {/* Designer Remark */}
        {!isB2b && (
        <FormField
          control={form.control}
          name="designer_remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Designer's Remark</FormLabel>
              <FormControl>
                <TextAreaInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter Designer's Remark"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="text-sm"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button
            type="submit"
            className="text-sm"
            disabled={updateLeadMutation.isPending}
          >
            {updateLeadMutation.isPending
              ? isDraftLead
                ? "Saving..."
                : "Updating..."
              : isDraftLead
                ? isDraftReadyToConvert
                  ? "Convert To Lead"
                  : "Save Draft"
                : "Update Lead"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
