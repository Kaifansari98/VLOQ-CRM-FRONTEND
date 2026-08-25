"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toastManager } from "@/components/ui/toast";
import {
  useLeadBillingInformation,
  useUpsertLeadBillingInformation,
} from "@/hooks/booking-stage/use-booking";
import type { LeadBillingAddress } from "@/api/booking";
import TextAreaInput from "@/components/origin-text-area";
import MapPicker from "@/components/MapPicker";
import { MapPin, FolderOpen, ArrowLeft, Building2, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type AddressForm = {
  name: string;
  address: string;
  map_link: string;
  gst_number: string;
  state_name: string;
  place_of_supply: string;
};

interface BillingInformationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  vendorId: number;
  productTypeTabs?: { productTypeId: number; label: string }[];
  activeProductTypeId?: number | null;
}

const emptyAddress = (): AddressForm => ({
  name: "",
  address: "",
  map_link: "",
  gst_number: "",
  state_name: "",
  place_of_supply: "",
});

const normalizeAddress = (address?: LeadBillingAddress | null): AddressForm => ({
  name: address?.name ?? "",
  address: address?.address ?? "",
  map_link: address?.map_link ?? "",
  gst_number: address?.gst_number ?? "",
  state_name: address?.state_name ?? "",
  place_of_supply: address?.place_of_supply ?? "",
});

const areAddressesEqual = (first: AddressForm, second: AddressForm) =>
  first.name === second.name &&
  first.address === second.address &&
  first.map_link === second.map_link &&
  first.gst_number === second.gst_number &&
  first.state_name === second.state_name &&
  first.place_of_supply === second.place_of_supply;

const toPayloadAddress = (address: AddressForm): LeadBillingAddress => ({
  name: address.name,
  address: address.address,
  map_link: address.map_link,
  gst_number: address.gst_number,
  state_name: address.state_name,
  place_of_supply: address.place_of_supply,
});

