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
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

interface ViewAttendanceMapModalProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  date: string;
  checkIn?: {
    time?: string;
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
  };
  checkOut?: {
    time?: string;
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
  };
  assignedLocation?: {
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  };
}

export function ViewAttendanceMapModal({
  open,
  onClose,
  employeeName,
  date,
  checkIn,
  checkOut,
  assignedLocation,
}: ViewAttendanceMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Helper to ensure Google Maps script has loaded
  const waitForGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).google !== "undefined" && (window as any).google.maps?.Map) {
        return resolve();
      }

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
          reject(new Error("Google Maps took too long to load."));
        }
      }, 8000);
    });
  };

  useEffect(() => {
    if (!open) {
      mapInstanceRef.current = null;
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    const initTimer = setTimeout(async () => {
      try {
        await waitForGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        const defaultCenter = {
          lat: checkIn?.lat || assignedLocation?.lat || 19.076,
          lng: checkIn?.lng || assignedLocation?.lng || 72.8777,
        };

        const map = new google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        });

        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;

        // 1. Draw assigned geo-fence circle if available
        if (assignedLocation?.lat && assignedLocation?.lng) {
          const officeCenter = { lat: assignedLocation.lat, lng: assignedLocation.lng };
          new google.maps.Circle({
            map,
            center: officeCenter,
            radius: assignedLocation.radius || 100,
            fillColor: "#10b981",
            fillOpacity: 0.15,
            strokeColor: "#059669",
            strokeWeight: 2,
          });

          new google.maps.Marker({
            position: officeCenter,
            map,
            title: assignedLocation.name || "Assigned Office / Site",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#059669",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          bounds.extend(officeCenter);
          hasPoints = true;
        }

        // 2. Check-in pin
        if (checkIn?.lat && checkIn?.lng) {
          const inPos = { lat: checkIn.lat, lng: checkIn.lng };
          new google.maps.Marker({
            position: inPos,
            map,
            label: { text: "IN", color: "#ffffff", fontSize: "11px", fontWeight: "bold" },
            title: `Check In: ${checkIn.time || ""}`,
          });
          bounds.extend(inPos);
          hasPoints = true;
        }

        // 3. Check-out pin
        if (checkOut?.lat && checkOut?.lng) {
          const outPos = { lat: checkOut.lat, lng: checkOut.lng };
          new google.maps.Marker({
            position: outPos,
            map,
            label: { text: "OUT", color: "#ffffff", fontSize: "11px", fontWeight: "bold" },
            title: `Check Out: ${checkOut.time || ""}`,
          });
          bounds.extend(outPos);
          hasPoints = true;
        }

        if (hasPoints) {
          map.fitBounds(bounds, 50);
          const listener = google.maps.event.addListener(map, "idle", () => {
            if (map.getZoom() && (map.getZoom() as number) > 17) {
              map.setZoom(17);
            }
            google.maps.event.removeListener(listener);
          });
        }

        mapInstanceRef.current = map;

        setTimeout(() => {
          if (mapInstanceRef.current) {
            google.maps.event.trigger(mapInstanceRef.current, "resize");
            mapInstanceRef.current.setCenter(defaultCenter);
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

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4 text-emerald-600" />
              Attendance Location Map
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Viewing GPS check-in/out records for <span className="font-semibold text-foreground">{employeeName}</span> on {date}.
          </DialogDescription>
        </DialogHeader>

        {/* Map canvas */}
        <div className="relative flex-1 min-h-[380px] h-[380px] w-full bg-muted/20">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs gap-2">
              <Loader2 className="size-6 animate-spin text-emerald-600" />
              <p className="text-xs text-muted-foreground">Loading attendance map…</p>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 p-6 text-center gap-2">
              <AlertCircle className="size-7 text-amber-500" />
              <p className="text-sm font-medium">{loadError}</p>
            </div>
          )}

          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[380px]"
            style={{ width: "100%", height: "100%", minHeight: "380px" }}
          />
        </div>

        {/* Info strip */}
        <div className="p-3 bg-muted/10 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {checkIn?.lat && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <Navigation className="size-3.5" />
                Check In {checkIn.time ? `(${checkIn.time})` : ""}
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {checkIn.lat.toFixed(6)}, {checkIn.lng?.toFixed(6)}
              </p>
              {checkIn.address && <p className="truncate text-foreground text-[11px]">{checkIn.address}</p>}
            </div>
          )}

          {checkOut?.lat && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                <Navigation className="size-3.5" />
                Check Out {checkOut.time ? `(${checkOut.time})` : ""}
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {checkOut.lat.toFixed(6)}, {checkOut.lng?.toFixed(6)}
              </p>
              {checkOut.address && <p className="truncate text-foreground text-[11px]">{checkOut.address}</p>}
            </div>
          )}

          {assignedLocation?.name && (
            <div className="sm:col-span-2 pt-1 border-t flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600" />
                Assigned: <strong className="text-foreground">{assignedLocation.name}</strong> ({assignedLocation.radius || 100}m radius)
              </span>
              {assignedLocation.address && (
                <span className="truncate max-w-[260px] text-right">{assignedLocation.address}</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-3 border-t bg-background">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
