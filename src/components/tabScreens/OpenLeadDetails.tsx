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
} from "lucide-react";
import { formatDateTime } from "../utils/privileges";
import {
  useLeadById,
  useLeadProductStructureInstances,
  useUploadMoreSitePhotos,
} from "@/hooks/useLeadsQueries";
import { useAppSelector } from "@/redux/store";
import {
  createLeadProductStructureInstance,
  deleteLeadProductStructureInstance,
  updateLeadProductStructureInstance,
  useDeleteDocument,
} from "@/api/leads";

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
import { useMemo, useState } from "react";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { ImageComponent } from "../utils/ImageCard";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { Input } from "@/components/ui/input";
import TextAreaInput from "@/components/origin-text-area";
import AssignToPicker from "@/components/assign-to-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useProductStructureTypes, useProductTypes } from "@/hooks/useTypesMaster";

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

export default function OpenLeadDetails({ leadId }: OpenLeadDetailsProps) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  const { data } = useLeadById(leadId, vendorId, userId);
  const { data: structureInstancesData, isLoading: isStructuresLoading } =
    useLeadProductStructureInstances(leadId, vendorId);
  const lead = data?.data?.lead;
  console.log("Data", lead);

  const leadStage = lead?.statusType?.type;
  console.log("Lead Stage In Lead Details: ", leadStage);
  const structureInstances = structureInstancesData?.data || [];
  const structureSummary = useMemo(() => {
    const total = structureInstances.length;
    const uniqueStructures = new Set(
      structureInstances.map((item: any) => item.product_structure_id)
    ).size;
    return { total, uniqueStructures };
  }, [structureInstances]);
  const isKitchenType = useMemo(() => {
    const typeLabel =
      lead?.productMappings?.[0]?.productType?.type ||
      lead?.productMappings?.[0]?.product_type?.type ||
      "";
    return String(typeLabel).toLowerCase().includes("kitchen");
  }, [lead?.productMappings]);

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
  const queryClient = useQueryClient();
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
      }) =>
        deleteLeadProductStructureInstance(vendorId, leadId, instanceId),
      onSuccess: () => {
        toast.success("Product structure instance deleted.");
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        });
        setConfirmStructureDelete(null);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to delete instance."
        );
      },
    });
  const { data: productStructureTypes } = useProductStructureTypes();
  const { data: productTypes } = useProductTypes();
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
      }) =>
        createLeadProductStructureInstance(vendorId, leadId, payload),
      onSuccess: () => {
        toast.success("Product structure instance added.");
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        });
        setAddStructure(null);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to add instance."
        );
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
          description?: string;
          updated_by?: number;
        };
      }) =>
        updateLeadProductStructureInstance(
          vendorId,
          leadId,
          instanceId,
          payload
        ),
      onSuccess: () => {
        toast.success("Product instance updated.");
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        });
        setEditStructure(null);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to update instance."
        );
      },
    });
  const { mutateAsync: uploadMoreSitePhotos, isPending: uploading } =
    useUploadMoreSitePhotos();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

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

  const getParentFilter = (productTypeId?: number) => {
    if (!productTypeId) return null;
    const typeLabel =
      productTypes?.data?.find((type: any) => type.id === productTypeId)?.type ||
      "";
    const normalized = String(typeLabel).toLowerCase();
    if (normalized.includes("kitchen")) return "Kitchen";
    if (normalized.includes("wardrobe")) return "Wardrobe";
    return "Others";
  };

  const editParentFilter = useMemo(
    () => getParentFilter(editStructure?.product_type_id),
    [editStructure?.product_type_id, productTypes?.data]
  );
  const addParentFilter = useMemo(
    () => getParentFilter(addStructure?.product_type_id),
    [addStructure?.product_type_id, productTypes?.data]
  );

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

  const editStructureOptions = useMemo(
    () => getStructureOptions(editParentFilter),
    [editParentFilter, productStructureTypes?.data]
  );
  const addStructureOptions = useMemo(
    () => getStructureOptions(addParentFilter),
    [addParentFilter, productStructureTypes?.data]
  );

  if (!lead) {
    return (
      <div className="border rounded-lg p-6">
        <p>No lead details found.</p>
      </div>
    );
  }

  const canUploadSitePhotos =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" && leadStage === "open");

  const handleUploadFilesChange = (files: File[]) => {
    if (files.length > 10) {
      toast.error("You can upload up to 10 site photos.");
      setUploadFiles(files.slice(0, 10));
      return;
    }
    setUploadFiles(files);
  };

  const handleUploadMoreSitePhotos = async () => {
    if (!vendorId || !userId) {
      toast.error("Vendor or user information is missing.");
      return;
    }

    if (uploadFiles.length === 0) {
      toast.error("Please select at least one photo to upload.");
      return;
    }

    try {
      await uploadMoreSitePhotos({
        vendorId,
        leadId,
        createdBy: userId,
        files: uploadFiles,
      });

      toast.success("Site photos uploaded successfully!");
      setUploadFiles([]);
      setUploadOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["lead", leadId, vendorId, userId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload site photos."
      );
    }
  };

  const SectionCard = ({ title, children, action }: any) => (
    <motion.section
      variants={itemVariants}
      className="
  bg-[#fff] dark:bg-[#0a0a0a]
  rounded-2xl 
  border border-border 
  shadow-soft 
  p-6 space-y-6
"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {action}
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

          {/* PRODUCT INFORMATION */}
          <SectionCard
            title="Product Information"
            action={
              !isKitchenType && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleAddOpen}
                >
                  <Plus />
                  Add Furniture Structure
                </Button>
              )
            }
          >
            <div className="space-y-4">
              <div className="flex items-center w-full justify-between">
                <InfoRow
                  icon={Package}
                  label="Product Types"
                  value={lead.productMappings
                    ?.map((pm: any) => pm.productType?.type)
                    ?.filter(Boolean)
                    ?.join(", ")}
                />
                {(structureSummary.total > 0 || structureSummary.uniqueStructures > 0) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {structureSummary.total > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-current opacity-60"></span>
                        {structureSummary.total} instance
                        {structureSummary.total === 1 ? "" : "s"}
                      </span>
                    )}
                    {structureSummary.uniqueStructures > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-current opacity-60"></span>
                        {structureSummary.uniqueStructures} structure
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
                      className="group rounded-xl border bg-white/60 p-5 transition-all hover:border-border/80 dark:bg-[#0a0a0a]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-base font-semibold leading-tight text-heading transition-colors group-hover:text-foreground dark:text-neutral-200">
                              {item.title || item.productStructure?.type || "—"}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="text-muted-foreground/70 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                                onClick={() => handleEditOpen(item)}
                                aria-label="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="text-muted-foreground/70 hover:text-destructive focus-visible:border-ring focus-visible:ring-ring/50 inline-flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                                onClick={() =>
                                  setConfirmStructureDelete({
                                    id: item.id,
                                    title:
                                      item.title ||
                                      item.productStructure?.type ||
                                      "this item",
                                  })
                                }
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

          {/* CONTACT INFORMATION */}
          <SectionCard title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                icon={User}
                label="Full Name"
                value={`${lead.firstname || ""} ${lead.lastname || ""}`.trim()}
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
          <SectionCard title="Project Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                icon={User}
                label="Architect Name"
                value={lead.archetech_name}
              />
              <InfoRow
                icon={Building}
                label="Site Type"
                value={lead.siteType?.type}
              />
              <InfoRow icon={MapPin} label="Source" value={lead.source?.type} />
            </div>
          </SectionCard>

          {/* ADDITIONAL INFORMATION */}
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

          {/* Site Photos */}
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
              {lead.documents && lead.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {lead.documents.map((doc: any, index: number) =>
                    doc.signedUrl ? (
                      <motion.div key={doc.id} variants={itemVariants}>
                        <ImageComponent
                          key={doc.id}
                          doc={doc}
                          index={index}
                          canDelete={
                            userType === "admin" ||
                            userType === "super-admin" ||
                            (userType === "sales-executive" &&
                              leadStage === "open")
                          }
                          onDelete={(id) => setConfirmDelete(Number(id))}
                        />
                      </motion.div>
                    ) : null
                  )}
                  {canUploadSitePhotos && (
                    <button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      className="
                        flex flex-col items-center justify-center
                        border border-dashed border-border/70
                        rounded-xl p-6 text-center
                        bg-mutedBg/40 dark:bg-neutral-800/40
                        hover:bg-muted/40 dark:hover:bg-neutral-800/60
                        transition
                        w-full h-full
                      "
                    >
                      <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Add more images
                      </p>
                      <p className="text-xs text-subtle">
                        Upload up to 10 photos
                      </p>
                    </button>
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
                    <button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      className="
                        mt-4 inline-flex items-center gap-2
                        rounded-lg border border-border px-3 py-2
                        text-xs font-medium text-muted-foreground
                        hover:bg-mutedBg/60 dark:hover:bg-neutral-800/60
                        transition
                      "
                    >
                      <ImagePlus className="w-4 h-4" />
                      Add more images
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.section>

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
                      prev
                        ? { ...prev, title: event.target.value }
                        : prev
                    );
                    if (editTitleError) setEditTitleError("");
                  }}
                  placeholder="Enter title"
                  className="mt-1"
                />
                {editTitleError && (
                  <p className="mt-1 text-xs text-red-500">
                    {editTitleError}
                  </p>
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
                      setEditStructure((prev) =>
                        prev
                          ? {
                              ...prev,
                              product_structure_id: selectedId,
                            }
                          : prev
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
                  value={editStructure?.description || ""}
                  onChange={(value) =>
                    setEditStructure((prev) =>
                      prev ? { ...prev, description: value } : prev
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
                      prev
                        ? { ...prev, title: event.target.value }
                        : prev
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
                          : prev
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
                      prev ? { ...prev, description: value } : prev
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
                maxFiles={10}
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
        </div>
      </motion.div>
    </>
  );
}
