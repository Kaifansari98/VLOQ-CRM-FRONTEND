"use client";

import React from "react";
import { motion } from "framer-motion";
import { FolderOpen, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/redux/store";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useClientApprovalDetails } from "@/api/client-approval";
import { LeadProductStructureInstance } from "@/api/leads";
import Loader from "@/components/utils/loader";

interface ClientApprovalItemGroupsProps {
  leadId: number;
  accountId: number;
  onUploadClick: (instance: LeadProductStructureInstance) => void;
  onViewClick: (instance: LeadProductStructureInstance) => void;
}

export const ClientApprovalItemGroups: React.FC<ClientApprovalItemGroupsProps> = ({
  leadId,
  accountId,
  onUploadClick,
  onViewClick,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data: structureInstancesData, isLoading: isInstancesLoading } =
    useLeadProductStructureInstances(leadId, vendorId);

  const { data: approvalDetails, isLoading: isDetailsLoading } =
    useClientApprovalDetails(vendorId!, leadId);

  const structureInstances: LeadProductStructureInstance[] = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data]
  );

  const displayGroups = React.useMemo(() => {
    const grouped = new Map<
      string,
      {
        key: string;
        title: string;
        subtitle: string;
        instance: LeadProductStructureInstance;
      }
    >();

    structureInstances.forEach((instance) => {
      const title =
        (instance as any).product_type?.name ||
        instance.productType?.type ||
        instance.productItemCode?.productStructure?.productType?.type ||
        instance.title ||
        "Item Group";

      const subtitle =
        (instance as any).code ||
        instance.productItemCode?.item_code ||
        instance.description ||
        "";

      const key = String(
        instance.product_type_id ||
          (instance as any).product_type?.id ||
          instance.productType?.id ||
          title,
      );

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          title,
          subtitle,
          instance,
        });
      }
    });

    return Array.from(grouped.values());
  }, [structureInstances]);

  const getFilesCount = (instance: LeadProductStructureInstance) => {
    const productTypeId =
      instance.product_type_id || (instance as any).product_type?.id;
    if (!approvalDetails || !productTypeId) return 0;

    const screenshotsCount =
      approvalDetails.screenshots?.filter(
        (s: any) => Number(s.product_type_id) === Number(productTypeId)
      )?.length || 0;

    const hasPaymentFile =
      approvalDetails.paymentInfo &&
      Number(approvalDetails.paymentInfo.product_type_id) === Number(productTypeId) &&
      approvalDetails.paymentFile;

    return screenshotsCount + (hasPaymentFile ? 1 : 0);
  };

  const isUploadedForInstance = (instance: LeadProductStructureInstance) => {
    const productTypeId =
      instance.product_type_id || (instance as any).product_type?.id;

    if (!approvalDetails || !productTypeId) return false;

    const hasSpecificScreenshots = approvalDetails.screenshots?.some(
      (s: any) => Number(s.product_type_id) === Number(productTypeId)
    );

    const hasSpecificPayment =
      approvalDetails.paymentInfo &&
      Number(approvalDetails.paymentInfo.product_type_id) === Number(productTypeId);

    return Boolean(hasSpecificScreenshots || hasSpecificPayment);
  };

  const isLoading = isInstancesLoading || isDetailsLoading;

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center items-center">
        <Loader size={120} message="Loading Item Groups..." />
      </div>
    );
  }

  if (displayGroups.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground">
        <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No Item Groups found for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Item Groups</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select an item group to upload or view client approval screenshots and payment details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayGroups.map((group, index) => {
          const { instance, title, subtitle } = group;
          const uploaded = isUploadedForInstance(instance);
          const filesCount = getFilesCount(instance);

          const handleAction = () => {
            if (uploaded) {
              onViewClick(instance);
            } else {
              onUploadClick(instance);
            }
          };

          return (
            <motion.div
              key={group.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
            >
              <Card
                className="h-full rounded-2xl border bg-white dark:bg-neutral-900 
                hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)]
                transition-all duration-200 cursor-pointer group"
                onClick={handleAction}
              >
                <CardContent className="px-6 py-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center 
                        border bg-neutral-50 dark:bg-neutral-800 text-primary"
                      >
                        <FolderOpen className="size-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {title}
                        </h3>
                        {subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction();
                      }}
                    >
                      {uploaded ? "View" : "Upload"}
                    </Button>
                  </div>

                  <div className="my-4 border-t" />

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {filesCount} file{filesCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Badge variant={uploaded ? "default" : "secondary"}>
                      {uploaded ? "Uploaded" : "Pending"}
                    </Badge>
                  </div>

                  {filesCount > 0 ? (
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(filesCount, 4) }).map(
                        (_, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 rounded-lg border bg-neutral-100 dark:bg-neutral-800 
                            flex items-center justify-center"
                            style={{ zIndex: 4 - idx }}
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ),
                      )}

                      {filesCount > 4 && (
                        <div
                          className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 
                          flex items-center justify-center text-xs font-medium text-muted-foreground"
                        >
                          +{filesCount - 4}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      No files uploaded yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientApprovalItemGroups;
