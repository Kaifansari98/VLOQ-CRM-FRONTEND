"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Mail,
  Phone,
  User,
  Building,
  MapPin,
  MessageSquare,
  ImagePlus,
  Package,
  Pencil,
  Trash2,
  Plus,
  Magnet,
  Search,
  Check,
  ChevronDown,
  X,
  ExternalLink,
  FileText,
} from "lucide-react";
import { formatDateTime } from "../utils/privileges";
import RequirementDocUpload from "./RequirementDocUpload";
import {
  useLeadById,
  useLeadProductStructureInstances,
  useUploadMoreSitePhotos,
} from "@/hooks/useLeadsQueries";
import { useLeadBillingInformation } from "@/hooks/booking-stage/use-booking";
import { useAppSelector } from "@/redux/store";
import {
  createLeadProductStructureInstance,
  deleteLeadProductStructureInstance,
  updateLeadProductStructureInstance,
  updateRequirementMetaApi,
  useDeleteDocument,
} from "@/api/leads";
import { AddMaterialQuantityModal } from "./AddMaterialQuantityModal";
import {
  fetchLeadRequirementMaterialsApi,
  deleteLeadRequirementMaterialApi,
} from "@/api/leadRequirementMaterial";

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
import { useMemo, useRef, useState, useEffect } from "react";
import { ImageComponent } from "../utils/ImageCard";
import DocumentCard from "../utils/documentCard";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { Input } from "@/components/ui/input";
import TextAreaInput from "@/components/origin-text-area";
import AssignToPicker from "@/components/assign-to-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import {
  useProductItemCodes,
  useProductStructureTypes,
  useProductTypes,
  useB2BRequirementTypes,
  useProcessBriefs,
} from "@/hooks/useTypesMaster";
import { updateLeadProductType, clearLeadProductStructures } from "@/api/leads";
import { saveLeadProcessBriefsApi, fetchLeadProcessBriefsApi } from "@/api/typesMasterApi";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useFranchisesByVendorId } from "@/api/franchise";
import type { LeadBillingAddress } from "@/api/booking";
import Link from "next/link";

type OpenLeadDetailsProps = {
  leadId: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

// ✅ COMPONENT KE BAHAR — FILE LEVEL PE
const SectionCard = ({ title, children, action }: any) => (
  <motion.section
    variants={itemVariants}
    className="bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft p-4 sm:p-6 space-y-4 sm:space-y-6"
  >
    <div className="flex items-center justify-between gap-4">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
    {children}
  </motion.section>
);

const InfoRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-sm text-subtle dark:text-neutral-400">
      {Icon && <Icon className="w-4 h-4 stroke-[1.5]" />}
      {label}
    </div>
    <div className="text-[15px] font-medium text-heading dark:text-neutral-200 pl-6">
      {value || "—"}
    </div>
  </div>
);

const hasAddressData = (address?: LeadBillingAddress | null) =>
  Boolean(
    address?.name ||
      address?.address ||
      address?.map_link ||
      address?.gst_number ||
      address?.state_name ||
      address?.place_of_supply,
  );

const BillingAddressView = ({
  title,
  address,
}: {
  title: string;
  address?: LeadBillingAddress | null;
}) => (
  <div className="space-y-4 rounded-2xl border p-4">
    <h3 className="text-base font-semibold">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InfoRow icon={User} label="Name" value={address?.name} />
      <InfoRow
        icon={MapPin}
        label="Map Link"
        value={
          address?.map_link ? (
            <a
              href={address.map_link}
              target="_blank"
              rel="noreferrer"
              className="underline hover:opacity-80"
            >
              View on Google Maps →
            </a>
          ) : (
            "No map link provided"
          )
        }
      />
      <InfoRow icon={Building} label="GST Number" value={address?.gst_number} />
      <InfoRow icon={Building} label="State Name" value={address?.state_name} />
      <InfoRow
        icon={Package}
        label="Place of Supply"
        value={address?.place_of_supply}
      />
    </div>
    <div>
      <div className="flex items-center gap-2 text-sm text-subtle dark:text-neutral-400">
        <MapPin className="w-4 h-4 stroke-[1.5]" />
        Address
      </div>
      <div className="text-[15px] font-medium text-heading dark:text-neutral-200 pl-6">
        {address?.address || "—"}
      </div>
    </div>
  </div>
);

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

const isImageDocument = (fileName?: string | null) => {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  return !!ext && IMAGE_EXTENSIONS.includes(ext);
};

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