export default function BillingInformationModal({
  open,
  onOpenChange,
  leadId,
  vendorId,
  productTypeTabs,
  activeProductTypeId,
}: BillingInformationModalProps) {
  const [takeBillOnInstanceLevel, setTakeBillOnInstanceLevel] = useState(true);
  const [selectedCard, setSelectedCard] = useState<{
    productTypeId: number | null;
    label: string;
  } | null>(null);

  const instanceCount = productTypeTabs?.length ?? 0;
  const hasMultipleInstances = instanceCount > 1;
  const hasSingleInstance = instanceCount === 1;

  useEffect(() => {
    if (!open) {
      setSelectedCard(null);
      setTakeBillOnInstanceLevel(true);
      return;
    }

    setTakeBillOnInstanceLevel(true);

    if (hasSingleInstance && productTypeTabs) {
      setSelectedCard({
        productTypeId: productTypeTabs[0].productTypeId,
        label: productTypeTabs[0].label,
      });
    } else if (hasMultipleInstances) {
      setSelectedCard(null);
    } else {
      setSelectedCard({ productTypeId: null, label: "Overall Lead" });
    }
  }, [open, instanceCount, hasSingleInstance, hasMultipleInstances, productTypeTabs]);

  const selectedProductTypeId = selectedCard?.productTypeId ?? null;

  const { data: overallData } = useLeadBillingInformation(
    vendorId,
    leadId,
    null,
  );

  const configuredProductTypeIds = useMemo(() => {
    return overallData?.configuredProductTypeIds || [];
  }, [overallData?.configuredProductTypeIds]);

  const { data, isLoading } = useLeadBillingInformation(
    vendorId,
    leadId,
    selectedProductTypeId,
  );

  const upsertBillingInformation = useUpsertLeadBillingInformation();
  const [billingAddress, setBillingAddress] = useState<AddressForm>(emptyAddress);
  const [shippingAddress, setShippingAddress] = useState<AddressForm>(emptyAddress);
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [activeMapType, setActiveMapType] = useState<"billing" | "shipping" | null>(
    null,
  );

  const cardList = useMemo(() => {
    const list: { productTypeId: number | null; label: string; subtitle?: string }[] = [];

    if (productTypeTabs && productTypeTabs.length > 0) {
      for (const tab of productTypeTabs) {
        list.push({
          productTypeId: tab.productTypeId,
          label: tab.label,
        });
      }
    }

    return list;
  }, [productTypeTabs]);

  const activeSavedLocation = useMemo(() => {
    if (activeMapType === "billing" && billingAddress.map_link.includes("maps?q=")) {
      const coords = billingAddress.map_link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coords) {
        return {
          lat: parseFloat(coords[1]),
          lng: parseFloat(coords[2]),
          address: billingAddress.address,
        };
      }
    }

    if (
      activeMapType === "shipping" &&
      shippingAddress.map_link.includes("maps?q=")
    ) {
      const coords = shippingAddress.map_link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coords) {
        return {
          lat: parseFloat(coords[1]),
          lng: parseFloat(coords[2]),
          address: shippingAddress.address,
        };
      }
    }

    return null;
  }, [activeMapType, billingAddress.address, billingAddress.map_link, shippingAddress.address, shippingAddress.map_link]);

  useEffect(() => {
    if (!open || !selectedCard) return;

    const nextBillingAddress = normalizeAddress(data?.billingAddress);
    const nextShippingAddress = normalizeAddress(data?.shippingAddress);
    const isSame = areAddressesEqual(nextBillingAddress, nextShippingAddress);

    setBillingAddress(nextBillingAddress);
    setShippingAddress(nextShippingAddress);
    setSameAsShipping(isSame && nextBillingAddress.address.length > 0);
  }, [data, open, selectedCard]);

  useEffect(() => {
    if (!sameAsShipping) return;
    setShippingAddress(billingAddress);
  }, [billingAddress, sameAsShipping]);

  const isSubmitting = upsertBillingInformation.isPending;

  const sectionFields = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        type: "input" as const,
      },
      {
        key: "address",
        label: "Address",
        type: "address" as const,
      },
      {
        key: "gst_number",
        label: "GST Number",
        type: "input" as const,
      },
      {
        key: "state_name",
        label: "State Name",
        type: "input" as const,
      },
      {
        key: "place_of_supply",
        label: "Place of Supply",
        type: "input" as const,
      },
    ],
    [],
  );

  const updateAddressField = (
    type: "billing" | "shipping",
    key: keyof AddressForm,
    value: string,
  ) => {
    if (type === "billing") {
      setBillingAddress((prev) => ({ ...prev, [key]: value }));
      return;
    }

    setShippingAddress((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    upsertBillingInformation.mutate(
      {
        vendorId,
        leadId,
        payload: {
          product_type_id: takeBillOnInstanceLevel ? selectedProductTypeId : null,
          billingAddress: toPayloadAddress(billingAddress),
          shippingAddress: toPayloadAddress(
            sameAsShipping ? billingAddress : shippingAddress,
          ),
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `Billing information for ${selectedCard?.label ?? "Lead"} saved successfully!`,
            type: "success",
          });
          if (hasMultipleInstances && takeBillOnInstanceLevel) {
            setSelectedCard(null);
          } else {
            onOpenChange(false);
          }
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to save billing information",
            type: "error",
          });
        },
      },
    );
  };

  const handleModalOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (selectedCard && hasMultipleInstances && takeBillOnInstanceLevel) {
        setSelectedCard(null);
        return;
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={handleModalOpenChange}
      title={
        selectedCard && selectedCard.productTypeId !== null
          ? `Billing Information - ${selectedCard.label}`
          : "Billing Information"
      }
      description="Manage Bill To and Ship To details for this lead."
      size="xl"
    >
      <div className="p-5">
        {!selectedCard ? (
          instanceCount > 0 && (
            <div className="flex items-center justify-between border-b pb-3.5 mb-5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="takeBillOnInstanceLevel"
                  checked={takeBillOnInstanceLevel}
                  disabled={configuredProductTypeIds.length > 0}
                  onCheckedChange={(checked) => {
                    if (configuredProductTypeIds.length > 0) return;
                    const isChecked = Boolean(checked);
                    setTakeBillOnInstanceLevel(isChecked);
                    if (!isChecked) {
                      setSelectedCard({ productTypeId: null, label: "Overall Lead" });
                    } else {
                      if (hasSingleInstance && productTypeTabs) {
                        setSelectedCard({
                          productTypeId: productTypeTabs[0].productTypeId,
                          label: productTypeTabs[0].label,
                        });
                      } else {
                        setSelectedCard(null);
                      }
                    }
                  }}
                />
                <label
                  htmlFor="takeBillOnInstanceLevel"
                  className={cn(
                    "text-sm font-medium select-none",
                    configuredProductTypeIds.length > 0
                      ? "text-muted-foreground cursor-not-allowed opacity-70"
                      : "text-foreground cursor-pointer",
                  )}
                >
                  Take Bill Address on Instance Level
                </label>
              </div>
            </div>
          )
        ) : null}

        {!selectedCard && hasMultipleInstances && takeBillOnInstanceLevel ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cardList.map((card, idx) => {
                const isCompleted = Boolean(
                  card.productTypeId &&
                    configuredProductTypeIds.includes(card.productTypeId),
                );

                return (
                  <motion.div
                    key={`card-${card.productTypeId ?? "overall"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                  >
                    <Card
                      className="h-full rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer group"
                      onClick={() =>
                        setSelectedCard({
                          productTypeId: card.productTypeId,
                          label: card.label,
                        })
                      }
                    >
                      <CardContent className="px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md flex items-center justify-center border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-foreground group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-200">
                              {card.productTypeId === null ? (
                                <Building2 className="size-3.5" />
                              ) : (
                                <FolderOpen className="size-3.5" />
                              )}
                            </div>

                            <div>
                              <h4 className="font-semibold text-xs">
                                {card.label}
                              </h4>
                              {card.subtitle && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                  {card.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] text-muted-foreground group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-200"
                          >
                            Manage
                          </Button>
                        </div>

                        <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-medium text-[11px]">Billing Details</span>
                          {isCompleted ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 flex items-center gap-1"
                            >
                              <CheckCircle2 className="size-3" /> Completed
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 font-normal flex items-center gap-1 text-muted-foreground"
                            >
                              <Clock className="size-3" /> Pending
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl border p-4">
                <h3 className="text-base font-semibold">Bill To</h3>
                {sectionFields.map((field) => (
                  <div key={`billing-${field.key}`} className="space-y-2">
                    {field.type === "address" ? (
                      <div className="flex items-center justify-between gap-3">
                        <Label>{field.label}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveMapType("billing")}
                          disabled={isLoading || isSubmitting}
                          className="flex items-center gap-1"
                        >
                          <MapPin className="h-4 w-4" />
                          {billingAddress.map_link ? "Update Map" : "Open Map"}
                        </Button>
                      </div>
                    ) : (
                      <Label>{field.label}</Label>
                    )}
                    {field.type === "address" ? (
                      <div className="space-y-2">
                        <TextAreaInput
                          value={billingAddress.address}
                          onChange={(value) =>
                            updateAddressField("billing", "address", value)
                          }
                          placeholder="Enter address or use map"
                          disabled={isLoading || isSubmitting}
                        />
                      </div>
                    ) : (
                      <Input
                        value={billingAddress[field.key as keyof AddressForm]}
                        onChange={(event) =>
                          updateAddressField(
                            "billing",
                            field.key as keyof AddressForm,
                            event.target.value,
                          )
                        }
                        disabled={isLoading || isSubmitting}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">Ship To</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameAsShipping"
                      checked={sameAsShipping}
                      onCheckedChange={(checked) => setSameAsShipping(Boolean(checked))}
                      disabled={isLoading || isSubmitting}
                    />
                    <label
                      htmlFor="sameAsShipping"
                      className="text-xs text-muted-foreground font-normal cursor-pointer"
                    >
                      Billing address same as shipping address
                    </label>
                  </div>
                </div>

                {sectionFields.map((field) => (
                  <div key={`shipping-${field.key}`} className="space-y-2">
                    {field.type === "address" ? (
                      <div className="flex items-center justify-between gap-3">
                        <Label>{field.label}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveMapType("shipping")}
                          disabled={isLoading || isSubmitting || sameAsShipping}
                          className="flex items-center gap-1"
                        >
                          <MapPin className="h-4 w-4" />
                          {shippingAddress.map_link ? "Update Map" : "Open Map"}
                        </Button>
                      </div>
                    ) : (
                      <Label>{field.label}</Label>
                    )}
                    {field.type === "address" ? (
                      <div className="space-y-2">
                        <TextAreaInput
                          value={shippingAddress.address}
                          onChange={(value) =>
                            updateAddressField("shipping", "address", value)
                          }
                          placeholder="Enter address or use map"
                          disabled={isLoading || isSubmitting || sameAsShipping}
                        />
                      </div>
                    ) : (
                      <Input
                        value={shippingAddress[field.key as keyof AddressForm]}
                        onChange={(event) =>
                          updateAddressField(
                            "shipping",
                            field.key as keyof AddressForm,
                            event.target.value,
                          )
                        }
                        disabled={isLoading || isSubmitting || sameAsShipping}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (hasMultipleInstances && takeBillOnInstanceLevel) {
                    setSelectedCard(null);
                  } else {
                    onOpenChange(false);
                  }
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Information"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <MapPicker
        open={Boolean(activeMapType)}
        onClose={() => setActiveMapType(null)}
        savedLocation={activeSavedLocation}
        onSelect={(address: string, link: string) => {
          if (!activeMapType) return;
          if (activeMapType === "billing") {
            setBillingAddress((prev) => ({
              ...prev,
              address: address || prev.address,
              map_link: link,
            }));
          } else {
            setShippingAddress((prev) => ({
              ...prev,
              address: address || prev.address,
              map_link: link,
            }));
          }
          setActiveMapType(null);
        }}
      />
    </BaseModal>
  );
}
