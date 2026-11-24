"use client";

import React, { useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MapPicker from "@/components/MapPicker";
import { unshortenUrl } from "@/api/leads";

// Site address + map pin, working like the lead generation form: type an
// address, paste a Google Maps link (resolved to its address), or pick the
// spot on the map. The pin is stored as a google.com/maps?q=lat,lng link.

const GOOGLE_MAPS_URL =
  /^(https?:\/\/)?(www\.)?(google\.[a-z.]{2,6}\/maps|maps\.google\.[a-z.]{2,6}|maps\.app\.goo\.gl|goo\.gl\/maps|share\.google)/i;
const SHORT_MAPS_URL = /maps\.app\.goo\.gl|goo\.gl\/maps|share\.google/i;
const COORDS = /^-?\d+\.\d+,-?\d+\.\d+$/;

const pinLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

function pinFromLink(link: string) {
  const m = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
}

type Geocoder = {
  geocode: (
    request: { address: string } | { location: { lat: number; lng: number } },
    callback: (results: GeocodeResult[] | null, status: string) => void,
  ) => void;
};
type GeocodeResult = {
  formatted_address: string;
  geometry: { location: { lat: () => number; lng: () => number } };
};

function geocode(geocoder: Geocoder, request: Parameters<Geocoder["geocode"]>[0]) {
  return new Promise<GeocodeResult | null>((resolve) =>
    geocoder.geocode(request, (results, status) => resolve(status === "OK" && results?.[0] ? results[0] : null)),
  );
}

/** Resolves a Google Maps link to an address and its coordinates. */
async function resolveMapsLink(value: string) {
  let url = value.trim();
  if (SHORT_MAPS_URL.test(url)) url = await unshortenUrl(url);

  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const coords = at ? { lat: parseFloat(at[1]), lng: parseFloat(at[2]) } : null;

  const named = url.match(/\/place\/([^/]+)/)?.[1] ?? url.match(/[?&]q=([^&]+)/)?.[1];
  const decoded = named ? decodeURIComponent(named.replace(/\+/g, " ")).trim() : "";
  const query = decoded && !COORDS.test(decoded) ? decoded : null;
  const qCoords = !coords && COORDS.test(decoded)
    ? { lat: parseFloat(decoded.split(",")[0]), lng: parseFloat(decoded.split(",")[1]) }
    : null;

  const google = (window as unknown as { google?: { maps?: { Geocoder: new () => Geocoder } } }).google;
  if (!google?.maps) throw new Error("Maps API not loaded");
  const geocoder = new google.maps.Geocoder();

  if (query) {
    const hit = await geocode(geocoder, { address: query });
    if (hit)
      return {
        address: hit.formatted_address,
        lat: hit.geometry.location.lat(),
        lng: hit.geometry.location.lng(),
      };
  }
  const point = coords ?? qCoords;
  if (point) {
    const hit = await geocode(geocoder, { location: point });
    if (hit) return { address: hit.formatted_address, ...point };
  }
  return null;
}

interface SiteLocationFieldProps {
  label: string;
  address: string;
  onAddressChange: (value: string) => void;
  mapLink: string;
  onMapLinkChange: (link: string) => void;
  /**
   * edit: editable address box. locked: address shown but not editable.
   * hidden: the address is shown elsewhere. Outside "edit" the map only sets the pin.
   */
  addressMode?: "edit" | "locked" | "hidden";
  placeholder?: string;
  error?: string;
}

export function SiteLocationField({
  label,
  address,
  onAddressChange,
  mapLink,
  onMapLinkChange,
  addressMode = "edit",
  placeholder = "Enter address, paste a Google Maps link or use the map",
  error,
}: SiteLocationFieldProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  // Ignores a slow lookup once the user has typed something else.
  const latestInput = useRef("");
  const editable = addressMode === "edit";
  const pin = pinFromLink(mapLink);

  const handleChange = async (value: string) => {
    latestInput.current = value;
    setLinkError(null);
    onAddressChange(value);
    if (!value.trim()) {
      onMapLinkChange("");
      return;
    }
    if (!/^https?:\/\/\S+/i.test(value.trim())) return;
    if (!GOOGLE_MAPS_URL.test(value.trim())) {
      setLinkError("Invalid link. Paste a Google Maps link or type the address.");
      return;
    }
    setResolving(true);
    try {
      const hit = await resolveMapsLink(value);
      if (latestInput.current !== value) return;
      if (hit) {
        onAddressChange(hit.address);
        onMapLinkChange(pinLink(hit.lat, hit.lng));
      } else {
        setLinkError("Could not find this location. Try the map instead.");
      }
    } catch {
      if (latestInput.current === value) setLinkError("Could not read this link. Try the map instead.");
    } finally {
      if (latestInput.current === value) setResolving(false);
    }
  };

  const message = linkError ?? error;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMapOpen(true)}
          className="h-7 gap-1 text-[11px] rounded-lg"
        >
          <MapPin className="h-3.5 w-3.5" />
          {pin ? "Update Map" : "Open Map"}
        </Button>
      </div>

      {addressMode !== "hidden" && (
        <div className="relative">
          <Textarea
            value={address}
            onChange={(e) => void handleChange(e.target.value)}
            disabled={!editable || resolving}
            placeholder={placeholder}
            rows={2}
            className={`text-xs rounded-xl resize-none ${resolving ? "text-transparent" : ""}`}
            aria-invalid={!!message}
          />
          {resolving && (
            <div className="absolute top-2 left-3 flex items-center gap-1.5 text-xs text-muted-foreground pointer-events-none">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Resolving address...
            </div>
          )}
        </div>
      )}

      {pin ? (
        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <MapPin className="h-3 w-3" /> Location pinned · view on Google Maps
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        addressMode === "hidden" && (
          <p className="text-[11px] text-muted-foreground">
            No map location for this site yet (optional) · use Open Map to pin it.
          </p>
        )
      )}

      {message && <p className="text-[11px] font-medium text-destructive">{message}</p>}

      <MapPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        savedLocation={pin ? { ...pin, address } : null}
        onSelect={(picked, link) => {
          const coords = pinFromLink(link);
          if (!coords) return;
          setLinkError(null);
          onMapLinkChange(pinLink(coords.lat, coords.lng));
          if (editable) onAddressChange(picked);
        }}
      />
    </div>
  );
}
