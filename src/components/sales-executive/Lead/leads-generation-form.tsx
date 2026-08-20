"use client";

import {
  type FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useSiteTypes,
  useSourceTypes,
  useProductStructureTypes,
  useProductTypes,
} from "@/hooks/useTypesMaster";
import { PhoneInput } from "@/components/ui/phone-input";
import { toastManager } from "@/components/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLead, unshortenUrl, assignDesignerToLead } from "@/api/leads";
import { useAppSelector } from "@/redux/store";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { apiClient } from "@/lib/apiClient";

import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { canReassingLead } from "@/components/utils/privileges";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import TextAreaInput from "@/components/origin-text-area";
import CustomeDatePicker from "@/components/date-picker";
import MapPicker from "@/components/MapPicker";
import { MapPin, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useClients } from "@/hooks/useClientMaster";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import AssignToPicker from "@/components/assign-to-picker";
import { useRouter } from "next/navigation";
import {
  useCheckContactOrEmailExists,
  useCheckSimilarLeadExists,
} from "@/hooks/useLeadsQueries";
import { useArchitectureMastersDropdownList } from "@/hooks/useArchitectureMaster";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StructureQuantityCards from "@/components/sales-executive/Lead/structure-quantity-cards";
import { getErrorMessage } from "@/lib/utils";
import { FileUploadField } from "@/components/custom/file-upload";

const priorityOptions = [
  { id: 1, label: "High", value: "High" },
  { id: 2, label: "Medium", value: "Medium" },
  { id: 3, label: "Low", value: "Low" },
] as const;

const formatFileDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sanitizeFileSegment = (value: string) =>
  value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex) : "";
};

const renameLeadSitePhotoFiles = ({
  files,
  clientName,
  targetLabel,
  uploadDate,
}: {
  files: File[];
  clientName: string;
  targetLabel: string;
  uploadDate: string;
}) => {
  const safeClientName = sanitizeFileSegment(clientName || "Client");
  const safeTargetLabel = sanitizeFileSegment(targetLabel || "Furniture Type");

  return files.map(
    (file, index) =>
      new File(
        [file],
        `CSP${index + 1}-${safeClientName}-${safeTargetLabel}-${uploadDate}${getFileExtension(
          file.name,
        )}`,
        {
          type: file.type,
          lastModified: file.lastModified,
        },
      ),
  );
};

// Schema for Create Lead - all fields required as per business logic
const createFormSchema = (
  userType: string | undefined,
  requiresFurnitureSelection: boolean,
  isB2b: boolean,
  referenceSourceIds: string[],
  mode: "standard" | "lead-pool" = "standard",
) => {
  const isAdminOrSuperAdmin =
    userType === "admin" || userType === "super-admin";

  return z
    .object({
      firstname: z.string().trim().min(1, "First name is required").max(300),
      lastname: z
        .string()
        .trim()
        .min(1, isB2b ? "Project name is required" : "Last name is required")
        .max(300),
      contact_no: isB2b
        ? z.string().optional().or(z.literal(""))
        : z.string().min(1, "This Contact number isn't valid").max(20),
      alt_contact_no: z.string().optional().or(z.literal("")),
      email: z
        .string()
        .email("Please enter a valid email")
        .optional()
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
              { message: "Invalid link" }
            )
        : z
            .string()
            .min(1, "Site Address is required")
            .max(2000)
            .refine(
              (val) => !/^(https?:\/\/[^\s]+)/i.test(val.trim()),
              { message: "Invalid link" }
            ),
      source_id: z.string().min(1, "Please select a source"),
      refered_by: z.string().max(300).optional().or(z.literal("")),
      client_id: isB2b
        ? z.string().min(1, "Please select a client")
        : z.string().optional().or(z.literal("")),
      order_number: z.string().max(100).optional().or(z.literal("")),
      product_types: requiresFurnitureSelection
        ? z.array(z.string()).min(1, "Please select at least one product type")
        : z.array(z.string()).optional(),
      product_structures: requiresFurnitureSelection
        ? z
            .array(z.string())
            .min(1, "Please select at least one product structure")
        : z.array(z.string()).optional(),
      assign_to: isAdminOrSuperAdmin
        ? z.string().min(1, "Please select an assignee")
        : z.string().optional(),
      assigned_by: isAdminOrSuperAdmin ? z.string() : z.string().optional(),
      documents: z.string().optional(),
      archetech_name: z.string().max(300).optional(),
      architect_id: z.string().optional(),
      archetech_number: z
        .string()
        .regex(/^\+?\d{7,20}$/, "Please enter a valid architect number")
        .optional()
        .or(z.literal("")),
      designer_id: z.string().optional(),
      designer_remark: z.string().max(2000).optional(),
      initial_site_measurement_date: z.string().optional(),
      priority: z.enum(["High", "Medium", "Low"], {
        message: "Please select a priority",
      }),
      franchise_id: z.string().optional(),
    })
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

      if (mode === "lead-pool" && !values.franchise_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["franchise_id"],
          message: "Please select a store",
        });
      }
    });
};

// Schema for Draft - only name, contact, and assign_to (for admin) required
const draftFormSchema = (
  userType: string | undefined,
  isB2b: boolean,
  referenceSourceIds: string[],
) => {
  const isAdminOrSuperAdmin =
    userType === "admin" || userType === "super-admin";

  return z
    .object({
      firstname: z.string().trim().min(1, "First name is required").max(300),
      lastname: z
        .string()
        .trim()
        .min(1, isB2b ? "Project name is required" : "Last name is required")
        .max(300),
      contact_no: isB2b
        ? z.string().optional().or(z.literal(""))
        : z.string().min(1, "Contact number is required").max(20),
      assign_to: isAdminOrSuperAdmin
        ? z.string().min(1, "Please select an assignee")
        : z.string().optional(),
      alt_contact_no: z.string().optional().or(z.literal("")),
      email: z.string().optional().or(z.literal("")),
      site_type_id: z.string().optional().or(z.literal("")),
      site_address: z
        .string()
        .optional()
        .or(z.literal(""))
        .refine(
          (val) => !val || !/^(https?:\/\/[^\s]+)/i.test(val.trim()),
          { message: "Invalid link" }
        ),
      source_id: isB2b
        ? z.string().min(1, "Please select a source")
        : z.string().optional().or(z.literal("")),
      refered_by: z.string().max(300).optional().or(z.literal("")),
      client_id: isB2b
        ? z.string().min(1, "Please select a client")
        : z.string().optional().or(z.literal("")),
      order_number: z.string().max(100).optional().or(z.literal("")),
      product_types: z.array(z.string()).optional(),
      product_structures: z.array(z.string()).optional(),
      assigned_by: z.string().optional(),
      documents: z.string().optional(),
      archetech_name: z.string().optional(),
      architect_id: z.string().optional(),
      archetech_number: z
        .string()
        .regex(/^\+?\d{7,20}$/, "Please enter a valid architect number")
        .optional()
        .or(z.literal("")),
      designer_id: z.string().optional(),
      designer_remark: z.string().optional(),
      initial_site_measurement_date: z.string().optional(),
      priority: z.enum(["High", "Medium", "Low"]).optional(),
    })
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
};

