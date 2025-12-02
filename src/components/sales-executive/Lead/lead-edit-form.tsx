"use client";

import { useState, useEffect } from "react";
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
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { useAppSelector } from "@/redux/store";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  useSourceTypes,
  useProductStructureTypes,
  useProductTypes,
  useSiteTypes,
} from "@/hooks/useTypesMaster";
import { updateLead, getLeadById, EditLeadPayload } from "@/api/leads";
import { CountryCode, parsePhoneNumber } from "libphonenumber-js";
import TextAreaInput from "@/components/origin-text-area";
import MapPicker from "@/components/MapPicker";
import { MapPin } from "lucide-react";
import CustomeDatePicker from "@/components/date-picker";
import AssignToPicker from "@/components/assign-to-picker";

// Form validation schema
const formSchema = z.object({
  // Required fields
  firstname: z.string().min(1, "First name is required").max(300),
  lastname: z.string().min(1, "Last name is required").max(300),

  // Fix phone validation - make it more lenient or add custom validation
  contact_no: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => {
      try {
        // Try to parse the phone number
        const parsed = parsePhoneNumber(val);
        return parsed && parsed.isValid();
      } catch (error) {
        // If parsing fails, check if it's at least 10 digits
        const digitsOnly = val.replace(/\D/g, "");
        return digitsOnly.length >= 10;
      }
    }, "Please enter a valid phone number"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .or(z.literal("")), // allow empty
  site_type_id: z.string().min(1, "Please select a site type"),
  site_address: z.string().min(1, "Site Address is required").max(2000),

  site_map_link: z.string().optional().or(z.literal("")), // allow empty
  source_id: z.string().min(1, "Please select a source"),

  // Optional fields - fix alt_contact_no validation
  alt_contact_no: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true; // Allow empty
      try {
        const parsed = parsePhoneNumber(val);
        return parsed && parsed.isValid();
      } catch (error) {
        const digitsOnly = val.replace(/\D/g, "");
        return digitsOnly.length >= 10;
      }
    }, "Please enter a valid alternate phone number"),

  product_types: z
    .array(z.string())
    .min(1, "Please select at least one product type"),

  product_structures: z
    .array(z.string())
    .min(1, "Please select at least one product structure"),
  archetech_name: z.string().max(300).optional(),
  designer_remark: z.string().max(2000).optional(),
  initial_site_measurement_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const today = new Date().toISOString().split("T")[0];
        return val >= today;
      },
      { message: "Initial site measurement date cannot be in the past" }
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface EditLeadFormProps {
  leadData: any; // ✅ Type it properly if you have interface
  onClose: () => void;
}

