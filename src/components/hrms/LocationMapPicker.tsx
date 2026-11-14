"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, Check, Loader2, AlertCircle } from "lucide-react";
import { toastManager } from "@/components/ui/toast";

interface LocationMapPickerProps {
  open: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
  onSelect: (data: { latitude: number; longitude: number; address: string }) => void;
}

export function LocationMapPicker({
  open,
  onClose,
  latitude,
  longitude,
  radiusMeters,
  address,
  onSelect,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const [currentLat, setCurrentLat] = useState(latitude || 19.076);
  const [currentLng, setCurrentLng] = useState(longitude || 72.8777);
  const [currentAddress, setCurrentAddress] = useState(address || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentLat(latitude || 19.076);
      setCurrentLng(longitude || 72.8777);
      setCurrentAddress(address || "");
      setLoadError(null);
    }
  }, [open, latitude, longitude, address]);

  // Reverse geocode
  const reverseGeocode = (lat: number, lng: number) => {
    if (typeof (window as any).google === "undefined" || !(window as any).google.maps?.Geocoder) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        setCurrentAddress(results[0].formatted_address);
      }
    });
  };

  // Helper to ensure Google Maps script has loaded
  const waitForGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).google !== "undefined" && (window as any).google.maps?.Map) {
        return resolve();
      }

      // Check if script is already present in document
      let script = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyC1FZNdpxsDhZvcDJcTbbxEfvjJYQUFgSg&libraries=places,geometry";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const checkInterval = setInterval(() => {
        if (typeof (window as any).google !== "undefined" && (window as any).google.maps?.Map) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof (window as any).google !== "undefined" && (window as any).google.maps?.Map) {
          resolve();
        } else {
          reject(new Error("Google Maps took too long to load. Please check your internet connection."));
        }
      }, 8000);
    });
  };

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open) {
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    // Give dialog animation a brief moment to render mapContainerRef
    const initTimer = setTimeout(async () => {
      try {
        await waitForGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        const center = { lat: currentLat, lng: currentLng };

        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 16,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        const marker = new google.maps.Marker({
          position: center,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });

        const circle = new google.maps.Circle({
          map,
          center,
          radius: radiusMeters,
          fillColor: "#10b981",
          fillOpacity: 0.2,
          strokeColor: "#059669",
          strokeWeight: 2,
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          marker.setPosition(e.latLng);
          circle.setCenter(e.latLng);
          setCurrentLat(newLat);
          setCurrentLng(newLng);
          reverseGeocode(newLat, newLng);
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const newLat = pos.lat();
          const newLng = pos.lng();
          circle.setCenter(pos);
          setCurrentLat(newLat);
          setCurrentLng(newLng);
          reverseGeocode(newLat, newLng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;

        // Trigger map resize so container fills 100% height
        setTimeout(() => {
          if (mapInstanceRef.current) {
            google.maps.event.trigger(mapInstanceRef.current, "resize");
            mapInstanceRef.current.setCenter(center);
          }
        }, 150);

        setIsLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err?.message || "Failed to load Google Maps");
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
    };
  }, [open]);

  // Update circle radius when prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusMeters);
    }
  }, [radiusMeters]);

  // Handle address search
  const handleSearch = () => {
    if (!searchQuery.trim() || typeof (window as any).google === "undefined" || !google.maps?.Geocoder) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery.trim() }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const newLat = loc.lat();
        const newLng = loc.lng();
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        setCurrentAddress(results[0].formatted_address);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(loc);
          mapInstanceRef.current.setZoom(17);
          markerRef.current?.setPosition(loc);
          circleRef.current?.setCenter(loc);
        }
      } else {
        toastManager.add({ title: "Location not found. Please try another query.", type: "error" });
      }
    });
  };

  // Get current device GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toastManager.add({ title: "Geolocation not supported by device", type: "error" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        reverseGeocode(newLat, newLng);

        if (mapInstanceRef.current) {
          const loc = { lat: newLat, lng: newLng };
          mapInstanceRef.current.setCenter(loc);
          mapInstanceRef.current.setZoom(17);
          markerRef.current?.setPosition(loc);
          circleRef.current?.setCenter(loc);
        }
      },
      () => {
        setIsLocating(false);
        toastManager.add({ title: "Could not fetch current device location", type: "error" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onSelect({
      latitude: Number(currentLat.toFixed(6)),
      longitude: Number(currentLng.toFixed(6)),
      address: currentAddress.trim() || address,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4 text-emerald-600" />
            Pin Location & Geo-Fence
          </DialogTitle>
          <DialogDescription className="text-xs">
            Click on the map or drag the pin to set the center of the geo-fence ({radiusMeters}m radius).
          </DialogDescription>
        </DialogHeader>

        {/* Search bar & Current location button */}
        <div className="p-3 bg-muted/20 border-b flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search office or site address on Google Maps…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 pl-9 text-xs bg-background"
            />
          </div>
          <Button size="sm" variant="outline" onClick={handleSearch} className="h-8 text-xs">
            Search
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="h-8 text-xs gap-1"
          >
            <Navigation className="size-3" />
            {isLocating ? "Locating…" : "My GPS"}
          </Button>
        </div>

        {/* Map canvas container */}
        <div className="relative flex-1 min-h-[380px] h-[380px] w-full bg-muted/20">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs gap-2">
              <Loader2 className="size-6 animate-spin text-emerald-600" />
              <p className="text-xs text-muted-foreground">Loading Google Maps…</p>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 p-6 text-center gap-2">
              <AlertCircle className="size-7 text-amber-500" />
              <p className="text-sm font-medium">{loadError}</p>
              <Button size="sm" variant="outline" onClick={() => { setIsLoading(true); setLoadError(null); }} className="mt-2 text-xs">
                Retry Loading
              </Button>
            </div>
          )}

          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[380px]"
            style={{ width: "100%", height: "100%", minHeight: "380px" }}
          />
        </div>

        {/* Coordinates summary */}
        <div className="p-3 bg-muted/10 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground font-medium">Latitude / Longitude:</span>
            <p className="font-mono font-semibold text-foreground">
              {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Selected Address:</span>
            <p className="truncate text-foreground font-medium">{currentAddress || "Custom pin coordinates"}</p>
          </div>
        </div>

        <DialogFooter className="p-3 border-t bg-background">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Check className="size-4" />
            Set Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
