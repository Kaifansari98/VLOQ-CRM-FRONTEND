"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash, ArrowLeft, Check, Upload, FileText, Pencil, Landmark as BankIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCompanyVendorMetaData,
  useDetailedCompanyVendor,
  useCreateDetailedCompanyVendor,
  useUpdateDetailedCompanyVendor,
  getDetailedCompanyVendorQueryKey,
} from "@/hooks/useDetailedCompanyVendor";
import { fetchDetailedCompanyVendor } from "@/api/typesMasterApi";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import { useCompanyVendorsForMaster } from "@/hooks/useTypesMaster";
import { toastManager } from "@/components/ui/toast";
import DocumentCard, { PreviewModal } from "@/components/utils/documentCard";
import { z } from "zod";
import { cn } from "@/lib/utils";

const toast = {
  success: (message: string) => toastManager.add({ title: message, type: "success" }),
  error: (message: string) => toastManager.add({ title: message, type: "error" }),
};

const companyInfoSchema = z.object({
  vendor_code: z.string().min(1, "Company Code is mandatory"),
  company_name: z.string().min(1, "Company Name is mandatory"),
  vendor_types: z.array(z.number()).min(1, "At least one Vendor Type is required"),
  point_of_contact: z.string().min(1, "Primary Contact Person is required"),
  contact_no: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit number required"),
  alternate_mobile_no: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit number required").or(z.literal("")).optional(),
  email: z.string().email("Valid email required").min(1, "Primary Email is required"),
  alternate_email: z.string().email("Valid email required").or(z.literal("")).optional(),
  payment_term_id: z.union([z.string(), z.number()]).refine(val => !!val, { message: "Payment Term is required" }),
  gst_no: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, "Invalid GST No. format").min(1, "GST No. is required"),
  pan_no: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, "Invalid PAN No. format").min(1, "PAN No. is required"),
  status_id: z.coerce.number().min(1, "Status is required"),
});

