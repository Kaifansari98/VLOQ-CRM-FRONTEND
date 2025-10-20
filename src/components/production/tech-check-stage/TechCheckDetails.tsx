"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { useSiteMeasurementLeadById } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import DocumentPreview from "@/components/utils/file-preview";
import ImageCard from "@/components/utils/image-card";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import {
  FileText,
  Image as ImageIcon,
  File,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  leadId: number;
  accountId: number;
  name?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const getExt = (f: string) => f?.split(".").pop()?.toLowerCase() ?? "";
const isImg = (ext: string) => IMAGE_EXTENSIONS.includes(ext);

export default function TechCheckDetails({ leadId, accountId, name }: Props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)!;

  // ✅ Hooks
  const { data: clientDocs } = useClientDocumentationDetails(vendorId, leadId);
  const { data: siteMeasurement } = useSiteMeasurementLeadById(leadId);
  const { data: finalMeasurement } = useFinalMeasurementLeadById(
    vendorId,
    leadId
  );

  // ✅ State for image preview
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [carouselImages, setCarouselImages] = useState<any[]>([]);

  const pptDocs = clientDocs?.documents?.ppt ?? [];
  const pythaDocs = clientDocs?.documents?.pytha ?? [];
  const allDocs = [...pptDocs, ...pythaDocs];
  const otherDocs = pptDocs.filter((d) => !isImg(getExt(d.doc_sys_name)));

  const ismDocs = siteMeasurement?.initial_site_measurement_documents ?? [];
  const finalDocs = finalMeasurement?.measurementDocs ?? [];

  console.log(" ISM Docs :- ", ismDocs);

  // Calculate stats from ALL docs (ppt + pytha)
  const approvedDocs = allDocs.filter(
    (d) => d.tech_check_status === "APPROVED"
  ).length;
  const rejectedDocs = allDocs.filter(
    (d) => d.tech_check_status === "REJECTED"
  ).length;
  const pendingDocs = allDocs.filter(
    (d) => !d.tech_check_status || d.tech_check_status === "PENDING"
  ).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full space-y-8 overflow-y-scroll"
    >
      {/* Header with Stats */}
      <motion.div variants={itemVariants} className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total Docs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allDocs.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
                <CheckCircle2 className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Approved
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {approvedDocs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 dark:bg-amber-600 flex items-center justify-center">
                <AlertCircle className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingDocs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500 dark:bg-red-600 flex items-center justify-center">
                <XCircle className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rejectedDocs}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========== CLIENT DOCUMENTATION - HORIZONTAL CARDS ========== */}
      <motion.div variants={itemVariants} className="space-y-8">
        {(() => {
          const formatDate = (date: string) =>
            new Date(date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

          const getFileExtension = (fileName: string): string => {
            return fileName?.split(".").pop()?.toUpperCase() || "FILE";
          };

          const isImageFile = (fileName: string): boolean => {
            const ext = fileName?.split(".").pop()?.toLowerCase() || "";
            return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
          };

          const getExtensionColor = (ext: string) => {
            const colors: Record<
              string,
              { bg: string; text: string; gradient: string }
            > = {
              PDF: {
                bg: "bg-red-500",
                text: "text-red-600",
                gradient: "from-red-500 to-red-600",
              },
              DOC: {
                bg: "bg-blue-500",
                text: "text-blue-600",
                gradient: "from-blue-500 to-blue-600",
              },
              DOCX: {
                bg: "bg-blue-500",
                text: "text-blue-600",
                gradient: "from-blue-500 to-blue-600",
              },
              PPT: {
                bg: "bg-orange-500",
                text: "text-orange-600",
                gradient: "from-orange-500 to-orange-600",
              },
              PPTX: {
                bg: "bg-orange-500",
                text: "text-orange-600",
                gradient: "from-orange-500 to-orange-600",
              },
              PYTHA: {
                bg: "bg-purple-500",
                text: "text-purple-600",
                gradient: "from-purple-500 to-purple-600",
              },
              PYO: {
                bg: "bg-purple-500",
                text: "text-purple-600",
                gradient: "from-purple-500 to-purple-600",
              },
              XLS: {
                bg: "bg-green-500",
                text: "text-green-600",
                gradient: "from-green-500 to-green-600",
              },
              XLSX: {
                bg: "bg-green-500",
                text: "text-green-600",
                gradient: "from-green-500 to-green-600",
              },
              TXT: {
                bg: "bg-gray-500",
                text: "text-gray-600",
                gradient: "from-gray-500 to-gray-600",
              },
              default: {
                bg: "bg-slate-500",
                text: "text-slate-600",
                gradient: "from-slate-500 to-slate-600",
              },
            };
            return colors[ext] || colors.default;
          };

          const getStatusStyle = (status?: string) => {
            switch (status) {
              case "APPROVED":
                return {
                  containerBg:
                    "bg-gradient-to-r from-green-50/80 via-emerald-50/50 to-green-50/30 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-green-950/20",
                  border: "border-green-300/50 dark:border-green-700/50",
                  ribbon: "bg-gradient-to-r from-green-500 to-emerald-600",
                  badge:
                    "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
                  ringColor: "ring-green-400/30 dark:ring-green-600/30",
                };
              case "REJECTED":
                return {
                  containerBg:
                    "bg-gradient-to-r from-red-50/80 via-rose-50/50 to-red-50/30 dark:from-red-950/40 dark:via-rose-950/30 dark:to-red-950/20",
                  border: "border-red-300/50 dark:border-red-700/50",
                  ribbon: "bg-gradient-to-r from-red-500 to-rose-600",
                  badge:
                    "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
                  ringColor: "ring-red-400/30 dark:ring-red-600/30",
                };
              default:
                return {
                  containerBg:
                    "bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-blue-50/30 dark:from-blue-950/40 dark:via-sky-950/30 dark:to-blue-950/20",
                  border: "border-blue-300/50 dark:border-blue-700/50",
                  ribbon: "bg-gradient-to-r from-blue-500 to-sky-600",
                  badge:
                    "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
                  ringColor: "ring-blue-400/30 dark:ring-blue-600/30",
                };
            }
          };

          const renderCard = (file: any, onClick?: () => void) => {
            const style = getStatusStyle(file.tech_check_status);
            const statusText =
              file.tech_check_status === "APPROVED"
                ? "Approved"
                : file.tech_check_status === "REJECTED"
                ? "Rejected"
                : "Pending";
            const StatusIcon =
              file.tech_check_status === "APPROVED"
                ? CheckCircle2
                : file.tech_check_status === "REJECTED"
                ? XCircle
                : AlertCircle;

            const isImage = isImageFile(file.doc_og_name);
            const extension = getFileExtension(file.doc_og_name);
            const extColor = getExtensionColor(extension);

            return (
              <motion.div
                key={file.id}
                onClick={onClick}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex items-center gap-4 w-fit min-w-[320px] max-w-md rounded-xl p-3 border-2 backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden",
                  style.border,
                  style.containerBg
                )}
              >
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                </div>

                {/* File Thumbnail/Extension - Left Side */}
                <div className="relative flex-shrink-0 w-20 h-20 rounded-lg bg-white/50 dark:bg-black/20 p-1.5 overflow-hidden">
                  {isImage && "signed_url" in file ? (
                    <img
                      src={
                        file.signed_url ||
                        "https://via.placeholder.com/80x80?text=No+Preview"
                      }
                      alt={file.doc_og_name}
                      className="w-full h-full rounded-md object-cover "
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Document Icon */}
                      <div
                        className={cn(
                          "relative w-14 h-16 rounded-md shadow-md transition-transform duration-300 group-hover:scale-110",
                          `bg-gradient-to-br ${extColor.gradient}`
                        )}
                      >
                        {/* Paper fold effect */}
                        <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-white/30 rounded-tr-md"></div>

                        {/* File Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="text-white/90" size={24} />
                        </div>

                        {/* Extension Badge */}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white/95 dark:bg-white/90 rounded">
                          <span
                            className={cn(
                              "text-[8px] font-black tracking-wider",
                              extColor.text
                            )}
                          >
                            .{extension}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Info - Center/Right Side */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p
                      className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight"
                      title={file.doc_og_name}
                    >
                      {file.doc_og_name}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">
                      {formatDate(file.created_at)}
                    </span>
                  </div>

                  {/* Status Badge - Bottom */}
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                        style.badge
                      )}
                    >
                      <StatusIcon size={12} />
                      <span>{statusText}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 20% 50%, ${
                      style.ribbon.includes("green")
                        ? "rgba(34, 197, 94, 0.08)"
                        : style.ribbon.includes("red")
                        ? "rgba(239, 68, 68, 0.08)"
                        : "rgba(59, 130, 246, 0.08)"
                    }, transparent 70%)`,
                  }}
                ></div>
              </motion.div>
            );
          };

          return (
            <>
              {/* Other Docs */}
              {otherDocs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
                        <File className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          Client Documents
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDFs, presentations, and other files
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                      <File size={14} />
                      {otherDocs.length} files
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {otherDocs.map((doc) =>
                      renderCard(doc, () =>
                        window.open(doc.signed_url, "_blank")
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Pytha Files */}
              {pythaDocs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30">
                        <FileText className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          Design Files
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          3D design and modeling files
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                      <FileText size={14} />
                      {pythaDocs.length} files
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {pythaDocs.map((doc) =>
                      renderCard(doc, () =>
                        window.open(doc.signed_url, "_blank")
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </motion.div>

      {/* ========== INITIAL SITE MEASUREMENT DOCUMENTS ========== */}
      {ismDocs.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md shadow-cyan-500/30">
                <Camera className="text-white" size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Initial Site Measurement Documents
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Documents captured during initial site visit
                </p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <Camera size={14} />
              {ismDocs.length} files
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {ismDocs.map((doc) => {
              const isImage = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
              ].includes(
                doc.originalName?.split(".").pop()?.toLowerCase() || ""
              );

              return (
                <motion.div
                  key={doc.id}
                  onClick={() => {
                    if (isImage) {
                      setCarouselImages(
                        ismDocs
                          .filter((d) =>
                            [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                              "svg",
                            ].includes(
                              d.originalName?.split(".").pop()?.toLowerCase() ||
                                ""
                            )
                          )
                          .map((p) => ({
                            id: p.id,
                            signed_url: p.signedUrl,
                            doc_og_name: p.originalName,
                          }))
                      );
                      setStartIndex(
                        ismDocs
                          .filter((d) =>
                            [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                              "svg",
                            ].includes(
                              d.originalName?.split(".").pop()?.toLowerCase() ||
                                ""
                            )
                          )
                          .findIndex((d) => d.id === doc.id)
                      );
                      setOpenCarousel(true);
                    } else {
                      window.open(doc.signedUrl, "_blank");
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-center gap-4 w-fit min-w-[320px] max-w-md rounded-xl p-3 border-2 backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden bg-gradient-to-r from-cyan-50/80 via-sky-50/50 to-cyan-50/30 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-cyan-950/20 border-cyan-300/50 dark:border-cyan-700/50"
                >
                  {/* Decorative Background Pattern */}
                  <div className="absolute inset-0 opacity-5 dark:opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                  </div>

                  {/* File Thumbnail/Extension - Left Side */}
                  <div className="relative flex-shrink-0 w-20 h-20 rounded-lg bg-white/50 dark:bg-black/20 p-1.5 overflow-hidden">
                    {isImage ? (
                      <img
                        src={
                          doc.signedUrl ||
                          "https://via.placeholder.com/80x80?text=No+Preview"
                        }
                        alt={doc.originalName}
                        className="w-full h-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative w-14 h-16 rounded-md shadow-md transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br from-cyan-500 to-cyan-600">
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-white/30 rounded-tr-md"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="text-white/90" size={24} />
                          </div>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white/95 dark:bg-white/90 rounded">
                            <span className="text-[8px] font-black tracking-wider text-cyan-600">
                              .
                              {doc.originalName
                                ?.split(".")
                                .pop()
                                ?.toUpperCase() || "FILE"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p
                        className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight"
                        title={doc.originalName}
                      >
                        {doc.originalName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">Site Visit</span>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.08), transparent 70%)",
                    }}
                  ></div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ========== FINAL MEASUREMENT DOCS ========== */}
      {(finalDocs?.length || 0) > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Final Measurement Documents
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Final measurements and documentation
                </p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <FileText size={14} />
              {finalDocs?.length || 0} files
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {finalDocs.map((doc: any) => {
              const isImage = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
              ].includes(
                doc.doc_og_name?.split(".").pop()?.toLowerCase() || ""
              );

              return (
                <motion.div
                  key={doc.id}
                  onClick={() => {
                    if (isImage) {
                      setCarouselImages(
                        finalDocs
                          .filter((d: any) =>
                            [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                              "svg",
                            ].includes(
                              d.doc_og_name?.split(".").pop()?.toLowerCase() ||
                                ""
                            )
                          )
                          .map((p: any) => ({
                            id: p.id,
                            signed_url: p.signed_url,
                            doc_og_name: p.doc_og_name,
                          }))
                      );
                      setStartIndex(
                        finalDocs
                          .filter((d: any) =>
                            [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                              "svg",
                            ].includes(
                              d.doc_og_name?.split(".").pop()?.toLowerCase() ||
                                ""
                            )
                          )
                          .findIndex((d: any) => d.id === doc.id)
                      );
                      setOpenCarousel(true);
                    } else {
                      window.open(doc.signed_url, "_blank");
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-center gap-4 w-fit min-w-[320px] max-w-md rounded-xl p-3 border-2 backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden bg-gradient-to-r from-emerald-50/80 via-green-50/50 to-emerald-50/30 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-emerald-950/20 border-emerald-300/50 dark:border-emerald-700/50"
                >
                  {/* Decorative Background Pattern */}
                  <div className="absolute inset-0 opacity-5 dark:opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                  </div>

                  {/* File Thumbnail/Extension - Left Side */}
                  <div className="relative flex-shrink-0 w-20 h-20 rounded-lg bg-white/50 dark:bg-black/20 p-1.5 overflow-hidden">
                    {isImage ? (
                      <img
                        src={
                          doc.signed_url ||
                          "https://via.placeholder.com/80x80?text=No+Preview"
                        }
                        alt={doc.doc_og_name}
                        className="w-full h-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative w-14 h-16 rounded-md shadow-md transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br from-emerald-500 to-emerald-600">
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-white/30 rounded-tr-md"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="text-white/90" size={24} />
                          </div>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white/95 dark:bg-white/90 rounded">
                            <span className="text-[8px] font-black tracking-wider text-emerald-600">
                              .
                              {doc.doc_og_name
                                ?.split(".")
                                .pop()
                                ?.toUpperCase() || "FILE"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p
                        className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight"
                        title={doc.doc_og_name}
                      >
                        {doc.doc_og_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">Final Measurement</span>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.08), transparent 70%)",
                    }}
                  ></div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Image Preview Modal */}
      <ImageCarouselModal
        images={carouselImages}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      />
    </motion.div>
  );
}
