"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toastManager } from "@/components/ui/toast";
import {
  useLeadBillingInformation,
  useUpsertLeadBillingInformation,
} from "@/hooks/booking-stage/use-booking";
import type { LeadBillingAddress } from "@/api/booking";
import TextAreaInput from "@/components/origin-text-area";
import MapPicker from "@/components/MapPicker";
import { MapPin } from "lucide-react";

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
}: BillingInformationModalProps) {
  const { data, isLoading } = useLeadBillingInformation(vendorId, leadId);
  const upsertBillingInformation = useUpsertLeadBillingInformation();
  const [billingAddress, setBillingAddress] = useState<AddressForm>(emptyAddress);
  const [shippingAddress, setShippingAddress] = useState<AddressForm>(emptyAddress);
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [activeMapType, setActiveMapType] = useState<"billing" | "shipping" | null>(
    null,
  );

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
    if (!open) return;

    const nextBillingAddress = normalizeAddress(data?.billingAddress);
    const nextShippingAddress = normalizeAddress(data?.shippingAddress);
    const isSame = areAddressesEqual(nextBillingAddress, nextShippingAddress);

    setBillingAddress(nextBillingAddress);
    setShippingAddress(nextShippingAddress);
    setSameAsShipping(isSame && nextBillingAddress.address.length > 0);
  }, [data, open]);

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
          billingAddress: toPayloadAddress(billingAddress),
          shippingAddress: toPayloadAddress(
            sameAsShipping ? billingAddress : shippingAddress,
          ),
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Billing information saved successfully!",
            type: "success",
          });
          onOpenChange(false);
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

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Billing Information"
      description="Manage Bill To and Ship To details for this lead."
      size="xl"
    >
      <div className="space-y-6 p-5">
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
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold">Ship To</h3>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={sameAsShipping}
                  onCheckedChange={(checked) => {
                    const enabled = checked === true;
                    setSameAsShipping(enabled);
                    if (enabled) {
                      setShippingAddress(billingAddress);
                    }
                  }}
                  disabled={isLoading || isSubmitting}
                />
                <span>Billing address same as shipping address</span>
              </label>
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
                      disabled={sameAsShipping || isLoading || isSubmitting}
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
                      disabled={sameAsShipping || isLoading || isSubmitting}
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
                    disabled={sameAsShipping || isLoading || isSubmitting}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Information"}
          </Button>
        </div>

        <MapPicker
          open={activeMapType !== null}
          onClose={() => setActiveMapType(null)}
          savedLocation={activeSavedLocation}
          onSelect={(address, link) => {
            if (activeMapType === "billing") {
              setBillingAddress((prev) => ({
                ...prev,
                address,
                map_link: link,
              }));
            }

            if (activeMapType === "shipping") {
              setShippingAddress((prev) => ({
                ...prev,
                address,
                map_link: link,
              }));
            }

            setActiveMapType(null);
          }}
        />
      </div>
    </BaseModal>
  );
}
