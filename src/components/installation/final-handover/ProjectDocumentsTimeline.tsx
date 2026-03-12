"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Ruler,
  BookOpen,
  FileCheck,
  ClipboardCheck,
  CheckCircle2,
  Truck,
  Home,
  ChevronRight,
  FileText,
  Images,
  UserCircle,
  Palette,
  Package,
  PackageCheck,
  MapPin,
  Navigation,
  Hammer,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { useAllLeadDocuments, type LeadDocument } from "@/api/leads";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StageConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  badgeColor: string;
  tags: string[];
  techCheckFilter?: ("APPROVED" | "REJECTED")[];
}

// ─── Stage definitions ────────────────────────────────────────────────────────

const STAGES: StageConfig[] = [
  {
    id: "leads",
    label: "Leads",
    icon: UserCircle,
    iconColor: "text-slate-500 dark:text-slate-400",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    badgeColor: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    tags: ["Type 1"],
  },
  {
    id: "ism",
    label: "Initial Site Measurement",
    icon: Ruler,
    iconColor: "text-violet-500 dark:text-violet-400",
    iconBg: "bg-violet-50 dark:bg-violet-900/30",
    badgeColor: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    tags: ["Type 2", "Type 3", "Type 4"],
  },
  {
    id: "designing",
    label: "Designing Stage",
    icon: Palette,
    iconColor: "text-pink-500 dark:text-pink-400",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
    badgeColor: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    tags: ["Type 5", "Type 6", "Type 7"],
  },
  {
    id: "booking",
    label: "Booking Stage",
    icon: BookOpen,
    iconColor: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    badgeColor: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    tags: ["Type 8", "Type 32"],
  },
  {
    id: "bookingDoneIsm",
    label: "Booking Done ISM",
    icon: ClipboardCheck,
    iconColor: "text-indigo-500 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
    badgeColor: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    tags: ["Type 33", "Type 34", "Type 35"],
  },
  {
    id: "finalMeasurement",
    label: "Final Measurement",
    icon: Ruler,
    iconColor: "text-cyan-500 dark:text-cyan-400",
    iconBg: "bg-cyan-50 dark:bg-cyan-900/30",
    badgeColor: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    tags: ["Type 9", "Type 10"],
  },
  {
    id: "clientDoc",
    label: "Client Documentation",
    icon: FileCheck,
    iconColor: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    badgeColor: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    tags: ["Type 11", "Type 12"],
  },
  {
    id: "clientApproval",
    label: "Client Approval",
    icon: CheckCircle2,
    iconColor: "text-green-500 dark:text-green-400",
    iconBg: "bg-green-50 dark:bg-green-900/30",
    badgeColor: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    tags: ["Type 13"],
  },
  {
    id: "techCheck",
    label: "Tech Check",
    icon: ShieldCheck,
    iconColor: "text-teal-500 dark:text-teal-400",
    iconBg: "bg-teal-50 dark:bg-teal-900/30",
    badgeColor: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    tags: ["Type 11", "Type 12"],
    techCheckFilter: ["APPROVED", "REJECTED"],
  },
  {
    id: "orderLogin",
    label: "Order Login",
    icon: FileText,
    iconColor: "text-sky-500 dark:text-sky-400",
    iconBg: "bg-sky-50 dark:bg-sky-900/30",
    badgeColor: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    tags: ["Type 36"],
  },
  {
    id: "production",
    label: "Production",
    icon: Package,
    iconColor: "text-orange-500 dark:text-orange-400",
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    badgeColor: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    tags: ["Type 14", "Type 15", "Type 16", "Type 17", "Type 38"],
  },
  {
    id: "readyToDispatch",
    label: "Ready to Dispatch",
    icon: PackageCheck,
    iconColor: "text-lime-500 dark:text-lime-400",
    iconBg: "bg-lime-50 dark:bg-lime-900/30",
    badgeColor: "bg-lime-50 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
    tags: ["Type 18"],
  },
  {
    id: "siteReadiness",
    label: "Site Readiness",
    icon: MapPin,
    iconColor: "text-yellow-500 dark:text-yellow-400",
    iconBg: "bg-yellow-50 dark:bg-yellow-900/30",
    badgeColor: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    tags: ["Type 19"],
  },
  {
    id: "dispatchPlanning",
    label: "Dispatch Planning",
    icon: Navigation,
    iconColor: "text-fuchsia-500 dark:text-fuchsia-400",
    iconBg: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
    badgeColor: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
    tags: ["Type 20"],
  },
  {
    id: "dispatch",
    label: "Dispatch Stage",
    icon: Truck,
    iconColor: "text-rose-500 dark:text-rose-400",
    iconBg: "bg-rose-50 dark:bg-rose-900/30",
    badgeColor: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    tags: ["Type 21", "Type 22"],
  },
  {
    id: "underInstallation",
    label: "Under Installation",
    icon: Hammer,
    iconColor: "text-stone-500 dark:text-stone-400",
    iconBg: "bg-stone-100 dark:bg-stone-800",
    badgeColor: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
    tags: ["Type 23", "Type 24", "Type 25", "Type 26"],
  },
  {
    id: "finalHandover",
    label: "Final Handover",
    icon: Home,
    iconColor: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    badgeColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    tags: ["Type 27", "Type 28", "Type 29", "Type 30", "Type 31"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic|heif|avif|jfif)$/i;
const isImageFile = (name: string) => IMAGE_EXTS.test(name ?? "");

function filterDocsForStage(
  allDocs: LeadDocument[],
  stage: StageConfig
): LeadDocument[] {
  return allDocs.filter((doc) => {
    if (!stage.tags.includes(doc.doc_type_tag)) return false;
    if (stage.techCheckFilter) {
      return (
        doc.tech_check_status !== null &&
        stage.techCheckFilter.includes(
          doc.tech_check_status as "APPROVED" | "REJECTED"
        )
      );
    }
    if (stage.id === "clientDoc") return !doc.tech_check_status;
    return true;
  });
}

// ─── Animation variants ───────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28 },
  },
};