interface LeadsGenerationFormProps {
  onClose: () => void;
  mode?: "standard" | "lead-pool";
}
export default function LeadsGenerationForm({
  onClose,
  mode = "standard",
}: LeadsGenerationFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const vendorId = useAppSelector((state: any) => state.auth.user?.vendor_id);
  const franchiseId = useAppSelector((state: any) => state.auth.user?.franchise_id);
  const vendorCustomUserTypeMode = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only as
        | boolean
        | null
        | undefined,
  );
  const isCustomDocNomenclatureEnabled = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_custom_doc_nomenclature_enabled === true,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const createdBy = useAppSelector((state: any) => state.auth.user?.id);
  const [mapOpen, setMapOpen] = useState(false);
  const [openDraftModal, setOpenDraftModal] = useState(false);
  const [showMaxStructureTooltip, setShowMaxStructureTooltip] = useState(false);
  const maxStructureTooltipTimerRef = useRef<number | null>(null);
  const [structureInstanceDetails, setStructureInstanceDetails] = useState<
    { title: string; desc: string }[]
  >([]);
  const [instanceSitePhotoUploads, setInstanceSitePhotoUploads] = useState<
    Record<string, File[]>
  >({});
  const previousStructuresRef = useRef<string[]>([]);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    open: boolean;
    field?: "contact_no" | "alt_contact_no" | "email";
    lead?: { lead_id: number; lead_code: string | null; lead_name: string };
  }>({ open: false });
  const [lastCheckedValue, setLastCheckedValue] = useState<{
    contact_no: string;
    alt_contact_no: string;
    email: string;
  }>({ contact_no: "", alt_contact_no: "", email: "" });
  const [similarLeadWarning, setSimilarLeadWarning] = useState<{
    lead_id: number;
    lead_code: string | null;
    lead_name: string;
  } | null>(null);
  const [lastSimilarLeadCheckKey, setLastSimilarLeadCheckKey] = useState("");

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
          prev ? { ...prev, address: value } : prev
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

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );
  const isB2b = useMemo(() => {
    if (mode === "lead-pool") return false;
    const activeFranchise = franchisesForB2b.find(
      (franchise) => franchise.id === franchiseId,
    );
    return activeFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, franchiseId, mode]);
  const requiresFurnitureSelection = !handlesLargeScaleProjects && !isB2b;

  const { data: clientsData, isLoading: isClientsLoading } = useClients({
    vendor_id: vendorId,
    limit: 200,
  });
  const clientsList = clientsData?.data?.data ?? [];
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

  const formSchema = useMemo(
    () =>
      createFormSchema(
        userType,
        requiresFurnitureSelection,
        isB2b,
        referenceSourceIds,
        mode,
      ),
    [requiresFurnitureSelection, userType, isB2b, referenceSourceIds, mode],
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      contact_no: "",
      alt_contact_no: "",
      email: "",
      site_type_id: "",
      site_address: "",
      source_id: "",
      refered_by: "",
      client_id: "",
      order_number: "",
      product_types: [],
      product_structures: [],
      documents: "",
      archetech_name: "",
      architect_id: "",
      archetech_number: "",
      designer_id: "",
      designer_remark: "N/A",
      priority: "Medium",
      assign_to: "",
      assigned_by: "",
      franchise_id: (franchiseId && userType !== "super-admin" && userType !== "admin") ? String(franchiseId) : "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  type FormValues = z.infer<typeof formSchema>;

  const selectedClientId = form.watch("client_id");
  const selectedSourceId = form.watch("source_id");
  const selectedClient = useMemo(
    () => clientsList.find((c) => String(c.id) === selectedClientId),
    [clientsList, selectedClientId],
  );
  const showReferredByField =
    isB2b && referenceSourceIds.includes(selectedSourceId);

  useEffect(() => {
    if (!isB2b || !selectedClient) return;

    const companyName = selectedClient.company_name || selectedClient.name || "";
    if (form.getValues("firstname") !== companyName) {
      form.setValue("firstname", companyName, { shouldValidate: false });
    }

    const digits = (selectedClient.contact || "").replace(/\D/g, "");
    const normalizedDigits =
      digits.length > 10 && digits.startsWith("91") ? digits.slice(2) : digits;
    if (form.getValues("contact_no") !== normalizedDigits) {
      form.setValue("contact_no", normalizedDigits, { shouldValidate: false });
    }

    const clientEmail = selectedClient.email || "";
    if (form.getValues("email") !== clientEmail) {
      form.setValue("email", clientEmail, { shouldValidate: false });
    }
  }, [isB2b, selectedClient, form]);
  const selectedProductTypes = form.watch("product_types");
  const selectedProductStructures = form.watch("product_structures");
  const { data: productStructures, isLoading: isStructuresLoading } =
    useProductStructureTypes();
  const { data: productTypes, isLoading: isProductTypesLoading } =
    useProductTypes();

  const selectedTypeId = selectedProductTypes?.[0];
  const selectedTypeLabel =
    productTypes?.data?.find(
      (type: any) => String(type.id) === selectedTypeId
    )?.type || "";
  const normalizedType = selectedTypeLabel.toLowerCase();
  const hasSelectedFurnitureType = mode === "lead-pool"
    ? Boolean(selectedProductTypes && selectedProductTypes.length > 0)
    : Boolean(selectedTypeId);

  const selectedCategories = useMemo(() => {
    if (!selectedProductTypes || selectedProductTypes.length === 0) {
      return new Set<string>();
    }
    const categories = new Set<string>();
    selectedProductTypes.forEach((id: string) => {
      const typeLabel =
        productTypes?.data?.find(
          (type: any) => String(type.id) === id
        )?.type?.toLowerCase() || "";
      if (typeLabel.includes("kitchen")) {
        categories.add("kitchen");
      } else if (typeLabel.includes("wardrobe")) {
        categories.add("wardrobe");
      } else {
        categories.add("others");
      }
    });
    return categories;
  }, [selectedProductTypes, productTypes?.data]);

  let parentFilter: "Kitchen" | "Wardrobe" | "Others" | null = null;
  if (normalizedType.includes("kitchen")) {
    parentFilter = "Kitchen";
  } else if (normalizedType.includes("wardrobe")) {
    parentFilter = "Wardrobe";
  } else if (selectedTypeId) {
    parentFilter = "Others";
  }

  const isKitchenStructureSingleSelect =
    mode === "lead-pool"
      ? false
      : parentFilter === "Kitchen";

  const allowDuplicatesForWardrobe =
    mode === "lead-pool"
      ? selectedCategories.has("wardrobe") || selectedCategories.has("others")
      : parentFilter === "Wardrobe" || parentFilter === "Others";

  useEffect(() => {
    return () => {
      if (maxStructureTooltipTimerRef.current) {
        window.clearTimeout(maxStructureTooltipTimerRef.current);
      }
    };
  }, []);

  const structureOptions: Option[] = useMemo(
    () =>
      productStructures?.data
        ?.filter((p: any) => {
          if (mode === "lead-pool") {
            if (selectedCategories.size === 0) return false;
            const parent = String(p.parent || "").toLowerCase();
            const parentCat =
              parent === "kitchen"
                ? "kitchen"
                : parent === "wardrobe"
                ? "wardrobe"
                : "others";
            return selectedCategories.has(parentCat);
          }
          if (!parentFilter) return true;
          const parent = String(p.parent || "").toLowerCase();
          if (parentFilter === "Kitchen") return parent === "kitchen";
          if (parentFilter === "Wardrobe") return parent === "wardrobe";
          return parent !== "kitchen" && parent !== "wardrobe";
        })
        ?.map((p: any) => ({
          value: String(p.id),
          label: p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "",
        })) ?? [],
    [parentFilter, productStructures?.data, mode, selectedCategories]
  );
  const buildStructureDetails = useCallback(
    (
      nextIds: string[],
      prevIds: string[],
      prevDetails: { title: string; desc: string }[]
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
    [structureOptions]
  );

  useEffect(() => {
    const nextIds = selectedProductStructures || [];
    const prevIds = previousStructuresRef.current;

    setStructureInstanceDetails((prevDetails) => {
      const nextDetails = buildStructureDetails(
        nextIds,
        prevIds,
        prevDetails
      );
      previousStructuresRef.current = nextIds;
      return nextDetails;
    });
  }, [buildStructureDetails, selectedProductStructures]);

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
    [selectedProductStructures, structureInstanceDetails, structureOptions]
  );
  const isCustomVendorFlow = vendorCustomUserTypeMode === true;
  const isMultiInstanceSitePhotoUploadFlow =
    requiresFurnitureSelection &&
    structureQuantityItems.length > 1 &&
    (isCustomVendorFlow || isCustomDocNomenclatureEnabled);

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
    setSimilarLeadWarning(null);
    setLastSimilarLeadCheckKey("");
  }, [form, requiresFurnitureSelection]);

  useEffect(() => {
    if (!isMultiInstanceSitePhotoUploadFlow) {
      setInstanceSitePhotoUploads({});
      return;
    }

    setInstanceSitePhotoUploads((prev) => {
      const next: Record<string, File[]> = {};
      for (const item of structureQuantityItems) {
        next[item.key] = prev[item.key] ?? [];
      }
      return next;
    });
  }, [isMultiInstanceSitePhotoUploadFlow, structureQuantityItems]);

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
        form.setValue("product_structures", [onlyId], {
          shouldValidate: true,
        });
      } else if (current.length !== onlySelections.length) {
        form.setValue("product_structures", onlySelections, {
          shouldValidate: true,
        });
      }
      return;
    }

    if (onlySelections.length !== 1 || current.length !== 1) {
      form.setValue("product_structures", [onlyId], {
        shouldValidate: true,
      });
    }
  }, [
    allowDuplicatesForWardrobe,
    form,
    hasSelectedFurnitureType,
    structureOptions,
  ]);

  // Keep selected structures in sync with available options
  useEffect(() => {
    if (!hasSelectedFurnitureType) {
      const current = form.getValues("product_structures") || [];
      if (current.length > 0) {
        form.setValue("product_structures", [], { shouldValidate: true });
      }
      return;
    }
    const current = form.getValues("product_structures") || [];
    const valid = current.filter((id) =>
      structureOptions.some((opt) => opt.value === id)
    );
    if (valid.length !== current.length) {
      form.setValue("product_structures", valid, { shouldValidate: true });
    }
  }, [structureOptions, form, hasSelectedFurnitureType]);

  const queryClient = useQueryClient();
  const checkContactMutation = useCheckContactOrEmailExists();
  const checkSimilarLeadMutation = useCheckSimilarLeadExists();

  // fetch data once at top of component (after form etc.)
  const { data: vendorUsers, isLoading: isVendorUsersLoading } =
    useVendorSalesExecutiveUsers(
      vendorId,
      franchiseId,
      vendorCustomUserTypeMode === true
        ? {
            assigneeUserType: "custom",
            requiredPrivilegeCode:
              "leads.open_leads.details_of_lead.add_lead",
          }
        : undefined,
    );
  const router = useRouter();

  const vendorUserss = vendorUsers?.data?.sales_executives ?? [];

  const { data: architectData, isLoading: isArchitectsLoading } = useArchitectureMastersDropdownList(vendorId);
  const architectsList = architectData?.data || [];

  const { data: designerUsers, isLoading: isDesignersLoading } =
    useVendorSalesExecutiveUsers(
      vendorId,
      franchiseId,
      vendorCustomUserTypeMode === true
        ? {
            assigneeUserType: "custom",
            requiredPrivilegeCode: "leads.designing_stage.designs.upload",
          }
        : undefined,
    );
  const designersList = Array.isArray(designerUsers?.data) 
    ? designerUsers.data 
    : (designerUsers?.data?.sales_executives || []);

  const createLeadMutation = useMutation({
    mutationFn: async ({
      payload,
      files,
    }: {
      payload: any;
      files: File[];
    }) => {
      if (mode === "lead-pool") {
        const productTypeNames = (payload.product_types || []).map((id: any) => {
          const typeObj = productTypes?.data?.find((t: any) => String(t.id) === String(id));
          return typeObj ? typeObj.type : "";
        }).filter(Boolean);

        const productStructureNames = (payload.product_structures || []).map((id: any) => {
          const structObj = productStructures?.data?.find((s: any) => String(s.id) === String(id));
          return structObj ? structObj.type : "";
        }).filter(Boolean);

        const response = await apiClient.post("/online-leads/walk-in", {
          vendor_id: payload.vendor_id,
          leads_name: `${payload.firstname} ${payload.lastname}`.trim(),
          firstname: payload.firstname,
          lastname: payload.lastname,
          email: payload.email || undefined,
          contact: payload.contact_no,
          alt_contact_no: payload.alt_contact_no || undefined,
          site_address: payload.site_address || undefined,
          site_type_id: payload.site_type_id ? Number(payload.site_type_id) : undefined,
          source_id: payload.source_id ? Number(payload.source_id) : undefined,
          refered_by: payload.refered_by || undefined,
          archetech_name: payload.archetech_name || undefined,
          archetech_number: payload.archetech_number || undefined,
          priority: payload.priority || undefined,
          product_types: productTypeNames,
          product_structures: productStructureNames,
          store_id: Number(payload.franchise_id),
          remark: payload.designer_remark,
          created_by: payload.created_by,
        });
        return response.data;
      }
      return createLead(payload, files);
    },
    onSuccess: async (data: any) => {
      const selectedDesignerId = form.getValues("designer_id");
      const createdLead = data?.data?.lead || data?.data || data;
      const leadId = createdLead?.id || createdLead?.lead_id;

      if (mode !== "lead-pool" && selectedDesignerId && leadId) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await assignDesignerToLead(vendorId, leadId, {
            account_id: Number(createdLead?.account_id || 0),
            assign_to_user_id: Number(selectedDesignerId),
            created_by: Number(createdBy || userId),
            user_type_or_role: "designer",
          });
        } catch (e) {
          console.error("Failed to assign designer", e);
        }
      }

      toastManager.add({ title: "Lead created successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["leadStats", vendorId, userId] });
      queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
      queryClient.invalidateQueries({ queryKey: ["vendorUserLeads", vendorId, userId] });
      form.reset();
      setFiles([]);
      onClose();
      router.push("/dashboard/leads/leadstable");
    },
    onError: (error: any) => {
      console.error("Form submission error:", error);
      toastManager.add({ title: getErrorMessage(error), type: "error" });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({ payload, files }: { payload: any; files: File[] }) =>
      createLead(payload, files),
    onSuccess: async (data: any) => {
      const selectedDesignerId = form.getValues("designer_id");
      const createdLead = data?.data?.lead || data?.data || data;
      const leadId = createdLead?.id || createdLead?.lead_id;

      if (selectedDesignerId && leadId) {
        try {
          // Delay execution to prevent backend race conditions where concurrent mapping creation causes the backend to assign the wrong role (ISM instead of designer)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await assignDesignerToLead(vendorId, leadId, {
            account_id: Number(createdLead?.account_id || 0),
            assign_to_user_id: Number(selectedDesignerId),
            created_by: Number(createdBy || userId),
            user_type_or_role: "designer",
          });
        } catch (e) {
          console.error("Failed to assign designer", e);
        }
      }

      toastManager.add({ title: "Lead saved as draft!", type: "success" });
      queryClient.invalidateQueries({
        queryKey: ["leadStats", vendorId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["universal-stage-leads"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeads", vendorId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["draft-lead-table-data"],
      });
      form.reset();
      setFiles([]);
      onClose();
      router.push("/dashboard/leads/draft-lead");
    },
    onError: (error: any) => {
      console.error("Draft save error:", error);
      toastManager.add({ title: getErrorMessage(error), type: "error" });
    },
  });

  const normalizePhone = (value?: string) => {
    if (!value) return "";
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) return parsed.nationalNumber;
    return value.replace(/\D/g, "");
  };

  const resetSimilarLeadValidation = useCallback(() => {
    setSimilarLeadWarning(null);
    setLastSimilarLeadCheckKey("");
  }, []);

  const getSimilarLeadCheckPayload = useCallback(() => {
    const phoneNumber = normalizePhone(form.getValues("contact_no"));
    const productTypes = (form.getValues("product_types") || [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (!phoneNumber || productTypes.length === 0) {
      return null;
    }

    const signature = [
      phoneNumber,
      [...productTypes].sort((a, b) => a - b).join(","),
    ].join("|");

    return {
      signature,
      payload: {
        phone_number: phoneNumber,
        product_types: productTypes,
      },
    };
  }, [form]);

  const handleSimilarLeadCheck = useCallback(() => {
    if (!vendorId) return;

    const details = getSimilarLeadCheckPayload();
    if (!details) {
      resetSimilarLeadValidation();
      return;
    }

    if (lastSimilarLeadCheckKey === details.signature) return;
    setLastSimilarLeadCheckKey(details.signature);

    checkSimilarLeadMutation.mutate(
      { vendorId, payload: details.payload },
      {
        onSuccess: (res) => {
          setSimilarLeadWarning(res?.exists ? res.lead : null);
        },
        onError: (err: any) => {
          setLastSimilarLeadCheckKey("");
          toastManager.add({
            title: err?.message || "Could not verify similar lead",
            type: "error",
          });
        },
      }
    );
  }, [
    checkSimilarLeadMutation,
    getSimilarLeadCheckPayload,
    lastSimilarLeadCheckKey,
    resetSimilarLeadValidation,
    vendorId,
  ]);

  const handleSimilarityFieldBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const nextFocused = event.relatedTarget;
      if (nextFocused && event.currentTarget.contains(nextFocused as Node)) {
        return;
      }

      handleSimilarLeadCheck();
    },
    [handleSimilarLeadCheck]
  );

  const similarLeadErrorMessage =
    "Similar lead already exists in the CRM, Hence it cannot be created.";

  const handleDuplicateCheck = (
    field: "contact_no" | "alt_contact_no" | "email"
  ) => {
    if (!vendorId) return;

    const rawValue = form.getValues(field) || "";
    const trimmed = rawValue.trim();
    if (!trimmed) return;

    let payload:
      | { phone_number: string }
      | { alt_phone_number: string }
      | { email: string };
    let normalized = trimmed;

    if (field === "email") {
      normalized = trimmed.toLowerCase();
      payload = { email: normalized };
    } else if (field === "contact_no") {
      normalized = normalizePhone(trimmed);
      if (!normalized) return;
      payload = { phone_number: normalized };
    } else {
      normalized = normalizePhone(trimmed);
      if (!normalized) return;
      payload = { alt_phone_number: normalized };
    }

    if (lastCheckedValue[field] === normalized) return;
    setLastCheckedValue((prev) => ({ ...prev, [field]: normalized }));

    checkContactMutation.mutate(
      { vendorId, payload },
      {
        onSuccess: (res) => {
          if (res?.exists) {
            setDuplicatePrompt({
              open: true,
              field,
              lead: res.lead || undefined,
            });
          }
        },
        onError: (err: any) => {
          toastManager.add({ title: err?.message || "Could not verify contact/email uniqueness", type: "error" });
        },
      }
    );
  };

  const handleDuplicateDecision = (proceed: boolean) => {
    if (!proceed && duplicatePrompt.field) {
      form.setValue(duplicatePrompt.field, "");
      setLastCheckedValue((prev) => ({
        ...prev,
        [duplicatePrompt.field as "contact_no" | "alt_contact_no" | "email"]:
          "",
      }));
    }
    setDuplicatePrompt({ open: false });
  };

  const buildRenamedSitePhotoFiles = useCallback(() => {
    const clientName = `${form.getValues("firstname") || ""} ${
      form.getValues("lastname") || ""
    }`.trim();
    const furnitureTypeName =
      productTypes?.data?.find(
        (type: any) => String(type.id) === selectedProductTypes?.[0],
      )?.type || "Furniture Type";
    const uploadDate = formatFileDate(new Date());

    if (isMultiInstanceSitePhotoUploadFlow) {
      return structureQuantityItems.flatMap((item) =>
        renameLeadSitePhotoFiles({
          files: instanceSitePhotoUploads[item.key] ?? [],
          clientName,
          targetLabel: item.title || item.label,
          uploadDate,
        }),
      );
    }

    return isCustomVendorFlow || isCustomDocNomenclatureEnabled
      ? renameLeadSitePhotoFiles({
          files,
          clientName,
          targetLabel: furnitureTypeName,
          uploadDate,
        })
      : files;
  }, [
    files,
    form,
    instanceSitePhotoUploads,
    isCustomDocNomenclatureEnabled,
    isCustomVendorFlow,
    isMultiInstanceSitePhotoUploadFlow,
    productTypes?.data,
    selectedProductTypes,
    structureQuantityItems,
  ]);

  function onSubmit(values: FormValues) {
    if (similarLeadWarning) {
      toastManager.add({ title: similarLeadErrorMessage, type: "error" });
      return;
    }

    if (!vendorId || !createdBy || !franchiseId) {
      toastManager.add({ title: "User authentication required", type: "error" });
      return;
    }

    // Parse phone number properly
    let countryCode: string;
    let phoneNumber: string;
    if (isB2b) {
      countryCode = "+91";
      phoneNumber = (values.contact_no || "").replace(/\D/g, "");
    } else {
      const phone = values.contact_no
        ? parsePhoneNumberFromString(values.contact_no)
        : null;
      countryCode = phone?.countryCallingCode ? `+${phone.countryCallingCode}` : "";
      phoneNumber = phone?.nationalNumber || "";
    }

    // Alt contact number (just keep digits)
    const altContactNo = values.alt_contact_no?.replace(/\D/g, "") || undefined;

    const payload = {
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email,
      site_address: values.site_address || undefined,
      site_type_id: values.site_type_id ? Number(values.site_type_id) : undefined,
      source_id: Number(values.source_id),
      refered_by: values.refered_by?.trim() || undefined,
      client_id: isB2b && values.client_id ? Number(values.client_id) : undefined,
      order_number: values.order_number || undefined,
      archetech_name: values.archetech_name || undefined,
      architect_id: values.architect_id ? Number(values.architect_id) : undefined,
      archetech_number: values.archetech_number || undefined,
      designer_remark: values.designer_remark || undefined,
      vendor_id: vendorId,
      franchise_id: values.franchise_id || (franchiseId ? String(franchiseId) : undefined),
      created_by: createdBy,
      priority: values.priority || "Medium",
      // ✅ new field
      site_map_link: savedMapLocation
        ? `https://www.google.com/maps?q=${savedMapLocation.lat},${savedMapLocation.lng}`
        : undefined,

      // ✅ cleanly separated
      country_code: countryCode,
      contact_no: phoneNumber,
      alt_contact_no: altContactNo,

      product_types: requiresFurnitureSelection ? values.product_types || [] : [],
      product_structures: requiresFurnitureSelection
        ? values.product_structures || []
        : [],
      product_structure_instances: requiresFurnitureSelection
        ? buildStructureInstancesPayload()
        : [],
      initial_site_measurement_date: values.initial_site_measurement_date
        ? new Date(values.initial_site_measurement_date).toISOString()
        : undefined,

      // Assignment logic based on user role
      ...(canReassingLead(userType)
        ? {
          // Admin/Super-admin can assign to anyone
          assign_to: values.assign_to ? Number(values.assign_to) : undefined,
          assigned_by: createdBy ? createdBy : undefined,
        }
        : {
          // Sales executive self-assigns
          assign_to: createdBy,
          assigned_by: createdBy,
        }),
    };

    // ── Pre-flight validation ──────────────────────────────────────────────
    if (files.length > 40) {
      toastManager.add({
        title: "Maximum 40 files allowed. Please remove some files.",
        type: "error",
      });
      return;
    }
    const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);
    const MAX_TOTAL_MB = 400;
    if (totalSizeBytes > MAX_TOTAL_MB * 1024 * 1024) {
      toastManager.add({
        title: `Total upload size exceeds ${MAX_TOTAL_MB}MB limit.`,
        type: "error",
      });
      return;
    }

    createLeadMutation.mutate(
      { payload, files: buildRenamedSitePhotoFiles() },
      {
        onSuccess: async () => {
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });
          if (mode === "lead-pool") {
            onClose();
            window.location.reload();
          } else {
            router.push("/dashboard/leads/leadstable");
          }
        },
      }
    );
  }

  async function handleSaveAsDraft() {
    // Temporarily switch to draft schema for validation
    const draftSchema = draftFormSchema(userType, isB2b, referenceSourceIds);
    const values = form.getValues();

    // Validate against draft schema
    const result = draftSchema.safeParse(values);

    if (!result.success) {
      // Show validation errors
      const errors = result.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, messages]) => {
        form.setError(field as any, {
          type: "manual",
          message: messages?.[0] || "Invalid value",
        });
      });
      toastManager.add({ title: "Please fill required fields for draft", type: "error" });
      return;
    }

    if (!vendorId || !createdBy || !franchiseId) {
      toastManager.add({ title: "User authentication required", type: "error" });
      return;
    }

    let countryCode: string;
    let phoneNumber: string;
    if (isB2b) {
      countryCode = "+91";
      phoneNumber = (values.contact_no || "").replace(/\D/g, "");
    } else {
      const phone = values.contact_no
        ? parsePhoneNumberFromString(values.contact_no)
        : null;
      countryCode = phone?.countryCallingCode ? `+${phone.countryCallingCode}` : "";
      phoneNumber = phone?.nationalNumber || "";
    }

    const payload = {
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email || undefined,
      site_address: values.site_address || undefined,
      site_type_id: values.site_type_id
        ? Number(values.site_type_id)
        : undefined,
      source_id: values.source_id ? Number(values.source_id) : undefined,
      refered_by: values.refered_by?.trim() || undefined,
      client_id: isB2b && values.client_id ? Number(values.client_id) : undefined,
      order_number: values.order_number || undefined,
      archetech_name: values.archetech_name || undefined,
      architect_id: values.architect_id ? Number(values.architect_id) : undefined,
      archetech_number: values.archetech_number || undefined,
      designer_remark: values.designer_remark || undefined,
      vendor_id: vendorId,
      franchise_id: values.franchise_id || (franchiseId ? String(franchiseId) : undefined),
      created_by: createdBy,
      priority: values.priority || undefined,
      site_map_link: savedMapLocation
        ? `https://www.google.com/maps?q=${savedMapLocation.lat},${savedMapLocation.lng}`
        : undefined,
      country_code: countryCode,
      contact_no: phoneNumber,
      alt_contact_no: values.alt_contact_no
        ? values.alt_contact_no.replace(/\D/g, "") // remove + or non-digits
        : undefined,
      product_types: requiresFurnitureSelection ? values.product_types || [] : [],
      product_structures: requiresFurnitureSelection
        ? values.product_structures || []
        : [],
      product_structure_instances: requiresFurnitureSelection
        ? buildStructureInstancesPayload()
        : [],
      initial_site_measurement_date: values.initial_site_measurement_date
        ? new Date(values.initial_site_measurement_date).toISOString()
        : undefined,
      ...(canReassingLead(userType)
        ? {
          assign_to: values.assign_to ? Number(values.assign_to) : undefined,
          assigned_by: createdBy,
        }
        : {
          assign_to: createdBy,
          assigned_by: createdBy,
        }),
      is_draft: true,
    };

    saveDraftMutation.mutate({ payload, files: buildRenamedSitePhotoFiles() });
  }

  return (
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
                
                const scrollContainer = targetScrollEl.closest("[data-radix-scroll-area-viewport]") || targetScrollEl.closest("form");
                if (scrollContainer instanceof HTMLElement) {
                  const containerRect = scrollContainer.getBoundingClientRect();
                  const elRect = targetScrollEl.getBoundingClientRect();
                  const scrollOffset = elRect.top - containerRect.top + scrollContainer.scrollTop - (containerRect.height / 2) + (elRect.height / 2);
                  scrollContainer.scrollTo({
                    top: scrollOffset,
                    behavior: "smooth",
                  });
                } else {
                  targetScrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }

                const focusable = el.querySelector("input, select, textarea, button");
                if (focusable instanceof HTMLElement) {
                  focusable.focus({ preventScroll: true });
                }
              }
            }
          })}
          className="space-y-4 p-5">
        {/* File Upload */}

        {/* Client / Project (B2B) or First Name & Last Name */}
        {isB2b ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => {
                  const pickerData = clientsList.map((c) => ({
                    id: c.id,
                    label: c.company_name || c.name,
                    subLabel: c.clientCode,
                  }));

                  return (
                    <FormItem data-name={field?.name || ""}>
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
                  <FormItem data-name={field?.name || ""} >
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
                <FormItem data-name={field?.name || ""} >
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
                <FormItem data-name={field?.name || ""} >
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
                <FormItem data-name={field?.name || ""} >
                  <FormLabel className="text-sm">Last Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter last name"
                      type="text"
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  {/* <FormDescription className="text-xs">
                      Lead's last name.
                    </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Contact Numbers */}
        {!isB2b && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <FormField
              control={form.control}
              name="contact_no"
              render={({ field }) => (
                <FormItem data-name={field?.name || ""} >
                  <FormLabel className="text-sm">Phone Number *</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="IN"
                      placeholder="Enter phone number"
                      className="text-sm"
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        resetSimilarLeadValidation();
                      }}
                      onBlur={() => {
                        field.onBlur();
                        handleDuplicateCheck("contact_no");
                        handleSimilarLeadCheck();
                      }}
                       validateIndianNumber={true}
                    />
                  </FormControl>
                  {/* <FormDescription className="text-xs">
                      Primary phone number.
                    </FormDescription> */}
                  <FormMessage />
                  {similarLeadWarning && (
                    <p className="text-sm font-medium text-destructive">
                      {similarLeadErrorMessage}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alt_contact_no"
              render={({ field }) => (
                <FormItem data-name={field?.name || ""} >
                  <FormLabel className="text-sm">Alt. Phone Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="IN"
                      placeholder="Enter alt number"
                      className="text-sm"
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      onBlur={() => {
                        field.onBlur();
                        handleDuplicateCheck("alt_contact_no");
                      }}
                      validateIndianNumber={true}
                    />
                  </FormControl>
                  {/* <FormDescription className="text-xs">
                      Optional alternate number (without country code).
                    </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Email */}
        {!isB2b && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem data-name={field?.name || ""} >
                <FormLabel className="text-sm">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    className="text-sm"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={(e) => {
                      field.onBlur();
                      handleDuplicateCheck("email");
                    }}
                  />
                </FormControl>
                {/* <FormDescription className="text-xs">
                    Lead's email address.
                  </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Site Type */}
        {!isB2b && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <FormField
            control={form.control}
            name="site_type_id"
            render={({ field }) => {
              const { data: siteTypes, isLoading } = useSiteTypes();

              // ✅ Transform API data into AssignToPicker format
              const pickerData =
                siteTypes?.data?.map((site: any) => ({
                  id: site.id,
                  label: site.type, // Display field
                })) || [];

              return (
                <FormItem data-name={field?.name || ""} >
                  <FormLabel className="text-sm">
                    Site Type *
                  </FormLabel>

                  {isLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Loading site types...
                    </p>
                  ) : (
                    <AssignToPicker
                      data={pickerData}
                      value={field.value ? Number(field.value) : undefined}
                      onChange={(selectedId: number | null) => {
                        field.onChange(selectedId ? String(selectedId) : ""); // ✅ cast to string
                      }}
                      placeholder="Search site type..."
                    />
                  )}

                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem data-name={field?.name || ""} >
                <FormLabel className="text-sm">Priority *</FormLabel>
                <AssignToPicker
                  data={priorityOptions.map((option) => ({
                    id: option.id,
                    label: option.label,
                  }))}
                  value={
                    priorityOptions.find((option) => option.value === field.value)
                      ?.id
                  }
                  onChange={(selectedId: number | null) => {
                    const selected = priorityOptions.find(
                      (option) => option.id === selectedId
                    );
                    if (selected) field.onChange(selected.value);
                  }}
                  placeholder="Select priority..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        )}

        {/* Select Store for Lead Pool */}
        {mode === "lead-pool" && (
          <div className="mt-3">
            <FormField
              control={form.control}
              name="franchise_id"
              render={({ field }) => {
                const pickerData = franchisesForB2b.map((f: any) => ({
                  id: f.id,
                  label: f.franchise_name || f.name,
                }));

                const userHasStore = franchiseId && userType !== "super-admin" && userType !== "admin";

                return (
                  <FormItem className="space-y-1.5 col-span-2">
                    <FormLabel className="text-sm">Select Store (Walk-In Location) *</FormLabel>
                    {userHasStore ? (
                      <Input
                        disabled
                        value={franchisesForB2b.find((f: any) => f.id === franchiseId)?.franchise_name || "Current Store"}
                        className="h-10 rounded-xl border bg-muted/50 cursor-not-allowed"
                      />
                    ) : (
                      <AssignToPicker
                        data={pickerData}
                        value={field.value ? Number(field.value) : undefined}
                        onChange={(selectedId: number | null) => {
                          field.onChange(selectedId ? String(selectedId) : "");
                        }}
                        placeholder="Search store/franchise..."
                        emptyLabel="Select Store"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <FormField
            control={form.control}
            name="source_id"
            render={({ field }) => {
              return (
                <FormItem data-name={field?.name || ""} >
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
              );
            }}
          />

          {isB2b && (
            <FormField
              control={form.control}
              name="alt_contact_no"
              render={({ field }) => (
                <FormItem data-name={field?.name || ""} >
                  <FormLabel className="text-sm">Phone Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="IN"
                      placeholder="Enter phone number"
                      className="text-sm"
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      onBlur={() => {
                        field.onBlur();
                        handleDuplicateCheck("alt_contact_no");
                      }}
                      validateIndianNumber={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {(showReferredByField || canReassingLead(userType)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {showReferredByField && (
              <FormField
                control={form.control}
                name="refered_by"
                render={({ field }) => (
                  <FormItem data-name={field?.name || ""} >
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
            )}

            {canReassingLead(userType) && (
              <FormField
                control={form.control}
                name="assign_to"
                render={({ field }) => {
                  const pickerData =
                    vendorUserss?.map((user: any) => ({
                      id: user.id,
                      label: user.user_type?.user_type === 'super-admin'
                        ? `${user.user_name} - super admin`
                        : user.user_name,
                    })) || [];

                  return (
                    <FormItem data-name={field?.name || ""} >
                      <FormLabel className="text-sm">Assign Lead To *</FormLabel>

                      <AssignToPicker
                        data={pickerData}
                        value={field.value ? Number(field.value) : undefined}
                        onChange={(selectedId) => {
                          field.onChange(selectedId ? String(selectedId) : "");
                        }}
                        placeholder="Search assignee..."
                        disabled={isVendorUsersLoading}
                      />

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}
          </div>
        )}

        {/* Site Address */}
        <FormField
          control={form.control}
          name="site_address"
          render={({ field }) => (
            <FormItem data-name={field?.name || ""} >
              <div className="w-full flex justify-between ">
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
              <div className="flex gap-2">
                <FormControl className="flex-1">
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
              </div>
              <FormMessage />
              <MapPicker
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                savedLocation={savedMapLocation} // Pass saved location to remember
                onSelect={(address, link) => {
                  // Auto-fill textarea
                  field.onChange(address);

                  // Save the location for future reference
                  const coords = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                  if (coords) {
                    const newLocation = {
                      lat: parseFloat(coords[1]),
                      lng: parseFloat(coords[2]),
                      address: address,
                    };
                    setSavedMapLocation(newLocation);
                  }

                  console.log("Selected Map Link:", link);
                }}
              />
            </FormItem>
          )}
        />

        {requiresFurnitureSelection && (
          <>
            <StructureQuantityCards
              items={structureQuantityItems}
              className="mt-2"
              onRemove={(removeIndex) => {
                const current = form.getValues("product_structures") || [];
                const next = current.filter((_, index) => index !== removeIndex);
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

                  const multiselectOptions: Option[] =
                    productTypes?.data?.map((p: any) => ({
                      value: String(p.id),
                      label: p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "",
                    })) || [];

                  const selectedOptions = (field.value || [])
                    .map((id) => multiselectOptions.find((opt) => opt.value === String(id)))
                    .filter((opt): opt is Option => !!opt);

                  return (
                    <FormItem data-name={field?.name || ""} >
                    <FormLabel className="text-sm">Furniture Type *</FormLabel>

                      {isProductTypesLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : mode === "lead-pool" ? (
                        <div onBlurCapture={handleSimilarityFieldBlur}>
                          <MultipleSelector
                            value={selectedOptions}
                            onChange={(selectedOptions) => {
                              resetSimilarLeadValidation();
                              const selectedIds = selectedOptions.map((opt) => opt.value);
                              field.onChange(selectedIds);
                            }}
                            options={multiselectOptions}
                            placeholder="Select furniture types"
                            emptyIndicator={
                              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                                no results found.
                              </p>
                            }
                          />
                        </div>
                      ) : (
                        <div onBlurCapture={handleSimilarityFieldBlur}>
                          <AssignToPicker
                            data={pickerData}
                            value={
                              field.value?.length ? Number(field.value[0]) : undefined
                            }
                            onChange={(selectedId) => {
                              resetSimilarLeadValidation();
                              field.onChange(selectedId ? [String(selectedId)] : []);
                            }}
                            placeholder="Search furniture type..."
                          />
                        </div>
                      )}

                      <FormMessage />
                      {similarLeadWarning && (
                        <p className="text-sm font-medium text-destructive">
                          {similarLeadErrorMessage}
                        </p>
                      )}
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
                      structureOptions.some((opt) => opt.value === id)
                    )
                    .map((id) => {
                      const option = structureOptions.find(
                        (opt) => opt.value === id
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
                    <FormItem data-name={field?.name || ""} >
                      <FormLabel className="text-sm">
                        Furniture Structure *
                      </FormLabel>
                      <FormControl>
                      <Tooltip {...(shouldShowMaxTooltip ? { open: true } : {})}>
                          <TooltipTrigger asChild>
                            <div className="w-full">
                              <MultipleSelector
                                value={selectedOptions}
                                onChange={(selectedOptions) => {
                                  const selectedIds = selectedOptions.map(
                                    (opt) => opt.value
                                  );
                                  field.onChange(selectedIds);
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
                                allowDuplicateSelections={allowDuplicatesForWardrobe}
                                onMaxSelected={() => {
                                  if (!isKitchenStructureSingleSelect) return;
                                  setShowMaxStructureTooltip(true);
                                  if (maxStructureTooltipTimerRef.current) {
                                    window.clearTimeout(
                                      maxStructureTooltipTimerRef.current
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
                                      maxStructureTooltipTimerRef.current
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
          </>
        )}

        {!isB2b && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start mb-3">
            <FormField
              control={form.control}
              name="initial_site_measurement_date"
              render={({ field }) => (
                <FormItem data-name={field?.name || ""} >
                  <FormLabel className="text-sm">
                    Initial Site Measurement Date
                  </FormLabel>
                  <FormControl>
                    <CustomeDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      restriction="futureOnly"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        {vendorCustomUserTypeMode && !isB2b && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start mb-3">
            <FormField
              control={form.control}
              name="architect_id"
              render={({ field }) => {
                const pickerData = architectsList.map((a: any) => ({
                  id: a.id,
                  label: a.name || "",
                  subLabel: a.mobile || "",
                }));
                return (
                  <FormItem data-name={field?.name || ""} >
                    <FormLabel className="text-sm">Architect</FormLabel>
                    <AssignToPicker
                      data={pickerData}
                      textClassName="text-sm font-medium"
                      value={field.value ? Number(field.value) : undefined}
                      onChange={(selectedId) => {
                        field.onChange(selectedId ? String(selectedId) : "");
                        if (selectedId) {
                          const selectedArchitect = architectsList.find((a: any) => a.id === selectedId);
                          if (selectedArchitect) {
                            form.setValue("archetech_name", selectedArchitect.name);
                            form.setValue("archetech_number", selectedArchitect.mobile);
                          }
                        } else {
                          form.setValue("archetech_name", "");
                          form.setValue("archetech_number", "");
                        }
                      }}
                      placeholder="Select Architect..."
                      disabled={isArchitectsLoading}
                    
                    />
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="designer_id"
              render={({ field }) => {
                const pickerData = designersList.map((d: any) => ({
                  id: d.id,
                  label: d.user_name || "",
                  subLabel: d.user_email || d.email || "",
                }));
                return (
                  <FormItem data-name={field?.name || ""} >
                    <FormLabel className="text-sm">Designer</FormLabel>
                    <AssignToPicker
                      data={pickerData}
                      textClassName="text-sm font-medium"
                      value={field.value ? Number(field.value) : undefined}
                      onChange={(selectedId) => {
                        field.onChange(selectedId ? String(selectedId) : "");
                      }}
                      placeholder="Select Designer..."
                      disabled={isDesignersLoading}
                    />
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        )}
        {!vendorCustomUserTypeMode && !isB2b && (
          <div className="grid grid-cols-1 gap-3 items-start sm:grid-cols-2">
            {/* Architect Name */}
            <FormField
              control={form.control}
              name="archetech_name"
              render={({ field }) => (
                <FormItem data-name={field?.name || ""} >
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
            <FormField
              control={form.control}
              name="archetech_number"
              render={({ field }) => (
                <FormItem data-name={field?.name || ""} >
                  <FormLabel className="text-sm">Architect Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="IN"
                      placeholder="Enter architect number"
                      className="text-sm"
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      validateIndianNumber={true}
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
              <FormItem data-name={field?.name || ""} >
                <FormLabel className="text-sm">Designer's Remark</FormLabel>
                <FormControl>
                  <TextAreaInput placeholder="Enter your remarks" {...field} />
                </FormControl>
                {/* <FormDescription className="text-xs">
                    Additional remarks or notes.
                  </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isB2b && (
          <FormField
            control={form.control}
            name="documents"
            render={({ field }) => (
              <FormItem data-name={field?.name || ""} >
                <FormLabel className="text-sm">Site Photos</FormLabel>
                <FormControl>
                  {isMultiInstanceSitePhotoUploadFlow ? (
                    <div className="space-y-4">
                      <div className="text-xs text-muted-foreground border-b pb-4">
                        Upload site photos for each selected instance.
                      </div>
                      <div className="grid gap-2">
                        {structureQuantityItems.map((item) => (
                          <div key={item.key}>
                            <div className="space-y-2">
                              <div>
                                <h4 className="text-sm font-semibold">
                                  {item.title || item.label}
                                </h4>
                                {item.desc ? (
                                  <p className="text-xs text-muted-foreground">
                                    {item.desc}
                                  </p>
                                ) : null}
                              </div>
                              <FileUploadField
                                value={instanceSitePhotoUploads[item.key] ?? []}
                                onChange={(nextFiles) =>
                                  setInstanceSitePhotoUploads((prev) => ({
                                    ...prev,
                                    [item.key]: nextFiles,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <FileUploadField
                      value={files}
                      onChange={setFiles}
                      multiple={true}
                      maxFiles={40}
                      maxSizeMB={400}
                    />
                  )}
                </FormControl>
                <FormDescription className="text-xs">
                  Upload photos or documents.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <AlertDialog
          open={duplicatePrompt.open}
          onOpenChange={(open) => {
            if (!open) setDuplicatePrompt({ open: false });
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Duplicate lead detected</AlertDialogTitle>
              <AlertDialogDescription>
                This{" "}
                {duplicatePrompt.field === "contact_no"
                  ? "phone number"
                  : duplicatePrompt.field === "alt_contact_no"
                    ? "alternate phone number"
                    : "email"}{" "}
                already exists for another lead.
              </AlertDialogDescription>
              {duplicatePrompt.lead && (
                <div className="text-sm rounded-md border p-3 bg-muted/30">
                  <div className="font-semibold text-md">
                    {duplicatePrompt.lead.lead_code ?? "N/A"}
                  </div>
                  <div className="text-muted-foreground">
                    {duplicatePrompt.lead.lead_name || "Unknown lead"}
                  </div>
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleDuplicateDecision(false)}>
                Clear field
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDuplicateDecision(true)}>
                Continue anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex flex-row justify-end gap-2 pt-4">
          {/* Save as Draft */}
          {mode !== "lead-pool" && (
            <AlertDialog open={openDraftModal} onOpenChange={setOpenDraftModal}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="text-sm"
                  disabled={saveDraftMutation.isPending}
                >
                  {saveDraftMutation.isPending ? "Saving..." : "Save as Draft"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Save Lead as Draft?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Only the name and contact number will be required. You can
                    fill the rest later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setOpenDraftModal(false);
                      handleSaveAsDraft();
                    }}
                    className="bg-primary"
                  >
                    Confirm Save
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Create Lead Button */}
          <Button
            type="submit"
            className="text-sm"
            disabled={
              createLeadMutation.isPending ||
              checkSimilarLeadMutation.isPending ||
              Boolean(similarLeadWarning)
            }
          >
            {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
