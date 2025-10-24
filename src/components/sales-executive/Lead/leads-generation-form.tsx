"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const queryClient = useQueryClient();

  // fetch data once at top of component (after form etc.)
  const { data: vendorUsers, isLoading } =
    useVendorSalesExecutiveUsers(vendorId);
  const { data: vendorUsersAssignedBy, isLoading: isLoadingAssignedBy } =
    useVendorSalesExecutiveUsers(vendorId);
  console.log(
    "userType:",
    userType,
    "canReassingLead:",
    canReassingLead(userType)
  );
  console.log("vendorUsers response:", vendorUsers);
  const vendorUserss = vendorUsers?.data?.sales_executives ?? [];

  const createLeadMutation = useMutation({
    mutationFn: ({ payload, files }: { payload: any; files: File[] }) =>
      createLead(payload, files),
    onSuccess: (data) => {
      toast.success("Lead created successfully!");
      queryClient.invalidateQueries({
        queryKey: ["leadStats", vendorId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeadsOpen", vendorId],
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
    onSuccess: (data) => {
      toast.success("Lead saved as draft!");
      queryClient.invalidateQueries({
        queryKey: ["leadStats", vendorId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeadsOpen", vendorId],
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
    <div className="w-full max-w-none pt-3 pb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {...field}
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
                      {...field}
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
                    {...field}
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
                const { data: siteTypes, isLoading, error } = useSiteTypes();

                return (
                  <FormItem>
                    <FormLabel className="text-sm">Site Type *</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select site type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteTypes?.data?.map((site: any) => (
                          <SelectItem key={site.id} value={String(site.id)}>
                            {site.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* <FormDescription className="text-xs">
                      Type of site/property.
                    </FormDescription> */}
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

          {/* Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="source_id"
              render={({ field }) => {
                const { data: sourceTypes, isLoading } = useSourceTypes();

                return (
                  <FormItem>
                    <FormLabel className="text-sm">Source *</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceTypes?.data?.map((source: any) => (
                          <SelectItem key={source.id} value={String(source.id)}>
                            {source.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* <FormDescription className="text-xs">
                      Lead source.
                    </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

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

                // Transform selected IDs back to Option[] format for display
                const selectedOptions = (field.value || []).map((id) => {
                  const option = options.find((opt) => opt.value === id);
                  return option || { value: id, label: id }; // fallback if option not found
                });

                return (
                  <FormItem>
                    <FormLabel className="text-sm">Furniture Type *</FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={selectedOptions} // Pass Option[] with proper labels
                        onChange={(selectedOptions) => {
                          // Extract IDs from selected options and store as string[]
                          const selectedIds = selectedOptions.map(
                            (opt) => opt.value
                          );
                          field.onChange(selectedIds);
                        }}
                        options={options}
                        maxSelected={1}
                        placeholder="Select furniture types"
                        disabled={isLoading}
                        hidePlaceholderWhenSelected
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="product_structures"
              render={({ field }) => {
                const { data: productStructures, isLoading } =
                  useProductStructureTypes();

                // Transform API data to options
                const options: Option[] =
                  productStructures?.data?.map((p: any) => ({
                    value: String(p.id),
                    label: p.type,
                  })) ?? [];

                // Transform selected IDs back to Option[] format for display
                const selectedOptions = (field.value || []).map((id) => {
                  const option = options.find((opt) => opt.value === id);
                  return option || { value: id, label: id }; // fallback if option not found
                });

                return (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Furniture Structure *
                    </FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={selectedOptions} // Pass Option[] with proper labels
                        onChange={(selectedOptions) => {
                          // Extract IDs from selected options and store as string[]
                          const selectedIds = selectedOptions.map(
                            (opt) => opt.value
                          );
                          field.onChange(selectedIds);
                        }}
                        options={options}
                        placeholder="Select furniture structures"
                        disabled={isLoading}
                        hidePlaceholderWhenSelected
                      />
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Assign Lead To *</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendorUserss?.map((user: any) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {user.user_name}
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
            render={({ field }) => (
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

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
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
    </div>
  );
}
