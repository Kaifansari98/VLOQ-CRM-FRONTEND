"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  User,
  Building2,
  CreditCard,
  MapPin,
  Briefcase,
  Landmark,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import DocumentCard from "@/components/utils/documentCard";
import CustomeDatePicker from "@/components/date-picker";
import { useStates } from "@/api/vendors";
import { INDIAN_STATES, parseAddress, formatAddress } from "@/lib/addressUtils";

import {
  useCreateUser,
  useUpdateUser,
  useUserDetail,
  useUserTypes,
} from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useVendorById } from "@/api/vendors";
import { useAppSelector } from "@/redux/store";
import {
  uploadUserDocument,
  fetchUserDocumentUrl,
  CreateUserMasterPayload,
  UpdateUserMasterPayload,
} from "@/api/typesMasterApi";
import { toastManager } from "@/components/ui/toast";

const toast = {
  success: (message: string) =>
    toastManager.add({ title: message, type: "success" }),
  error: (message: string) =>
    toastManager.add({ title: message, type: "error" }),
};

/* ------------------------------------------------------------------ */
/*  Document Upload Box Component with Preview/Download/Delete Card   */
/* ------------------------------------------------------------------ */
function DocumentUploadBox({
  label,
  fileUrl,
  fileName,
  signedUrlOverride,
  createdAt,
  onUpload,
  onRemove,
  isUploading,
}: {
  label: string;
  fileUrl?: string | null;
  fileName?: string | null;
  signedUrlOverride?: string | null;
  createdAt?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [signedUrl, setSignedUrl] = React.useState<string>("");
  const [loadingUrl, setLoadingUrl] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!fileUrl) {
      setSignedUrl("");
      return;
    }
    if (signedUrlOverride) {
      setSignedUrl(signedUrlOverride);
      return;
    }
    if (
      fileUrl.startsWith("http://") ||
      fileUrl.startsWith("https://") ||
      fileUrl.startsWith("blob:")
    ) {
      setSignedUrl(fileUrl);
      return;
    }

    let isMounted = true;
    setLoadingUrl(true);
    fetchUserDocumentUrl(fileUrl)
      .then((url) => {
        if (isMounted) {
          setSignedUrl(url || fileUrl);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch signed URL:", err);
        if (isMounted) {
          setSignedUrl(fileUrl);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingUrl(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileUrl, signedUrlOverride]);

  const displayName = React.useMemo(() => {
    const defaultLabel = label.replace(/^Upload\s+/i, "");
    const extFromUrl = fileUrl?.split("?")[0]?.split(".").pop()?.toLowerCase();
    const extFromName = fileName?.split(".").pop()?.toLowerCase();
    const validExt =
      extFromName && extFromName.length <= 5
        ? extFromName
        : extFromUrl && extFromUrl.length <= 5
        ? extFromUrl
        : "pdf";

    const name =
      fileName?.trim() || fileUrl?.split("/").pop()?.split("?")[0] || "";
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
        name,
      );
    if (!name || isUuid) {
      return `${defaultLabel.replace(/\s+/g, "_")}.${validExt}`;
    }
    return name.includes(".") ? name : `${name}.${validExt}`;
  }, [label, fileUrl, fileName]);

  return (
    <div className="space-y-2 w-full">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {fileUrl ? (
        <div className="w-full">
          {loadingUrl && !signedUrl ? (
            <div className="flex items-center justify-center p-6 border rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground">
                Loading document preview...
              </span>
            </div>
          ) : (
            <DocumentCard
              doc={{
                id: 1,
                originalName: displayName,
                signedUrl: signedUrl || fileUrl,
                created_at: createdAt || undefined,
              }}
              canDelete={true}
              onDelete={() => onRemove()}
              className="w-full"
            />
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-accent/40 cursor-pointer transition-colors min-h-[110px]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file);
              }
            }}
          />
          {isUploading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">
                Uploading document...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1 text-center">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">
                Click or drag file to upload
              </span>
              <span className="text-[11px] text-muted-foreground">
                Supported: PDF, JPG, PNG (Max 10MB)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Form Types and Default State                                      */
/* ------------------------------------------------------------------ */
interface EmployeeFormData {
  employee_type: "permanent" | "contractual" | "temporary";
  contract_start_date: string;
  contract_end_date: string;
  employee_code?: string;
  first_name: string;
  last_name: string;
  user_name: string;
  designation: string;
  user_contact: string;
  user_email: string;
  personal_email?: string;
  user_password?: string;
  confirm_password?: string;
  user_type_id: string;
  franchise_ids: number[];
  status: "active" | "inactive";
  department: string;
  aadhar_no: string;
  pan_no: string;
  permanent_address: string;
  permanent_state: string;
  permanent_city: string;
  permanent_pincode: string;
  current_address: string;
  current_state: string;
  current_city: string;
  current_pincode: string;
  aadhar_card_file: string;
  pan_card_file: string;
  bank_account_holder_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  bank_name?: string;
  bank_document_file?: string;
  joining_date: string;
  exit_date: string;
  salary_rate_type: string;
  salary_amount: string;
  statutory_compliance: string;
  work_location: string;
}

const defaultFormData: EmployeeFormData = {
  employee_type: "permanent",
  contract_start_date: "",
  contract_end_date: "",
  employee_code: "",
  first_name: "",
  last_name: "",
  user_name: "",
  designation: "",
  user_contact: "",
  user_email: "",
  personal_email: "",
  user_password: "",
  confirm_password: "",
  user_type_id: "",
  franchise_ids: [],
  status: "active",
  department: "Branch",
  aadhar_no: "",
  pan_no: "",
  permanent_address: "",
  permanent_state: "",
  permanent_city: "",
  permanent_pincode: "",
  current_address: "",
  current_state: "",
  current_city: "",
  current_pincode: "",
  aadhar_card_file: "",
  pan_card_file: "",
  bank_account_holder_name: "",
  bank_account_number: "",
  bank_ifsc_code: "",
  bank_name: "",
  bank_document_file: "",
  joining_date: "",
  exit_date: "",
  salary_rate_type: "Monthly Salary",
  salary_amount: "",
  statutory_compliance: "No",
  work_location: "",
};

interface EmployeeMasterFormProps {
  mode: "create" | "edit";
  employeeId?: number;
  vendorIdOverride?: number;
}

function formatUserTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";

  if (normalized.toLowerCase().replace(/[-_]+/g, " ") === "hrms admin") {
    return "HRMS Admin";
  }

  return normalized
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function EmployeeMasterForm({
  mode,
  employeeId,
  vendorIdOverride,
}: EmployeeMasterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const authUser = useAppSelector((state) => state.auth.user);
  const vendorId =
    vendorIdOverride ||
    (searchParams.get("vendor_id")
      ? Number(searchParams.get("vendor_id"))
      : authUser?.vendor_id || authUser?.vendor?.id || 1);

  const { data: vendorData } = useVendorById(vendorId);
  const { data: userTypesData } = useUserTypes();
  const { data: franchisesData = [] } = useFranchisesByVendorId(vendorId);

  // Single user query for Edit mode
  const {
    data: userDetailResponse,
    isLoading: isLoadingUser,
  } = useUserDetail(mode === "edit" ? employeeId : null, vendorId);

  const createUserMutation = useCreateUser(vendorId);
  const updateUserMutation = useUpdateUser(vendorId);

  const [form, setForm] = React.useState<EmployeeFormData>(defaultFormData);
  const [originalForm, setOriginalForm] =
    React.useState<EmployeeFormData>(defaultFormData);
  const [sameAddress, setSameAddress] = React.useState(false);

  const statesQuery = useStates();
  const stateOptions = React.useMemo(() => {
    const apiStates = statesQuery.data?.data?.map((s) => s.name) || [];
    if (apiStates.length > 0) {
      return Array.from(new Set([...apiStates, ...INDIAN_STATES])).sort((a, b) =>
        a.localeCompare(b),
      );
    }
    return INDIAN_STATES;
  }, [statesQuery.data?.data]);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [uploadingBankDoc, setUploadingBankDoc] = React.useState(false);
  const [bankDocFileName, setBankDocFileName] = React.useState("");
  const [bankDocSignedUrl, setBankDocSignedUrl] = React.useState("");

  const [uploadingAadhar, setUploadingAadhar] = React.useState(false);
  const [uploadingPan, setUploadingPan] = React.useState(false);
  const [aadharFileName, setAadharFileName] = React.useState("");
  const [panFileName, setPanFileName] = React.useState("");
  const [aadharSignedUrl, setAadharSignedUrl] = React.useState("");
  const [panSignedUrl, setPanSignedUrl] = React.useState("");
  const [userCreatedAt, setUserCreatedAt] = React.useState<string | undefined>(
    undefined,
  );

  const [supervisorConfirmation, setSupervisorConfirmation] = React.useState<{
    message: string;
    franchises: string[];
    onConfirm: () => void;
  } | null>(null);

  // Available user types for Employee Master
  const hrmsUserTypeOptions = React.useMemo(() => {
    const types = userTypesData?.data ?? [];
    const list: { id: number; label: string }[] = [];
    types.forEach((t) => {
      const lower = t.user_type?.trim().toLowerCase();
      if (lower !== "master-admin") {
        list.push({ id: t.id, label: formatUserTypeLabel(t.user_type) });
      }
    });

    // Ensure the current user's user_type from detail API is always present
    if (userDetailResponse?.data?.user_type?.id) {
      const curId = userDetailResponse.data.user_type.id;
      const curName = userDetailResponse.data.user_type.user_type || "Employee";
      if (!list.some((item) => item.id === curId)) {
        list.push({ id: curId, label: formatUserTypeLabel(curName) });
      }
    }

    if (form.user_type_id && !list.some((item) => String(item.id) === String(form.user_type_id))) {
      const found = types.find((t) => String(t.id) === String(form.user_type_id));
      if (found) {
        list.push({ id: found.id, label: formatUserTypeLabel(found.user_type) });
      }
    }
    return list;
  }, [userTypesData?.data, userDetailResponse?.data?.user_type, form.user_type_id]);

  // Set default user_type_id for Create
  React.useEffect(() => {
    if (mode === "create" && hrmsUserTypeOptions.length > 0 && !form.user_type_id) {
      const empOption = hrmsUserTypeOptions.find(t => t.label.toLowerCase() === "employee") || hrmsUserTypeOptions[0];
      setForm((f) => ({ ...f, user_type_id: String(empOption.id) }));
    }
  }, [mode, hrmsUserTypeOptions, form.user_type_id]);

  // Pre-fill form when userDetailResponse loads in Edit mode
  React.useEffect(() => {
    if (mode === "edit" && userDetailResponse?.data) {
      const u = userDetailResponse.data;
      const rawDep = (u.department || "Branch").trim();
      const normalizedDep =
        rawDep.toUpperCase() === "BRANCH"
          ? "Branch"
          : rawDep.toUpperCase() === "FACTORY"
          ? "Factory"
          : rawDep.toUpperCase() === "FRANCHISE"
          ? "Franchise"
          : rawDep || "Branch";

      const matchedTypeId =
        u.user_type?.id ||
        (u as any).user_type_id ||
        userTypesData?.data?.find(
          (ut) =>
            ut.user_type?.trim().toLowerCase() ===
            (u.user_type?.user_type || "").trim().toLowerCase(),
        )?.id;

      const prefilled: EmployeeFormData = {
        employee_type: ((u as any).employee_type || "permanent").toLowerCase() as any,
        contract_start_date: (u as any).contract_start_date ? String((u as any).contract_start_date).split("T")[0] : "",
        contract_end_date: (u as any).contract_end_date ? String((u as any).contract_end_date).split("T")[0] : "",
        employee_code: u.employee_code || "",
        first_name: (u.user_name || "").trim().split(/\s+/)[0] || "",
        last_name: (u.user_name || "").trim().split(/\s+/).slice(1).join(" ") || "",
        user_name: u.user_name || "",
        designation: u.designation || "",
        user_contact: u.user_contact || "",
        user_email: u.user_email || "",
        personal_email: (u as any).personal_email || "",
        user_password: "",
        user_type_id: matchedTypeId ? String(matchedTypeId) : "",
        franchise_ids: u.franchise_ids || (u.franchise_id ? [u.franchise_id] : []),
        status: (u.status === "active" || u.status === "inactive"
          ? u.status
          : "active") as "active" | "inactive",
        department: normalizedDep,
        aadhar_no: u.aadhar_no || "",
        pan_no: u.pan_no || "",
        ...(() => {
          const perm = parseAddress(u.permanent_address);
          const curr = parseAddress(u.current_address);
          return {
            permanent_address: perm.address,
            permanent_state: perm.state,
            permanent_city: perm.city,
            permanent_pincode: perm.pincode,
            current_address: curr.address,
            current_state: curr.state,
            current_city: curr.city,
            current_pincode: curr.pincode,
          };
        })(),
        aadhar_card_file: u.aadhar_card_file || "",
        pan_card_file: u.pan_card_file || "",
        bank_account_holder_name: (u as any).bank_account_holder_name || "",
        bank_account_number: (u as any).bank_account_number || "",
        bank_ifsc_code: (u as any).bank_ifsc_code || "",
        bank_name: (u as any).bank_name || "",
        bank_document_file: (u as any).bank_document_file || "",
        confirm_password: "",
        joining_date: u.joining_date ? u.joining_date.split("T")[0] : "",
        exit_date: u.exit_date ? u.exit_date.split("T")[0] : "",
        salary_rate_type: (u as any).salary_rate_type || "Monthly Salary",
        salary_amount: (u as any).salary_amount || "",
        statutory_compliance: (u as any).statutory_compliance || "No",
        work_location: (u as any).work_location || "",
      };

      setForm(prefilled);
      setOriginalForm(prefilled);
      setUserCreatedAt(u.created_at);

      setAadharFileName(
        u.aadhar_card_file ? u.aadhar_card_file.split("/").pop() || "Aadhar_Card" : "",
      );
      setPanFileName(
        u.pan_card_file ? u.pan_card_file.split("/").pop() || "PAN_Card" : "",
      );
      setSameAddress(
        Boolean(
          u.permanent_address &&
            u.current_address &&
            u.permanent_address.trim() === u.current_address.trim(),
        ),
      );
    }
  }, [mode, userDetailResponse, userTypesData]);

  // Filter franchise options by department
  const departmentFranchiseOptions = React.useMemo<Option[]>(() => {
    const depUpper = (form.department || "Branch").trim().toUpperCase();
    const filtered = franchisesData.filter((fr) => {
      const fDep = (fr.Department || (fr as any).department || "").trim().toUpperCase();
      return !fDep || fDep === depUpper;
    });

    return filtered.map((fr) => ({
      value: String(fr.id),
      label: fr.franchise_name,
    }));
  }, [franchisesData, form.department]);

  const handleDepartmentChange = (val: string) => {
    const nextDepUpper = val.trim().toUpperCase();
    const matchingFranchises = franchisesData.filter((fr) => {
      const fDep = (fr.Department || (fr as any).department || "").trim().toUpperCase();
      return !fDep || fDep === nextDepUpper;
    });
    const validIds = new Set(matchingFranchises.map((fr) => fr.id));

    setForm((f) => ({
      ...f,
      department: val,
      franchise_ids: f.franchise_ids.filter((id) => validIds.has(id)),
    }));
  };

  // Upload handlers
  const handleUploadAadhar = async (file: File) => {
    if (!vendorId) return;
    setUploadingAadhar(true);
    try {
      const res = await uploadUserDocument(file, vendorId);
      if (res.file_url) {
        setForm((f) => ({ ...f, aadhar_card_file: res.file_url }));
        setAadharFileName(file.name);
        if (res.signed_url) setAadharSignedUrl(res.signed_url);
        toast.success("Aadhar card uploaded successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload Aadhar card");
    } finally {
      setUploadingAadhar(false);
    }
  };

  const handleUploadPan = async (file: File) => {
    if (!vendorId) return;
    setUploadingPan(true);
    try {
      const res = await uploadUserDocument(file, vendorId);
      if (res.file_url) {
        setForm((f) => ({ ...f, pan_card_file: res.file_url }));
        setPanFileName(file.name);
        if (res.signed_url) setPanSignedUrl(res.signed_url);
        toast.success("PAN card uploaded successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload PAN card");
    } finally {
      setUploadingPan(false);
    }
  };

  const handleRemoveAadhar = () => {
    setForm((f) => ({ ...f, aadhar_card_file: "" }));
    setAadharFileName("");
    setAadharSignedUrl("");
  };

  const handleRemovePan = () => {
    setForm((f) => ({ ...f, pan_card_file: "" }));
    setPanFileName("");
    setPanSignedUrl("");
  };

  const handleUploadBankDoc = async (file: File) => {
    if (!vendorId) return;
    setUploadingBankDoc(true);
    try {
      const res = await uploadUserDocument(file, vendorId);
      if (res.file_url) {
        setForm((f) => ({ ...f, bank_document_file: res.file_url }));
        setBankDocFileName(file.name);
        if (res.signed_url) setBankDocSignedUrl(res.signed_url);
        toast.success("Bank document uploaded successfully.");
      }
    } catch {
      toast.error("Failed to upload bank document.");
    } finally {
      setUploadingBankDoc(false);
    }
  };

  const handleRemoveBankDoc = () => {
    setForm((f) => ({ ...f, bank_document_file: "" }));
    setBankDocFileName("");
    setBankDocSignedUrl("");
    toast.success("Bank document removed.");
  };

  // Validation
  const passwordValidations = React.useMemo(() => {
    const pwd = form.user_password || "";
    return {
      minLength: pwd.length >= 8,
      hasNumber: /\d/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  }, [form.user_password]);

  const isPasswordValid = React.useMemo(() => {
    if (mode === "edit" && !form.user_password) return true;
    if (!form.user_password) return false;
    const reqsPassed = Object.values(passwordValidations).every(Boolean);
    return reqsPassed && form.user_password === form.confirm_password;
  }, [mode, form.user_password, form.confirm_password, passwordValidations]);

  const isFormValid = React.useMemo(() => {
    const fullName = (form.first_name ? form.first_name + (form.last_name ? " " + form.last_name : "") : form.user_name).trim();
    if (!fullName || !form.user_contact.trim())
      return false;
    if ((form.employee_type === "contractual" || form.employee_type === "temporary") && (!form.contract_start_date || !form.contract_end_date))
      return false;
    if (!form.user_type_id) return false;
    if (!form.department) return false;
    if (form.franchise_ids.length === 0) return false;
    if (!isPasswordValid) return false;
    return true;
  }, [form, isPasswordValid]);

  const handleSubmitError = (error: any, retryFn: () => void) => {
    const errorData = error.response?.data;
    if (errorData?.code === "SUPERVISOR_CONFIRMATION_REQUIRED") {
      setSupervisorConfirmation({
        message: errorData.message,
        franchises: errorData.franchises || [],
        onConfirm: () => {
          setSupervisorConfirmation(null);
          retryFn();
        },
      });
      return;
    }
    toast.error(errorData?.message || "Operation failed. Please try again.");
  };

  const handleSave = () => {
    if (!isFormValid || !vendorId) return;

    const extractNational = (val: string) => {
      const parsed = parsePhoneNumberFromString(val);
      return parsed?.nationalNumber ?? val.replace(/\D/g, "");
    };

    if (mode === "create") {
      const payload: CreateUserMasterPayload = {
        vendor_id: vendorId,
        franchise_id: form.franchise_ids[0] || 0,
        franchise_ids: form.franchise_ids,
        employee_type: form.employee_type,
        contract_start_date: form.employee_type !== "permanent" && form.contract_start_date ? form.contract_start_date : undefined,
        contract_end_date: form.employee_type !== "permanent" && form.contract_end_date ? form.contract_end_date : undefined,
        user_name: (form.first_name ? `${form.first_name.trim()}${form.last_name.trim() ? " " + form.last_name.trim() : ""}` : form.user_name).trim(),
        designation: form.designation.trim() || undefined,
        user_contact: form.user_contact.trim(),
        user_email: form.user_email.trim(),
        personal_email: form.personal_email?.trim() || undefined,
        user_timezone: "Asia/Kolkata",
        password: form.user_password!,
        user_type_id: Number(form.user_type_id),
        status: form.status,
        department: form.department?.trim() || undefined,
        aadhar_no: form.aadhar_no?.trim() || undefined,
        pan_no: form.pan_no?.trim() || undefined,
        permanent_address: form.permanent_address?.trim() || undefined,
        current_address: form.current_address?.trim() || undefined,
        aadhar_card_file: form.aadhar_card_file?.trim() || undefined,
        pan_card_file: form.pan_card_file?.trim() || undefined,
        bank_account_holder_name: form.bank_account_holder_name?.trim() || undefined,
        bank_account_number: form.bank_account_number?.trim() || undefined,
        bank_ifsc_code: form.bank_ifsc_code?.trim().toUpperCase() || undefined,
        bank_name: form.bank_name?.trim() || undefined,
        bank_document_file: form.bank_document_file?.trim() || undefined,
        joining_date: form.joining_date || undefined,
        exit_date: form.exit_date || undefined,
        salary_rate_type: form.salary_rate_type?.trim() || undefined,
        salary_amount: form.salary_amount?.trim() || undefined,
        statutory_compliance: form.statutory_compliance?.trim() || undefined,
        work_location: form.work_location?.trim() || undefined,
      };

      createUserMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Employee created successfully");
          router.push(
            "/dashboard/masters-management/hrms-masters/employee-master" +
              (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
          );
        },
        onError: (err) =>
          handleSubmitError(err, () =>
            createUserMutation.mutate({
              ...payload,
              confirm_additional_supervisor: true,
            }),
          ),
      });
    } else {
      if (!employeeId) return;

      const payload: UpdateUserMasterPayload = {};
      const computedName = (form.first_name ? `${form.first_name.trim()}${form.last_name.trim() ? " " + form.last_name.trim() : ""}` : form.user_name).trim();
      if (computedName !== (originalForm.user_name || "").trim())
        payload.user_name = computedName;
      if (form.employee_type !== originalForm.employee_type)
        payload.employee_type = form.employee_type;
      if (form.contract_start_date !== originalForm.contract_start_date)
        payload.contract_start_date = form.employee_type !== "permanent" && form.contract_start_date ? form.contract_start_date : null;
      if (form.contract_end_date !== originalForm.contract_end_date)
        payload.contract_end_date = form.employee_type !== "permanent" && form.contract_end_date ? form.contract_end_date : null;
      if ((form.employee_code || "").trim() !== (originalForm.employee_code || "").trim())
        payload.employee_code = form.employee_code?.trim() || null;
      if ((form.designation || "").trim() !== (originalForm.designation || "").trim())
        payload.designation = form.designation.trim() || null;

      const currContact = extractNational(form.user_contact);
      const origContact = extractNational(originalForm.user_contact);
      if (currContact !== origContact) payload.user_contact = form.user_contact.trim();

      if (form.user_email.trim().toLowerCase() !== originalForm.user_email.trim().toLowerCase())
        payload.user_email = form.user_email.trim();
      if ((form.personal_email || "").trim().toLowerCase() !== (originalForm.personal_email || "").trim().toLowerCase())
        payload.personal_email = form.personal_email?.trim() || null;
      if (form.user_password) payload.password = form.user_password;
      if (Number(form.user_type_id) !== Number(originalForm.user_type_id))
        payload.user_type_id = Number(form.user_type_id);

      const currFranchises = [...form.franchise_ids].sort().join(",");
      const origFranchises = [...originalForm.franchise_ids].sort().join(",");
      if (currFranchises !== origFranchises) payload.franchise_ids = form.franchise_ids;

      if (form.status !== originalForm.status) payload.status = form.status;

      if ((form.department || "").trim() !== (originalForm.department || "").trim())
        payload.department = form.department?.trim() || null;
      if ((form.aadhar_no || "").trim() !== (originalForm.aadhar_no || "").trim())
        payload.aadhar_no = form.aadhar_no?.trim() || null;
      if ((form.pan_no || "").trim() !== (originalForm.pan_no || "").trim())
        payload.pan_no = form.pan_no?.trim() || null;
      if ((form.permanent_address || "").trim() !== (originalForm.permanent_address || "").trim())
        payload.permanent_address = form.permanent_address?.trim() || null;
      if ((form.current_address || "").trim() !== (originalForm.current_address || "").trim())
        payload.current_address = form.current_address?.trim() || null;
      if ((form.aadhar_card_file || "").trim() !== (originalForm.aadhar_card_file || "").trim())
        payload.aadhar_card_file = form.aadhar_card_file?.trim() || null;
      if ((form.pan_card_file || "").trim() !== (originalForm.pan_card_file || "").trim())
        payload.pan_card_file = form.pan_card_file?.trim() || null;
      if ((form.bank_account_holder_name || "").trim() !== (originalForm.bank_account_holder_name || "").trim())
        payload.bank_account_holder_name = form.bank_account_holder_name.trim() || null;
      if ((form.bank_account_number || "").trim() !== (originalForm.bank_account_number || "").trim())
        payload.bank_account_number = form.bank_account_number.trim() || null;
      if ((form.bank_ifsc_code || "").trim() !== (originalForm.bank_ifsc_code || "").trim())
        payload.bank_ifsc_code = form.bank_ifsc_code.trim().toUpperCase() || null;
      if ((form.bank_name || "").trim() !== (originalForm.bank_name || "").trim())
        payload.bank_name = form.bank_name?.trim() || null;
      if ((form.bank_document_file || "").trim() !== (originalForm.bank_document_file || "").trim())
        payload.bank_document_file = form.bank_document_file?.trim() || null;
      if (form.joining_date !== originalForm.joining_date)
        payload.joining_date = form.joining_date || null;
      if (form.exit_date !== originalForm.exit_date)
        payload.exit_date = form.exit_date || null;
      if (form.salary_rate_type !== originalForm.salary_rate_type)
        payload.salary_rate_type = form.salary_rate_type || null;
      if ((form.salary_amount || "").trim() !== (originalForm.salary_amount || "").trim())
        payload.salary_amount = form.salary_amount.trim() || null;
      if (form.statutory_compliance !== originalForm.statutory_compliance)
        payload.statutory_compliance = form.statutory_compliance || null;
      if ((form.work_location || "").trim() !== (originalForm.work_location || "").trim())
        payload.work_location = form.work_location.trim() || null;

      if (Object.keys(payload).length === 0) {
        toast.success("No changes made");
        router.push(
          "/dashboard/masters-management/hrms-masters/employee-master" +
            (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
        );
        return;
      }

      updateUserMutation.mutate(
        { userId: employeeId, payload },
        {
          onSuccess: () => {
            toast.success("Employee updated successfully");
            router.push(
              "/dashboard/masters-management/hrms-masters/employee-master" +
                (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
            );
          },
          onError: (err) =>
            handleSubmitError(err, () =>
              updateUserMutation.mutate({
                userId: employeeId,
                payload: { ...payload, confirm_additional_supervisor: true },
              }),
            ),
        },
      );
    }
  };

  const isSaving = createUserMutation.isPending || updateUserMutation.isPending;

  if (mode === "edit" && isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading employee details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 w-full">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                "/dashboard/masters-management/hrms-masters/employee-master" +
                  (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
              )
            }
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employee Master
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {mode === "edit" ? "Edit Employee" : "Create Employee"}
            </h1>
            {mode === "edit" && form.employee_code && (
              <Badge variant="secondary" className="font-mono text-xs font-semibold px-2 py-0.5">
                {form.employee_code}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                "/dashboard/masters-management/hrms-masters/employee-master" +
                  (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
              )
            }
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid || isSaving || uploadingAadhar || uploadingPan || uploadingBankDoc}
            className="min-w-[130px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : mode === "edit" ? (
              "Save Changes"
            ) : (
              "Create Employee"
            )}
          </Button>
        </div>
      </div>

      {/* Main Form Cards */}
      <div className="grid grid-cols-1 gap-5">
        {/* Card 1: Basic Information - 4 Columns */}
        <Card className="shadow-xs py-0 gap-0 overflow-hidden">
          <CardHeader className="py-[10px] px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Basic Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Primary credentials, name, user type, and contact details.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-[10px] px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Employee Type */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-employee-type" className="text-xs font-medium">
                  Employee Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.employee_type}
                  onValueChange={(val: any) => setForm((f) => ({ ...f, employee_type: val }))}
                >
                  <SelectTrigger id="emp-employee-type" className="h-10 w-full">
                    <SelectValue placeholder="Select Employee Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contractual">Contractual</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Code */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-code" className="text-xs font-medium">
                  Employee Code <span className="text-muted-foreground text-[11px] font-normal">(Unique)</span>
                </Label>
                <Input
                  id="emp-code"
                  placeholder="e.g. EMP-001"
                  value={form.employee_code || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, employee_code: e.target.value.toUpperCase() }))
                  }
                  className="font-mono text-xs"
                />
              </div>

              {/* Start Date & End Date for Contractual / Temporary */}
              {(form.employee_type === "contractual" || form.employee_type === "temporary") && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="emp-contract-start" className="text-xs font-medium">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <CustomeDatePicker
                      value={form.contract_start_date}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, contract_start_date: val || "" }))
                      }
                      className="h-10 w-full"
                      placeholder="Select start date"
                      dateFormat="dd MMM yyyy"
                      captionLayout="dropdown"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emp-contract-end" className="text-xs font-medium">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <CustomeDatePicker
                      value={form.contract_end_date}
                      onChange={(val) =>
                        setForm((f) => ({ ...f, contract_end_date: val || "" }))
                      }
                      className="h-10 w-full"
                      placeholder="Select end date"
                      dateFormat="dd MMM yyyy"
                      captionLayout="dropdown"
                    />
                  </div>
                </>
              )}

              {/* First Name */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-first-name" className="text-xs font-medium">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emp-first-name"
                  placeholder="e.g. Rahul"
                  value={form.first_name}
                  onChange={(e) => {
                    const fn = e.target.value;
                    setForm((f) => ({
                      ...f,
                      first_name: fn,
                      user_name: (fn + (f.last_name ? " " + f.last_name : "")).trim(),
                    }));
                  }}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-last-name" className="text-xs font-medium">
                  Last Name
                </Label>
                <Input
                  id="emp-last-name"
                  placeholder="e.g. Sharma"
                  value={form.last_name}
                  onChange={(e) => {
                    const ln = e.target.value;
                    setForm((f) => ({
                      ...f,
                      last_name: ln,
                      user_name: ((f.first_name || "") + (ln ? " " + ln : "")).trim(),
                    }));
                  }}
                />
              </div>

              {/* Contact No */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-contact" className="text-xs font-medium">
                  Contact Number <span className="text-destructive">*</span>
                </Label>
                <PhoneInput
                  id="emp-contact"
                  defaultCountry="IN"
                  placeholder="Enter contact number"
                  value={form.user_contact}
                  onChange={(val) => setForm((f) => ({ ...f, user_contact: val || "" }))}
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-email" className="text-xs font-medium">
                  Email Address <span className="text-muted-foreground text-[11px] font-normal">(Optional)</span>
                </Label>
                <Input
                  id="emp-email"
                  type="email"
                  placeholder="employee@vloq.com"
                  value={form.user_email}
                  onChange={(e) => setForm((f) => ({ ...f, user_email: e.target.value }))}
                />
              </div>

              {/* Personal Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-personal-email" className="text-xs font-medium">
                  Personal E-mail Address <span className="text-muted-foreground text-[11px] font-normal">(Optional)</span>
                </Label>
                <Input
                  id="emp-personal-email"
                  type="email"
                  placeholder="personal@gmail.com"
                  value={form.personal_email || ""}
                  onChange={(e) => setForm((f) => ({ ...f, personal_email: e.target.value }))}
                />
              </div>

              {/* User Type */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-user-type" className="text-xs font-medium">
                  User Role / Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.user_type_id}
                  onValueChange={(val) => setForm((f) => ({ ...f, user_type_id: val }))}
                >
                  <SelectTrigger id="emp-user-type" className="h-10 w-full">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {hrmsUserTypeOptions.map((ut) => (
                      <SelectItem key={ut.id} value={String(ut.id)}>
                        {ut.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Designation - Spans 2 Columns */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="emp-designation" className="text-xs font-medium">Designation</Label>
                <Input
                  id="emp-designation"
                  placeholder="e.g. Senior Designer, Production Engineer, HR Executive"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5 flex flex-col justify-end pb-1">
                <Label className="text-xs font-medium">Account Status</Label>
                <div className="flex items-center space-x-2 h-9 px-3 rounded-md border bg-muted/20">
                  <Checkbox
                    id="emp-status"
                    checked={form.status === "active"}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({
                        ...f,
                        status: checked ? "active" : "inactive",
                      }))
                    }
                  />
                  <Label htmlFor="emp-status" className="text-xs font-normal cursor-pointer">
                    Active <span className="text-muted-foreground">(Can login)</span>
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

                {/* Card 2: Department & Franchise Assignment */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Department & Franchise Assignment
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose department to filter and assign matching franchises.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-3.5 items-start">
              {/* Department */}
              <div className="w-full sm:w-[200px] shrink-0 space-y-1.5">
                <Label htmlFor="emp-department" className="text-xs font-medium">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Select value={form.department} onValueChange={handleDepartmentChange}>
                  <SelectTrigger id="emp-department" className="h-10 w-full text-xs">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Branch">Branch</SelectItem>
                    <SelectItem value="Franchise">Franchise</SelectItem>
                    <SelectItem value="Factory">Factory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Franchise */}
              <div className="w-full flex-1 space-y-1.5 min-w-0">
                <Label className="text-xs font-medium">
                  Franchise <span className="text-destructive">*</span>
                </Label>
                <MultipleSelector
                  className="min-h-[40px]"
                  placeholder={
                    departmentFranchiseOptions.length === 0
                      ? `No ${form.department} franchises found`
                      : `Select ${form.department} franchises...`
                  }
                  defaultOptions={departmentFranchiseOptions}
                  options={departmentFranchiseOptions}
                  value={departmentFranchiseOptions.filter((opt) =>
                    form.franchise_ids.includes(Number(opt.value)),
                  )}
                  onChange={(selected: Option[]) => {
                    const ids = selected.map((s) => Number(s.value));
                    setForm((f) => ({ ...f, franchise_ids: ids }));
                  }}
                  emptyIndicator={
                    <p className="text-center text-xs text-muted-foreground py-2">
                      No franchises found for ${form.department} department.
                    </p>
                  }
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {form.franchise_ids.length > 0
                ? `${form.franchise_ids.length} franchise(s) selected for ${form.department}.`
                : `Please select at least one ${form.department} franchise.`}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Address Details */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Address Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Permanent and current residence addresses with state, city, and pincode.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Permanent Address Column */}
              <div className="space-y-3 p-3.5 rounded-lg border bg-muted/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
                    Permanent Address
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emp-perm-address" className="text-xs font-medium">
                    Address / Street
                  </Label>
                  <Textarea
                    id="emp-perm-address"
                    placeholder="House/Flat No, Building, Street, Area..."
                    value={form.permanent_address}
                    className="h-[62px] resize-none overflow-y-auto leading-relaxed text-xs"
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({
                        ...f,
                        permanent_address: val,
                        current_address: sameAddress ? val : f.current_address,
                      }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* State (Dropdown) */}
                  <div className="space-y-1.5 sm:col-span-5 min-w-0">
                    <Label className="text-xs font-medium">State</Label>
                    <Select
                      value={form.permanent_state}
                      onValueChange={(val) => {
                        setForm((f) => ({
                          ...f,
                          permanent_state: val,
                          current_state: sameAddress ? val : f.current_state,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full h-9 text-xs min-w-0 overflow-hidden [&>span]:truncate">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {stateOptions.map((st) => (
                          <SelectItem key={st} value={st} className="text-xs">
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City */}
                  <div className="space-y-1.5 sm:col-span-4 min-w-0">
                    <Label htmlFor="emp-perm-city" className="text-xs font-medium">
                      City
                    </Label>
                    <Input
                      id="emp-perm-city"
                      placeholder="Enter city"
                      value={form.permanent_city}
                      className="h-9 text-xs w-full min-w-0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({
                          ...f,
                          permanent_city: val,
                          current_city: sameAddress ? val : f.current_city,
                        }));
                      }}
                    />
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1.5 sm:col-span-3 min-w-0">
                    <Label htmlFor="emp-perm-pincode" className="text-xs font-medium">
                      Pincode
                    </Label>
                    <Input
                      id="emp-perm-pincode"
                      placeholder="6-digit PIN"
                      maxLength={6}
                      value={form.permanent_pincode}
                      className="h-9 text-xs w-full min-w-0"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setForm((f) => ({
                          ...f,
                          permanent_pincode: val,
                          current_pincode: sameAddress ? val : f.current_pincode,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Current Address Column */}
              <div className="space-y-3 p-3.5 rounded-lg border bg-muted/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
                    Current Address
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="emp-same-address"
                      checked={sameAddress}
                      onCheckedChange={(checked) => {
                        const val = Boolean(checked);
                        setSameAddress(val);
                        if (val) {
                          setForm((f) => ({
                            ...f,
                            current_address: f.permanent_address,
                            current_state: f.permanent_state,
                            current_city: f.permanent_city,
                            current_pincode: f.permanent_pincode,
                          }));
                        }
                      }}
                    />
                    <Label
                      htmlFor="emp-same-address"
                      className="text-xs font-normal text-muted-foreground cursor-pointer"
                    >
                      Same as Permanent
                    </Label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emp-curr-address" className="text-xs font-medium">
                    Address / Street
                  </Label>
                  <Textarea
                    id="emp-curr-address"
                    placeholder="House/Flat No, Building, Street, Area..."
                    value={sameAddress ? form.permanent_address : form.current_address}
                    disabled={sameAddress}
                    className="h-[62px] resize-none overflow-y-auto leading-relaxed text-xs"
                    onChange={(e) => {
                      setForm((f) => ({ ...f, current_address: e.target.value }));
                      if (sameAddress) setSameAddress(false);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* State (Dropdown) */}
                  <div className="space-y-1.5 sm:col-span-5 min-w-0">
                    <Label className="text-xs font-medium">State</Label>
                    <Select
                      value={sameAddress ? form.permanent_state : form.current_state}
                      disabled={sameAddress}
                      onValueChange={(val) => {
                        setForm((f) => ({ ...f, current_state: val }));
                        if (sameAddress) setSameAddress(false);
                      }}
                    >
                      <SelectTrigger className="w-full h-9 text-xs min-w-0 overflow-hidden [&>span]:truncate">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {stateOptions.map((st) => (
                          <SelectItem key={st} value={st} className="text-xs">
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City */}
                  <div className="space-y-1.5 sm:col-span-4 min-w-0">
                    <Label htmlFor="emp-curr-city" className="text-xs font-medium">
                      City
                    </Label>
                    <Input
                      id="emp-curr-city"
                      placeholder="Enter city"
                      value={sameAddress ? form.permanent_city : form.current_city}
                      disabled={sameAddress}
                      className="h-9 text-xs w-full min-w-0"
                      onChange={(e) => {
                        setForm((f) => ({ ...f, current_city: e.target.value }));
                        if (sameAddress) setSameAddress(false);
                      }}
                    />
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1.5 sm:col-span-3 min-w-0">
                    <Label htmlFor="emp-curr-pincode" className="text-xs font-medium">
                      Pincode
                    </Label>
                    <Input
                      id="emp-curr-pincode"
                      placeholder="6-digit PIN"
                      maxLength={6}
                      value={sameAddress ? form.permanent_pincode : form.current_pincode}
                      disabled={sameAddress}
                      className="h-9 text-xs w-full min-w-0"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setForm((f) => ({ ...f, current_pincode: val }));
                        if (sameAddress) setSameAddress(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Employment & Compensation Details - 3x2 Grid (3 on top, 3 on bottom) */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Employment & Compensation Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Joining details, assigned work location, salary structure, and statutory compliance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Row 1 - Box 1: Joining Date */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-joining-date" className="text-xs font-medium flex items-center h-5">
                  Joining Date
                </Label>
                <CustomeDatePicker
                  value={form.joining_date}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, joining_date: val || "" }))
                  }
                  className="h-10 w-full"
                  placeholder="Select joining date"
                  dateFormat="dd MMM yyyy"
                  captionLayout="dropdown"
                />
              </div>

              {/* Row 1 - Box 2: Exit Date */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-exit-date" className="text-xs font-medium flex items-center h-5">
                  Exit Date <span className="text-muted-foreground font-normal ml-1">(if applicable)</span>
                </Label>
                <CustomeDatePicker
                  value={form.exit_date}
                  onChange={(val) =>
                    setForm((f) => ({ ...f, exit_date: val || "" }))
                  }
                  className="h-10 w-full"
                  placeholder="Select exit date"
                  dateFormat="dd MMM yyyy"
                  captionLayout="dropdown"
                />
              </div>

              {/* Row 1 - Box 3: Assigned Work Location */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-work-location" className="text-xs font-medium flex items-center h-5">
                  Assigned Work Location
                </Label>
                <Input
                  id="emp-work-location"
                  placeholder="e.g. Mumbai HO, Factory Unit 2"
                  className="h-10 w-full"
                  value={form.work_location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, work_location: e.target.value }))
                  }
                />
              </div>

              {/* Row 2 - Box 4: Statutory / Compliance Applicability */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-statutory-compliance" className="text-xs font-medium flex items-center h-5">
                  Statutory / Compliance Applicability
                </Label>
                <Select
                  value={form.statutory_compliance}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, statutory_compliance: val }))
                  }
                >
                  <SelectTrigger id="emp-statutory-compliance" className="h-10 w-full">
                    <SelectValue placeholder="Select Applicability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes (Applicable)</SelectItem>
                    <SelectItem value="No">No (Not Applicable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2 - Box 5: Salary / Hourly Rate Type */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-salary-type" className="text-xs font-medium flex items-center h-5">
                  Pay Type (Salary / Hourly Rate)
                </Label>
                <Select
                  value={form.salary_rate_type}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, salary_rate_type: val }))
                  }
                >
                  <SelectTrigger id="emp-salary-type" className="h-10 w-full">
                    <SelectValue placeholder="Select Pay Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly Salary">Monthly Salary</SelectItem>
                    <SelectItem value="Hourly Rate">Hourly Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2 - Box 6: Salary / Hourly Rate Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-salary-amount" className="text-xs font-medium flex items-center h-5">
                  {form.salary_rate_type === "Hourly Rate"
                    ? "Hourly Rate Amount (₹)"
                    : "Monthly Salary Amount (₹)"}
                </Label>
                <Input
                  id="emp-salary-amount"
                  type="number"
                  className="h-10 w-full"
                  placeholder={
                    form.salary_rate_type === "Hourly Rate" ? "e.g. 250" : "e.g. 35000"
                  }
                  value={form.salary_amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, salary_amount: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Bank Details - 4 Columns + Document Upload */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Bank Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Employee bank account details and documents for payroll and salary disbursement.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bank Name */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-bank-name" className="text-xs font-medium flex items-center h-5">
                  Bank Name
                </Label>
                <Input
                  id="emp-bank-name"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  className="h-10 w-full"
                  value={form.bank_name || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bank_name: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-bank-holder" className="text-xs font-medium flex items-center h-5">
                  Account Holder Name
                </Label>
                <Input
                  id="emp-bank-holder"
                  placeholder="Name as per bank account"
                  className="h-10 w-full"
                  value={form.bank_account_holder_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bank_account_holder_name: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Bank Account Number */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-bank-acc" className="text-xs font-medium flex items-center h-5">
                  Bank Account Number
                </Label>
                <Input
                  id="emp-bank-acc"
                  placeholder="Enter bank account number (max 17 digits)"
                  className="h-10 w-full"
                  maxLength={17}
                  value={form.bank_account_number}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bank_account_number: e.target.value.replace(/\D/g, "").slice(0, 17),
                    }))
                  }
                />
              </div>

              {/* IFSC Code */}
              <div className="space-y-1.5">
                <Label htmlFor="emp-bank-ifsc" className="text-xs font-medium flex items-center h-5">
                  IFSC Code
                </Label>
                <Input
                  id="emp-bank-ifsc"
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                  value={form.bank_ifsc_code}
                  className="h-10 uppercase font-mono"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bank_ifsc_code: e.target.value.toUpperCase().slice(0, 11),
                    }))
                  }
                />
              </div>
            </div>

            {/* Bank Document Upload */}
            <div className="pt-3 border-t">
              <div className="max-w-md">
                <DocumentUploadBox
                  label="Upload Bank Document (Cancelled Cheque / Passbook)"
                  fileUrl={form.bank_document_file}
                  fileName={bankDocFileName}
                  signedUrlOverride={bankDocSignedUrl}
                  createdAt={userCreatedAt}
                  onUpload={handleUploadBankDoc}
                  onRemove={handleRemoveBankDoc}
                  isUploading={uploadingBankDoc}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Identity & Verification Documents - 4 Columns */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Identity & Verification Documents
                </CardTitle>
                <CardDescription className="text-xs">
                  Aadhar, PAN details, and document cards with preview, download, and delete actions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Aadhar No (2 cols) */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="emp-aadhar-no" className="text-xs font-medium">Aadhar Card No.</Label>
                <Input
                  id="emp-aadhar-no"
                  placeholder="12-digit Aadhar number"
                  maxLength={12}
                  value={form.aadhar_no}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                    setForm((f) => ({ ...f, aadhar_no: val }));
                  }}
                />
              </div>

              {/* PAN No (2 cols) */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="emp-pan-no" className="text-xs font-medium">PAN Card No.</Label>
                <Input
                  id="emp-pan-no"
                  placeholder="10-digit PAN (e.g. ABCDE1234F)"
                  maxLength={10}
                  value={form.pan_no}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 10);
                    setForm((f) => ({ ...f, pan_no: val }));
                  }}
                />
              </div>

              {/* Upload Aadhar Card (2 cols) */}
              <div className="lg:col-span-2">
                <DocumentUploadBox
                  label="Upload Aadhar Card"
                  fileUrl={form.aadhar_card_file}
                  fileName={aadharFileName}
                  signedUrlOverride={aadharSignedUrl}
                  createdAt={userCreatedAt}
                  onUpload={handleUploadAadhar}
                  onRemove={handleRemoveAadhar}
                  isUploading={uploadingAadhar}
                />
              </div>

              {/* Upload PAN Card (2 cols) */}
              <div className="lg:col-span-2">
                <DocumentUploadBox
                  label="Upload PAN Card"
                  fileUrl={form.pan_card_file}
                  fileName={panFileName}
                  signedUrlOverride={panSignedUrl}
                  createdAt={userCreatedAt}
                  onUpload={handleUploadPan}
                  onRemove={handleRemovePan}
                  isUploading={uploadingPan}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Password & Security - 4 Columns */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Account Security
                </CardTitle>
                <CardDescription className="text-xs">
                  {mode === "edit"
                    ? "Leave password field blank to keep current password unchanged."
                    : "Create a secure password for this user account."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
              {/* Password */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="emp-password" className="text-xs font-medium">
                  {mode === "edit" ? "New Password (optional)" : "Password"}{" "}
                  {mode === "create" && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="emp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      mode === "edit"
                        ? "Leave blank to keep current password"
                        : "Enter account password"
                    }
                    value={form.user_password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, user_password: e.target.value }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="emp-confirm-password" className="text-xs font-medium">
                  Confirm Password{" "}
                  {(mode === "create" || Boolean(form.user_password)) && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="emp-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={form.confirm_password || ""}
                    disabled={mode === "edit" && !form.user_password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, confirm_password: e.target.value }))
                    }
                    className={`pr-10 ${
                      Boolean(form.user_password) && Boolean(form.confirm_password)
                        ? form.user_password === form.confirm_password
                          ? "border-emerald-500 focus-visible:ring-emerald-500/30"
                          : "border-destructive focus-visible:ring-destructive/30"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {Boolean(form.user_password) && Boolean(form.confirm_password) && (
                  <p
                    className={`text-[11px] ${
                      form.user_password === form.confirm_password
                        ? "text-emerald-600 font-medium"
                        : "text-destructive font-medium"
                    }`}
                  >
                    {form.user_password === form.confirm_password
                      ? "✓ Passwords match"
                      : "✕ Passwords do not match"}
                  </p>
                )}
              </div>

              {(mode === "create" || Boolean(form.user_password)) && (
                <div className="lg:col-span-4 rounded-lg border bg-muted/30 p-3 space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground text-xs">Password requirements:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5 text-[11px]">
                    <span
                      className={`flex items-center gap-1 ${
                        passwordValidations.minLength ? "text-emerald-600 font-medium" : ""
                      }`}
                    >
                      <Check className="h-3 w-3" /> 8+ characters
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        passwordValidations.hasNumber ? "text-emerald-600 font-medium" : ""
                      }`}
                    >
                      <Check className="h-3 w-3" /> 1 number
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        passwordValidations.hasLower ? "text-emerald-600 font-medium" : ""
                      }`}
                    >
                      <Check className="h-3 w-3" /> 1 lowercase
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        passwordValidations.hasUpper ? "text-emerald-600 font-medium" : ""
                      }`}
                    >
                      <Check className="h-3 w-3" /> 1 uppercase
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        passwordValidations.hasSpecial ? "text-emerald-600 font-medium" : ""
                      }`}
                    >
                      <Check className="h-3 w-3" /> 1 special character
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              "/dashboard/masters-management/hrms-masters/employee-master" +
                (vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""),
            )
          }
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isFormValid || isSaving || uploadingAadhar || uploadingPan || uploadingBankDoc}
          className="min-w-[140px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === "edit" ? (
            "Save Changes"
          ) : (
            "Create Employee"
          )}
        </Button>
      </div>

      {/* Supervisor Confirmation Alert Dialog */}
      {supervisorConfirmation && (
        <AlertDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setSupervisorConfirmation(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <ShieldAlert className="h-5 w-5" />
                <AlertDialogTitle>Supervisor Role Assignment</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-2 pt-2 text-sm text-foreground">
                <p>{supervisorConfirmation.message}</p>
                {supervisorConfirmation.franchises?.length > 0 && (
                  <div className="rounded-md border p-2.5 bg-muted/40 space-y-1">
                    <p className="font-semibold text-xs text-foreground">
                      Affected Franchises:
                    </p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {supervisorConfirmation.franchises.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSupervisorConfirmation(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => supervisorConfirmation.onConfirm()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Proceed & Assign
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