const addressSchema = z.object({
  address_line_1: z.string().min(1, "Address Line 1 is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  state_id: z.union([z.string(), z.number()]).refine(val => !!val, { message: "State is required" }),
  city_id: z.union([z.string(), z.number()]).refine(val => !!val, { message: "City is required" }),
});

const contactSchema = z.object({
  name: z.string().min(1, "Contact Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  email: z.string().email("Valid email address required").min(1, "Email is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
});

const bankSchema = z.object({
  holder_name: z.string().regex(/^[a-zA-Z\s.]+$/, "Only letters, spaces, and dots allowed").min(1, "Account Holder Name is required"),
  account_no: z.string().regex(/^\d{9,18}$/, "Account number must be 9–18 digits"),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format (e.g. SBIN0001234)"),
  branch: z.string().min(1, "Branch Name is required"),
  swift: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid SWIFT code format").or(z.literal("")).optional(),
});

const documentSchema = z.object({
  document_type_id: z.union([z.string(), z.number()]).refine(val => !!val, { message: "Document Type is required" }),
});

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " Bytes";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

interface CompanyVendorFormProps {
  id?: number; // edit mode if id is provided
}

export default function CompanyVendorForm({ id }: CompanyVendorFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [currentId, setCurrentId] = React.useState<number | null>(null);
  const [editingAddressIndex, setEditingAddressIndex] = React.useState<number | null>(null);
  const [editingContactIndex, setEditingContactIndex] = React.useState<number | null>(null);
  const [editingBankIndex, setEditingBankIndex] = React.useState<number | null>(null);
  const [editingDocIndex, setEditingDocIndex] = React.useState<number | null>(null);

  const sessionVendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Fetch Metadata & Vendor details
  const { data: metaDataResponse, isLoading: isMetaLoading } = useCompanyVendorMetaData(sessionVendorId);
  const { data: allVendorsData } = useCompanyVendorsForMaster(sessionVendorId);
  const allVendors = allVendorsData?.data || [];

  const [duplicateErrors, setDuplicateErrors] = React.useState<Record<string, string>>({});
  const { data: vendorResponse, isLoading: isVendorLoading } = useDetailedCompanyVendor(id || currentId || undefined);

  const createMutation = useCreateDetailedCompanyVendor(sessionVendorId, userId);
  const updateMutation = useUpdateDetailedCompanyVendor(sessionVendorId, userId);

  // State definitions
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = React.useState(tabParam || "company-info");

  React.useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Preview Modal State
  const [previewData, setPreviewData] = React.useState<{
    url: string;
    fileName: string;
    fileExt: string;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    isOpen: boolean;
    type: "address" | "contact" | "bank" | "document" | null;
    index: number | null;
  }>({ isOpen: false, type: null, index: null });

  const confirmDelete = () => {
    if (deleteConfirm.index === null || !deleteConfirm.type) return;
    const idx = deleteConfirm.index;
    
    if (deleteConfirm.type === "address") {
      setAddresses((prev) => prev.filter((_, i) => i !== idx));
    } else if (deleteConfirm.type === "contact") {
      const contactToRemove = contacts[idx];
      setContacts((prev) => prev.filter((_, i) => i !== idx));
      if (contactToRemove?.is_primary) {
        setInfo((p) => ({ ...p, point_of_contact: "", contact_no: "", email: "" }));
      }
    } else if (deleteConfirm.type === "bank") {
      setBanks((prev) => prev.filter((_, i) => i !== idx));
    } else if (deleteConfirm.type === "document") {
      const doc = documents[idx];
      if (doc?.document_url && doc.document_url.startsWith("blob:")) {
        URL.revokeObjectURL(doc.document_url);
      }
      setDocuments((prev) => prev.filter((_, i) => i !== idx));
    }
    setDeleteConfirm({ isOpen: false, type: null, index: null });
  };

  const handlePreviewLocalFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewData({
      url: objectUrl,
      fileName: file.name,
      fileExt: file.name.split(".").pop()?.toLowerCase() || "",
    });
  };

  const handlePreviewRemoteFile = (url: string, filePath?: string | null) => {
    const fileName = filePath ? filePath.split("/").pop() || "document" : "document";
    const fileExt = (filePath || "").split(".").pop()?.toLowerCase() || "pdf";
    setPreviewData({
      url,
      fileName,
      fileExt,
    });
  };

  const handleClosePreview = () => {
    if (previewData && previewData.url.startsWith("blob:")) {
      URL.revokeObjectURL(previewData.url);
    }
    setPreviewData(null);
  };

  // Tab 1 Info State
  const [info, setInfo] = React.useState({
    vendor_code: "",
    company_name: "",
    vendor_name: "",
    vendor_types: [] as number[],
    in_house: false,
    alternate_mobile_no: "",
    alternate_email: "",
    gst_no: "",
    pan_no: "",
    payment_term_id: "",
    status_id: 1,
    // Primary contact person data
    point_of_contact: "",
    contact_no: "",
    email: "",
  });

  // Tab 1 Info Zod Errors
  const [zodErrors, setZodErrors] = React.useState<any>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));


  React.useEffect(() => {
    const result = companyInfoSchema.safeParse(info);
    if (!result.success) {
      setZodErrors(result.error.format());
    } else {
      setZodErrors({});
    }
  }, [info]);

  // Duplication check validation
  React.useEffect(() => {
    const errors: Record<string, string> = {};
    if (allVendors && allVendors.length > 0) {
      const activeRecordId = id || currentId;
      
      const checkDup = (field: string, val: string, label: string) => {
        if (!val) return;
        const exists = allVendors.some((v: any) => {
          if (activeRecordId && v.id === activeRecordId) return false;
          return String(v[field] || "").trim().toLowerCase() === val.trim().toLowerCase();
        });
        if (exists) {
          errors[field] = `${label} already exists in database`;
        }
      };

      checkDup("vendor_code", info.vendor_code, "Company Code");
      checkDup("company_name", info.company_name, "Company Name");
      checkDup("contact_no", info.contact_no, "Mobile No.");
      checkDup("email", info.email, "Email");
      checkDup("gst_no", info.gst_no, "GST No.");
      checkDup("pan_no", info.pan_no, "PAN No.");
    }
    setDuplicateErrors(errors);
  }, [info.vendor_code, info.company_name, info.contact_no, info.email, info.gst_no, info.pan_no, allVendors, id, currentId]);

  // Dropdown Open state for multi-select Vendor Type
  const [isVendorTypeDropdownOpen, setIsVendorTypeDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Dropdown Open state for Payment Term
  const [isPaymentTermDropdownOpen, setIsPaymentTermDropdownOpen] = React.useState(false);
  const paymentTermDropdownRef = React.useRef<HTMLDivElement>(null);

  // Dropdown Open state for State
  const [isStateDropdownOpen, setIsStateDropdownOpen] = React.useState(false);
  const stateDropdownRef = React.useRef<HTMLDivElement>(null);

  // Dropdown Open state for Status
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsVendorTypeDropdownOpen(false);
      }
      if (paymentTermDropdownRef.current && !paymentTermDropdownRef.current.contains(event.target as Node)) {
        setIsPaymentTermDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Tab 2 Address State
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [addressForm, setAddressForm] = React.useState({
    address_line_1: "",
    address_line_2: "",
    landmark: "",
    pincode: "",
    state_id: "",
    city_id: "",
    is_primary: false,
  });

  // Tab 3 Contacts State
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [contactForm, setContactForm] = React.useState({
    name: "",
    department: "",
    phone: "",
    designation: "",
    email: "",
    is_primary: false,
  });

  // Tab 4 Banks State
  const [banks, setBanks] = React.useState<any[]>([]);
  const [bankForm, setBankForm] = React.useState({
    holder_name: "",
    account_no: "",
    ifsc: "",
    swift: "",
    branch: "",
    is_default: false,
    cancelled_cheque_file: null as File | null,
    cancelled_cheque_url: null as string | null,
  });

  // Tab 5 Documents State
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [docForm, setDocForm] = React.useState({
    document_type_id: "",
    file: null as File | null,
    document_url: null as string | null,
  });

  // Track if form is dirty for unsaved changes warning
  const isFormDirty = React.useMemo(() => {
    if (!isEditMode) {
      return (
        info.vendor_code !== "" ||
        info.company_name !== "" ||
        addresses.length > 0 ||
        contacts.length > 0 ||
        banks.length > 0 ||
        documents.length > 0
      );
    }
    return false;
  }, [info, addresses, contacts, banks, documents, isEditMode]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty]);

  // Tab 2 Address Zod
  const [addrErrors, setAddrErrors] = React.useState<any>({});
  const [addrTouched, setAddrTouched] = React.useState<Record<string, boolean>>({});
  const touchAddr = (field: string) => setAddrTouched((prev) => ({ ...prev, [field]: true }));
  React.useEffect(() => {
    const r = addressSchema.safeParse(addressForm);
    setAddrErrors(r.success ? {} : r.error.format());
  }, [addressForm]);

  // Tab 3 Contact Zod
  const [contactErrors, setContactErrors] = React.useState<any>({});
  const [contactTouched, setContactTouched] = React.useState<Record<string, boolean>>({});
  const touchContact = (field: string) => setContactTouched((prev) => ({ ...prev, [field]: true }));
  React.useEffect(() => {
    const r = contactSchema.safeParse(contactForm);
    setContactErrors(r.success ? {} : r.error.format());
  }, [contactForm]);

  // Tab 4 Bank Zod
  const [bankErrors, setBankErrors] = React.useState<any>({});
  const [bankTouched, setBankTouched] = React.useState<Record<string, boolean>>({});
  const touchBank = (field: string) => setBankTouched((prev) => ({ ...prev, [field]: true }));
  React.useEffect(() => {
    const r = bankSchema.safeParse(bankForm);
    setBankErrors(r.success ? {} : r.error.format());
  }, [bankForm]);

  // Tab 5 Document Zod
  const [docErrors, setDocErrors] = React.useState<any>({});
  const [docTouched, setDocTouched] = React.useState<Record<string, boolean>>({});
  const touchDoc = (field: string) => setDocTouched((prev) => ({ ...prev, [field]: true }));
  React.useEffect(() => {
    const r = documentSchema.safeParse(docForm);
    setDocErrors(r.success ? {} : r.error.format());
  }, [docForm]);

  // Load existing vendor data in Edit Mode or when draft is created
  React.useEffect(() => {
    if ((isEditMode || currentId) && vendorResponse?.data) {
      const v = vendorResponse.data;
      
      setInfo({
        vendor_code: v.vendor_code || "",
        company_name: v.company_name || "",
        vendor_name: v.vendor_name || "",
        vendor_types: v.vendorTypes.map((t) => t.vendor_type_id) || [],
        in_house: v.in_house || false,
        alternate_mobile_no: v.alternate_mobile_no || "",
        alternate_email: v.alternate_email || "",
        gst_no: v.gst_no || "",
        pan_no: v.pan_no || "",
        payment_term_id: v.default_payment_term_id ? String(v.default_payment_term_id) : "",
        status_id: v.status_id || 1,
        point_of_contact: v.point_of_contact || "",
        contact_no: v.contact_no || "",
        email: v.email || "",
      });

      // Addresses
      setAddresses(
        (v.addresses || []).map((addr) => ({
          id: addr.id,
          address_line_1: addr.address_line_1,
          address_line_2: addr.address_line_2 || "",
          landmark: addr.landmark || "",
          pincode: addr.pincode,
          state_id: String(addr.state_id),
          city_id: String(addr.city_id),
          is_primary: addr.is_primary,
          state: addr.state,
          city: addr.city,
        }))
      );

      // Contacts
      setContacts(
        (v.contactPersons || []).map((c) => ({
          id: c.id,
          name: c.name,
          department: c.department || "",
          phone: c.phone,
          designation: c.designation || "",
          email: c.email || "",
          is_primary: c.is_primary,
        }))
      );

      // Banks
      setBanks(
        (v.bankAccounts || []).map((b) => ({
          id: b.id,
          holder_name: b.holder_name,
          account_no: b.account_no,
          ifsc: b.ifsc,
          swift: b.swift || "",
          branch: b.branch,
          is_default: b.is_default,
          cancelled_cheque_path: b.cancelled_cheque_path,
          cancelled_cheque_url: b.cancelled_cheque_url || null,
        }))
      );

      // Documents
      setDocuments(
        (v.documents || []).map((d) => ({
          id: d.id,
          document_type_id: String(d.document_type_id),
          file_path: d.file_path,
          document_url: d.document_url || null,
          documentType: d.documentType,
        }))
      );
    }
  }, [isEditMode, currentId, vendorResponse]);

  // Synchronize Tab 1 primary contact to Tab 3 contacts list (both create and edit modes)
  React.useEffect(() => {
    if (info.point_of_contact || info.contact_no || info.email) {
      setContacts((prev) => {
        const hasPrimary = prev.some((c) => c.is_primary);
        if (hasPrimary) {
          return prev.map((c) =>
            c.is_primary
              ? {
                  ...c,
                  name: info.point_of_contact,
                  phone: info.contact_no,
                  email: info.email,
                }
              : c
          );
        } else {
          const primaryPoc = {
            name: info.point_of_contact,
            phone: info.contact_no,
            email: info.email,
            department: "Management",
            designation: "Primary Contact",
            is_primary: true,
          };
          return [primaryPoc, ...prev];
        }
      });
    }
  }, [info.point_of_contact, info.contact_no, info.email]);

  // Pre-fill Tab 3 Add Contact form with Tab 1 primary contact data when Tab 3 is active and fields are empty
  React.useEffect(() => {
    if (!isEditMode && activeTab === "contact-person") {
      if (!contactForm.name && !contactForm.phone && !contactForm.email) {
        setContactForm((p) => ({
          ...p,
          name: info.point_of_contact || "",
          phone: info.contact_no || "",
          email: info.email || "",
          is_primary: true,
        }));
      }
    }
  }, [activeTab, info.point_of_contact, info.contact_no, info.email, isEditMode]);

  // Filters city list based on selected state
  const getFilteredCities = (stateId: string) => {
    if (!stateId) return [];
    return (metaDataResponse?.data?.cities || []).filter(
      (c) => String(c.state_id) === String(stateId)
    );
  };
  const startEditAddress = (index: number) => {
    const addr = addresses[index];
    setAddressForm({
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 || "",
      landmark: addr.landmark || "",
      pincode: addr.pincode,
      state_id: String(addr.state_id),
      city_id: String(addr.city_id),
      is_primary: addr.is_primary,
    });
    setEditingAddressIndex(index);
    setAddrTouched({});
  };

  // Add/Remove Address
  const addAddress = () => {
    // Mark all address fields touched to show errors
    setAddrTouched({ address_line_1: true, pincode: true, state_id: true, city_id: true });
    const result = addressSchema.safeParse(addressForm);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    const stateObj = (metaDataResponse?.data?.states || []).find(
      (s) => String(s.id) === String(addressForm.state_id)
    );
    const isNumericId = /^\d+$/.test(String(addressForm.city_id).trim());
    let cityObj = null;
    if (isNumericId) {
      cityObj = (metaDataResponse?.data?.cities || []).find(
        (c) => String(c.id) === String(addressForm.city_id)
      );
    } else {
      const cityName = String(addressForm.city_id).trim();
      const existing = (metaDataResponse?.data?.cities || []).find(
        (c) => String(c.state_id) === String(addressForm.state_id) && c.name.toLowerCase() === cityName.toLowerCase()
      );
      if (existing) {
        cityObj = existing;
      } else {
        cityObj = { id: cityName, name: cityName };
      }
    }

    const newAddresses = addresses.map((a, i) => {
      if (addressForm.is_primary && i !== editingAddressIndex) {
        return { ...a, is_primary: false };
      }
      return a;
    });

    const updatedAddress = {
      ...addresses[editingAddressIndex ?? -1],
      ...addressForm,
      state: stateObj,
      city: cityObj,
    };

    if (editingAddressIndex !== null) {
      const updatedList = [...newAddresses];
      updatedList[editingAddressIndex] = updatedAddress;
      setAddresses(updatedList);
      setEditingAddressIndex(null);
      toast.success("Address updated");
    } else {
      setAddresses([...newAddresses, updatedAddress]);
      toast.success("Address added");
    }

    // Reset address form and touched state
    setAddressForm({
      address_line_1: "",
      address_line_2: "",
      landmark: "",
      pincode: "",
      state_id: "",
      city_id: "",
      is_primary: false,
    });
    setAddrTouched({});
  };

  const removeAddress = (index: number) => {
    if (editingAddressIndex === index) {
      setEditingAddressIndex(null);
      setAddressForm({
        address_line_1: "",
        address_line_2: "",
        landmark: "",
        pincode: "",
        state_id: "",
        city_id: "",
        is_primary: false,
      });
      setAddrTouched({});
    }
    setDeleteConfirm({ isOpen: true, type: "address", index });
  };

  const startEditContact = (index: number) => {
    const c = contacts[index];
    setContactForm({
      name: c.name,
      department: c.department || "",
      phone: c.phone,
      designation: c.designation || "",
      email: c.email || "",
      is_primary: c.is_primary,
    });
    setEditingContactIndex(index);
    setContactTouched({});
  };

  // Add/Remove Contact
  const addContact = () => {
    setContactTouched({ name: true, phone: true, email: true, department: true, designation: true });
    const result = contactSchema.safeParse(contactForm);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    // Local duplicate email/phone check
    const isDuplicateContact = contacts.some((c, i) => {
      if (editingContactIndex !== null && i === editingContactIndex) return false;
      return (
        (c.email && contactForm.email && c.email.toLowerCase() === contactForm.email.toLowerCase()) ||
        (c.phone && contactForm.phone && c.phone === contactForm.phone)
      );
    });
    if (isDuplicateContact) {
      toast.error("A contact with this email or phone number has already been added.");
      return;
    }

    // Sync back to Tab 1 if primary contact is added or updated
    if (contactForm.is_primary) {
      setInfo((p) => ({
        ...p,
        point_of_contact: contactForm.name,
        contact_no: contactForm.phone,
        email: contactForm.email || "",
      }));
    }

    const updatedContact = {
      ...contacts[editingContactIndex ?? -1],
      ...contactForm,
    };

    const newContacts = contacts.map((c, i) => {
      if (contactForm.is_primary && i !== editingContactIndex) {
        return { ...c, is_primary: false };
      }
      return c;
    });

    if (editingContactIndex !== null) {
      const updatedList = [...newContacts];
      updatedList[editingContactIndex] = updatedContact;
      setContacts(updatedList);
      setEditingContactIndex(null);
      toast.success("Contact person updated");
    } else {
      const existingIndex = contacts.findIndex(
        (c) => c.name.toLowerCase() === contactForm.name.toLowerCase() && c.phone === contactForm.phone
      );

      if (existingIndex !== -1) {
        // Update existing contact
        const updatedContacts = contacts.map((c, i) => {
          if (i === existingIndex) return { ...c, ...contactForm };
          return contactForm.is_primary ? { ...c, is_primary: false } : c;
        });
        setContacts(updatedContacts);
        toast.success("Contact person updated");
      } else {
        setContacts([...newContacts, contactForm]);
        toast.success("Contact person added");
      }
    }

    setContactForm({
      name: "",
      department: "",
      phone: "",
      designation: "",
      email: "",
      is_primary: false,
    });
    setContactTouched({});
  };

  const removeContact = (index: number) => {
    const contact = contacts[index];
    if (contact.is_primary) {
      toast.error("Cannot delete the primary contact person");
      return;
    }
    if (editingContactIndex === index) {
      setEditingContactIndex(null);
      setContactForm({
        name: "",
        department: "",
        phone: "",
        designation: "",
        email: "",
        is_primary: false,
      });
      setContactTouched({});
    }
    setDeleteConfirm({ isOpen: true, type: "contact", index });
  };

  const startEditBank = (index: number) => {
    const b = banks[index];
    setBankForm({
      holder_name: b.holder_name,
      account_no: b.account_no,
      ifsc: b.ifsc,
      swift: b.swift || "",
      branch: b.branch,
      is_default: b.is_default,
      cancelled_cheque_file: b.cancelled_cheque_file || null,
      cancelled_cheque_url: b.cancelled_cheque_url || null,
    });
    setEditingBankIndex(index);
    setBankTouched({});
  };

  // Add/Remove Bank Account
  const addBank = () => {
    setBankTouched({ holder_name: true, account_no: true, ifsc: true, branch: true, swift: true });
    const result = bankSchema.safeParse(bankForm);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    // Local duplicate account number + IFSC check
    const isDuplicateBank = banks.some((b, i) => {
      if (editingBankIndex !== null && i === editingBankIndex) return false;
      return (
        b.account_no === bankForm.account_no &&
        b.ifsc.toUpperCase() === bankForm.ifsc.toUpperCase()
      );
    });
    if (isDuplicateBank) {
      toast.error("A bank account with this Account Number and IFSC Code has already been added.");
      return;
    }

    const newBanks = banks.map((b, i) =>
      (bankForm.is_default && i !== editingBankIndex) ? { ...b, is_default: false } : b
    );

    const updatedBank = {
      ...banks[editingBankIndex ?? -1],
      ...bankForm,
    };

    if (editingBankIndex !== null) {
      const updatedList = [...newBanks];
      updatedList[editingBankIndex] = updatedBank;
      setBanks(updatedList);
      setEditingBankIndex(null);
      toast.success("Bank account updated");
    } else {
      setBanks([
        ...newBanks,
        bankForm,
      ]);
      toast.success("Bank account added");
    }

    setBankForm({
      holder_name: "",
      account_no: "",
      ifsc: "",
      swift: "",
      branch: "",
      is_default: false,
      cancelled_cheque_file: null,
      cancelled_cheque_url: null,
    });
    setBankTouched({});
  };

  const removeBank = (index: number) => {
    if (editingBankIndex === index) {
      setEditingBankIndex(null);
      setBankForm({
        holder_name: "",
        account_no: "",
        ifsc: "",
        swift: "",
        branch: "",
        is_default: false,
        cancelled_cheque_file: null,
        cancelled_cheque_url: null,
      });
      setBankTouched({});
    }
    setDeleteConfirm({ isOpen: true, type: "bank", index });
  };

  const startEditDoc = (index: number) => {
    const d = documents[index];
    setDocForm({
      document_type_id: String(d.document_type_id),
      file: d.file || null,
      document_url: d.document_url || null,
    });
    setEditingDocIndex(index);
    setDocTouched({});
  };

  // Add/Remove Document
  const addDocument = () => {
    setDocTouched({ document_type_id: true });
    const result = documentSchema.safeParse(docForm);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    if (!docForm.file && !docForm.document_url) {
      toast.error("Please upload a file");
      return;
    }

    const docTypeObj = (metaDataResponse?.data?.documentTypes || []).find(
      (d) => String(d.id) === String(docForm.document_type_id)
    );

    const localUrl = docForm.file ? URL.createObjectURL(docForm.file) : null;

    const updatedDoc = {
      ...documents[editingDocIndex ?? -1],
      document_type_id: String(docForm.document_type_id),
      file: docForm.file || documents[editingDocIndex ?? -1]?.file || null,
      document_url: localUrl || docForm.document_url || documents[editingDocIndex ?? -1]?.document_url || null,
      documentType: docTypeObj,
    };

    if (editingDocIndex !== null) {
      const updatedList = [...documents];
      updatedList[editingDocIndex] = updatedDoc;
      setDocuments(updatedList);
      setEditingDocIndex(null);
      toast.success("Document updated");
    } else {
      setDocuments([
        ...documents,
        {
          ...docForm,
          document_url: localUrl || docForm.document_url,
          documentType: docTypeObj,
        },
      ]);
      toast.success("Document uploaded");
    }

    setDocForm({
      document_type_id: "",
      file: null,
      document_url: null,
    });
    setDocTouched({});
  };

  const removeDocument = (index: number) => {
    if (editingDocIndex === index) {
      setEditingDocIndex(null);
      setDocForm({
        document_type_id: "",
        file: null,
        document_url: null,
      });
      setDocTouched({});
    }
    setDeleteConfirm({ isOpen: true, type: "document", index });
  };

  // Submit Handler (Supports both tab-level save and final header save)
  const handleSubmit = async (isFinal = false) => {
    // Check for unsaved partially-filled sub-forms first
    const isAddressFormPartiallyFilled = 
      !!addressForm.address_line_1?.trim() || 
      !!addressForm.address_line_2?.trim() || 
      !!addressForm.landmark?.trim() || 
      !!addressForm.pincode?.trim() || 
      !!addressForm.state_id || 
      !!addressForm.city_id;

    const isContactFormPartiallyFilled = 
      !!contactForm.name?.trim() || 
      !!contactForm.phone?.trim() || 
      !!contactForm.email?.trim() || 
      !!contactForm.department?.trim() || 
      !!contactForm.designation?.trim();

    const isBankFormPartiallyFilled = 
      !!bankForm.holder_name?.trim() || 
      !!bankForm.account_no?.trim() || 
      !!bankForm.ifsc?.trim() || 
      !!bankForm.swift?.trim() || 
      !!bankForm.branch?.trim() || 
      !!bankForm.cancelled_cheque_file;

    const isDocFormPartiallyFilled = 
      !!docForm.document_type_id || 
      !!docForm.file;

    if (isFinal) {
      if (isAddressFormPartiallyFilled) {
        toast.error("You have unsaved details in the Address form. Please click 'Add Address' or clear the fields first.");
        return;
      }
      if (isContactFormPartiallyFilled) {
        toast.error("You have unsaved details in the Contact form. Please click 'Add Contact' or clear the fields first.");
        return;
      }
      if (isBankFormPartiallyFilled) {
        toast.error("You have unsaved details in the Bank form. Please click 'Add Bank Account' or clear the fields first.");
        return;
      }
      if (isDocFormPartiallyFilled) {
        toast.error("You have unsaved details in the Document form. Please click 'Add Document' or clear the fields first.");
        return;
      }
    } else {
      if (activeTab === "address" && isAddressFormPartiallyFilled) {
        toast.error("You have unsaved details in the Address form. Please click 'Add Address' or clear the fields first.");
        return;
      }
      if (activeTab === "contact-person" && isContactFormPartiallyFilled) {
        toast.error("You have unsaved details in the Contact form. Please click 'Add Contact' or clear the fields first.");
        return;
      }
      if (activeTab === "bank-account" && isBankFormPartiallyFilled) {
        toast.error("You have unsaved details in the Bank form. Please click 'Add Bank Account' or clear the fields first.");
        return;
      }
      if (activeTab === "documents" && isDocFormPartiallyFilled) {
        toast.error("You have unsaved details in the Document form. Please click 'Add Document' or clear the fields first.");
        return;
      }
    }

    // 1. Tab 1 base validations (always mandatory) using Zod
    const parsedInfo = companyInfoSchema.safeParse(info);
    if (!parsedInfo.success) {
      const errorMessages = parsedInfo.error.issues.map((issue) => issue.message);
      toast.error(`Please fill all mandatory fields: \n${errorMessages.join("\n")}`);

      // Mark all failed fields as touched to display errors inline
      const touchedFields: Record<string, boolean> = {};
      parsedInfo.error.issues.forEach((issue) => {
        if (issue.path && issue.path[0]) {
          touchedFields[issue.path[0] as string] = true;
        }
      });
      setTouched((prev) => ({ ...prev, ...touchedFields }));
      return;
    }

    // Check duplicate data validation error check
    const duplicateFields = Object.keys(duplicateErrors);
    if (duplicateFields.length > 0) {
      const messages = duplicateFields.map((f) => duplicateErrors[f]);
      toast.error(`Duplicate data found: \n${messages.join("\n")}`);
      return;
    }

    // 2. Final completeness checks (only for final header submission)
    if (isFinal) {
      if (addresses.length === 0) {
        toast.error("At least one Address is required (Tab 2)");
        return;
      }
      const hasPrimaryAddress = addresses.some((a) => a.is_primary);
      if (!hasPrimaryAddress) {
        toast.error("Please mark exactly one address as Primary (Tab 2)");
        return;
      }

      if (contacts.length === 0) {
        toast.error("At least one contact person is required (Tab 3)");
        return;
      }
      const hasPrimaryContact = contacts.some((c) => c.is_primary);
      if (!hasPrimaryContact) {
        toast.error("Please specify a Primary Contact Person (Tab 3)");
        return;
      }

      if (documents.length < 2) {
        toast.error("Minimum two documents are required before final submission (Tab 5)");
        return;
      }
    } else {
      // Intermediary draft checks
      if (addresses.length > 0) {
        const primCount = addresses.filter((a) => a.is_primary).length;
        if (primCount > 1) {
          toast.error("Only one address can be marked as Primary (Tab 2)");
          return;
        }
      }
      if (contacts.length > 0) {
        const primCount = contacts.filter((c) => c.is_primary).length;
        if (primCount > 1) {
          toast.error("Only one contact person can be marked as Primary (Tab 3)");
          return;
        }
      }
    }

    // Build FormData
    const formData = new FormData();
    
    // Setup JSON Data Payload
    const payload = {
      vendor_code: info.vendor_code.trim(),
      company_name: info.company_name.trim(),
      vendor_name: info.vendor_name.trim(),
      vendor_types: info.vendor_types,
      in_house: info.in_house,
      alternate_mobile_no: info.alternate_mobile_no || null,
      alternate_email: info.alternate_email || null,
      gst_no: info.gst_no || null,
      pan_no: info.pan_no || null,
      payment_term_id: info.payment_term_id ? Number(info.payment_term_id) : null,
      status_id: info.status_id,
      
      addresses: addresses.map((a) => ({
        id: a.id,
        address_line_1: a.address_line_1,
        address_line_2: a.address_line_2 || null,
        landmark: a.landmark || null,
        pincode: a.pincode,
        state_id: Number(a.state_id),
        city_id: /^\d+$/.test(String(a.city_id)) ? Number(a.city_id) : a.city_id,
        is_primary: a.is_primary,
      })),

      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        department: c.department || null,
        phone: c.phone,
        designation: c.designation || null,
        email: c.email || null,
        is_primary: c.is_primary,
      })),

      bank_accounts: banks.map((b) => ({
        id: b.id,
        holder_name: b.holder_name,
        account_no: b.account_no,
        ifsc: b.ifsc,
        swift: b.swift || null,
        branch: b.branch,
        is_default: b.is_default,
        cancelled_cheque_path: b.cancelled_cheque_path || null,
      })),

      documents: documents.map((d) => ({
        id: d.id,
        document_type_id: Number(d.document_type_id),
        file_path: d.file_path || null,
      })),
    };

    formData.append("data", JSON.stringify(payload));

    // Append Bank Files
    banks.forEach((bank, idx) => {
      if (bank.cancelled_cheque_file) {
        formData.append(`cancelled_cheque_${idx}`, bank.cancelled_cheque_file);
      }
    });

    // Append Document Files
    documents.forEach((doc, idx) => {
      if (doc.file) {
        formData.append(`document_file_${idx}`, doc.file);
      }
    });

    // Run Mutations
    try {
      const activeRecordId = id || currentId;
      
      const getSuccessMessage = () => {
        if (isFinal) {
          return "Company Vendor Master saved successfully!";
        }
        switch (activeTab) {
          case "company-info":
            return "Company Info saved successfully. Moving to Address Details...";
          case "address":
            return "Address Details saved successfully. Moving to Contact Persons...";
          case "contact-person":
            return "Contact Persons saved successfully. Moving to Bank Accounts...";
          case "bank-account":
            return "Bank Accounts saved successfully. Moving to Documents...";
          case "documents":
            return "Documents saved successfully.";
          default:
            return "Progress saved successfully.";
        }
      };

      if (isEditMode || activeRecordId) {
        await updateMutation.mutateAsync({ id: activeRecordId!, formData });
        const freshData = await fetchDetailedCompanyVendor(activeRecordId!);
        queryClient.setQueryData(getDetailedCompanyVendorQueryKey(activeRecordId!), freshData);
        toast.success(getSuccessMessage());

        if (isFinal) {
          router.push("/dashboard/masters-management/field-masters?vendor_id=" + sessionVendorId);
        } else {
          const tabsOrder = ["company-info", "address", "contact-person", "bank-account", "documents"];
          const currentIdx = tabsOrder.indexOf(activeTab);
          if (currentIdx !== -1 && currentIdx < tabsOrder.length - 1) {
            const nextTab = tabsOrder[currentIdx + 1];
            setActiveTab(nextTab);
          }
        }
      } else {
        const response = await createMutation.mutateAsync(formData);
        const newId = response.data?.id;
        if (newId) {
          if (isFinal) {
            router.push("/dashboard/masters-management/field-masters?vendor_id=" + sessionVendorId);
          } else {
            router.replace(`/dashboard/masters-management/field-masters/company-vendor/edit/${newId}?tab=address`);
          }
        }
        toast.success(getSuccessMessage());
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Something went wrong");
    }
  };

  if (isMetaLoading || (isEditMode && isVendorLoading)) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground animate-pulse">
        Loading Company Vendor Master Form...
      </div>
    );
  }

  // Common Tab Save Button markup
  const renderTabSaveButton = () => {
    const isLastTab = activeTab === "documents";
    return (
      <div className="flex justify-end gap-3 pt-5 border-t mt-6">
        <Button
          type="button"
          variant={isLastTab ? "default" : "secondary"}
          onClick={() => handleSubmit(isLastTab)}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending
            ? "Saving..."
            : isLastTab
            ? "Save Vendor Master"
            : "Save"}
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/dashboard/masters-management/field-masters?vendor_id=" + sessionVendorId)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {isEditMode ? "Edit Company Vendor Master" : "Create Company Vendor Master"}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {isEditMode ? "Modify details across the tabs below" : "Enter details across the tabs below"}
            </p>
          </div>
        </div>
        {activeTab !== "documents" && (
          <Button onClick={() => handleSubmit(true)} className="shadow-sm w-full sm:w-auto" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Vendor Master"}
          </Button>
        )}
      </div>

      {/* Modern Horizontal Tabs Header */}
      <div className="inline-flex self-start max-w-full overflow-x-auto gap-2 bg-zinc-50/50 dark:bg-zinc-800/50 p-1.5 rounded-lg border dark:border-zinc-700 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { id: "company-info", label: "Company Info" },
          { id: "address", label: "Address Details" },
          { id: "contact-person", label: "Contact Persons" },
          { id: "bank-account", label: "Bank Accounts" },
          { id: "documents", label: "Documents" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer flex-shrink-0 outline-none",
                isActive
                  ? "text-white dark:text-black"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-700/50"
              )}
            >
              <span className="relative z-10">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="vendor-form-tab"
                  className="absolute inset-0 bg-black dark:bg-white rounded-md shadow-sm z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tabs Contents */}
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* TAB 1: Company Info */}
              {activeTab === "company-info" && (
                <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="vendor_code">Company Code <span className="text-red-500">*</span></Label>
                  <Input
                    id="vendor_code"
                    value={info.vendor_code}
                    onChange={(e) => setInfo((p) => ({ ...p, vendor_code: e.target.value }))}
                    onBlur={() => touch("vendor_code")}
                    placeholder="e.g. VEN-001"
                  />
                  {touched.vendor_code && zodErrors.vendor_code?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.vendor_code._errors[0]}</p>}
                  {duplicateErrors.vendor_code && <p className="text-red-500 text-[10px] mt-0.5">{duplicateErrors.vendor_code}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="company_name"
                    value={info.company_name}
                    onChange={(e) => setInfo((p) => ({ ...p, company_name: e.target.value }))}
                    onBlur={() => touch("company_name")}
                    placeholder="e.g. Acme Corp"
                  />
                  {touched.company_name && zodErrors.company_name?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.company_name._errors[0]}</p>}
                  {duplicateErrors.company_name && <p className="text-red-500 text-[10px] mt-0.5">{duplicateErrors.company_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Vendor Display Name <span className="text-zinc-400 font-normal">(Optional)</span></Label>
                  <Input
                    id="vendor_name"
                    value={info.vendor_name}
                    onChange={(e) => setInfo((p) => ({ ...p, vendor_name: e.target.value }))}
                    placeholder="e.g. John Doe Distributing"
                  />
                </div>
              </div>

              {/* Vendor Types Selection (Custom Dropdown Multi-select) */}
              <div className="space-y-2 relative" ref={dropdownRef}>
                <div className="flex justify-between items-center">
                  <Label>Vendor Type (Multi-select) <span className="text-red-500">*</span></Label>
                  {touched.vendor_types && zodErrors.vendor_types?._errors && <span className="text-red-500 text-[10px]">{zodErrors.vendor_types._errors[0]}</span>}
                </div>
                <div
                  onClick={() => { setIsVendorTypeDropdownOpen(!isVendorTypeDropdownOpen); touch("vendor_types"); }}
                  className="flex min-h-[38px] w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm shadow-sm cursor-pointer select-none"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {info.vendor_types.length === 0 ? (
                      <span className="text-zinc-400 text-xs">Select vendor types...</span>
                    ) : (
                      info.vendor_types.map((id) => {
                        const typeObj = (metaDataResponse?.data?.vendorTypes || []).find((t) => t.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs px-2 py-0.5 rounded font-medium border border-zinc-200 dark:border-zinc-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfo((p) => ({
                                ...p,
                                vendor_types: p.vendor_types.filter((tid) => tid !== id),
                              }));
                            }}
                          >
                            {typeObj?.vendor_type_name || "Type"}
                            <span className="hover:text-red-500 font-bold ml-0.5">×</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                  <span className="text-zinc-400 text-xs">▼</span>
                </div>

                {isVendorTypeDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-lg max-h-60 overflow-y-auto">
                    {(metaDataResponse?.data?.vendorTypes || []).map((type) => {
                      const isChecked = info.vendor_types.includes(type.id);
                      return (
                        <div
                          key={type.id}
                          onClick={() => {
                            setInfo((p) => {
                              const newTypes = isChecked
                                ? p.vendor_types.filter((id) => id !== type.id)
                                : [...p.vendor_types, type.id];
                              return { ...p, vendor_types: newTypes };
                            });
                          }}
                          className="flex items-center space-x-2.5 p-2 rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer select-none text-sm"
                        >
                          <Checkbox
                            id={`drop-type-${type.id}`}
                            checked={isChecked}
                            onCheckedChange={() => {}} // handled by parent div click
                          />
                          <Label htmlFor={`drop-type-${type.id}`} className="font-normal cursor-pointer pointer-events-none">
                            {type.vendor_type_name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legacy Point of Contact & Info fields (Synchronized into primary contact) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t pt-5">
                <div className="space-y-2">
                  <Label htmlFor="point_of_contact">Primary Contact Person <span className="text-red-500">*</span></Label>
                  <Input
                    id="point_of_contact"
                    value={info.point_of_contact}
                    onChange={(e) => setInfo((p) => ({ ...p, point_of_contact: e.target.value }))}
                    onBlur={() => touch("point_of_contact")}
                    placeholder="Full name"
                  />
                  {touched.point_of_contact && zodErrors.point_of_contact?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.point_of_contact._errors[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_no">Mobile No. <span className="text-red-500">*</span></Label>
                  <Input
                    id="contact_no"
                    value={info.contact_no}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setInfo((p) => ({ ...p, contact_no: val }));
                    }}
                    onBlur={() => touch("contact_no")}
                    placeholder="10 digit mobile"
                  />
                  {touched.contact_no && zodErrors.contact_no?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.contact_no._errors[0]}</p>}
                  {duplicateErrors.contact_no && <p className="text-red-500 text-[10px] mt-0.5">{duplicateErrors.contact_no}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    value={info.email}
                    onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))}
                    onBlur={() => touch("email")}
                    placeholder="Email address"
                  />
                  {touched.email && zodErrors.email?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.email._errors[0]}</p>}
                  {duplicateErrors.email && <p className="text-red-500 text-[10px] mt-0.5">{duplicateErrors.email}</p>}
                </div>
              </div>

              {/* Optionals & Payment & Tax info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t pt-5">
                <div className="space-y-2">
                  <Label htmlFor="alternate_mobile_no">Alternate Mobile No. (Optional)</Label>
                  <Input
                    id="alternate_mobile_no"
                    value={info.alternate_mobile_no}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setInfo((p) => ({ ...p, alternate_mobile_no: val }));
                    }}
                    onBlur={() => touch("alternate_mobile_no")}
                    placeholder="Alternate number"
                  />
                  {touched.alternate_mobile_no && zodErrors.alternate_mobile_no?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.alternate_mobile_no._errors[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternate_email">Alternate Email (Optional)</Label>
                  <Input
                    id="alternate_email"
                    value={info.alternate_email}
                    onChange={(e) => setInfo((p) => ({ ...p, alternate_email: e.target.value }))}
                    onBlur={() => touch("alternate_email")}
                    placeholder="Alternate email"
                  />
                  {touched.alternate_email && zodErrors.alternate_email?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.alternate_email._errors[0]}</p>}
                </div>
                <div className="space-y-2 relative" ref={paymentTermDropdownRef}>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="payment_term_id">Payment Term <span className="text-red-500">*</span></Label>
                    {touched.payment_term_id && zodErrors.payment_term_id?._errors && <span className="text-red-500 text-[10px]">{zodErrors.payment_term_id._errors[0]}</span>}
                  </div>
                  <div
                    onClick={() => { setIsPaymentTermDropdownOpen(!isPaymentTermDropdownOpen); touch("payment_term_id"); }}
                    className="flex min-h-[38px] w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm shadow-sm cursor-pointer select-none"
                  >
                    <span className={cn("text-xs", !info.payment_term_id && "text-zinc-400")}>
                      {(() => {
                        const selectedTerm = (metaDataResponse?.data?.paymentTerms || []).find(
                          (term) => String(term.id) === String(info.payment_term_id)
                        );
                        return selectedTerm?.term_name || "Select payment term";
                      })()}
                    </span>
                    <span className="text-zinc-400 text-xs">▼</span>
                  </div>

                  {isPaymentTermDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-lg max-h-60 overflow-y-auto">
                      <div
                        onClick={() => {
                          setInfo((p) => ({ ...p, payment_term_id: "" }));
                          setIsPaymentTermDropdownOpen(false);
                        }}
                        className="p-2 rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer select-none text-sm text-zinc-400 italic"
                      >
                        Select payment term
                      </div>
                      {(metaDataResponse?.data?.paymentTerms || []).map((term) => {
                        const isSelected = String(term.id) === String(info.payment_term_id);
                        return (
                          <div
                            key={term.id}
                            onClick={() => {
                              setInfo((p) => ({ ...p, payment_term_id: String(term.id) }));
                              setIsPaymentTermDropdownOpen(false);
                            }}
                            className={cn(
                              "p-2 rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer select-none text-sm transition-colors",
                              isSelected && "bg-zinc-100 dark:bg-zinc-800 font-semibold"
                            )}
                          >
                            {term.term_name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="gst_no">GST No. <span className="text-red-500">*</span></Label>
                  <Input
                    id="gst_no"
                    value={info.gst_no}
                    onChange={(e) => setInfo((p) => ({ ...p, gst_no: e.target.value.toUpperCase().slice(0, 15) }))}
                    onBlur={() => touch("gst_no")}
                    placeholder="15 character GSTIN"
                  />
                  {touched.gst_no && zodErrors.gst_no?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.gst_no._errors[0]}</p>}
                  {duplicateErrors.gst_no && <p className="text-red-500 text-[10px] mt-0.5">{duplicateErrors.gst_no}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan_no">PAN No. <span className="text-red-500">*</span></Label>
                  <Input
                    id="pan_no"
                    value={info.pan_no}
                    onChange={(e) => setInfo((p) => ({ ...p, pan_no: e.target.value.toUpperCase().slice(0, 10) }))}
                    onBlur={() => touch("pan_no")}
                    placeholder="10 character PAN"
                  />
                  {touched.pan_no && zodErrors.pan_no?._errors && <p className="text-red-500 text-[10px] mt-0.5">{zodErrors.pan_no._errors[0]}</p>}
                  {duplicateErrors.pan_no && <p className="text-red-500 text-[10px] mt-0.5">{duplicateErrors.pan_no}</p>}
                </div>
                <div className="space-y-2 relative" ref={statusDropdownRef}>
                  <Label htmlFor="status_id">Status <span className="text-red-500">*</span></Label>
                  <div
                    onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); }}
                    className="flex min-h-[38px] w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm shadow-sm cursor-pointer select-none"
                  >
                    <span className="text-xs">
                      {(() => {
                        const selectedStatus = (metaDataResponse?.data?.statuses || []).find(
                          (s) => Number(s.id) === Number(info.status_id)
                        );
                        return selectedStatus?.status_name || "Select Status";
                      })()}
                    </span>
                    <span className="text-zinc-400 text-xs">▼</span>
                  </div>

                  {isStatusDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-lg max-h-60 overflow-y-auto">
                      {(metaDataResponse?.data?.statuses || []).map((s) => {
                        const isSelected = Number(s.id) === Number(info.status_id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              setInfo((p) => ({ ...p, status_id: Number(s.id) }));
                              setIsStatusDropdownOpen(false);
                            }}
                            className={cn(
                              "p-2 rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer select-none text-sm transition-colors",
                              isSelected && "bg-zinc-100 dark:bg-zinc-800 font-semibold"
                            )}
                          >
                            {s.status_name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="in_house"
                  checked={info.in_house}
                  onCheckedChange={(checked) => setInfo((p) => ({ ...p, in_house: !!checked }))}
                />
                <Label htmlFor="in_house" className="cursor-pointer font-medium">In House Vendor (Default: No)</Label>
              </div>

              {renderTabSaveButton()}
            </div>
          )}

          {/* TAB 2: Addresses */}
          {activeTab === "address" && (
            <div className="space-y-6">
              <div className="bg-zinc-50/50 dark:bg-zinc-800/50 p-5 rounded-lg border dark:border-zinc-700 space-y-4">
                <h3 className="font-semibold text-sm">Add Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Address Line 1 <span className="text-red-500">*</span></Label>
                    <Input
                      value={addressForm.address_line_1}
                      onChange={(e) => setAddressForm((p) => ({ ...p, address_line_1: e.target.value }))}
                      onBlur={() => touchAddr("address_line_1")}
                      placeholder="Street address, building name"
                    />
                    {addrTouched.address_line_1 && addrErrors.address_line_1?._errors && <p className="text-red-500 text-[10px] mt-0.5">{addrErrors.address_line_1._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2 (Optional)</Label>
                    <Input
                      value={addressForm.address_line_2}
                      onChange={(e) => setAddressForm((p) => ({ ...p, address_line_2: e.target.value }))}
                      placeholder="Apartment, unit, floor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2 relative" ref={stateDropdownRef}>
                    <Label>State <span className="text-red-500">*</span></Label>
                    <div
                      onClick={() => { setIsStateDropdownOpen(!isStateDropdownOpen); touchAddr("state_id"); }}
                      className="flex min-h-[38px] w-full items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm shadow-sm cursor-pointer select-none"
                    >
                      <span className={cn("text-xs", !addressForm.state_id && "text-zinc-400")}>
                        {(() => {
                          const selectedState = (metaDataResponse?.data?.states || []).find(
                            (state) => String(state.id) === String(addressForm.state_id)
                          );
                          return selectedState?.name || "Select State";
                        })()}
                      </span>
                      <span className="text-zinc-400 text-xs">▼</span>
                    </div>

                    {isStateDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-lg max-h-60 overflow-y-auto">
                        <div
                          onClick={() => {
                            setAddressForm((p) => ({ ...p, state_id: "", city_id: "" }));
                            setIsStateDropdownOpen(false);
                          }}
                          className="p-2 rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer select-none text-sm text-zinc-400 italic"
                        >
                          Select State
                        </div>
                        {(metaDataResponse?.data?.states || []).map((state) => {
                          const isSelected = String(state.id) === String(addressForm.state_id);
                          return (
                            <div
                              key={state.id}
                              onClick={() => {
                                setAddressForm((p) => ({ ...p, state_id: String(state.id), city_id: "" }));
                                setIsStateDropdownOpen(false);
                              }}
                              className={cn(
                                "p-2 rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer select-none text-sm transition-colors",
                                isSelected && "bg-zinc-100 dark:bg-zinc-800 font-semibold"
                              )}
                            >
                              {state.name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {addrTouched.state_id && addrErrors.state_id?._errors && <p className="text-red-500 text-[10px] mt-0.5">{addrErrors.state_id._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>City <span className="text-red-500">*</span></Label>
                    <Input
                      value={addressForm.city_id}
                      onChange={(e) => setAddressForm((p) => ({ ...p, city_id: e.target.value }))}
                      onBlur={() => touchAddr("city_id")}
                      disabled={!addressForm.state_id}
                      placeholder="Enter city name"
                    />
                    {addrTouched.city_id && addrErrors.city_id?._errors && <p className="text-red-500 text-[10px] mt-0.5">{addrErrors.city_id._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Landmark (Optional)</Label>
                    <Input
                      value={addressForm.landmark}
                      onChange={(e) => setAddressForm((p) => ({ ...p, landmark: e.target.value }))}
                      placeholder="e.g. Near metro station"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode <span className="text-red-500">*</span></Label>
                    <Input
                      value={addressForm.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setAddressForm((p) => ({ ...p, pincode: val }));
                      }}
                      onBlur={() => touchAddr("pincode")}
                      placeholder="6 digit pincode"
                    />
                    {addrTouched.pincode && addrErrors.pincode?._errors && <p className="text-red-500 text-[10px] mt-0.5">{addrErrors.pincode._errors[0]}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addr_primary"
                      checked={addressForm.is_primary}
                      onCheckedChange={(checked) => setAddressForm((p) => ({ ...p, is_primary: !!checked }))}
                    />
                    <Label htmlFor="addr_primary" className="cursor-pointer">Mark as Primary Address</Label>
                  </div>
                  <div className="flex gap-2">
                    {editingAddressIndex !== null && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingAddressIndex(null);
                          setAddressForm({
                            address_line_1: "",
                            address_line_2: "",
                            landmark: "",
                            pincode: "",
                            state_id: "",
                            city_id: "",
                            is_primary: false,
                          });
                          setAddrTouched({});
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="button" onClick={addAddress} size="sm">
                      {editingAddressIndex !== null ? (
                        <><Check className="h-4 w-4 mr-2" /> Update Address</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" /> Add Address</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Added Addresses List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Added Addresses</h4>
                {addresses.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-2">No addresses added yet. Minimum 1 is required.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr, idx) => (
                      <Card key={idx} className={cn("relative shadow-sm border dark:border-zinc-700", addr.is_primary && "border-black dark:border-white bg-zinc-50/20 dark:bg-zinc-800/20", editingAddressIndex === idx && "ring-2 ring-black dark:ring-white")}>
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-semibold">Address #{idx + 1}</CardTitle>
                          <div className="flex items-center gap-1">
                            {addr.is_primary && (
                              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full mr-1">
                                Primary
                              </span>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => startEditAddress(idx)} className="h-7 w-7 text-zinc-500 hover:text-zinc-700">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeAddress(idx)} className="h-7 w-7 text-red-500 hover:text-red-700">
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm space-y-1">
                          <p>{addr.address_line_1}</p>
                          {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                          {addr.landmark && <p className="text-xs text-muted-foreground">Landmark: {addr.landmark}</p>}
                          <p className="font-medium text-xs">
                            {addr.city?.name || "City"}, {addr.state?.name || "State"} - {addr.pincode}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {renderTabSaveButton()}
            </div>
          )}

          {/* TAB 3: Contact Persons */}
          {activeTab === "contact-person" && (
            <div className="space-y-6">
              <div className="bg-zinc-50/50 dark:bg-zinc-800/50 p-5 rounded-lg border dark:border-zinc-700 space-y-4">
                <h3 className="font-semibold text-sm">Add Contact Person</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      onBlur={() => touchContact("name")}
                      placeholder="Name of contact"
                    />
                    {contactTouched.name && contactErrors.name?._errors && <p className="text-red-500 text-[10px] mt-0.5">{contactErrors.name._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone No. <span className="text-red-500">*</span></Label>
                    <Input
                      value={contactForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setContactForm((p) => ({ ...p, phone: val }));
                      }}
                      onBlur={() => touchContact("phone")}
                      placeholder="Contact number"
                    />
                    {contactTouched.phone && contactErrors.phone?._errors && <p className="text-red-500 text-[10px] mt-0.5">{contactErrors.phone._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Input
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                      onBlur={() => touchContact("email")}
                      placeholder="Email address"
                    />
                    {contactTouched.email && contactErrors.email?._errors && <p className="text-red-500 text-[10px] mt-0.5">{contactErrors.email._errors[0]}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department <span className="text-red-500">*</span></Label>
                    <Input
                      value={contactForm.department}
                      onChange={(e) => setContactForm((p) => ({ ...p, department: e.target.value }))}
                      onBlur={() => touchContact("department")}
                      placeholder="e.g. Sales, Accounts"
                    />
                    {contactTouched.department && contactErrors.department?._errors && <p className="text-red-500 text-[10px] mt-0.5">{contactErrors.department._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Designation <span className="text-red-500">*</span></Label>
                    <Input
                      value={contactForm.designation}
                      onChange={(e) => setContactForm((p) => ({ ...p, designation: e.target.value }))}
                      onBlur={() => touchContact("designation")}
                      placeholder="e.g. Manager, Executive"
                    />
                    {contactTouched.designation && contactErrors.designation?._errors && <p className="text-red-500 text-[10px] mt-0.5">{contactErrors.designation._errors[0]}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contact_primary"
                      checked={contactForm.is_primary}
                      onCheckedChange={(checked) => setContactForm((p) => ({ ...p, is_primary: !!checked }))}
                    />
                    <Label htmlFor="contact_primary" className="cursor-pointer">Mark as Primary Contact</Label>
                  </div>
                  <div className="flex gap-2">
                    {editingContactIndex !== null && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingContactIndex(null);
                          setContactForm({
                            name: "",
                            department: "",
                            phone: "",
                            designation: "",
                            email: "",
                            is_primary: false,
                          });
                          setContactTouched({});
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="button" onClick={addContact} size="sm">
                      {editingContactIndex !== null ? (
                        <><Check className="h-4 w-4 mr-2" /> Update Contact</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" /> Add Contact</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Added Contacts List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Added Contacts</h4>
                {contacts.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-2">No contacts added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contacts.map((contact, idx) => {
                      return (
                        <Card key={idx} className={cn("relative shadow-sm border dark:border-zinc-700", contact.is_primary && "border-black dark:border-white bg-zinc-50/20 dark:bg-zinc-800/20", editingContactIndex === idx && "ring-2 ring-black dark:ring-white")}>
                          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">{contact.name}</CardTitle>
                            <div className="flex items-center gap-1">
                              {contact.is_primary && (
                                <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full mr-1">
                                  Primary
                                </span>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => startEditContact(idx)} className="h-7 w-7 text-zinc-500 hover:text-zinc-700">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removeContact(idx)} className="h-7 w-7 text-red-500 hover:text-red-700">
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-sm space-y-1">
                            <p><span className="font-medium text-xs text-zinc-500">Phone:</span> {contact.phone}</p>
                            {contact.email && <p><span className="font-medium text-xs text-zinc-500">Email:</span> {contact.email}</p>}
                            {contact.department && <p><span className="font-medium text-xs text-zinc-500">Department:</span> {contact.department}</p>}
                            {contact.designation && <p><span className="font-medium text-xs text-zinc-500">Designation:</span> {contact.designation}</p>}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {renderTabSaveButton()}
            </div>
          )}

          {/* TAB 4: Bank Details */}
          {activeTab === "bank-account" && (
            <div className="space-y-6">
              <div className="bg-zinc-50/50 dark:bg-zinc-800/50 p-5 rounded-lg border dark:border-zinc-700 space-y-4">
                <h3 className="font-semibold text-sm">Add Bank Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Account Holder Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={bankForm.holder_name}
                      onChange={(e) => setBankForm((p) => ({ ...p, holder_name: e.target.value }))}
                      onBlur={() => touchBank("holder_name")}
                      placeholder="Account holder's name"
                    />
                    {bankTouched.holder_name && bankErrors.holder_name?._errors && <p className="text-red-500 text-[10px] mt-0.5">{bankErrors.holder_name._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={bankForm.account_no}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 18);
                        setBankForm((p) => ({ ...p, account_no: val }));
                      }}
                      onBlur={() => touchBank("account_no")}
                      placeholder="9 to 18 digit account number"
                    />
                    {bankTouched.account_no && bankErrors.account_no?._errors && <p className="text-red-500 text-[10px] mt-0.5">{bankErrors.account_no._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code <span className="text-red-500">*</span></Label>
                    <Input
                      value={bankForm.ifsc}
                      onChange={(e) => setBankForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase().slice(0, 11) }))}
                      onBlur={() => touchBank("ifsc")}
                      placeholder="e.g. SBIN0001234"
                    />
                    {bankTouched.ifsc && bankErrors.ifsc?._errors && <p className="text-red-500 text-[10px] mt-0.5">{bankErrors.ifsc._errors[0]}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>SWIFT Code (Optional)</Label>
                    <Input
                      value={bankForm.swift}
                      onChange={(e) => setBankForm((p) => ({ ...p, swift: e.target.value.toUpperCase().slice(0, 11) }))}
                      onBlur={() => touchBank("swift")}
                      placeholder="e.g. BARCINBB or BARCINBB123"
                    />
                    {bankTouched.swift && bankErrors.swift?._errors && <p className="text-red-500 text-[10px] mt-0.5">{bankErrors.swift._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Branch Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={bankForm.branch}
                      onChange={(e) => setBankForm((p) => ({ ...p, branch: e.target.value }))}
                      onBlur={() => touchBank("branch")}
                      placeholder="e.g. Andheri East Branch"
                    />
                    {bankTouched.branch && bankErrors.branch?._errors && <p className="text-red-500 text-[10px] mt-0.5">{bankErrors.branch._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Upload Cancelled Cheque</Label>
                    {bankForm.cancelled_cheque_file || bankForm.cancelled_cheque_url ? (
                      <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-4 shadow-sm">
                        <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                          <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {bankForm.cancelled_cheque_file?.name || "cheque_image.png"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {bankForm.cancelled_cheque_file 
                              ? formatFileSize(bankForm.cancelled_cheque_file.size) 
                              : "Existing uploaded cheque"}
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setBankForm((p) => ({ ...p, cancelled_cheque_file: null, cancelled_cheque_url: null }))}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 rounded-full"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 cursor-pointer group shadow-inner"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            setBankForm((p) => ({ ...p, cancelled_cheque_file: file }));
                            toast.success("File chosen: " + file.name);
                          }
                        }}
                      >
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setBankForm((p) => ({ ...p, cancelled_cheque_file: file }));
                              toast.success("File chosen: " + file.name);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-all duration-300 mb-3 shadow-sm">
                          <Upload className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 text-center">
                          Drag & Drop or Click to Select File
                        </span>
                        <span className="text-xs text-zinc-400 text-center">
                          Supports PDF, JPG, JPEG, PNG (max 10MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bank_default"
                      checked={bankForm.is_default}
                      onCheckedChange={(checked) => setBankForm((p) => ({ ...p, is_default: !!checked }))}
                    />
                    <Label htmlFor="bank_default" className="cursor-pointer">Mark as Default Bank Account</Label>
                  </div>
                  <div className="flex gap-2">
                    {editingBankIndex !== null && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingBankIndex(null);
                          setBankForm({
                            holder_name: "",
                            account_no: "",
                            ifsc: "",
                            swift: "",
                            branch: "",
                            is_default: false,
                            cancelled_cheque_file: null,
                            cancelled_cheque_url: null,
                          });
                          setBankTouched({});
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="button" onClick={addBank} size="sm">
                      {editingBankIndex !== null ? (
                        <><Check className="h-4 w-4 mr-2" /> Update Bank Account</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" /> Add Bank Account</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Added Bank Accounts List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Added Bank Accounts</h4>
                {banks.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-2">No bank accounts added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banks.map((bank, idx) => (
                      <Card key={idx} className={cn("relative shadow-sm border dark:border-zinc-700", bank.is_default && "border-black dark:border-white bg-zinc-50/20 dark:bg-zinc-800/20", editingBankIndex === idx && "ring-2 ring-black dark:ring-white")}>
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BankIcon className="h-4 w-4" /> {bank.holder_name}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            {bank.is_default && (
                              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full mr-1">
                                Default
                              </span>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => startEditBank(idx)} className="h-7 w-7 text-zinc-500 hover:text-zinc-700">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeBank(idx)} className="h-7 w-7 text-red-500 hover:text-red-700">
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm space-y-1">
                          <p><span className="font-medium text-xs text-zinc-500">Account No:</span> {bank.account_no}</p>
                          <p><span className="font-medium text-xs text-zinc-500">IFSC:</span> {bank.ifsc}</p>
                          <p><span className="font-medium text-xs text-zinc-500">Branch:</span> {bank.branch}</p>
                          {bank.swift && <p><span className="font-medium text-xs text-zinc-500">SWIFT:</span> {bank.swift}</p>}
                          
                          {/* Cancelled Cheque status */}
                          <div className="pt-2">
                            {bank.cancelled_cheque_file ? (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 truncate max-w-[180px]">
                                  <Check className="h-3.5 w-3.5" /> Pending: {bank.cancelled_cheque_file.name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-blue-600 hover:underline"
                                  onClick={() => handlePreviewLocalFile(bank.cancelled_cheque_file)}
                                >
                                  Preview
                                </Button>
                              </div>
                            ) : bank.cancelled_cheque_url ? (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-600 font-medium flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5" /> Cheque Uploaded
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-blue-600 hover:underline"
                                  onClick={() => handlePreviewRemoteFile(bank.cancelled_cheque_url, bank.cancelled_cheque_path)}
                                >
                                  Preview
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No Cheque Uploaded</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {renderTabSaveButton()}
            </div>
          )}

          {/* TAB 5: Documents */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="bg-zinc-50/50 dark:bg-zinc-800/50 p-5 rounded-lg border dark:border-zinc-700 space-y-4">
                <h3 className="font-semibold text-sm">Upload Documents <span className="text-red-500">* (Min 2 required)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Document Type <span className="text-red-500">*</span></Label>
                    <select
                      value={docForm.document_type_id}
                      onChange={(e) => setDocForm((p) => ({ ...p, document_type_id: e.target.value }))}
                      onBlur={() => touchDoc("document_type_id")}
                      className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent dark:bg-zinc-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-400"
                    >
                      <option value="">Select Document Type</option>
                      {(metaDataResponse?.data?.documentTypes || []).map((docType) => (
                        <option key={docType.id} value={docType.id}>
                          {docType.document_name}
                        </option>
                      ))}
                    </select>
                    {docTouched.document_type_id && docErrors.document_type_id?._errors && <p className="text-red-500 text-[10px] mt-0.5">{docErrors.document_type_id._errors[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Select File <span className="text-red-500">*</span></Label>
                    {docForm.file || docForm.document_url ? (
                      <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-4 shadow-sm">
                        <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                          <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {docForm.file?.name || "document_file.pdf"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {docForm.file 
                              ? formatFileSize(docForm.file.size) 
                              : "Existing uploaded document"}
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDocForm((p) => ({ ...p, file: null, document_url: null }))}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 rounded-full"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 cursor-pointer group shadow-inner"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            setDocForm((p) => ({ ...p, file }));
                            toast.success("Document selected: " + file.name);
                          }
                        }}
                      >
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDocForm((p) => ({ ...p, file }));
                              toast.success("Document selected: " + file.name);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-all duration-300 mb-3 shadow-sm">
                          <Upload className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 text-center">
                          Drag & Drop or Click to Select File
                        </span>
                        <span className="text-xs text-zinc-400 text-center">
                          Supports PDF, JPG, JPEG, PNG (max 10MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <div className="flex gap-2">
                    {editingDocIndex !== null && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingDocIndex(null);
                          setDocForm({
                            document_type_id: "",
                            file: null,
                            document_url: null,
                          });
                          setDocTouched({});
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="button" onClick={addDocument} size="sm">
                      {editingDocIndex !== null ? (
                        <><Check className="h-4 w-4 mr-2" /> Update Document</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" /> Add Document</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Added Documents List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Uploaded Documents ({documents.length} / Min 2)
                </h4>
                {documents.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic py-2">No documents added yet. At least 2 documents must be uploaded before submitting.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc, idx) => {
                      const docExt = doc.file 
                        ? doc.file.name.split(".").pop()?.toLowerCase() || ""
                        : doc.file_path?.split(".").pop()?.toLowerCase() || "";
                      
                      const mappedDoc = {
                        id: doc.id || idx,
                        originalName: doc.file 
                          ? doc.file.name 
                          : `${doc.documentType?.document_name || "Document"}${docExt ? "." + docExt : ""}`,
                        signedUrl: doc.document_url || "",
                      };

                      return (
                        <div key={idx} className={cn("relative flex items-start gap-2 bg-zinc-50/50 dark:bg-zinc-800/50 p-2 rounded-lg border dark:border-zinc-700", editingDocIndex === idx && "ring-2 ring-black dark:ring-white")}>
                          <div className="flex-1 min-w-0">
                            <DocumentCard
                              doc={mappedDoc}
                              canDelete={true}
                              onDelete={() => removeDocument(idx)}
                              compact={true}
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => startEditDoc(idx)} className="h-7 w-7 text-zinc-500 hover:text-zinc-700 mt-1 shrink-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {renderTabSaveButton()}
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {previewData && (
        <PreviewModal
          url={previewData.url}
          fileName={previewData.fileName}
          fileExt={previewData.fileExt}
          onClose={handleClosePreview}
        />
      )}

      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, type: null, index: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deleteConfirm.type} from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
