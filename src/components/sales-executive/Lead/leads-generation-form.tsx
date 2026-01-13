"use client";

import { useState } from "react";
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
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLead } from "@/api/leads";
import { useAppSelector } from "@/redux/store";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { FileUploadField } from "@/components/custom/file-upload";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { canReassingLead } from "@/components/utils/privileges";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import TextAreaInput from "@/components/origin-text-area";
import CustomeDatePicker from "@/components/date-picker";
import MapPicker from "@/components/MapPicker";
import { MapPin } from "lucide-react";
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
import { useCheckContactOrEmailExists } from "@/hooks/useLeadsQueries";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Schema for Create Lead - all fields required as per business logic
const createFormSchema = (userType: string | undefined) => {
  const isAdminOrSuperAdmin =
    userType === "admin" || userType === "super_admin";

  return z.object({
    firstname: z.string().min(1, "First name is required").max(300),
    lastname: z.string().min(1, "Last name is required").max(300),
    contact_no: z.string().min(1, "This Contact number isn't valid").max(20),
    alt_contact_no: z.string().optional().or(z.literal("")),
    email: z
      .string()
      .email("Please enter a valid email")
      .optional()
      .or(z.literal("")),
    site_type_id: z.string().min(1, "Please select a site type"),
    site_address: z.string().min(1, "Site Address is required").max(2000),
    source_id: z.string().min(1, "Please select a source"),
    product_types: z
      .array(z.string())
      .min(1, "Please select at least one product type"),
    product_structures: z
      .array(z.string())
      .min(1, "Please select at least one product structure"),
    assign_to: isAdminOrSuperAdmin
      ? z.string().min(1, "Please select an assignee")
      : z.string().optional(),
    assigned_by: isAdminOrSuperAdmin ? z.string() : z.string().optional(),
    documents: z.string().optional(),
    archetech_name: z.string().max(300).optional(),
    designer_remark: z.string().max(2000).optional(),
    initial_site_measurement_date: z.string().optional(),
  });
};

// Schema for Draft - only name, contact, and assign_to (for admin) required
const draftFormSchema = (userType: string | undefined) => {
  const isAdminOrSuperAdmin =
    userType === "admin" || userType === "super_admin";

  return z.object({
    firstname: z.string().min(1, "First name is required").max(300),
    lastname: z.string().min(1, "Last name is required").max(300),
    contact_no: z.string().min(1, "Contact number is required").max(20),
    // Admin must assign even in draft
    assign_to: isAdminOrSuperAdmin
      ? z.string().min(1, "Please select an assignee")
      : z.string().optional(),
    // All other fields are optional for draft
    alt_contact_no: z.string().optional().or(z.literal("")),
    email: z.string().optional().or(z.literal("")),
    site_type_id: z.string().optional().or(z.literal("")),
    site_address: z.string().optional().or(z.literal("")),
    source_id: z.string().optional().or(z.literal("")),
    product_types: z.array(z.string()).optional(),
    product_structures: z.array(z.string()).optional(),
    assigned_by: z.string().optional(),
    documents: z.string().optional(),
    archetech_name: z.string().optional(),
    designer_remark: z.string().optional(),
    initial_site_measurement_date: z.string().optional(),
  });
};

