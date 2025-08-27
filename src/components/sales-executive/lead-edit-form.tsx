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

// Form validation schema
const formSchema = z.object({
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
  documents: z.string().optional(),
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
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const createdBy = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();

  // Update lead mutation
  // const updateLeadMutation = useMutation({
  //   mutationFn: ({ payload, files }: { payload: any; files: File[] }) =>
  //     updateLead(payload, files),
  //   onSuccess: () => {
  //     toast.success("Lead updated successfully!");
  //     queryClient.invalidateQueries({ queryKey: ["vendorUserLeads", vendorId, createdBy] });
  //     onClose();
  //   },
  //   onError: (error: any) => {
  //     console.error("Update error:", error);
  //     toast.error("Failed to update lead");
  //   },
  // });

  // Initialize form with default values from leadData
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: leadData?.firstname || "",
      lastname: leadData?.lastname || "",
      billing_name: leadData?.billing_name || "",
      contact_no: leadData?.contact_no || "",
      alt_contact_no: leadData?.alt_contact_no || "",
      email: leadData?.email || "",
      site_type_id: leadData?.site_type_id ? String(leadData.site_type_id) : "",
      site_address: leadData?.site_address || "",
      priority: leadData?.priority || "",
      source_id: leadData?.source_id ? String(leadData.source_id) : "",
      product_types: leadData?.product_types || [],
      product_structures: leadData?.product_structures || [],
      documents: leadData?.documents || "",
      archetech_name: leadData?.archetech_name || "",
      designer_remark: leadData?.designer_remark || "",
    },
  });

  // const onSubmit = (values: FormValues) => {
  //   if (!vendorId || !createdBy) {
  //     toast.error("User authentication required");
  //     return;
  //   }

  //   const payload = {
  //     ...values,
  //     vendor_id: vendorId,
  //     updated_by: createdBy,
  //     id: leadData.id, // ✅ Make sure the API knows which lead to update
  //   };

  //   updateLeadMutation.mutate({ payload, files });
  // };

  // const stringArrayToOptions = (strings: string[]): Option[] =>
  //   strings.map((str) => ({ value: str, label: str }));
  // const optionsToStringArray = (options: Option[]): string[] =>
  //   options.map((option) => option.value);

  return (
    <div className="w-full max-w-none pt-3 pb-6">
      <Form {...form}>
        <form
          // onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
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
                      {...field}
                      placeholder="Enter first name"
                      className="text-sm"
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
                      {...field}
                      placeholder="Enter last name"
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="contact_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter phone number"
                      className="text-sm"
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
                    <Input
                      {...field}
                      placeholder="Enter alt number"
                      className="text-sm"
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
                    {...field}
                    placeholder="Enter email address"
                    className="text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Site Address */}
          <FormField
            control={form.control}
            name="site_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Site Address *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter site address"
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Documents */}
          <FormField
            control={form.control}
            name="documents"
            render={() => (
              <FormItem>
                <FormLabel className="text-sm">Site Photos</FormLabel>
                <FormControl>
                  <FileUploadField value={files} onChange={setFiles} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateLeadMutation.isPending}>
              {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
            </Button>
          </div> */}
        </form>
      </Form>
    </div>
  );
}
