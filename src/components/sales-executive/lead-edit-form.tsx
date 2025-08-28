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
import { Textarea } from "@/components/ui/textarea";
import { CloudUpload, Paperclip, ChevronDown } from "lucide-react";
import MultipleSelector, { Option } from "../ui/multiselect";
import { FileUploadField } from "../custom/file-upload";
import { useAppSelector } from "@/redux/store";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { updateLead } from "@/api/leads"; // ✅ Update API
import { PhoneInput } from "../ui/phone-input";
import {
  useSourceTypes,
  useProductStructureTypes,
  useProductTypes,
  useSiteTypes,
} from "@/hooks/useTypesMaster";
import { canReassingLead } from "../utils/privileges";
import { updateLead, getLeadById, EditLeadPayload } from "@/api/leads";
import { CountryCode, parsePhoneNumber } from "libphonenumber-js";
import { apiClient } from "@/lib/apiClient";

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

  email: z.string().email("Please enter a valid email"),
  site_type_id: z.string().min(1, "Please select a site type"),
  site_address: z.string().min(1, "Site Address is required").max(2000),
  priority: z.string().min(1, "Please select a priority"),
  source_id: z.string().min(1, "Please select a source"),

  // Optional fields - fix alt_contact_no validation
  billing_name: z.string().optional(),
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

  product_types: z.array(z.string()).optional(),
  product_structures: z.array(z.string()).optional(),
  archetech_name: z.string().max(300).optional(),
  designer_remark: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditLeadFormProps {
  leadData: any; // ✅ Type it properly if you have interface
  onClose: () => void;
}

