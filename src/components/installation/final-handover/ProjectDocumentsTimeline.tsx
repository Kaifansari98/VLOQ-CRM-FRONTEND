"use client";

import React, { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Ruler,
  FileCheck,
  CheckCircle2,
  Truck,
  Home,
  ChevronRight,
  FileText,
  Package,
  MapPin,
  Hammer,
  ShieldCheck,
  FolderOpen,
  File,
  Layers3,
} from "lucide-react";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import VideoCard from "@/components/utils/VideoCard";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import {
  useAllLeadDocuments,
  type LeadDocument,
  type DocGroup,
  type InstanceGroup,
  type StageDocResult,
} from "@/api/leads";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

interface StageUIConfig {
  id: string;
  label: string;
  icon: React.ElementType;
}

const STAGE_UI: StageUIConfig[] = [
  { id: "ism", label: "Initial Site Measurement", icon: Ruler },
  { id: "bookingDone", label: "Booking Done Documents", icon: FileText },
  { id: "finalMeasurement", label: "Final Measurement", icon: Ruler },
  { id: "clientDoc", label: "Client Documentation", icon: FileCheck },
  { id: "clientApproval", label: "Client Approval", icon: CheckCircle2 },
  { id: "techCheck", label: "Tech Check", icon: ShieldCheck },
  { id: "production", label: "Production", icon: Package },
  { id: "siteReadiness", label: "Site Readiness", icon: MapPin },
  { id: "dispatch", label: "Dispatch Stage", icon: Truck },
  { id: "underInstallation", label: "Under Installation", icon: Hammer },
  { id: "finalHandover", label: "Final Handover", icon: Home },
];

const IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic|heif|avif|jfif)$/i;
const VIDEO_EXTS = /\.(mp4|mov|avi|mkv|webm|m4v|3gp|wmv|flv|ogg)$/i;

const getFileType = (name: string): "image" | "video" | "document" => {
  if (IMAGE_EXTS.test(name ?? "")) return "image";
  if (VIDEO_EXTS.test(name ?? "")) return "video";
  return "document";
};

function FileCard({ doc }: { doc: LeadDocument }) {
  const type = getFileType(doc.doc_og_name);
  if (type === "image")
    return (
      <ImageComponent
        doc={{
          id: doc.id,
          doc_og_name: doc.doc_og_name,
          signedUrl: doc.signed_url,
          created_at: doc.created_at,
        }}
      />
    );
  if (type === "video")
    return (
      <VideoCard
        doc={{
          id: doc.id,
          originalName: doc.doc_og_name,
          signedUrl: doc.signed_url,
          created_at: doc.created_at,
        }}
      />
    );
  return (
    <DocumentCard
      doc={{
        id: doc.id,
        originalName: doc.doc_og_name,
        signedUrl: doc.signed_url,
        created_at: doc.created_at,
      }}
    />
  );
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28 } },
};
const iconVariants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 350, damping: 22 },
  },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
};
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
};

