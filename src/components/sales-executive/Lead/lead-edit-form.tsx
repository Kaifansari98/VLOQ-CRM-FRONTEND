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
import { useAppSelector } from "@/redux/store";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  useSourceTypes,
  useSiteTypes,
} from "@/hooks/useTypesMaster";
import { updateLead, getLeadById, EditLeadPayload } from "@/api/leads";
import { parsePhoneNumber } from "libphonenumber-js";
import TextAreaInput from "@/components/origin-text-area";
import MapPicker from "@/components/MapPicker";
import { MapPin } from "lucide-react";
import CustomeDatePicker from "@/components/date-picker";
import AssignToPicker from "@/components/assign-to-picker";
import { toastError } from "@/lib/utils";

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

// Form validation schema
const formSchema = z.object({
  // Required fields
  firstname: z.string().min(1, "First name is required").max(300),
  lastname: z.string().min(1, "Last name is required").max(300),

  contact_no: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => {
      try {
        const parsed = parsePhoneNumber(val);
        return parsed && parsed.isValid();
      } catch (error) {
        const digitsOnly = val.replace(/\D/g, "");
        return digitsOnly.length >= 10;
      }
    }, "Please enter a valid phone number"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .or(z.literal("")),
  site_type_id: z.string().min(1, "Please select a site type"),
  site_address: z.string().min(1, "Site Address is required").max(2000),
  site_map_link: z.string().optional().or(z.literal("")),
  source_id: z.string().min(1, "Please select a source"),

  // Optional fields
  alt_contact_no: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      try {
        const parsed = parsePhoneNumber(val);
        return parsed && parsed.isValid();
      } catch (error) {
        const digitsOnly = val.replace(/\D/g, "");
        return digitsOnly.length >= 10;
      }
    }, "Please enter a valid alternate phone number"),

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
  leadData: any;
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

  const updateLeadMutation = useMutation({
    mutationFn: async (payload: EditLeadPayload) => {
      const result = await updateLead(payload, leadData.id, createdBy!);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ Mutation onSuccess:", data);
      toast.success("Lead updated successfully!");

      queryClient.invalidateQueries({
        queryKey: ["lead", leadData.id, vendorId, createdBy],
      });

      queryClient.invalidateQueries({
        queryKey: ["universal-stage-leads"],
        exact: false,
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

        // ✅ Normalize phone numbers to E.164 format
        const formattedContactNo = toE164(
          lead.contact_no,
          lead.country_code
        );

        const formattedAltContactNo = toE164(
          lead.alt_contact_no,
          lead.country_code
        );

        // Format date for input (YYYY-MM-DD)
        const formattedDate = lead.initial_site_measurement_date
          ? new Date(lead.initial_site_measurement_date)
              .toISOString()
              .split("T")[0]
          : "";

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
          archetech_name: lead.archetech_name || "",
          designer_remark: lead.designer_remark || "",
          initial_site_measurement_date: formattedDate,
        });

        // Handle map location
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
    }

    if (isDirty("email")) payload.email = values.email || "";
    if (isDirty("site_type_id"))
      payload.site_type_id = Number(values.site_type_id);
    if (isDirty("source_id")) payload.source_id = Number(values.source_id);
    if (isDirty("site_address")) payload.site_address = values.site_address;
    if (values.site_map_link && values.site_map_link.trim() !== "") {
      payload.site_map_link = values.site_map_link.trim();
    }
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Numbers - ✅ SIMPLIFIED */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <FormField
            control={form.control}
            name="contact_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Phone Number *</FormLabel>
                <FormControl>
                  <PhoneInput
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

        {/* Email & Furniture Type */}
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

        {/* Site Type & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
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
                    if (
                      savedMapLocation &&
                      value !== savedMapLocation.address
                    ) {
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
                  field.onChange(address);
                  const coords = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                  if (coords) {
                    setSavedMapLocation({
                      lat: parseFloat(coords[1]),
                      lng: parseFloat(coords[2]),
                      address,
                    });
                  }
                  form.setValue("site_map_link", link);
                  form.trigger("site_map_link");
                }}
              />
            </FormItem>
          )}
        />


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