interface LeadsGenerationFormProps {
  onClose: () => void;
}
export default function LeadsGenerationForm({
  onClose,
}: LeadsGenerationFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const vendorId = useAppSelector((state: any) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const createdBy = useAppSelector((state: any) => state.auth.user?.id);
  const [mapOpen, setMapOpen] = useState(false);
  const [openDraftModal, setOpenDraftModal] = useState(false);
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

  const [savedMapLocation, setSavedMapLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const form = useForm({
    resolver: zodResolver(createFormSchema(userType)), // Always use create schema initially
    defaultValues: {
      firstname: "",
      lastname: "",
      contact_no: "",
      alt_contact_no: "",
      email: "",
      site_type_id: "",
      site_address: "",
      source_id: "",
      product_types: [],
      product_structures: [],
      documents: "",
      archetech_name: "",
      designer_remark: "N/A",
      assign_to: "",
      assigned_by: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  type FormValues = z.infer<ReturnType<typeof createFormSchema>>;
  const selectedProductTypes = form.watch("product_types");

  const queryClient = useQueryClient();
  const checkContactMutation = useCheckContactOrEmailExists();

  // fetch data once at top of component (after form etc.)
  const { data: vendorUsers, isLoading } =
    useVendorSalesExecutiveUsers(vendorId);
  const router = useRouter();

  const vendorUserss = vendorUsers?.data?.sales_executives ?? [];

  const createLeadMutation = useMutation({
    mutationFn: ({ payload, files }: { payload: any; files: File[] }) =>
      createLead(payload, files),
    onSuccess: () => {
      toast.success("Lead created successfully!");
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
      form.reset();
      setFiles([]);
      onClose();
    },
    onError: (error: any) => {
      console.error("Form submission error:", error);
      const errorMessage =
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        "Failed to create lead";
      toast.error(errorMessage);
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({ payload, files }: { payload: any; files: File[] }) =>
      createLead(payload, files),
    onSuccess: () => {
      toast.success("Lead saved as draft!");
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
      form.reset();
      setFiles([]);
      onClose();
    },
    onError: (error: any) => {
      console.error("Draft save error:", error);
      const errorMessage =
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        "Failed to save draft";
      toast.error(errorMessage);
    },
  });

  const normalizePhone = (value?: string) => {
    if (!value) return "";
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) return parsed.nationalNumber;
    return value.replace(/\D/g, "");
  };

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
          toast.error(
            err?.message || "Could not verify contact/email uniqueness"
          );
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

  function onSubmit(values: FormValues) {
    if (!vendorId || !createdBy) {
      toast.error("User authentication required");
      return;
    }

    // Parse phone number properly
    const phone = values.contact_no
      ? parsePhoneNumberFromString(values.contact_no)
      : null;

    const countryCode = phone?.countryCallingCode
      ? `+${phone.countryCallingCode}`
      : "";
    const phoneNumber = phone?.nationalNumber || "";

    // Alt contact number (just keep digits)
    const altContactNo = values.alt_contact_no?.replace(/\D/g, "") || undefined;

    const payload = {
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email,
      site_address: values.site_address,
      site_type_id: Number(values.site_type_id),
      source_id: Number(values.source_id),
      archetech_name: values.archetech_name || undefined,
      designer_remark: values.designer_remark || undefined,
      vendor_id: vendorId,
      created_by: createdBy,
      // ✅ new field
      site_map_link: savedMapLocation
        ? `https://www.google.com/maps?q=${savedMapLocation.lat},${savedMapLocation.lng}`
        : undefined,

      // ✅ cleanly separated
      country_code: countryCode,
      contact_no: phoneNumber,
      alt_contact_no: altContactNo,

      product_types: values.product_types || [],
      product_structures: values.product_structures || [],
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

    createLeadMutation.mutate(
      { payload, files },
      {
        onSuccess: () => {
          // ✅ Refetch lead count after success
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          router.push("/dashboard/leads/leadstable");
        },
      }
    );
  }

  async function handleSaveAsDraft() {
    // Temporarily switch to draft schema for validation
    const draftSchema = draftFormSchema(userType);
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
      toast.error("Please fill required fields for draft");
      return;
    }

    if (!vendorId || !createdBy) {
      toast.error("User authentication required");
      return;
    }

    const phone = values.contact_no
      ? parsePhoneNumberFromString(values.contact_no)
      : null;
    const countryCode = phone?.countryCallingCode
      ? `+${phone.countryCallingCode}`
      : "";
    const phoneNumber = phone?.nationalNumber || "";

    const payload = {
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email || undefined,
      site_address: values.site_address || undefined,
      site_type_id: values.site_type_id
        ? Number(values.site_type_id)
        : undefined,
      source_id: values.source_id ? Number(values.source_id) : undefined,
      archetech_name: values.archetech_name || undefined,
      designer_remark: values.designer_remark || undefined,
      vendor_id: vendorId,
      created_by: createdBy,
      site_map_link: savedMapLocation
        ? `https://www.google.com/maps?q=${savedMapLocation.lat},${savedMapLocation.lng}`
        : undefined,
      country_code: countryCode,
      contact_no: phoneNumber,
      alt_contact_no: values.alt_contact_no
        ? values.alt_contact_no.replace(/\D/g, "") // remove + or non-digits
        : undefined,
      product_types: values.product_types || [],
      product_structures: values.product_structures || [],
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

    saveDraftMutation.mutate({ payload, files });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5">
        {/* File Upload */}

        {/* First Name & Last Name */}
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
                {/* <FormDescription className="text-xs">
                    Lead's last name.
                  </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
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
                    onBlur={() => {
                      field.onBlur();
                      handleDuplicateCheck("contact_no");
                    }}
                  />
                </FormControl>
                {/* <FormDescription className="text-xs">
                    Primary phone number.
                  </FormDescription> */}
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
                  {/* Use regular Input instead of PhoneInput */}
                  {/* <Input
                        placeholder="Enter alternate number"
                        type="tel"
                        className="text-sm"
                        {...field}
                        /> */}
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

        {/* Email */}
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

        {/* Site Type */}
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
            name="source_id"
            render={({ field }) => {
              const { data: sourceTypes, isLoading } = useSourceTypes();

              // Convert backend data to AssignToPicker format
              const pickerData =
                sourceTypes?.data?.map((source: any) => ({
                  id: source.id,
                  label: source.type, // or whatever field you want to show
                })) || [];

              return (
                <FormItem>
                  <FormLabel className="text-sm">Source *</FormLabel>

                  {isLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Loading sources...
                    </p>
                  ) : (
                    <AssignToPicker
                      data={pickerData}
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
        </div>

        {/* Site Address */}
        <FormField
          control={form.control}
          name="site_address"
          render={({ field }) => (
            <FormItem>
              <div className="w-full flex justify-between ">
                <FormLabel className="text-sm">Site Address *</FormLabel>
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
                  <div className="w-full">
                    <TextAreaInput
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);

                        // ✅ Preserve the lat/lng even if user edits text
                        if (savedMapLocation) {
                          setSavedMapLocation((prev) =>
                            prev ? { ...prev, address: value } : prev
                          );
                        }
                      }}
                      placeholder="Enter address or use map"
                    />
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

        {/* Product Types & Structures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <FormField
            control={form.control}
            name="product_types"
            render={({ field }) => {
              const { data: productTypes, isLoading } = useProductTypes();

              // Transform API data to options
              const options: Option[] =
                productTypes?.data?.map((p: any) => ({
                  value: String(p.id),
                  label: p.type,
                })) ?? [];

              return (
                <FormField
                  control={form.control}
                  name="product_types"
                  render={({ field }) => {
                    const { data: productTypes, isLoading } = useProductTypes();

                    const pickerData =
                      productTypes?.data?.map((p: any) => ({
                        id: p.id,
                        label: p.type,
                      })) || [];

                    return (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Furniture Type *
                        </FormLabel>

                        {isLoading ? (
                          <p className="text-xs text-muted-foreground">
                            Loading...
                          </p>
                        ) : (
                          <AssignToPicker
                            data={pickerData}
                            value={
                              field.value?.length
                                ? Number(field.value[0])
                                : undefined
                            } // ✅ array → single
                            onChange={(selectedId) => {
                              field.onChange(
                                selectedId ? [String(selectedId)] : []
                              ); // ✅ single → array
                            }}
                            placeholder="Search furniture type..."
                          />
                        )}

                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              );
            }}
          />

          <FormField
            control={form.control}
            name="product_structures"
            render={({ field }) => {
              const { data: productStructures, isLoading } =
                useProductStructureTypes();
              const { data: productTypes } = useProductTypes();

              const selectedTypeId = selectedProductTypes?.[0];
              const selectedTypeLabel =
                productTypes?.data?.find(
                  (type: any) => String(type.id) === selectedTypeId
                )?.type || "";
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
              const allowDuplicatesForWardrobe = parentFilter === "Wardrobe";

              // Transform API data to options
              const options: Option[] =
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
                  })) ?? [];

              // Transform selected IDs back to Option[] format for display
              const selectedOptions = (field.value || [])
                .filter((id) => options.some((opt) => opt.value === id))
                .map((id) => {
                  const option = options.find((opt) => opt.value === id);
                  return option || { value: id, label: id };
                });

              return (
                <FormItem>
                  <FormLabel className="text-sm">
                    Furniture Structure *
                  </FormLabel>
                  <FormControl>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <MultipleSelector
                            value={selectedOptions} // Pass Option[] with proper labels
                            onChange={(selectedOptions) => {
                              const selectedIds = selectedOptions.map(
                                (opt) => opt.value
                              );
                              field.onChange(selectedIds);
                            }}
                            options={options}
                            placeholder="Select furniture structures"
                            disabled={isLoading || !hasSelectedFurnitureType}
                            hidePlaceholderWhenSelected
                            showSelectedOptionsInDropdown
                            allowDuplicateSelections={allowDuplicatesForWardrobe}
                          />
                        </div>
                      </TooltipTrigger>
                      {!hasSelectedFurnitureType && (
                        <TooltipContent side="top" sideOffset={6}>
                          Select a furniture type first.
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

        {canReassingLead(userType) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assign To */}
            <FormField
              control={form.control}
              name="assign_to"
              render={({ field }) => {
                const pickerData =
                  vendorUserss?.map((user: any) => ({
                    id: user.id,
                    label: user.user_name,
                  })) || [];

                return (
                  <FormItem>
                    <FormLabel className="text-sm">Assign Lead To *</FormLabel>

                    <AssignToPicker
                      data={pickerData}
                      value={field.value ? Number(field.value) : undefined} // ✅ string → number
                      onChange={(selectedId) => {
                        field.onChange(selectedId ? String(selectedId) : ""); // ✅ number → string
                      }}
                      placeholder="Search assignee..."
                      disabled={isLoading}
                    />

                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />{" "}
        </div>

        {/* Designer Remark */}
        <FormField
          control={form.control}
          name="designer_remark"
          render={({ field }) => (
            <FormItem>
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

        <FormField
          control={form.control}
          name="documents"
          render={() => (
            <FormItem>
              <FormLabel className="text-sm">Site Photos</FormLabel>
              <FormControl>
                <FileUploadField value={files} onChange={setFiles} />
              </FormControl>
              <FormDescription className="text-xs">
                Upload photos or documents.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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

          {/* Create Lead */}
          <Button
            type="submit"
            className="text-sm"
            disabled={createLeadMutation.isPending}
          >
            {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