export default function EditLeadForm({ leadData, onClose }: EditLeadFormProps) {
  const [files, setFiles] = useState<File[]>(leadData?.documents || []);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const createdBy = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeads", vendorId, createdBy],
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update lead");
    },
  });

  const debugFormErrors = () => {
    const errors = form.formState.errors;
    console.log("🔍 Detailed form errors:", errors);

    // Check each field individually
    Object.keys(errors).forEach((fieldName) => {
      console.log(
        `❌ ${fieldName}:`,
        errors[fieldName as keyof typeof errors]?.message
      );
    });

    // Check specific phone number validation
    const contactNo = form.getValues("contact_no");
    console.log("📞 Contact number value:", contactNo);

    try {
      const parsed = parsePhoneNumber(contactNo);
      console.log("📞 Parsed phone:", {
        isValid: parsed?.isValid(),
        country: parsed?.country,
        nationalNumber: parsed?.nationalNumber,
        countryCallingCode: parsed?.countryCallingCode,
      });
    } catch (error) {
      console.error("📞 Phone parsing error:", error);
    }
  };

  const debugFormSubmission = async () => {
    const values = form.getValues();
    console.log("📝 Current form values:", values);

    const errors = form.formState.errors;
    console.log("❌ Form errors:", errors);

    const isValid = form.formState.isValid;
    console.log("✅ Form is valid:", isValid);

    // Manually trigger validation
    const manualValidation = await form.trigger();
    console.log("🔍 Manual validation result:", manualValidation);
  };

  // 4. Test the API call directly
  const testDirectAPICall = async () => {
    const testPayload = {
      firstname: "Test",
      lastname: "User",
      country_code: "+91",
      contact_no: "9999999999",
      email: "test@test.com",
      updated_by: createdBy!,
    };

    try {
      console.log("🧪 Testing direct API call...");
      const result = await updateLead(testPayload, leadData.id, createdBy!);
      console.log("✅ Direct API test successful:", result);
    } catch (error) {
      console.error("❌ Direct API test failed:", error);
    }
  };

  // Initialize form with default values from leadData
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      billing_name: "",
      contact_no: "",
      alt_contact_no: "",
      email: "",
      site_type_id: "",
      site_address: "",
      priority: "",
      source_id: "",
      product_types: [],
      product_structures: [],
      archetech_name: "",
      designer_remark: "",
    },
  });

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

        // Extract product type IDs from the nested structure
        const productTypeIds =
          lead.productMappings?.map((mapping: any) =>
            String(mapping.product_type_id)
          ) || [];

        // Extract product structure IDs from the nested structure
        const productStructureIds =
          lead.leadProductStructureMapping?.map((mapping: any) =>
            String(mapping.product_structure_id)
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
            const altPhoneToCheck = lead.alt_contact_no.startsWith("+")
              ? lead.alt_contact_no
              : `+${lead.alt_contact_no}`;
            const parsedAltPhone = parsePhoneNumber(altPhoneToCheck);
            if (parsedAltPhone?.country) {
              setAltCountry(parsedAltPhone.country);
            }
          } catch (error) {
            console.log("Error parsing alternate phone:", error);
            // Fallback to same country as primary if primary exists
            if (primaryCountry !== "IN") {
              setAltCountry(primaryCountry);
            }
          }
        }

        // Format phone numbers to E.164 format
        let formattedContactNo = "";
        let formattedAltContactNo = "";

        // Format primary contact number
        if (lead.contact_no && lead.country_code) {
          formattedContactNo = `${lead.country_code}${lead.contact_no}`;
        }

        // Format alternate contact number
        if (lead.alt_contact_no) {
          if (lead.alt_contact_no.startsWith("+")) {
            formattedAltContactNo = lead.alt_contact_no;
          } else {
            // If no + prefix, try to add it
            formattedAltContactNo = `+${lead.alt_contact_no}`;
          }
        }

        // Update the form.reset call in useEffect to exclude documents
        form.reset({
          firstname: lead.firstname || "",
          lastname: lead.lastname || "",
          billing_name: lead.billing_name || "",
          contact_no: formattedContactNo,
          alt_contact_no: formattedAltContactNo,
          email: lead.email || "",
          site_type_id: lead.site_type_id ? String(lead.site_type_id) : "",
          site_address: lead.site_address || "",
          priority: lead.priority || "",
          source_id: lead.source_id ? String(lead.source_id) : "",
          product_types: productTypeIds,
          product_structures: productStructureIds,
          // REMOVE THIS LINE: documents: lead.documents || "",
          archetech_name: lead.archetech_name || "",
          designer_remark: lead.designer_remark || "",
        });

        // Handle documents if they exist
        if (lead.documents && Array.isArray(lead.documents)) {
          setFiles(lead.documents);
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

    if (!vendorId || !createdBy) {
      console.error("❌ Missing authentication:", { vendorId, createdBy });
      toast.error("User authentication required");
      return;
    }

    // Primary contact number split
    let country_code = "";
    let contact_no = "";
    if (values.contact_no) {
      try {
        const parsed = parsePhoneNumber(values.contact_no);
        if (parsed) {
          country_code = `+${parsed.countryCallingCode}`;
          contact_no = parsed.nationalNumber.toString();
        }
      } catch (error) {
        console.error("❌ Error parsing primary phone:", error);
        toast.error("Invalid primary phone number format");
        return;
      }
    }

    // Alt contact number split
    let alt_country_code = "";
    let alt_contact_no = "";
    if (values.alt_contact_no && values.alt_contact_no.trim()) {
      try {
        const parsedAlt = parsePhoneNumber(values.alt_contact_no);
        if (parsedAlt) {
          alt_country_code = `+${parsedAlt.countryCallingCode}`;
          alt_contact_no = parsedAlt.nationalNumber.toString();
        }
      } catch (error) {
        console.error("⚠️ Error parsing alt phone:", error);
        alt_contact_no = values.alt_contact_no.replace(/\D/g, "");
      }
    }

    const payload: EditLeadPayload = {
      firstname: values.firstname || "",
      lastname: values.lastname || "",
      billing_name: values.billing_name || "",
      country_code,
      contact_no,
      alt_contact_no: alt_contact_no || undefined,
      email: values.email || "",
      site_type_id: values.site_type_id
        ? Number(values.site_type_id)
        : undefined,
      site_address: values.site_address || "",
      priority: values.priority || "",
      source_id: values.source_id ? Number(values.source_id) : undefined,
      product_types: (values.product_types || []).map((id) => Number(id)),
      product_structures: (values.product_structures || []).map((id) =>
        Number(id)
      ),
      archetech_name: values.archetech_name || "",
      designer_remark: values.designer_remark || "",
      updated_by: createdBy!,
      // NO documents field in payload
    };

    console.log("📤 Final Payload being sent:", payload);
    console.log("🔗 API call details:", {
      leadId: leadData.id,
      userId: createdBy,
      endpoint: `/leads/update/${leadData.id}/userId/${createdBy}`,
    });

    try {
      // Call the mutation
      const result = await updateLeadMutation.mutateAsync(payload);
      console.log("✅ Update successful:", result);
    } catch (error: any) {
      console.error("❌ Update failed:", {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
      });

      // More detailed error handling
      if (error.response) {
        console.error(
          "Server responded with error:",
          error.response.status,
          error.response.data
        );
        toast.error(
          error.response.data?.message ||
            `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        toast.error("Network error: Unable to reach server");
      } else {
        console.error("Request setup error:", error.message);
        toast.error("Request failed: " + error.message);
      }
    }
  };

  // Update your handleUpdateClick function
  const handleUpdateClick = async () => {
    console.log("🔧 Direct button click handler");

    // Get current form values
    const currentValues = form.getValues();
    console.log("Current form values:", currentValues);

    // Debug form errors first
    debugFormErrors();

    // Validate form
    const isValid = await form.trigger();
    console.log("📋 Form validation result:", isValid);

    if (!isValid) {
      console.log("❌ Form validation failed - checking individual fields...");

      // Check each required field
      const requiredFields = [
        "firstname",
        "lastname",
        "contact_no",
        "email",
        "site_type_id",
        "site_address",
        "priority",
        "source_id",
      ];

      for (const field of requiredFields) {
        const fieldValid = await form.trigger(field as any);
        console.log(`📝 ${field} valid:`, fieldValid);
      }

      toast.error("Please fix form errors before submitting");
      return;
    }

    console.log("✅ Form validation passed - proceeding with submission");
    // Proceed with submission
    onSubmit(currentValues);
  };

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
                <FormLabel className="text-sm">Email *</FormLabel>
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

          {/* Billing Name & Site Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <FormField
              control={form.control}
              name="billing_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Billing Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter billing name"
                      type="text"
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  {/* <FormDescription className="text-xs">
                    Optional billing name.
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_type_id"
              render={({ field }) => {
                const { data: siteTypes, isLoading, error } = useSiteTypes();

                useEffect(() => {
                  // console.log("🔍 siteTypes response:", siteTypes);
                }, [siteTypes]);

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
                <FormLabel className="text-sm">Site Address *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter site address"
                    className="resize-none text-sm"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                {/* <FormDescription className="text-xs">
                  Site address of the lead.
                </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Priority *</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="standard">
                        Standard Priority
                      </SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <FormDescription className="text-xs">
                    Lead priority level.
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <FormLabel className="text-sm">Furniture Type</FormLabel>
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
                      Furniture Structure
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

          {/* Designer Remark */}
          <FormField
            control={form.control}
            name="designer_remark"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Designer's Remark</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter remarks"
                    className="resize-none text-sm"
                    rows={3}
                    {...field}
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
              onClick={handleUpdateClick}
            >
              {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