function TitleCard({ group }: { group: DocGroup }) {
  const [modalOpen, setModalOpen] = useState(false);
  const total = group.docs.length;
  const preview = group.docs.slice(0, 4);
  const extra = total - 4;

  return (
    <>
      <motion.div
        variants={cardVariants}
        className="flex flex-col rounded-2xl border bg-card text-card-foreground overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Card header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
              style={{
                background: "var(--muted)",
                borderColor: "var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              <File className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-sm truncate"
                style={{ color: "var(--foreground)" }}
              >
                {group.title}
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {total} {total === 1 ? "file" : "files"} uploaded
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs shrink-0 ml-2"
            onClick={() => setModalOpen(true)}
          >
            View
          </Button>
        </div>

        <div style={{ borderTop: "1px solid var(--border)" }} />

        {/* Preview stack */}
        <div className="px-4 py-3">
          {total > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {preview.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="w-9 h-9 rounded-lg border flex items-center justify-center overflow-hidden"
                    style={{
                      background: "var(--muted)",
                      borderColor: "var(--border)",
                      zIndex: 4 - index,
                    }}
                  >
                    {getFileType(doc.doc_og_name) === "image" ? (
                      <img
                        src={doc.signed_url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <FileText
                        className="w-4 h-4"
                        style={{ color: "var(--muted-foreground)" }}
                      />
                    )}
                  </div>
                ))}
                {extra > 0 && (
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-foreground)",
                      zIndex: 0,
                    }}
                  >
                    +{extra}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 ml-1 flex-wrap">
                {(() => {
                  const images = group.docs.filter(
                    (d) => getFileType(d.doc_og_name) === "image",
                  ).length;
                  const videos = group.docs.filter(
                    (d) => getFileType(d.doc_og_name) === "video",
                  ).length;
                  const docCount = group.docs.filter(
                    (d) => getFileType(d.doc_og_name) === "document",
                  ).length;
                  return (
                    <>
                      {images > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--muted)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {images} photo{images > 1 ? "s" : ""}
                        </span>
                      )}
                      {videos > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--muted)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {videos} video{videos > 1 ? "s" : ""}
                        </span>
                      )}
                      {docCount > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--muted)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {docCount} doc{docCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              No files uploaded yet
            </p>
          )}
        </div>
      </motion.div>

      {/* View Modal */}
      <BaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={group.title}
        description={`${total} file${total !== 1 ? "s" : ""} uploaded`}
        icon={
          <div
            className="p-2.5 rounded-lg"
            style={{ background: "var(--muted)" }}
          >
            <FileText
              className="w-5 h-5"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>
        }
        size="lg"
      >
        <div className="p-4 space-y-3">
          {total === 0 ? (
            <div
              className="py-12 border border-dashed rounded-xl text-center"
              style={{
                borderColor: "var(--border)",
                background: "var(--muted)",
              }}
            >
              <FolderOpen
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                No files uploaded yet
              </p>
            </div>
          ) : (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {group.docs.map((doc) => (
                <motion.div key={doc.id} variants={gridItemVariants}>
                  <FileCard doc={doc} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </BaseModal>
    </>
  );
}

interface InstanceSectionProps {
  group: InstanceGroup;
}

function InstanceSection({ group }: InstanceSectionProps) {
  const hasInstance = group.instanceId !== null;

  const mainName = group.instanceType ?? group.instanceTitle;
  const subtitleName =
    group.instanceType &&
    group.instanceTitle &&
    group.instanceType !== group.instanceTitle
      ? group.instanceTitle
      : null;

  return (
    <div className="space-y-3">
      {hasInstance && mainName && (
        <div className="flex items-center gap-2.5 px-1 py-1">
          {/* Icon box */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <Layers3
              className="w-3 h-3"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>

          {/* Names — one row */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-[13px] font-medium truncate"
              style={{ color: "var(--foreground)" }}
            >
              {mainName}
            </span>

            {subtitleName && (
              <>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  -
                </span>
                <span className="text-[12px] truncate text-muted-foreground">
                  {subtitleName}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {group.docGroups.map((docGroup) => (
          <TitleCard
            key={`${group.instanceId ?? "__lead__"}|||${docGroup.title}`}
            group={docGroup}
          />
        ))}
      </div>
    </div>
  );
}

interface StageItemProps {
  uiConfig: StageUIConfig;
  instanceGroups: InstanceGroup[];
  totalFiles: number;
  isLast: boolean;
}

function StageItem({
  uiConfig,
  instanceGroups,
  totalFiles,
  isLast,
}: StageItemProps) {
  const [open, setOpen] = useState(false);
  const hasFiles = totalFiles > 0;
  const Icon = uiConfig.icon;

  return (
    <motion.div variants={itemVariants} className="relative flex gap-4">
      {/* Spine */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div
          variants={iconVariants}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 z-10 transition-opacity",
            !hasFiles && "opacity-40",
          )}
          style={{
            background: "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          <Icon
            size={14}
            style={{
              color: hasFiles ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          />
        </motion.div>
        {!isLast && (
          <div
            className="w-px flex-1 min-h-4 mt-1"
            style={{ background: "var(--border)" }}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-3")}>
        {/* Stage header button */}
        <button
          onClick={() => hasFiles && setOpen((v) => !v)}
          disabled={!hasFiles}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-200",
            !hasFiles && "cursor-default opacity-50",
          )}
          style={{
            borderColor: "var(--border)",
            background: hasFiles ? "var(--card)" : "var(--muted)",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="text-sm font-medium truncate"
              style={{ color: "var(--foreground)" }}
            >
              {uiConfig.label}
            </span>
            {hasFiles && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  delay: 0.1,
                }}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0"
                style={{
                  background: "var(--muted)",
                  color: "var(--muted-foreground)",
                }}
              >
                {totalFiles} {totalFiles === 1 ? "file" : "files"}
              </motion.span>
            )}
          </div>
          {hasFiles && (
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="inline-flex shrink-0"
            >
              <ChevronRight
                size={14}
                style={{ color: "var(--muted-foreground)" }}
              />
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
              <motion.div
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
                  },
                }}
                initial="hidden"
                animate="visible"
                className="pt-3 space-y-5"
              >
                {instanceGroups.map((ig) => (
                  <motion.div
                    key={ig.instanceId ?? "__lead__"}
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.22 },
                      },
                    }}
                  >
                    <InstanceSection group={ig} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface Props {
  leadId: number;
  vendorId: number;
  upToStage?: string;
}

export default function ProjectDocumentsTimeline({
  leadId,
  vendorId,
  upToStage,
}: Props) {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instance_id")
    ? Number(searchParams.get("instance_id"))
    : null;

  const { data: stageResults = [], isLoading } = useAllLeadDocuments(
    vendorId,
    leadId,
    instanceId,
  );

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type as string | undefined,
  );

  const visibleStages = useMemo(() => {
    let ui = STAGE_UI;
    if (upToStage) {
      const idx = STAGE_UI.findIndex((s) => s.id === upToStage);
      ui = idx === -1 ? STAGE_UI : STAGE_UI.slice(0, idx + 1);
    }
    return ui.filter((s) => {
      if (s.id === "orderLogin")
        return userType === "backend" || userType === "super-admin";
      if (s.id === "production")
        return userType === "factory" || userType === "super-admin";
      return true;
    });
  }, [upToStage, userType]);

  const stageResultMap = useMemo(() => {
    const map: Record<string, StageDocResult> = {};
    for (const r of stageResults) map[r.stageId] = r;
    return map;
  }, [stageResults]);

  const totalFiles = useMemo(
    () => stageResults.reduce((acc, s) => acc + s.totalFiles, 0),
    [stageResults],
  );

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
          <FolderOpen size={25} style={{ color: "var(--muted-foreground)" }} />
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Project Documents
            </h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              All files uploaded across every stage of this project.
            </p>
          </div>
        </div>
        {!isLoading && totalFiles > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="text-xs px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
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
              <div
                className="w-8 h-8 rounded-lg animate-pulse shrink-0"
                style={{ background: "var(--muted)" }}
              />
              <div
                className="flex-1 h-11 rounded-xl animate-pulse"
                style={{ background: "var(--muted)" }}
              />
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible">
          {visibleStages.map((uiConfig, idx) => {
            const result = stageResultMap[uiConfig.id];
            return (
              <StageItem
                key={uiConfig.id}
                uiConfig={uiConfig}
                instanceGroups={result?.instanceGroups ?? []}
                totalFiles={result?.totalFiles ?? 0}
                isLast={idx === visibleStages.length - 1}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