const iconVariants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 350, damping: 22 },
  },
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22 },
  },
};

// ─── Stage Item ───────────────────────────────────────────────────────────────

interface StageItemProps {
  stage: StageConfig;
  docs: LeadDocument[];
  isLast: boolean;
}

function StageItem({ stage, docs, isLast }: StageItemProps) {
  const [open, setOpen] = useState(false);

  const images = docs.filter((d) => isImageFile(d.doc_og_name));
  const fileDocs = docs.filter((d) => !isImageFile(d.doc_og_name));
  const total = docs.length;
  const hasFiles = total > 0;

  const Icon = stage.icon;

  return (
    <motion.div variants={itemVariants} className="relative flex gap-4">
      {/* Spine */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div
          variants={iconVariants}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 z-10 transition-opacity",
            stage.iconBg,
            !hasFiles && "opacity-40"
          )}
        >
          <Icon size={14} className={cn(stage.iconColor, !hasFiles && "opacity-60")} />
        </motion.div>
        {!isLast && (
          <div className="w-px flex-1 min-h-[16px] mt-1 bg-border" />
        )}
      </div>

      {/* Card */}
      <div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-3")}>
        <button
          onClick={() => hasFiles && setOpen((v) => !v)}
          disabled={!hasFiles}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-200",
            hasFiles
              ? "border-border bg-white dark:bg-neutral-900 hover:bg-muted/40 dark:hover:bg-neutral-800 cursor-pointer"
              : "border-border/40 bg-muted/20 dark:bg-neutral-900/40 cursor-default opacity-50"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {stage.label}
            </span>
            {hasFiles && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0",
                  stage.badgeColor
                )}
              >
                {total} {total === 1 ? "file" : "files"}
              </motion.span>
            )}
          </div>

          {hasFiles && (
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="inline-flex shrink-0"
            >
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && hasFiles && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-4">
                {images.length > 0 && (
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-1.5 px-1"
                    >
                      <Images size={11} className="text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        Photos ({images.length})
                      </span>
                    </motion.div>
                    <motion.div
                      variants={gridVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                      {images.map((doc) => (
                        <motion.div key={doc.id} variants={gridItemVariants}>
                          <ImageComponent
                            doc={{
                              id: doc.id,
                              doc_og_name: doc.doc_og_name,
                              signedUrl: doc.signed_url,
                              created_at: doc.created_at,
                            }}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}

                {fileDocs.length > 0 && (
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-1.5 px-1"
                    >
                      <FileText size={11} className="text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        Documents ({fileDocs.length})
                      </span>
                    </motion.div>
                    <motion.div
                      variants={gridVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                      {fileDocs.map((doc) => (
                        <motion.div key={doc.id} variants={gridItemVariants}>
                          <DocumentCard
                            doc={{
                              id: doc.id,
                              originalName: doc.doc_og_name,
                              signedUrl: doc.signed_url,
                              created_at: doc.created_at,
                            }}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  leadId: number;
  vendorId: number;
}

export default function ProjectDocumentsTimeline({ leadId, vendorId }: Props) {
  const { data: allDocs = [], isLoading } = useAllLeadDocuments(vendorId, leadId);

  const stageDocMap = useMemo(() => {
    const map: Record<string, LeadDocument[]> = {};
    for (const stage of STAGES) {
      map[stage.id] = filterDocsForStage(allDocs, stage);
    }
    return map;
  }, [allDocs]);

  const totalFiles = allDocs.length;
  const stagesWithFiles = STAGES.filter((s) => stageDocMap[s.id].length > 0).length;

  return (
    <div className="pb-6 px-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <FolderOpen size={25} className="text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">Project Documents</h2>
            <p className="text-xs text-muted-foreground">
              All files uploaded across every stage of this project.
            </p>
          </div>
        </div>
        {!isLoading && totalFiles > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full shrink-0"
          >
            {totalFiles} {totalFiles === 1 ? "file" : "files"}
          </motion.span>
        )}
      </motion.div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="flex-1 h-11 rounded-xl bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {STAGES.map((stage, idx) => (
            <StageItem
              key={stage.id}
              stage={stage}
              docs={stageDocMap[stage.id]}
              isLast={idx === STAGES.length - 1}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