export default function OpenLeadDetails({ leadId }: OpenLeadDetailsProps) {
  // ✅ 1. REDUX STATE
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isCustomDocNomenclatureEnabled = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_custom_doc_nomenclature_enabled === true,
  );
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  // ✅ 2. QUERY HOOKS
  const { data, isLoading, isPlaceholderData } = useLeadById(
    leadId,
    vendorId!,
    userId!,
  );
  const { data: structureInstancesData, isLoading: isStructuresLoading } =
    useLeadProductStructureInstances(leadId, vendorId);
  const { data: billingInformation } = useLeadBillingInformation(
    vendorId,
    handlesLargeScaleProjects ? leadId : undefined,
  );
  const { data: productItemCodesData, isLoading: isProductItemCodesLoading } =
    useProductItemCodes();
  const { data: productStructureTypes } = useProductStructureTypes();
  const { data: productTypes } = useProductTypes();
  const { data: b2bReqTypesData } = useB2BRequirementTypes(vendorId);
  const { data: processBriefsData } = useProcessBriefs();
  const processBriefs = useMemo(() => processBriefsData?.data || [], [processBriefsData]);

  const { data: reqMaterialsData, refetch: refetchReqMaterials } = useQuery({
    queryKey: ["lead-requirement-materials", leadId, vendorId],
    queryFn: () => fetchLeadRequirementMaterialsApi(leadId, vendorId!),
    enabled: !!leadId && !!vendorId,
  });
  const reqMaterials = useMemo(() => reqMaterialsData?.data || [], [reqMaterialsData]);
  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );

  // ✅ 3. ALL useState HOOKS
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [confirmStructureDelete, setConfirmStructureDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [editStructure, setEditStructure] = useState<{
    id: number;
    title: string;
    description: string;
    product_structure_id: number;
    product_type_id: number;
  } | null>(null);
  const [addStructure, setAddStructure] = useState<{
    title: string;
    description: string;
    product_structure_id: number;
    product_type_id: number;
  } | null>(null);
  const [editTitleError, setEditTitleError] = useState("");
  const [editStructureError, setEditStructureError] = useState("");
  const [editProductTypeOpen, setEditProductTypeOpen] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<
    number | null
  >(null);
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<number[]>([]);
  const [reqBudgets, setReqBudgets] = useState<Record<number, string>>({});
  const [reqStatuses, setReqStatuses] = useState<Record<number, string>>({});
  const [openGlobalStatusDropdown, setOpenGlobalStatusDropdown] = useState(false);
  const [selectedProcessBriefIds, setSelectedProcessBriefIds] = useState<Record<number, number[]>>({});
  const [briefModalTypeId, setBriefModalTypeId] = useState<number | null>(null);
  const [materialModalTypeId, setMaterialModalTypeId] = useState<number | null>(null);
  const [editingMaterialItem, setEditingMaterialItem] = useState<any | null>(null);
  const [briefSearchQuery, setBriefSearchQuery] = useState("");
  const [savingProcessBriefs, setSavingProcessBriefs] = useState(false);
  const [confirmProductTypeSave, setConfirmProductTypeSave] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [boqModalOpen, setBoqModalOpen] = useState(false);
  const [boqSearch, setBoqSearch] = useState("");
  const [boqDisplaySearch, setBoqDisplaySearch] = useState("");
  const [isAddingBoqItems, setIsAddingBoqItems] = useState(false);
  const [editingBoqItemId, setEditingBoqItemId] = useState<number | null>(null);
  const [editingBoqQty, setEditingBoqQty] = useState<string>("");
  const [boqPage, setBoqPage] = useState(1);
  const boqPageSize = 9;
  const [boqPreview, setBoqPreview] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [selectedBoqItems, setSelectedBoqItems] = useState<
    Record<number, { quantity: string; order: number }>
  >({});
  const boqSelectionOrderRef = useRef(0);

  // ✅ 4. useQueryClient
  const queryClient = useQueryClient();

  // ✅ 5. ALL useMutation HOOKS
  const { mutate: deleteDocument, isPending: deleting } = useDeleteDocument();
  const { mutate: deleteStructureInstance, isPending: deletingStructure } =
    useMutation({
      mutationFn: ({
        vendorId,
        leadId,
        instanceId,
      }: {
        vendorId: number;
        leadId: number;
        instanceId: number;
      }) => deleteLeadProductStructureInstance(vendorId, leadId, instanceId),
      onSuccess: () => {
        toastManager.add({
          title: "Product structure instance deleted.",
          type: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        });
        setConfirmStructureDelete(null);
      },
      onError: (error: any) => {
        toastManager.add({
          title: error?.response?.data?.message || "Failed to delete instance.",
          type: "error",
        });
      },
    });
  const { mutate: createStructureInstance, isPending: creatingStructure } =
    useMutation({
      mutationFn: ({
        vendorId,
        leadId,
        payload,
      }: {
        vendorId: number;
        leadId: number;
        payload: {
          product_structure_id: number;
          title: string;
          description?: string;
          created_by: number;
        };
      }) => createLeadProductStructureInstance(vendorId, leadId, payload),
      onSuccess: () => {
        toastManager.add({
          title: "Product structure instance added.",
          type: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        });
        setAddStructure(null);
      },
      onError: (error: any) => {
        toastManager.add({
          title: error?.response?.data?.message || "Failed to add instance.",
          type: "error",
        });
      },
    });
  const { mutate: updateStructureInstance, isPending: updatingStructure } =
    useMutation({
      mutationFn: ({
        vendorId,
        leadId,
        instanceId,
        payload,
      }: {
        vendorId: number;
        leadId: number;
        instanceId: number;
        payload: {
          product_structure_id: number;
          title: string;
          quantity?: number;
          description?: string;
          updated_by?: number;
        };
      }) =>
        updateLeadProductStructureInstance(
          vendorId,
          leadId,
          instanceId,
          payload,
        ),
      onSuccess: () => {
        toastManager.add({
          title: "Product instance updated.",
          type: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        });
        setEditStructure(null);
      },
      onError: (error: any) => {
        toastManager.add({
          title: error?.response?.data?.message || "Failed to update instance.",
          type: "error",
        });
      },
    });
  const { mutate: updateLeadProductTypeMutation, isPending: updatingLeadType } =
    useMutation({
      mutationFn: async (typeIds: number[]) => {
        const primaryTypeId = typeIds[0];
        const nextTypeLabel = (b2bReqTypesData?.data || productTypes?.data)?.find(
          (t: any) => t.id === primaryTypeId,
        )?.type;
        
        return updateLeadProductType(leadId, userId || 0, {
          productTypeIds: typeIds,
          productTypeId: primaryTypeId,
          productType: nextTypeLabel,
        });
      },
      onSuccess: async () => {
        toastManager.add({
          title: "Product type updated successfully.",
          type: "success",
        });
        setEditProductTypeOpen(false);
        await queryClient.invalidateQueries({
          queryKey: ["lead", leadId, vendorId, userId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        });
      },
      onError: (error: any) => {
        toastManager.add({
          title:
            error?.response?.data?.message || "Failed to update product type.",
          type: "error",
        });
      },
    });
  const { mutateAsync: uploadMoreSitePhotos, isPending: uploading } =
    useUploadMoreSitePhotos();

  // ✅ 6. DERIVED VALUES (non-hook)
  const lead = data?.data?.lead;
  const structureInstances = structureInstancesData?.data || [];
  const productItemCodes = productItemCodesData?.data || [];
  const leadDocuments = lead?.documents || [];
  const imageDocuments = leadDocuments.filter((doc: any) =>
    isImageDocument(doc.doc_og_name || doc.originalName),
  );
  const fileDocuments = leadDocuments.filter(
    (doc: any) => !isImageDocument(doc.doc_og_name || doc.originalName),
  );
  const leadStage = lead?.statusType?.type;
  const isOpenStage = leadStage?.toLowerCase() === "open";
  const isBookingStage = leadStage?.toLowerCase() === "booking-stage";
  const isDesignStage = leadStage?.toLowerCase().includes("design");
  const leadStatusTag = lead?.statusType?.tag;
  const {
    isLeadBlocked,
    blockedTooltip,
    shouldDisableBlockedActions,
  } = useLeadAccessControl({
    leadId,
    userType,
    lead,
  });


  const normalizedUserType = (userType || "").toLowerCase();
  const isAuditor = normalizedUserType === "auditor";
  const canEditLeadDetailsForCustomUser = customPrivilegeCodes.includes(
    "leads.open_leads.details_of_lead.edit",
  );

  // Lead stage tags look like "Type 1", "Type 4", "Type 17" — extract the
  // ordinal so we can gate editing to a max stage per role instead of a
  // single boolean "open" check.
  const leadStageTypeNumber = (() => {
    const match = String(leadStatusTag || "").match(/(\d+)/);
    return match ? Number(match[1]) : null;
  })();
  const isWithinStageRange = (maxType: number) =>
    leadStageTypeNumber !== null &&
    leadStageTypeNumber >= 1 &&
    leadStageTypeNumber <= maxType;

  const canEditAtCurrentStage =
    normalizedUserType === "admin" || normalizedUserType === "super-admin"
      ? isWithinStageRange(17)
      : normalizedUserType === "sales-executive"
        ? isWithinStageRange(4)
        : isOpenStage;

  const canEditStructures =
    !isAuditor &&
    (normalizedUserType === "custom"
      ? canEditLeadDetailsForCustomUser
      : canEditAtCurrentStage);
  const canEditProductType =
    !isAuditor &&
    (normalizedUserType === "custom"
      ? canEditLeadDetailsForCustomUser
      : ["admin", "super-admin", "sales-executive"].includes(normalizedUserType)
        ? canEditAtCurrentStage
        : false);
  const canEditBoqItems = canEditStructures;
  const currentProductTypeId =
    lead?.productMappings?.[0]?.product_type_id ||
    lead?.productMappings?.[0]?.productType?.id ||
    lead?.productMappings?.[0]?.product_type?.id ||
    null;

  const boqInstances = useMemo(
    () =>
      structureInstances.filter(
        (item: any) =>
          item?.isLargeScaleProjectInstance === true || item?.product_item_code_id,
      ),
    [structureInstances],
  );

  const filteredBoqInstances = useMemo(() => {
    const search = boqDisplaySearch.trim().toLowerCase();
    if (!search) return boqInstances;
    return boqInstances.filter((item: any) => {
      const haystack = [
        item.productItemCode?.item_code,
        item.title,
        item.productType?.type,
        item.productItemCode?.productStructure?.productType?.type,
        item.productStructure?.type,
        item.productItemCode?.productStructure?.type,
        item.subProductStructure?.type,
        item.productItemCode?.subProductStructure?.type,
        item.productItemCode?.description,
        item.description,
        item.productItemCode?.specification,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [boqDisplaySearch, boqInstances]);

  const paginatedBoqInstances = useMemo(() => {
    const startIndex = (boqPage - 1) * boqPageSize;
    return filteredBoqInstances.slice(startIndex, startIndex + boqPageSize);
  }, [filteredBoqInstances, boqPage]);

  useEffect(() => {
    setBoqPage(1);
  }, [boqDisplaySearch]);

  const filteredBoqItemCodes = useMemo(() => {
    const search = boqSearch.trim().toLowerCase();
    if (!search) return productItemCodes;
    return productItemCodes.filter((item: any) => {
      const haystack = [
        item.item_code,
        item.description,
        item.specification,
        item.subProductStructure?.type,
        item.productStructure?.type,
        item.productStructure?.productType?.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [boqSearch, productItemCodes]);

  // ✅ 7. HELPER FUNCTIONS (useMemo se pehle kyunki memos inhe use karte hain)
  const getParentFilter = (productTypeId?: number) => {
    if (!productTypeId) return null;
    const typeLabel =
      productTypes?.data?.find((type: any) => type.id === productTypeId)
        ?.type || "";
    const normalized = String(typeLabel).toLowerCase();
    if (normalized.includes("kitchen")) return "Kitchen";
    if (normalized.includes("wardrobe")) return "Wardrobe";
    return "Others";
  };

  const getStructureOptions = (parentFilter: string | null) => {
    const options =
      productStructureTypes?.data?.map((structure: any) => ({
        id: structure.id,
        label: structure.type,
        parent: structure.parent,
      })) || [];
    if (!parentFilter) return options;
    return options.filter((structure: any) => {
      const parent = String(structure.parent || "").toLowerCase();
      if (parentFilter === "Kitchen") return parent === "kitchen";
      if (parentFilter === "Wardrobe") return parent === "wardrobe";
      return parent !== "kitchen" && parent !== "wardrobe";
    });
  };

  // ✅ 8. ALL useMemo HOOKS
  const structureSummary = useMemo(() => {
    const total = structureInstances.length;
    const uniqueStructures = new Set(
      structureInstances.map((item: any) => item.product_structure_id),
    ).size;
    return { total, uniqueStructures };
  }, [structureInstances]);

  const currentProductTypeLabel = useMemo(() => {
    return (
      lead?.productMappings?.[0]?.productType?.type ||
      lead?.productMappings?.[0]?.product_type?.type ||
      ""
    );
  }, [lead?.productMappings]);

  const isModularKitchenType = useMemo(() => {
    const label = String(currentProductTypeLabel).toLowerCase();
    return label === "modular kitchen" || label === "semi-modular kitchen";
  }, [currentProductTypeLabel]);

  const modularKitchenType = useMemo(
    () =>
      productTypes?.data?.find(
        (type: any) => String(type.type).toLowerCase() === "modular kitchen",
      ),
    [productTypes?.data],
  );

  const semiModularKitchenType = useMemo(
    () =>
      productTypes?.data?.find(
        (type: any) =>
          String(type.type).toLowerCase() === "semi-modular kitchen",
      ),
    [productTypes?.data],
  );

  const editParentFilter = useMemo(
    () => getParentFilter(editStructure?.product_type_id),
    [editStructure?.product_type_id, productTypes?.data],
  );

  const addParentFilter = useMemo(
    () => getParentFilter(addStructure?.product_type_id),
    [addStructure?.product_type_id, productTypes?.data],
  );

  const editStructureOptions = useMemo(
    () => getStructureOptions(editParentFilter),
    [editParentFilter, productStructureTypes?.data],
  );

  const addStructureOptions = useMemo(
    () => getStructureOptions(addParentFilter),
    [addParentFilter, productStructureTypes?.data],
  );

  const b2bProductTypes = useMemo(() => {
    return b2bReqTypesData?.data || [];
  }, [b2bReqTypesData?.data]);

  const filteredBriefsForModal = useMemo(() => {
    if (!briefModalTypeId) return [];
    if (!briefSearchQuery.trim()) return processBriefs;
    return processBriefs.filter((b: any) =>
      String(b.name).toLowerCase().includes(briefSearchQuery.trim().toLowerCase())
    );
  }, [briefModalTypeId, processBriefs, briefSearchQuery]);

  useEffect(() => {
    if (!leadId || !vendorId) return;

    fetchLeadProcessBriefsApi(leadId, vendorId)
      .then((res: any) => {
        if (res?.success && Array.isArray(res?.data)) {
          const mappingObj: Record<number, number[]> = {};
          res.data.forEach((item: any) => {
            const tId = item.product_type_id;
            const bId = item.process_brief_id;
            if (!mappingObj[tId]) mappingObj[tId] = [];
            if (!mappingObj[tId].includes(bId)) mappingObj[tId].push(bId);
          });
          setSelectedProcessBriefIds(mappingObj);
        }
      })
      .catch((err) => {
        console.error("[ERROR] Failed to fetch lead process briefs:", err);
      });
  }, [leadId, vendorId]);

  useEffect(() => {
    if (lead?.productMappings && Array.isArray(lead.productMappings)) {
      const budgetMap: Record<number, string> = {};
      const statusMap: Record<number, string> = {};
      lead.productMappings.forEach((m: any) => {
        const typeId = m.product_type_id || m.productType?.id;
        if (typeId) {
          if (m.approximate_budget != null) {
            budgetMap[typeId] = String(m.approximate_budget);
          }
          if (m.project_status) {
            statusMap[typeId] = m.project_status;
          }
        }
      });
      setReqBudgets((prev) => ({ ...budgetMap, ...prev }));
      setReqStatuses((prev) => ({ ...statusMap, ...prev }));
    }
  }, [lead?.productMappings]);

  const totalApproximateBudget = useMemo(() => {
    return selectedProductTypeIds.reduce((sum, typeId) => {
      const rawVal = reqBudgets[typeId];
      const num = rawVal ? parseFloat(rawVal) : 0;
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [selectedProductTypeIds, reqBudgets]);

  const overallProjectStatus = useMemo(() => {
    const values = Object.values(reqStatuses);
    return values.includes("Order") ? "Order" : "Estimate";
  }, [reqStatuses]);

  const handleSaveProcessBriefs = async () => {
    if (!leadId || !vendorId) return;

    try {
      setSavingProcessBriefs(true);
      const mappingsList: { product_type_id: number; process_brief_id: number }[] = [];

      Object.entries(selectedProcessBriefIds).forEach(([typeIdStr, briefIds]) => {
        const typeId = Number(typeIdStr);
        if (typeId > 0 && Array.isArray(briefIds)) {
          briefIds.forEach((bId) => {
            mappingsList.push({
              product_type_id: typeId,
              process_brief_id: bId,
            });
          });
        }
      });

      await saveLeadProcessBriefsApi({
        lead_id: leadId,
        vendor_id: vendorId,
        mappings: mappingsList,
        created_by: userId || 1,
      });

      toastManager.add({
        title: "Process Briefs saved successfully!",
        type: "success",
      });

      setBriefModalTypeId(null);
    } catch (error: any) {
      console.error("[ERROR] Error saving lead process briefs:", error);
      toastManager.add({
        title: "Failed to save process briefs: " + (error?.message || "Unknown error"),
        type: "error",
      });
    } finally {
      setSavingProcessBriefs(false);
    }
  };

  const isB2b = useMemo(() => {
    const leadFranchise = franchisesForB2b.find(
      (franchise: any) => franchise.id === lead?.franchise_id,
    );
    return leadFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, lead?.franchise_id]);
  const shouldShowBillingInformationCard = useMemo(
    () =>
      handlesLargeScaleProjects &&
      (hasAddressData(billingInformation?.billingAddress) ||
        hasAddressData(billingInformation?.shippingAddress)),
    [
      billingInformation?.billingAddress,
      billingInformation?.shippingAddress,
      handlesLargeScaleProjects,
    ],
  );

  // ✅ 9. EARLY RETURNS — SARE HOOKS KE BAAD
  if (isLoading && !lead) {
    return <div>Loading...</div>;
  }

  if (!lead) {
    return (
      <div className="border rounded-lg p-6">
        <p>No lead details found.</p>
      </div>
    );
  }

  // ✅ 10. REGULAR VARIABLES
  console.log("Data", lead);
  console.log("Lead Stage In Lead Details: ", leadStage);

  const canUploadSitePhotos =
    !isAuditor &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.add_current_site_photos",
      )
      : userType === "admin" ||
      userType === "super-admin" ||
      (userType === "sales-executive" && leadStage === "open"));

  // ✅ 11. EVENT HANDLERS
  const toggleRequirementType = (id: number) => {
    if (isB2b) {
      setSelectedProductTypeIds((prev) => {
        const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
        if (next.length > 0 && (!selectedProductTypeId || !next.includes(selectedProductTypeId))) {
          setSelectedProductTypeId(next[0]);
        }
        return next;
      });
    } else {
      setSelectedProductTypeIds([id]);
      setSelectedProductTypeId(id);
    }
  };

  const toggleProcessBrief = (typeId: number, briefId: number) => {
    setSelectedProcessBriefIds((prev) => {
      const current = prev[typeId] || [];
      const next = current.includes(briefId)
        ? current.filter((b) => b !== briefId)
        : [...current, briefId];
      return { ...prev, [typeId]: next };
    });
  };

  const handleSaveRequirementMeta = async (productTypeId: number, overrideBudget?: string, overrideStatus?: string) => {
    if (!leadId || !vendorId) return;
    try {
      const bVal = overrideBudget !== undefined ? overrideBudget : reqBudgets[productTypeId];
      const sVal = overrideStatus !== undefined ? overrideStatus : reqStatuses[productTypeId];

      await updateRequirementMetaApi({
        lead_id: leadId,
        vendor_id: vendorId,
        product_type_id: productTypeId,
        approximate_budget: bVal ? Number(bVal) : null,
        project_status: sVal || null,
      });

      queryClient.invalidateQueries({ queryKey: ["lead", leadId, vendorId, userId] });
    } catch (err: any) {
      console.error("Failed to update requirement metadata", err);
    }
  };

  const handleSaveGlobalProjectStatus = async (newStatus: string) => {
    selectedProductTypeIds.forEach((typeId) => {
      handleSaveRequirementMeta(typeId, undefined, newStatus);
    });
    setReqStatuses((prev) => {
      const next = { ...prev };
      selectedProductTypeIds.forEach((id) => {
        next[id] = newStatus;
      });
      return next;
    });
  };

  const handleOpenProductTypeEdit = () => {
    const currentIds = lead?.productMappings
      ?.map((pm: any) => pm.product_type_id || pm.productType?.id)
      ?.filter(Boolean) || (currentProductTypeId ? [currentProductTypeId] : []);
    setSelectedProductTypeIds(currentIds);
    setSelectedProductTypeId(currentIds[0] || currentProductTypeId);
    setEditProductTypeOpen(true);
  };

  const handleSaveProductType = () => {
    if (selectedProductTypeIds.length === 0 && !selectedProductTypeId) {
      toastManager.add({
        title: "Please select at least one requirement type.",
        type: "error",
      });
      return;
    }
    setConfirmProductTypeSave(true);
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      await deleteLeadRequirementMaterialApi(id, vendorId!);
      toastManager.add({
        title: "Material deleted successfully",
        type: "success",
      });
      refetchReqMaterials();
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to delete material",
        type: "error",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      setConfirmDelete(null);
    }
  };

  const handleConfirmStructureDelete = () => {
    if (!confirmStructureDelete || !vendorId) return;
    deleteStructureInstance({
      vendorId,
      leadId,
      instanceId: confirmStructureDelete.id,
    });
  };

  const handleToggleBoqItem = (itemId: number, nextChecked: boolean) => {
    setSelectedBoqItems((prev) => {
      if (!nextChecked) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }

      return {
        ...prev,
        [itemId]: prev[itemId] || {
          quantity: "1",
          order: ++boqSelectionOrderRef.current,
        },
      };
    });
  };

  const handleBoqQuantityChange = (itemId: number, value: string) => {
    const sanitized = value.replace(/[^\d]/g, "");
    setSelectedBoqItems((prev) => {
      const existing = prev[itemId];
      if (!existing) {
        return {
          ...prev,
          [itemId]: {
            quantity: sanitized,
            order: ++boqSelectionOrderRef.current,
          },
        };
      }

      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: sanitized,
        },
      };
    });
  };

  const handleDeselectAllBoqItems = () => {
    setSelectedBoqItems({});
  };

  const handleAddBoqItems = async () => {
    if (!vendorId || !userId) return;

    const selectedEntries = Object.entries(selectedBoqItems)
      .map(([itemId, meta]) => ({
        itemId: Number(itemId),
        quantity: Number(meta.quantity),
        order: meta.order,
      }))
      .filter((item) => item.quantity > 0)
      .sort((a, b) => a.order - b.order);

    if (selectedEntries.length === 0) {
      toastManager.add({
        title: "Select at least one BOQ item with quantity.",
        type: "error",
      });
      return;
    }

    try {
      setIsAddingBoqItems(true);

      for (const entry of selectedEntries) {
        const item = productItemCodes.find((row: any) => row.id === entry.itemId);
        if (!item) continue;

        await createLeadProductStructureInstance(vendorId, leadId, {
          product_structure_id: item.product_structure_id,
          title: item.item_code,
          description: item.description || undefined,
          created_by: userId,
          sub_product_structure_id: item.sub_product_structure_id || undefined,
          product_item_code_id: item.id,
          quantity: entry.quantity,
          isLargeScaleProjectInstance: true,
        });
      }

      toastManager.add({
        title: "BOQ items added successfully.",
        type: "success",
      });
      setBoqModalOpen(false);
      setBoqSearch("");
      setSelectedBoqItems({});
      await queryClient.invalidateQueries({
        queryKey: ["lead-product-structure-instances", leadId, vendorId],
      });
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to add BOQ items.",
        type: "error",
      });
    } finally {
      setIsAddingBoqItems(false);
    }
  };

  const handleSaveBoqQuantity = (item: any) => {
    if (!vendorId || Number.isNaN(Number(editingBoqQty)) || Number(editingBoqQty) <= 0) return;
    updateStructureInstance(
      {
        vendorId,
        leadId,
        instanceId: item.id,
        payload: {
          product_structure_id: item.product_structure_id,
          title: item.title,
          quantity: Number(editingBoqQty),
          updated_by: userId,
        },
      },
      {
        onSuccess: () => {
          setEditingBoqItemId(null);
        },
      },
    );
  };

  const handleEditOpen = (item: any) => {
    setEditTitleError("");
    setEditStructureError("");
    setEditStructure({
      id: item.id,
      title: item.title || item.productStructure?.type || "",
      description: item.description || "",
      product_structure_id: item.product_structure_id,
      product_type_id: item.product_type_id,
    });
  };

  const handleEditStructureChange = (selectedId: number) => {
    const selectedStructure = productStructureTypes?.data?.find(
      (type: any) => type.id === selectedId,
    );
    setEditStructure((prev) =>
      prev
        ? {
          ...prev,
          product_structure_id: selectedId,
          title: selectedStructure?.type?.trim() || prev.title || "",
        }
        : prev,
    );
    if (editStructureError) setEditStructureError("");
  };

  const handleEditSave = () => {
    if (!editStructure || !vendorId) return;
    if (!editStructure.title.trim()) {
      setEditTitleError("Title is required.");
      return;
    }
    if (!editStructure.product_structure_id) {
      setEditStructureError("Please select a structure.");
      return;
    }
    updateStructureInstance({
      vendorId,
      leadId,
      instanceId: editStructure.id,
      payload: {
        product_structure_id: editStructure.product_structure_id,
        title: editStructure.title.trim(),
        description: editStructure.description.trim() || undefined,
        updated_by: userId,
      },
    });
  };

  const handleAddOpen = () => {
    const productTypeId = lead?.productMappings?.[0]?.product_type_id || 0;
    setEditTitleError("");
    setEditStructureError("");
    setAddStructure({
      title: "",
      description: "",
      product_structure_id: 0,
      product_type_id: productTypeId,
    });
  };

  const handleAddSave = () => {
    if (!addStructure || !vendorId || !userId) return;
    if (!addStructure.title.trim()) {
      setEditTitleError("Title is required.");
      return;
    }
    if (!addStructure.product_structure_id) {
      setEditStructureError("Please select a structure.");
      return;
    }
    createStructureInstance({
      vendorId,
      leadId,
      payload: {
        product_structure_id: addStructure.product_structure_id,
        title: addStructure.title.trim(),
        description: addStructure.description.trim() || undefined,
        created_by: userId,
      },
    });
  };

  const handleUploadFilesChange = (files: File[]) => {
    if (files.length > 10) {
      toastManager.add({
        title: "You can upload up to 10 site photos.",
        type: "error",
      });
      setUploadFiles(files.slice(0, 10));
      return;
    }
    setUploadFiles(files);
  };

  const handleUploadMoreSitePhotos = async () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Vendor or user information is missing.",
        type: "error",
      });
      return;
    }
    if (uploadFiles.length === 0) {
      toastManager.add({
        title: "Please select at least one photo to upload.",
        type: "error",
      });
      return;
    }
    try {
      const preparedFiles = isCustomDocNomenclatureEnabled
        ? renameLeadSitePhotoFiles({
          files: uploadFiles,
          clientName: `${lead?.firstname || ""} ${lead?.lastname || ""}`.trim(),
          targetLabel: currentProductTypeLabel || "Furniture Type",
          uploadDate: formatFileDate(new Date()),
        })
        : uploadFiles;

      await uploadMoreSitePhotos({
        vendorId,
        leadId,
        createdBy: userId,
        files: preparedFiles,
      });

      toastManager.add({
       
        title: "Site photos uploaded successfully",
       
        type: "success",
     
      });

    } catch (error: any) {

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload site photos";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  // ✅ 12. SUB-COMPONENTS

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="
    rounded-lg 
    w-full h-full   
    bg-[#fff] dark:bg-[#0a0a0a]
  "
      >
        {/* Header */}
        <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between  ">
            <div>
              <h2 className="text-lg font-semibold ">Lead Details</h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                All the Lead Related Details Which has been filled during
                onboard.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">Created At</div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <Calendar className="w-4 h-4" />
                {formatDateTime(lead.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="py-4 space-y-4">
          {/* SELECT PROCESS BRIEFS MODAL */}
          <BaseModal
            open={!!briefModalTypeId}
            onOpenChange={(open) => {
              if (!open) {
                setBriefModalTypeId(null);
                setBriefSearchQuery("");
              }
            }}
            title={`Select Process Briefs - ${
              productTypes?.data?.find((t: any) => t.id === briefModalTypeId)?.type || ""
            }`}
            description="Select process briefs for this requirement type."
            size="md"
          >
            <div className="space-y-4 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={briefSearchQuery}
                  onChange={(e) => setBriefSearchQuery(e.target.value)}
                  placeholder="Search briefs..."
                  className="pl-9 text-xs"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredBriefsForModal.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
                    No process briefs available for this type.
                  </p>
                ) : (
                  filteredBriefsForModal.map((brief: any) => {
                    const selectedList = selectedProcessBriefIds[briefModalTypeId!] || [];
                    const isChecked = selectedList.includes(brief.id);
                    return (
                      <div
                        key={brief.id}
                        onClick={() => toggleProcessBrief(briefModalTypeId!, brief.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-muted/30 border-emerald-600/40 font-medium"
                            : "bg-background border-border/60 hover:bg-muted/20"
                        }`}
                      >
                        <Checkbox checked={isChecked} className="h-4 w-4 pointer-events-none" />
                        <span className="text-xs text-foreground">{brief.name}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBriefModalTypeId(null)}
                  disabled={savingProcessBriefs}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveProcessBriefs}
                  disabled={savingProcessBriefs}
                >
                  {savingProcessBriefs ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </BaseModal>

          {/* PRODUCT INFORMATION (B2C Leads) */}
          {!handlesLargeScaleProjects && !isB2b && (
            <SectionCard
              title="Product Information"
              action={
                canEditStructures && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-auto">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-auto">
                              <Button
                                onClick={() => {
                                  if (shouldDisableBlockedActions) return;
                                  handleAddOpen();
                                }}
                                className={
                                  shouldDisableBlockedActions
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Add Furniture Structure</span>
                              </Button>
                            </div>
                          </TooltipTrigger>

                          {shouldDisableBlockedActions && (
                            <TooltipContent>
                              <p>{blockedTooltip}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    </TooltipTrigger>

                    {shouldDisableBlockedActions && (
                      <TooltipContent>
                        {blockedTooltip}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              }
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center w-full justify-between gap-3 items-start">
                  <InfoRow
                    icon={Package}
                    label={
                      <span className="inline-flex items-center gap-2">
                        <span>Product Types</span>
                        {canEditProductType && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  if (shouldDisableBlockedActions) return;

                                  handleOpenProductTypeEdit();
                                }}
                                className="
                                  text-muted-foreground/70
                                  hover:text-foreground
                                  inline-flex size-7 items-center justify-center
                                  rounded-md
                                  transition
                                  disabled:pointer-events-none
                                "
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>

                            {shouldDisableBlockedActions && (
                              <TooltipContent>
                                {blockedTooltip}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )}
                      </span>
                    }
                    value={lead.productMappings
                      ?.map((pm: any) => pm.productType?.type)
                      ?.filter(Boolean)
                      ?.join(", ")}
                  />
                  {(structureSummary.total > 0 ||
                    structureSummary.uniqueStructures > 0) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {structureSummary.total > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-current opacity-60"></span>
                            {structureSummary.total} Instance
                            {structureSummary.total === 1 ? "" : "s"}
                          </span>
                        )}
                        {structureSummary.uniqueStructures > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-current opacity-60"></span>
                            {structureSummary.uniqueStructures} Structure
                            {structureSummary.uniqueStructures === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    )}
                </div>

                {isStructuresLoading ? (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Loading product information...
                  </div>
                ) : structureInstances.length === 0 ? (
                  <InfoRow
                    icon={Package}
                    label="Product Structures"
                    value={lead.leadProductStructureMapping
                      ?.map((ps: any) => ps.productStructure?.type)
                      ?.filter(Boolean)
                      ?.join(", ")}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {structureInstances.map((item: any) => (
                      <div
                        key={`${item.product_structure_id}-${item.quantity_index}`}
                        className="group rounded-xl border bg-white/60 p-5 transition-all hover:border-border/80 dark:bg-[#0a0a0a] min-w-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="flex-1 min-w-0 line-clamp-2 text-base font-semibold leading-tight text-heading transition-colors group-hover:text-foreground dark:text-neutral-200 text-wrap break-words">
                                {item.title || item.productStructure?.type || "—"}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {canEditStructures && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className="text-muted-foreground/70 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                                          onClick={() => {
                                            if (shouldDisableBlockedActions) return;

                                            handleEditOpen(item);
                                          }}
                                          aria-label="Edit"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>

                                      {shouldDisableBlockedActions && (
                                        <TooltipContent>
                                          {blockedTooltip}
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                    {structureInstances.length > 1 && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (shouldDisableBlockedActions) return;

                                              setConfirmStructureDelete({
                                                id: item.id,
                                                title:
                                                  item.title ||
                                                  item.productStructure?.type ||
                                                  "this item",
                                              });
                                            }}
                                            className="
                                              text-muted-foreground/70
                                              hover:text-destructive
                                              inline-flex size-7 items-center justify-center
                                              rounded-md
                                            "
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </TooltipTrigger>

                                        {shouldDisableBlockedActions && (
                                          <TooltipContent>
                                            {blockedTooltip}
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                              {item.productStructure?.type || "—"}
                            </p>
                          </div>
                        </div>

                        {item.description && (
                          <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground transition-colors group-hover:bg-muted/40">
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* REQUIREMENT TYPES EDIT MODAL */}
          {!handlesLargeScaleProjects && isB2b && (
            <SectionCard
              title="Requirement Details"
              action={
                canEditProductType && (
                  <Button
                    onClick={() => {
                      if (shouldDisableBlockedActions) return;
                      handleOpenProductTypeEdit();
                    }}
                    className="bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    <span>Add Requirement Type</span>
                  </Button>
                )
              }
            >
              <div className="space-y-6 p-1">
                <p className="text-xs text-muted-foreground -mt-2">
                  Select requirement types and define process briefs along with materials & quantity.
                </p>

                {/* 1. Select Requirement Types (Multi-select) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold tracking-tight text-foreground">
                      1. Select Requirement Types {isB2b ? "(Multi-select)" : "(Single-select)"}
                    </h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Global Project Status Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-semibold">Project Status:</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenGlobalStatusDropdown((prev) => !prev)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold shadow-2xs hover:bg-muted/40 transition-colors"
                          >
                            <span>{overallProjectStatus}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </button>

                          {openGlobalStatusDropdown && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenGlobalStatusDropdown(false)}
                              />
                              
                              <div className="absolute right-0 mt-1 w-36 p-1 rounded-xl border bg-background text-foreground shadow-lg z-50 space-y-0.5 border-border">
                                {["Estimate", "Order"].map((statusOpt) => {
                                  const isActive = overallProjectStatus === statusOpt;
                                  return (
                                    <button
                                      key={statusOpt}
                                      type="button"
                                      onClick={() => {
                                        handleSaveGlobalProjectStatus(statusOpt);
                                        setOpenGlobalStatusDropdown(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                        isActive
                                          ? "bg-muted text-foreground font-semibold"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                      }`}
                                    >
                                      <span>{statusOpt}</span>
                                      {isActive && <Check className="h-3.5 w-3.5 text-foreground" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {totalApproximateBudget > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted border text-foreground">
                          Total Approx. Budget: ₹{totalApproximateBudget.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {b2bProductTypes
                      .filter((pt: any) => selectedProductTypeIds.includes(pt.id))
                      .map((pt: any) => {
                        const isSelected = selectedProductTypeIds.includes(pt.id);
                        return (
                          <div
                            key={pt.id}
                            className="flex items-center gap-3 px-4 py-2 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-200 text-xs font-semibold select-none"
                          >
                            <span>{pt.type}</span>
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          </div>
                        );
                      })}
                    {b2bProductTypes.filter((pt: any) => selectedProductTypeIds.includes(pt.id)).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No requirement types selected. Click "+ Add Requirement Type" to select.</p>
                    )}
                  </div>
                </div>

                {/* Requirement Types Cards with Process Brief counts & Materials */}
                {selectedProductTypeIds.length > 0 && (
                  <div className="space-y-3 pt-2 border-t">
                    {selectedProductTypeIds.map((typeId) => {
                      const typeObj = b2bReqTypesData?.data?.find((t: any) => t.id === typeId);
                      const selectedBriefs = selectedProcessBriefIds[typeId] || [];
                      const typeMaterials = reqMaterials.filter((m: any) => (m.b2b_requirement_type_id || m.product_type_id) === typeId);

                      return (
                        <div
                          key={typeId}
                          className="p-4 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-all border-border/70 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">{typeObj?.type}</h4>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                  {selectedBriefs.length} Process Brief{selectedBriefs.length === 1 ? "" : "s"}
                                  {selectedBriefs.length > 0 && (
                                    <span className="ml-1 text-foreground font-normal">
                                      ({selectedBriefs.map(bId => processBriefs.find((b: any) => b.id === bId)?.name).filter(Boolean).join(", ")})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBriefModalTypeId(typeId);
                                  setBriefSearchQuery("");
                                }}
                                className="text-xs gap-1.5 bg-background shadow-2xs hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Select Process Briefs
                              </Button>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingMaterialItem(null);
                                        setMaterialModalTypeId(typeId);
                                      }}
                                      disabled={selectedBriefs.length === 0}
                                      className="text-xs gap-1.5 bg-background shadow-2xs hover:bg-muted text-emerald-700 dark:text-emerald-400 border-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Add Material & Quantity
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {selectedBriefs.length === 0 && (
                                  <TooltipContent side="top">
                                    Please select at least one process brief first
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                          </div>

                          {/* Saved Requirement Materials - Compact Scrollable List */}
                          {typeMaterials.length > 0 && (
                            <div className="pt-2 border-t space-y-1.5">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Materials & Quantity ({typeMaterials.length})
                                </h5>
                              </div>

                              <div className="max-h-44 overflow-y-auto border rounded-lg divide-y bg-background text-xs shadow-2xs">
                                {typeMaterials.map((mat: any) => (
                                  <div
                                    key={mat.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
                                      <span className="font-semibold text-foreground truncate min-w-[120px] max-w-[220px]">
                                        {mat.product?.product_name || "Material"}
                                      </span>
                                      <span className="text-muted-foreground shrink-0 text-[11px]">
                                        Qty: <strong className="text-foreground font-semibold">{mat.quantity}</strong> {mat.unit_name || mat.product?.unit_of_measure || ""}
                                      </span>
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted border shrink-0">
                                        {mat.supplied_by === "Frankvin"
                                          ? "Frankvin (100%)"
                                          : mat.supplied_by === "Client"
                                          ? "Client (100%)"
                                          : `Shared (Client: ${mat.client_percentage}% / Frankvin: ${mat.frankvin_percentage}%)`}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setEditingMaterialItem(mat);
                                          setMaterialModalTypeId(typeId);
                                        }}
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                                        title="Edit Material & Quantity"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteMaterial(mat.id)}
                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                                        title="Delete Material"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Approx. Budget Row */}
                          <div className="pt-2.5 border-t flex flex-wrap items-center justify-end gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-medium">Approx. Budget:</span>
                              <div className="relative flex items-center">
                                <span className="absolute left-2.5 text-xs text-muted-foreground font-semibold">₹</span>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="0"
                                  value={reqBudgets[typeId] ?? ""}
                                  onChange={(e) => setReqBudgets((prev) => ({ ...prev, [typeId]: e.target.value }))}
                                  onBlur={(e) => handleSaveRequirementMeta(typeId, e.target.value)}
                                  className="pl-6 pr-2 py-1 h-8 w-32 text-xs font-semibold shadow-2xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Requirement Document Upload Section (B2B Vendors) */}
                          {isB2b && leadId && vendorId && (
                            <RequirementDocUpload
                              leadId={leadId}
                              vendorId={vendorId}
                              productTypeId={typeId}
                              userId={userId}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {handlesLargeScaleProjects && (
            <SectionCard
              title="Bill of Quantity"
              action={
                <div className="flex items-center gap-2">
                  {userType === "super-admin" && (
                    <Link
                      href="/dashboard/masters-management/boq-items-master"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Create BOQ Items
                    </Link>
                  )}
                  {canEditBoqItems && boqInstances.length > 0 ? (
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={() => {
                        if (shouldDisableBlockedActions) return;
                        setBoqModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add BOQ Items
                    </Button>
                  ) : null}
                </div>
              }
            >
              {boqInstances.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!canEditBoqItems || shouldDisableBlockedActions) return;
                    setBoqModalOpen(true);
                  }}
                  className={`group flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center transition hover:border-primary/50 hover:bg-muted/30 ${
                    !canEditBoqItems ? "cursor-default" : ""
                  }`}
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border/80 bg-background shadow-sm transition group-hover:scale-105">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">
                      Create BOQ Items
                    </p>
                    <p className="text-sm text-muted-foreground">
                      No BOQ items added yet. Start by selecting item codes and quantities.
                    </p>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={boqDisplaySearch}
                        onChange={(event) => setBoqDisplaySearch(event.target.value)}
                        placeholder="Search BOQ items..."
                        className="pl-10"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {boqInstances.length} BOQ item
                        {boqInstances.length === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {boqInstances.reduce(
                          (sum: number, item: any) => sum + Number(item.quantity || 0),
                          0,
                        )}{" "}
                        total quantity
                      </span>
                    </div>
                  </div>
                  {filteredBoqInstances.length === 0 ? (
                    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center">
                      <div className="max-w-sm space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border/70 bg-background">
                          <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          No items found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try a different item code, category, description, or
                          specification keyword.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {paginatedBoqInstances.map((item: any) => (
                          <div
	                        key={item.id}
	                        className="w-full rounded-xl border bg-background p-4 transition hover:border-border/80 flex flex-col justify-between"
	                      >
	                        <div className="flex flex-col gap-3">
	                          <div className="min-w-0 flex-1 space-y-2">
	                            <div className="flex items-start justify-between gap-3">
	                              <div className="min-w-0 flex-1">
	                                <p className="text-base font-semibold leading-tight text-foreground break-words">
	                                  {item.productItemCode?.item_code || item.title || "—"}
	                                </p>
	                              </div>
	                              {canEditBoqItems && (
	                                <div className="flex shrink-0 items-center gap-1">
	                                  <Tooltip>
	                                    <TooltipTrigger asChild>
	                                      <button
	                                        type="button"
	                                        onClick={() => {
	                                          if (shouldDisableBlockedActions) return;
	 
	                                          setConfirmStructureDelete({
	                                            id: item.id,
	                                            title:
	                                              item.productItemCode?.item_code ||
	                                              item.title ||
	                                              "this BOQ item",
	                                          });
	                                        }}
	                                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:text-destructive"
	                                      >
	                                        <Trash2 className="h-4 w-4" />
	                                      </button>
	                                    </TooltipTrigger>
	                                    {shouldDisableBlockedActions && (
	                                      <TooltipContent>{blockedTooltip}</TooltipContent>
	                                    )}
	                                  </Tooltip>
	                                </div>
	                              )}
	                            </div>
	 
	                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
	                              <span className="font-medium text-muted-foreground">
	                                {item.productType?.type ||
	                                  item.productItemCode?.productStructure?.productType?.type ||
	                                  "—"}
	                              </span>
	                              <span className="text-muted-foreground/50">|</span>
	                              <span className="font-medium text-muted-foreground">
	                                {item.productStructure?.type ||
	                                  item.productItemCode?.productStructure?.type ||
	                                  "—"}
	                              </span>
	                              <span className="text-muted-foreground/50">|</span>
	                              <span className="font-medium text-muted-foreground">
	                                {item.subProductStructure?.type ||
	                                  item.productItemCode?.subProductStructure?.type ||
	                                  "—"}
	                              </span>
	                            </div>
	 
	                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
	                              <div className="flex flex-wrap items-center gap-2">
	                                <Tooltip>
	                                  <TooltipTrigger asChild>
	                                    <Button
	                                      type="button"
	                                      variant="outline"
	                                      className="h-8 rounded-lg px-3 text-xs shadow-none"
	                                      onClick={() =>
	                                        setBoqPreview({
	                                          title: "Description",
	                                          content:
	                                            item.productItemCode?.description ||
	                                            item.description ||
	                                            "No description available.",
	                                        })
	                                      }
	                                    >
	                                      View Desc
	                                    </Button>
	                                  </TooltipTrigger>
	                                  <TooltipContent className="max-w-sm whitespace-pre-wrap text-left">
	                                    {item.productItemCode?.description ||
	                                      item.description ||
	                                      "No description available."}
	                                  </TooltipContent>
	                                </Tooltip>
	                                <Tooltip>
	                                  <TooltipTrigger asChild>
	                                    <Button
	                                      type="button"
	                                      variant="outline"
	                                      className="h-8 rounded-lg px-3 text-xs shadow-none"
	                                      onClick={() =>
	                                        setBoqPreview({
	                                          title: "Specification",
	                                          content:
	                                            item.productItemCode?.specification ||
	                                            "No specification available.",
	                                        })
	                                      }
	                                    >
	                                      View Specs
	                                    </Button>
	                                  </TooltipTrigger>
	                                  <TooltipContent className="max-w-sm whitespace-pre-wrap text-left">
	                                    {item.productItemCode?.specification ||
	                                      "No specification available."}
	                                  </TooltipContent>
	                                </Tooltip>
	                              </div>
	 
	                              {editingBoqItemId === item.id ? (
	                                <div className="flex items-center gap-1 bg-primary/5 border border-primary/20 rounded-lg p-1">
	                                  <Input
	                                    type="number"
	                                    min="1"
	                                    value={editingBoqQty}
	                                    onChange={(e) => setEditingBoqQty(e.target.value)}
	                                    className="w-16 h-7 text-xs font-semibold px-2 py-1 text-center bg-background border-primary/30"
	                                  />
	                                  <Button
	                                    size="icon"
	                                    variant="ghost"
	                                    className="size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
	                                    onClick={() => handleSaveBoqQuantity(item)}
	                                    disabled={updatingStructure}
	                                  >
	                                    <Check className="size-4" />
	                                  </Button>
	                                  <Button
	                                    size="icon"
	                                    variant="ghost"
	                                    className="size-7 text-red-500 hover:text-red-600 hover:bg-red-50"
	                                    onClick={() => setEditingBoqItemId(null)}
	                                  >
	                                    <X className="size-4" />
	                                  </Button>
	                                </div>
	                              ) : (
	                                <div className="flex items-center gap-1.5">
	                                  <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
	                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
	                                      Qty
	                                    </span>
	                                    <span className="text-sm font-semibold text-foreground">
	                                      {item.quantity ?? "—"}
	                                    </span>
	                                  </div>
	                                  {canEditBoqItems && (
	                                    <Button
	                                      type="button"
	                                      variant="ghost"
	                                      size="icon"
	                                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
	                                      onClick={() => {
	                                        if (shouldDisableBlockedActions) return;
	                                        setEditingBoqItemId(item.id);
	                                        setEditingBoqQty(String(item.quantity || "1"));
	                                      }}
	                                    >
	                                      <Pencil className="h-3.5 w-3.5" />
	                                    </Button>
	                                  )}
	                                </div>
	                              )}
	                            </div>
	                          </div>
	                        </div>
	                      </div>
	                    ))}
	                  </div>
                    {filteredBoqInstances.length > boqPageSize && (
                      <div className="flex items-center justify-between border-t pt-4 mt-2">
                        <div className="text-xs text-muted-foreground">
                          Showing {Math.min(filteredBoqInstances.length, (boqPage - 1) * boqPageSize + 1)} to{" "}
                          {Math.min(filteredBoqInstances.length, boqPage * boqPageSize)} of{" "}
                          {filteredBoqInstances.length} items
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setBoqPage((p) => Math.max(1, p - 1))}
                            disabled={boqPage === 1}
                            className="h-8 text-xs px-3"
                          >
                            Previous
                          </Button>
                          <span className="text-xs font-medium text-muted-foreground px-2">
                            Page {boqPage} of {Math.ceil(filteredBoqInstances.length / boqPageSize)}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setBoqPage((p) =>
                                Math.min(Math.ceil(filteredBoqInstances.length / boqPageSize), p + 1)
                              )
                            }
                            disabled={boqPage >= Math.ceil(filteredBoqInstances.length / boqPageSize)}
                            className="h-8 text-xs px-3"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            </SectionCard>
          )}

          {/* CONTACT INFORMATION */}
          <SectionCard title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                icon={User}
                label="Full Name"
                value={<span className="capitalize">{`${lead.firstname || ""} ${lead.lastname || ""}`.trim()}</span>}
              />
              <InfoRow icon={Mail} label="Email Address" value={lead.email} />
              {/* Phone */}
              <InfoRow
                icon={Phone}
                label="Phone Number"
                value={
                  lead.country_code && lead.contact_no
                    ? `${lead.country_code} ${lead.contact_no}`
                    : lead.contact_no
                }
              />

              {/* Maps link (same row as phone) */}
              <div>
                <div className="flex items-center gap-2 text-sm text-subtle mb-1">
                  <MapPin className="w-4 h-4 stroke-[1.5]" />
                  Site Google Maps Link
                </div>

                {lead?.site_map_link ? (
                  <a
                    href={lead.site_map_link}
                    target="_blank"
                    className="
          pl-6 underline
          font-medium text-heading dark:text-neutral-200
          hover:opacity-80
        "
                  >
                    View on Google Maps →
                  </a>
                ) : (
                  <p className="pl-6 text-subtle">No map link provided</p>
                )}
              </div>

              {isB2b && (
                <>
                  <InfoRow icon={Magnet} label="Source" value={lead.source?.type} />
                  <InfoRow
                    icon={Package}
                    label="Order Number"
                    value={lead.order_number}
                  />
                </>
              )}
            </div>

            {/* Site Address below full width */}
            <div className="md:col-span-2">
              <InfoRow
                icon={MapPin}
                label="Site Address"
                value={lead.site_address || "No address provided"}
              />
            </div>
          </SectionCard>

          {/* PROJECT DETAILS */}
          {!isB2b && (
            <SectionCard title="Project Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow
                  icon={User}
                  label="Architect Name"
                  value={<span className="capitalize">{lead.archetech_name}</span>}
                />
                {lead.archetech_number && (
                  <InfoRow
                    icon={Phone}
                    label="Architect Number"
                    value={lead.archetech_number}
                  />
                )}
                <InfoRow
                  icon={Building}
                  label="Site Type"
                  value={lead.siteType?.type}
                />
                <InfoRow icon={Magnet} label="Source" value={lead.source?.type} />
                <InfoRow icon={Package} label="Priority" value={lead.priority} />
              </div>
            </SectionCard>
          )}

          {shouldShowBillingInformationCard && (
            <SectionCard title="Billing Information">
              <div className="grid gap-6 lg:grid-cols-2">
                {hasAddressData(billingInformation?.billingAddress) && (
                  <BillingAddressView
                    title="Bill To"
                    address={billingInformation?.billingAddress}
                  />
                )}
                {hasAddressData(billingInformation?.shippingAddress) && (
                  <BillingAddressView
                    title="Ship To"
                    address={billingInformation?.shippingAddress}
                  />
                )}
              </div>
            </SectionCard>
          )}

          {/* ADDITIONAL INFORMATION */}
          {!isB2b && (
            <SectionCard title="Additional Information">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-subtle mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Design Remarks
                  </div>

                  <div
                    className="
    bg-[#fff] dark:bg-[#0a0a0a]
    border border-border
    rounded-xl p-4 ml-6
  "
                  >
                    <p className="text-[15px] leading-relaxed text-heading dark:text-neutral-200">
                      {lead.designer_remark || "No remarks provided"}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Site Photos */}
          {!isB2b && (
          <motion.section
            variants={itemVariants}
            className="
    bg-[#fff] dark:bg-[#0a0a0a] 
    rounded-2xl 
    border border-border 
    shadow-soft 
    overflow-hidden
  "
          >
            {/* Header */}
            <div
              className="
    flex items-center justify-between 
    px-5 py-3 
    border-b border-border
    bg-[#fff] dark:bg-[#0a0a0a]
  "
            >
              <div className="flex flex-col items-start">
                <h1 className="text-lg font-semibold tracking-tight">
                  Current Site Photos
                </h1>
                <p className="text-xs text-gray-500 ">
                  All the Lead Related Documents Which has been submitted during
                  onboard.
                </p>
              </div>
              {/* 
                <Button
                  variant="outline"
                  size="sm"
                  className="
    rounded-lg 
    border-border 
    hover:bg-mutedBg dark:hover:bg-neutral-800 
    dark:border-neutral-700
    transition
  "
                >
                  <RefreshCcw size={15} />
                  Refresh
                </Button> */}
            </div>

            {/* Body */}
            <motion.div variants={itemVariants} className="p-6">
              {leadDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {imageDocuments.map((doc: any, index: number) => (
                    <motion.div key={doc.id} variants={itemVariants}>
                      <ImageComponent
                        doc={{
                          id: doc.id,
                          doc_og_name: doc.doc_og_name || doc.originalName,
                          signedUrl: doc.signedUrl,
                          created_at: doc.created_at,
                        }}
                        index={index}
                        canDelete={canUploadSitePhotos}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    </motion.div>
                  ))}
                  {fileDocuments.map((doc: any) => (
                    <motion.div key={doc.id} variants={itemVariants}>
                      <DocumentCard
                        doc={{
                          id: doc.id,
                          originalName: doc.doc_og_name || doc.originalName,
                          signedUrl: doc.signedUrl,
                          created_at: doc.created_at,
                        }}
                        canDelete={canUploadSitePhotos}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    </motion.div>
                  ))}
                  {canUploadSitePhotos && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            if (shouldDisableBlockedActions) return;
                            setUploadOpen(true);
                          }}
                          className={`
          flex flex-col items-center justify-center
          border border-dashed border-border/70
          rounded-xl p-6 text-center
          bg-mutedBg/40 dark:bg-neutral-800/40
          hover:bg-muted/40 dark:hover:bg-neutral-800/60
          transition
          w-full h-full
          ${shouldDisableBlockedActions
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                            }
        `}
                        >
                          <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                          <p className="text-xs font-medium text-muted-foreground">
                            Add more images
                          </p>
                          <p className="text-xs text-subtle">
                            Upload up to 10 photos
                          </p>
                        </button>
                      </TooltipTrigger>

                      {shouldDisableBlockedActions && (
                        <TooltipContent>
                          {blockedTooltip}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}
                </div>
              ) : (
                <div
                  className="
                  flex flex-col items-center justify-center 
                  py-14 px-6 
                  border border-dashed border-border/60 
                  rounded-xl 
                  bg-mutedBg/40 dark:bg-neutral-800/40
                  dark:border-neutral-700/40
                "
                >
                  <svg
                    className="w-12 h-12 text-muted-foreground dark:text-neutral-500 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>

                  <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                    No site photos uploaded
                  </p>

                  <p className="text-xs text-subtle dark:text-neutral-500 mt-1 tracking-tight">
                    Photos will appear here once uploaded
                  </p>
                  {canUploadSitePhotos && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            if (shouldDisableBlockedActions) return;
                            setUploadOpen(true);
                          }}
                          className={`
          mt-4 inline-flex items-center gap-2
          rounded-lg border border-border px-3 py-2
          text-xs font-medium text-muted-foreground
          hover:bg-mutedBg/60 dark:hover:bg-neutral-800/60
          transition
          ${shouldDisableBlockedActions
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                            }
        `}
                        >
                          <ImagePlus className="w-4 h-4" />
                          Add more images
                        </button>
                      </TooltipTrigger>

                      {shouldDisableBlockedActions && (
                        <TooltipContent>
                          {blockedTooltip}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}
                </div>
              )}
            </motion.div>
          </motion.section>
          )}

          <Dialog
            open={boqModalOpen}
            onOpenChange={(open) => {
              setBoqModalOpen(open);
              if (!open) {
                setBoqSearch("");
                setSelectedBoqItems({});
                setBoqPreview(null);
              }
            }}
          >
            <DialogContent className="min-w-6xl gap-0 overflow-hidden p-0 shadow-none">
              <DialogHeader className="border-b bg-linear-to-b from-muted/50 to-transparent px-6 py-5">
                <div className="flex items-start justify-between gap-4 pr-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">Add BOQ Items</DialogTitle>
                      <DialogDescription className="mt-1">
                        Search item codes, select multiple rows, set quantities,
                        and add them to this lead.
                      </DialogDescription>
                    </div>
                  </div>
                  {Object.keys(selectedBoqItems).length > 0 && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {Object.keys(selectedBoqItems).length} selected
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 px-6 py-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={boqSearch}
                    onChange={(event) => setBoqSearch(event.target.value)}
                    placeholder="Search by item code, description, specification, or category..."
                    className="rounded-xl pl-10"
                  />
                </div>

                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                  {isProductItemCodesLoading ? (
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
                      <Package className="h-6 w-6 animate-pulse text-muted-foreground/60" />
                      Loading BOQ items...
                    </div>
                  ) : filteredBoqItemCodes.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
                      <Search className="h-6 w-6 text-muted-foreground/60" />
                      No BOQ item codes found.
                    </div>
                  ) : (
                    filteredBoqItemCodes.map((item: any) => {
                      const selected = selectedBoqItems[item.id];

                      return (
                        <div
                          key={item.id}
                          className={`w-full rounded-xl border bg-background p-4 transition-all ${
                            selected
                              ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                              : "hover:border-border/80"
                          }`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={!!selected}
                                  onCheckedChange={(checked) =>
                                    handleToggleBoqItem(item.id, checked === true)
                                  }
                                  className="mt-1"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-base font-semibold leading-tight text-foreground break-words">
                                      {item.item_code}
                                    </p>
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="font-medium text-muted-foreground">
                                      {item.productStructure?.productType?.type || "None"}
                                    </span>
                                    <span className="text-muted-foreground/50">|</span>
                                    <span className="font-medium text-muted-foreground">
                                      {item.productStructure?.type || "None"}
                                    </span>
                                    <span className="text-muted-foreground/50">|</span>
                                    <span className="font-medium text-muted-foreground">
                                      {item.subProductStructure?.type || "None"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
                              <div className="flex flex-wrap items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-8 rounded-lg px-3 text-xs shadow-none"
                                      onClick={() =>
                                        setBoqPreview({
                                          title: "Description",
                                          content: item.description || "No description available.",
                                        })
                                      }
                                    >
                                      View Desc
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm whitespace-pre-wrap text-left">
                                    {item.description || "No description available."}
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-8 rounded-lg px-3 text-xs shadow-none"
                                      onClick={() =>
                                        setBoqPreview({
                                          title: "Specification",
                                          content:
                                            item.specification || "No specification available.",
                                        })
                                      }
                                    >
                                      View Specs
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm whitespace-pre-wrap text-left">
                                    {item.specification || "No specification available."}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  Qty
                                </span>
                                <div className="w-[68px]">
                                  <Input
                                    value={selected?.quantity || ""}
                                    onChange={(event) =>
                                      handleBoqQuantityChange(item.id, event.target.value)
                                    }
                                    placeholder="0"
                                    inputMode="numeric"
                                    disabled={!selected}
                                    className="h-8 rounded-lg text-xs disabled:opacity-50 shadow-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {Object.keys(selectedBoqItems).length > 0
                    ? `${Object.keys(selectedBoqItems).length} item${
                        Object.keys(selectedBoqItems).length > 1 ? "s" : ""
                      } selected`
                    : "No items selected"}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeselectAllBoqItems}
                    disabled={isAddingBoqItems || Object.keys(selectedBoqItems).length === 0}
                  >
                    Deselect All
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddBoqItems}
                    disabled={isAddingBoqItems || Object.keys(selectedBoqItems).length === 0}
                  >
                    {isAddingBoqItems ? "Adding..." : "Add Items"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!boqPreview}
            onOpenChange={(open) => {
              if (!open) setBoqPreview(null);
            }}
          >
            <DialogContent className="max-w-2xl p-0 shadow-none">
              <DialogHeader className="border-b px-6 py-5">
                <DialogTitle>{boqPreview?.title}</DialogTitle>
                <DialogDescription>
                  Full BOQ item content preview.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-5">
                <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm leading-7 whitespace-pre-wrap text-foreground/90">
                  {boqPreview?.content}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!confirmDelete}
            onOpenChange={() => setConfirmDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The selected document will be
                  permanently removed from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={!!confirmStructureDelete}
            onOpenChange={() => setConfirmStructureDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product Instance?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove{" "}
                  <span className="font-medium text-foreground">
                    {confirmStructureDelete?.title}
                  </span>{" "}
                  from this lead. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletingStructure}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmStructureDelete}
                  disabled={deletingStructure}
                >
                  {deletingStructure ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <BaseModal
            open={editProductTypeOpen}
            onOpenChange={(open) => {
              if (!open) {
                setEditProductTypeOpen(false);
              }
            }}
            title="Requirement Details"
            description="Select requirement types and dependent process briefs."
            size="md"
          >
            <div className="space-y-5 p-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Requirement Types {isB2b ? "(Multi-Select)" : "(Single-Select)"} <span className="text-red-500">*</span></span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {selectedProductTypeIds.length} selected
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-muted/10">
                  {b2bProductTypes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-2">No B2B requirement types found.</p>
                  ) : (
                    b2bProductTypes.map((t: any) => {
                      const isSelected = selectedProductTypeIds.includes(t.id);
                      return (
                        <Badge
                          key={t.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer py-1.5 px-3 text-xs flex items-center gap-1.5 transition-all select-none ${
                            isSelected ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                          }`}
                          onClick={() => toggleRequirementType(t.id)}
                        >
                          <Checkbox checked={isSelected} className="h-3.5 w-3.5 pointer-events-none" />
                          <span>{t.type}</span>
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>



              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditProductTypeOpen(false)}
                  disabled={updatingLeadType}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveProductType}
                  disabled={updatingLeadType}
                >
                  {updatingLeadType ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </BaseModal>

          <AlertDialog
            open={confirmProductTypeSave}
            onOpenChange={setConfirmProductTypeSave}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isB2b
                    ? currentProductTypeId
                      ? "Confirm Requirement Type Change?"
                      : "Set Requirement Type?"
                    : currentProductTypeId
                    ? "Confirm Product Type Change?"
                    : "Set Product Type?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isB2b
                    ? currentProductTypeId
                      ? "This will update the requirement type for this lead."
                      : "This will set the requirement type for this lead."
                    : currentProductTypeId
                    ? "This will update the product type for this lead."
                    : "This will set the product type for this lead."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={updatingLeadType}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setConfirmProductTypeSave(false);
                    if (selectedProductTypeIds.length > 0) {
                      updateLeadProductTypeMutation(selectedProductTypeIds);
                    }
                  }}
                  disabled={updatingLeadType}
                >
                  {updatingLeadType ? "Saving..." : "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <BaseModal
            open={!!editStructure}
            onOpenChange={(open) => {
              if (!open) {
                setEditStructure(null);
                setEditTitleError("");
                setEditStructureError("");
              }
            }}
            title="Edit Product Instance"
            description="Update title, structure, and description."
            size="md"
          >
            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editStructure?.title || ""}
                  onChange={(event) => {
                    setEditStructure((prev) =>
                      prev ? { ...prev, title: event.target.value } : prev,
                    );
                    if (editTitleError) setEditTitleError("");
                  }}
                  placeholder="Enter title"
                  className="mt-1"
                />
                {editTitleError && (
                  <p className="mt-1 text-xs text-red-500">{editTitleError}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Product Structure <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <AssignToPicker
                    data={editStructureOptions}
                    value={editStructure?.product_structure_id}
                    onChange={(selectedId) => {
                      if (!selectedId) {
                        setEditStructureError("Please select a structure.");
                        return;
                      }
                      handleEditStructureChange(selectedId);
                    }}
                    placeholder="Select structure..."
                  />
                </div>
                {editStructureError && (
                  <p className="mt-1 text-xs text-red-500">
                    {editStructureError}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Description (optional)
                </label>
                <TextAreaInput
                  value={editStructure?.description || ""}
                  onChange={(value) =>
                    setEditStructure((prev) =>
                      prev ? { ...prev, description: value } : prev,
                    )
                  }
                  placeholder="Add description..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditStructure(null);
                    setEditTitleError("");
                    setEditStructureError("");
                  }}
                  disabled={updatingStructure}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleEditSave}
                  disabled={updatingStructure}
                >
                  {updatingStructure ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </BaseModal>

          <BaseModal
            open={!!addStructure}
            onOpenChange={(open) => {
              if (!open) {
                setAddStructure(null);
                setEditTitleError("");
                setEditStructureError("");
              }
            }}
            title="Add Furniture Structure"
            description="Create a new product structure instance."
            size="md"
          >
            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={addStructure?.title || ""}
                  onChange={(event) => {
                    setAddStructure((prev) =>
                      prev ? { ...prev, title: event.target.value } : prev,
                    );
                    if (editTitleError) setEditTitleError("");
                  }}
                  placeholder="Enter title"
                  className="mt-1"
                />
                {editTitleError && (
                  <p className="mt-1 text-xs text-red-500">{editTitleError}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Product Structure <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <AssignToPicker
                    data={addStructureOptions}
                    value={addStructure?.product_structure_id}
                    onChange={(selectedId) => {
                      if (!selectedId) {
                        setEditStructureError("Please select a structure.");
                        return;
                      }
                      setAddStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            product_structure_id: selectedId,
                          }
                          : prev,
                      );
                      if (editStructureError) setEditStructureError("");
                    }}
                    placeholder="Select structure..."
                  />
                </div>
                {editStructureError && (
                  <p className="mt-1 text-xs text-red-500">
                    {editStructureError}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Description (optional)
                </label>
                <TextAreaInput
                  value={addStructure?.description || ""}
                  onChange={(value) =>
                    setAddStructure((prev) =>
                      prev ? { ...prev, description: value } : prev,
                    )
                  }
                  placeholder="Add description..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddStructure(null);
                    setEditTitleError("");
                    setEditStructureError("");
                  }}
                  disabled={creatingStructure}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddSave}
                  disabled={creatingStructure}
                >
                  {creatingStructure ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </BaseModal>

          <BaseModal
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            title="Add More Site Photos"
            description="Upload up to 10 current site photos."
            size="md"
          >
            <div className="p-5 space-y-4">
              <FileUploadField
                value={uploadFiles}
                onChange={handleUploadFilesChange}
                accept=".jpg,.jpeg,.png"
                multiple
                maxSizeMB={400}
                maxFiles={50}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUploadMoreSitePhotos}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </BaseModal>

          {materialModalTypeId && vendorId && (
            <AddMaterialQuantityModal
              open={!!materialModalTypeId}
              onOpenChange={(open) => {
                if (!open) {
                  setMaterialModalTypeId(null);
                  setEditingMaterialItem(null);
                }
              }}
              vendorId={vendorId}
              leadId={leadId}
              productTypeId={materialModalTypeId}
              productTypeName={
                (b2bReqTypesData?.data || productTypes?.data)?.find((t: any) => t.id === materialModalTypeId)?.type || "Requirement"
              }
              userId={userId || 0}
              editingItem={editingMaterialItem}
              onSuccess={() => refetchReqMaterials()}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}