export default function EditLeadForm({ leadData, onClose }: EditLeadFormProps) {
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const createdBy = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const [mapOpen, setMapOpen] = useState(false);
  const [savedMapLocation, setSavedMapLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [primaryCountry, setPrimaryCountry] = useState<CountryCode>("IN");
  const [altCountry, setAltCountry] = useState<CountryCode>("IN");

  const updateLeadMutation = useMutation({
    mutationFn: async (payload: EditLeadPayload) => {
      const result = await updateLead(payload, leadData.id, createdBy!);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ Mutation onSuccess:", data);
      toast.success("Lead updated successfully!");

      // ✅ Refresh specific lead details
      queryClient.invalidateQueries({
        queryKey: ["lead", leadData.id, vendorId, createdBy],
      });

      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeadsOpen", vendorId],
      });

      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeads", vendorId, createdBy],
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update lead");
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
      product_types: [],
      product_structures: [],
      archetech_name: "",
      designer_remark: "",
      initial_site_measurement_date: "",
    },
    mode: "onChange",
  });

  const {
    formState: { dirtyFields },
  } = form;

  useEffect(() => {
    console.log("LeadID: ", leadData.id);
    console.log("VendorID: ", vendorId);
    console.log("CreatedBy: ", createdBy);
    const fetchLeadData = async () => {
      if (!leadData?.id || !vendorId || !createdBy) return;

      try {
        setIsLoadingLead(true);
        const response = await getLeadById(leadData.id, vendorId, createdBy);
        const lead = response.data.lead;

        const productTypeIds =
          lead.productMappings?.map((m: any) => String(m.product_type_id)) ||
          [];
        const productStructureIds =
          lead.leadProductStructureMapping?.map((m: any) =>
            String(m.product_structure_id)
          ) || [];

        // Set country codes for phone inputs
        if (lead.contact_no && lead.country_code) {
          try {
            const phoneWithCountryCode = `${lead.country_code}${lead.contact_no}`;
            const parsedPhone = parsePhoneNumber(phoneWithCountryCode);
            if (parsedPhone?.country) {
              setPrimaryCountry(parsedPhone.country);
            }
          } catch (error) {
            console.log("Error parsing primary phone:", error);
          }
        }

        // For alternate contact, try to detect country from the number itself
        if (lead.alt_contact_no) {
          try {
            let parsedAltPhone;

            // If alt number starts with +, parse directly
            if (lead.alt_contact_no.startsWith("+")) {
              parsedAltPhone = parsePhoneNumber(lead.alt_contact_no);
            } else {
              // Otherwise parse using primary country as fallback (e.g., "IN")
              parsedAltPhone = parsePhoneNumber(
                lead.alt_contact_no,
                primaryCountry
              );
            }

            if (parsedAltPhone?.country) {
              setAltCountry(parsedAltPhone.country);
            } else {
              // fallback to primary country if parser can't detect
              setAltCountry(primaryCountry);
            }
          } catch (error) {
            console.warn("⚠️ Error parsing alternate phone:", error);
            setAltCountry(primaryCountry);
          }
        }

        // ✅ Format phone numbers to E.164 format
        const formattedContactNo = lead.country_code
          ? `${lead.country_code}${lead.contact_no || ""}`
          : lead.contact_no || "";

        const formattedAltContactNo = lead.alt_contact_no
          ? lead.alt_contact_no.startsWith("+")
            ? lead.alt_contact_no
            : `${lead.country_code || "+91"}${lead.alt_contact_no}`
          : "";

        setPrimaryCountry((prev) => prev || "IN");
        setAltCountry((prev) => prev || "IN");

        // Format alternate contact number
        // if (lead.alt_contact_no) {
        //   let alt = lead.alt_contact_no.trim();
        //   if (!alt.startsWith("+") && lead.country_code) {
        //     alt = `${lead.country_code}${alt}`;
        //   }
        //   formattedAltContactNo = alt;
        // }

        // Format date for input (YYYY-MM-DD)
        const formattedDate = lead.initial_site_measurement_date
          ? new Date(lead.initial_site_measurement_date)
              .toISOString()
              .split("T")[0]
          : "";

        // Update the form.reset call in useEffect to exclude documents
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
          product_types: productTypeIds,
          product_structures: productStructureIds,
          // REMOVE THIS LINE: documents: lead.documents || "",
          archetech_name: lead.archetech_name || "",
          designer_remark: lead.designer_remark || "",
          initial_site_measurement_date: formattedDate,
        });

        if (lead.site_map_link && lead.site_map_link.includes("maps?q=")) {
          const coords = lead.site_map_link.match(
            /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
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
        toast.error("Failed to load lead data");
      } finally {
        setIsLoadingLead(false);
      }
    };

    fetchLeadData();
  }, [leadData?.id, vendorId, createdBy, form]);

  if (isLoadingLead) {
    return (
      <div className="w-full max-w-none pt-3 pb-6 flex items-center justify-center">
        <div className="text-sm">Loading lead data...</div>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    console.log("🚀 Update button clicked - Form submission started");
    console.log("📋 Form values received:", values);
    console.log("🧩 Dirty fields:", dirtyFields);

    if (!vendorId || !createdBy) {
      toast.error("User authentication required");
      return;
    }

    // Build payload only with changed fields
    const payload: Partial<EditLeadPayload> = {};

    // Helper: check if a field was changed
    const isDirty = (field: keyof FormValues) => !!dirtyFields[field];

    // Handle each field conditionally
    if (isDirty("firstname")) payload.firstname = values.firstname;
    if (isDirty("lastname")) payload.lastname = values.lastname;

    if (isDirty("contact_no")) {
      try {
        const parsed = parsePhoneNumber(values.contact_no);
        if (parsed) {
          payload.country_code = `+${parsed.countryCallingCode}`;
          payload.contact_no = parsed.nationalNumber.toString();
        }
      } catch (error) {
        toast.error("Invalid primary phone number format");
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
    }

    if (isDirty("email")) payload.email = values.email || "";
    if (isDirty("site_type_id"))
      payload.site_type_id = Number(values.site_type_id);
    if (isDirty("source_id")) payload.source_id = Number(values.source_id);
    if (isDirty("site_address")) payload.site_address = values.site_address;
    if (values.site_map_link && values.site_map_link.trim() !== "") {
      payload.site_map_link = values.site_map_link.trim();
    }
    payload.product_types = values.product_types.map(Number);
    payload.product_structures = values.product_structures.map(Number);
    if (isDirty("archetech_name"))
      payload.archetech_name = values.archetech_name || "";
    if (isDirty("designer_remark"))
      payload.designer_remark = values.designer_remark || "";
    if (
      isDirty("initial_site_measurement_date") &&
      values.initial_site_measurement_date
    ) {
      payload.initial_site_measurement_date = new Date(
        values.initial_site_measurement_date
      ).toISOString();
    }

    // Always include updated_by
    payload.updated_by = createdBy!;

    // If no changes detected
    if (Object.keys(payload).length <= 1) {
      toast.info("No changes made");
      return;
    }

    console.log("📤 Final Payload being sent:", payload);

    try {
      const result = await updateLeadMutation.mutateAsync(
        payload as EditLeadPayload
      );

      console.log("✅ Update successful:", result);
    } catch (error: any) {
      console.error("❌ Update failed:", error);
      toast.error(error?.response?.data?.message || "Failed to update lead");
    }
  };

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
                {/* <FormDescription className="text-xs">
                    Lead's first name.
                  </FormDescription> */}
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
                    defaultCountry={primaryCountry}
                    placeholder="Enter phone number"
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
            name="alt_contact_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Alt. Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    defaultCountry={altCountry}
                    placeholder="Enter alt number"
                    className="text-sm"
                    {...field}
                  />
                </FormControl>
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

        {/* Site Type & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* 🔹 Site Type Picker */}
          <FormField
            control={form.control}
            name="site_type_id"
            render={({ field }) => {
              const { data: siteTypes, isLoading } = useSiteTypes();

              // Transform API response → Picker data format
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
                        // ✅ Convert number → string for form
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

          {/* 🔹 Source Picker */}
          <FormField
            control={form.control}
            name="source_id"
            render={({ field }) => {
              const { data: sourceTypes, isLoading } = useSourceTypes();

              const pickerData =
                sourceTypes?.data?.map((source: any) => ({
                  id: source.id,
                  label: source.type,
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
                        // ✅ Convert number → string for form
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
              <div className="w-full flex justify-between">
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
              <FormControl>
                <TextAreaInput
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    // Don't reset map link when manually editing
                    if (
                      savedMapLocation &&
                      value !== savedMapLocation.address
                    ) {
                      // just update address text, keep link
                      setSavedMapLocation((prev) =>
                        prev ? { ...prev, address: value } : null
                      );
                    }
                  }}
                  placeholder="Enter address or use map"
                />
              </FormControl>
              <FormMessage />

              <MapPicker
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                savedLocation={savedMapLocation}
                onSelect={(address, link) => {
                  // Autofill address
                  field.onChange(address);
                  // Save coords
                  const coords = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                  if (coords) {
                    setSavedMapLocation({
                      lat: parseFloat(coords[1]),
                      lng: parseFloat(coords[2]),
                      address,
                    });
                  }
                  // Also push into form state for site_map_link
                  form.setValue("site_map_link", link);
                  form.trigger("site_map_link"); // ensures validation + marks as touched
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
                {/* <FormDescription className="text-xs">
                  Project architect name.
                </FormDescription> */}
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
                    restriction="futureOnly" // 👈 only allow future dates
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Designer Remark */}
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
              {/* <FormDescription className="text-xs">
                  Additional remarks or notes.
                </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />

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
            {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
