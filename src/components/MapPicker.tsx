"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin } from "lucide-react";

interface MapPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (address: string, link: string) => void;
  savedLocation?: { lat: number; lng: number; address: string } | null;
}

export default function MapPicker({
  open,
  onClose,
  onSelect,
  savedLocation,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(savedLocation || null);
  // hold pending selection, allow confirm before firing onSelect
  const [pendingSelection, setPendingSelection] = useState<{
    lat: number;
    lng: number;
    address: string;
    link: string;
  } | null>(null);

  const isGoogleMapsLoaded = () =>
    !!(window as any).google?.maps && !!(window as any).google?.maps?.places;

  const waitForGoogleMaps = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (isGoogleMapsLoaded()) return resolve();
      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Google Maps failed to load"));
      }, 10000);
    });

  const placeMarkerAndGetAddress = (
    position: google.maps.LatLng,
    fromSearch = false
  ) => {
    if (!mapInstance.current) return;
    setError(null);
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new google.maps.Marker({
      position,
      map: mapInstance.current,
      animation: google.maps.Animation.DROP,
    });
    if (fromSearch) {
      mapInstance.current.setCenter(position);
      mapInstance.current.setZoom(16);
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      const link = `https://www.google.com/maps?q=${position.lat()},${position.lng()}`;
      if (status === "OK" && results?.[0]) {
        const address = results[0].formatted_address;
        // Print Google maps link and address
        console.log("📍 Map Link:", link);
        console.log("🏠 Address:", address);
        setPendingSelection({
          lat: position.lat(),
          lng: position.lng(),
          address,
          link,
        });
      } else {
        setError(
          "Unable to get address for this location. Please try selecting a different location."
        );
        if (markerRef.current) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
        setPendingSelection(null);
      }
    });
  };

  const initializeSearchBox = () => {
    if (!searchInputRef.current || !mapInstance.current) return;
    searchBoxRef.current = new google.maps.places.SearchBox(
      searchInputRef.current
    );
    mapInstance.current.addListener("bounds_changed", () => {
      if (searchBoxRef.current && mapInstance.current) {
        searchBoxRef.current.setBounds(mapInstance.current.getBounds()!);
      }
    });
    searchBoxRef.current.addListener("places_changed", () => {
      if (!searchBoxRef.current || !mapInstance.current) return;
      const places = searchBoxRef.current.getPlaces();
      if (!places || places.length === 0) {
        setIsSearching(false);
        return;
      }
      const place = places[0];
      if (!place.geometry || !place.geometry.location) {
        setIsSearching(false);
        return;
      }
      setSearchQuery("");
      setIsSearching(false);
      placeMarkerAndGetAddress(place.geometry.location, true);
    });
  };

  const initializeMap = async () => {
    if (!mapRef.current) return;
    try {
      setIsLoading(true);
      setError(null);
      setMapError(null);
      await waitForGoogleMaps();
      if (!(window as any).google?.maps?.Map) {
        throw new Error("Google Maps API not properly loaded");
      }
      const initialCenter = currentLocation
        ? { lat: currentLocation.lat, lng: currentLocation.lng }
        : { lat: 19.076, lng: 72.8777 };
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: currentLocation ? 16 : 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      if (currentLocation) {
        markerRef.current = new google.maps.Marker({
          position: initialCenter,
          map: mapInstance.current,
          animation: google.maps.Animation.DROP,
        });
      }
      setTimeout(() => {
        initializeSearchBox();
      }, 100);
      google.maps.event.addListener(mapInstance.current, "tilesloaded", () => {
        setIsLoading(false);
      });
      mapInstance.current.addListener(
        "click",
        (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || !mapInstance.current) return;
          placeMarkerAndGetAddress(e.latLng);
        }
      );
      setIsLoading(false);
    } catch (err) {
      setMapError(
        err instanceof Error ? err.message : "Failed to load map"
      );
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);

  // CHANGED: search button is now type="button", so form is never submitted
  const handleSearchButtonClick = () => {
    // No-op; SearchBox handles search via input changes/enter key.
    // This avoids an accidental submit or reload.
  };

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    setError(null);
    setMapError(null);
    setSearchQuery("");
    setIsSearching(false);
    setCurrentLocation(savedLocation || null);
    setPendingSelection(null);
    const timer = setTimeout(() => {
      initializeMap();
    }, 200);
    return () => {
      clearTimeout(timer);
    };
  }, [open, savedLocation]);

  useEffect(() => {
    if (!open || !mapInstance.current || isLoading) return;
    const timer = setTimeout(() => {
      if (mapInstance.current) {
        google.maps.event.trigger(mapInstance.current, "resize");
        const center = currentLocation
          ? { lat: currentLocation.lat, lng: currentLocation.lng }
          : { lat: 19.076, lng: 72.8777 };
        mapInstance.current.setCenter(center);
        mapInstance.current.setZoom(currentLocation ? 16 : 12);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [open, isLoading, currentLocation]);

  const handleRetry = () => {
    initializeMap();
  };

  const handleConfirm = () => {
    if (!pendingSelection) return;
    setCurrentLocation(pendingSelection);
    onSelect(pendingSelection.address, pendingSelection.link);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-1 flex-shrink-0">
          <DialogTitle>Select Location on Map</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Search for a location or click on the map to select
          </p>
        </DialogHeader>
        <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
          <div className="flex gap-2 mb-4 flex-shrink-0">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                  disabled={isLoading || mapError !== null}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                />
              </div>
              <Button
                type="button" // Changed from submit!
                size="sm"
                disabled={
                  isLoading ||
                  mapError !== null ||
                  !searchQuery.trim() ||
                  isSearching
                }
                onClick={handleSearchButtonClick}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {currentLocation && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm mb-4 flex-shrink-0">
              <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-blue-800 font-medium">Current:</span>
              <span className="text-blue-700 flex-1 truncate">
                {currentLocation.address}
              </span>
            </div>
          )}
          <div className="relative flex-1 bg-gray-100 rounded-lg overflow-hidden border min-h-[450px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center gap-4 p-6 text-center">
                  <p className="text-red-600 font-medium">Failed to load map</p>
                  <p className="text-sm text-gray-600">{mapError}</p>
                  <Button onClick={handleRetry} size="sm">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                <div className="flex flex-col items-center gap-4 p-6 text-center max-w-md mx-auto">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-medium text-sm">
                      Address Not Found
                    </p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setError(null)} size="sm" variant="outline">
                      Try Different Location
                    </Button>
                    <Button onClick={onClose} size="sm">
                      Enter Manually
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full absolute inset-0" />
          </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  Search above or click anywhere on the map to select that location
                </p>
              </div>
          {pendingSelection && (
            <div className="mt-4 flex flex-col gap-2 items-end">
              <Button size="sm" onClick={handleConfirm}>Confirm Selection</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
