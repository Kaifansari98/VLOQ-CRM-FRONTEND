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
import { CloudUpload, Paperclip, ChevronDown, Phone } from "lucide-react";
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

const createFormSchema = (userType: string | undefined) => {
  const isAdminOrSuperAdmin =
    userType === "admin" || userType === "super_admin";

  return z.object({
    firstname: z.string().min(1, "First name is required").max(300),
    lastname: z.string().min(1, "Last name is required").max(300),
    billing_name: z.string().optional(),
    contact_no: z.string().min(1, "This Contact number isn't valid").max(20),
    alt_contact_no: z.string().optional().or(z.literal("")),
    email: z.string().email("Please enter a valid email"),
    site_type_id: z.string().min(1, "Please select a site type"),
    site_address: z.string().min(1, "Site Address is required").max(2000),
    priority: z.string().min(1, "Please select a priority"),
    source_id: z.string().min(1, "Please select a source"),
    product_types: z.array(z.string()).optional(),
    product_structures: z.array(z.string()).optional(),
    // Dynamic validation based on user role
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
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const formSchema = createFormSchema(userType);
  type FormValues = z.infer<typeof formSchema>;

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
      // console.log("Lead created:", data);

      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeads", vendorId, createdBy],
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
      documents: "",
      archetech_name: "",
      designer_remark: "",
      assign_to: "",
      assigned_by: "",
    },
  });

  const handleResetform = () => {
    form.reset();
    setFiles([]);
    form.setValue("priority", "");
    form.setValue("source_id", "");
    form.setValue("site_type_id", "");
  };

  function onSubmit(values: FormValues) {
    if (!vendorId || !createdBy) {
      toast.error("User authentication required");
      return;
    }

    // console.log("[DEBUG] Form values before processing:", values);

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
      billing_name: values.billing_name || undefined,
      email: values.email,
      site_address: values.site_address,
      site_type_id: Number(values.site_type_id),
      priority: values.priority,
      source_id: Number(values.source_id),
      archetech_name: values.archetech_name || undefined,
      designer_remark: values.designer_remark || undefined,
      vendor_id: vendorId,
      created_by: createdBy,

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

    // console.log("[DEBUG] Processed payload:", payload);

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
                  <TextAreaInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter your address"
                  />
                </FormControl>
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

          {canReassingLead(userType) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Assign To */}
              <FormField
                control={form.control}
                name="assign_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Assign To</FormLabel>
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
            <Button
              type="button"
              variant="outline"
              className="text-sm"
              onClick={handleResetform}
            >
              Reset
            </Button>
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
