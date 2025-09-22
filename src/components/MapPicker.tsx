"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MapPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (address: string, link: string) => void;
}

export default function MapPicker({ open, onClose, onSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Function to check if Google Maps is loaded
  const isGoogleMapsLoaded = () => {
    return !!(window as any).google?.maps;
  };

  // Function to wait for Google Maps to load
  const waitForGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isGoogleMapsLoaded()) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Google Maps failed to load'));
      }, 10000);
    });
  };

  // Function to initialize the map
  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      setMapError(null);

      // Wait for Google Maps to load
      await waitForGoogleMaps();

      // Check if Google Maps loaded properly
      if (!(window as any).google?.maps?.Map) {
        throw new Error('Google Maps API not properly loaded');
      }

      // Create map instance
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 19.0760, lng: 72.8777 }, // Mumbai coordinates
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // Check for map initialization errors
      google.maps.event.addListener(mapInstance.current, 'idle', () => {
        console.log('Google Maps loaded successfully');
      });

      google.maps.event.addListener(mapInstance.current, 'tilesloaded', () => {
        setIsLoading(false);
      });

      // Add click handler
      mapInstance.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !mapInstance.current) return;
        
        // Clear any previous errors when user clicks
        setError(null);
      
        if (markerRef.current) markerRef.current.setMap(null);
      
        markerRef.current = new google.maps.Marker({
          position: e.latLng,
          map: mapInstance.current,
          animation: google.maps.Animation.DROP,
        });
      
        const geocoder = new google.maps.Geocoder();
      
        geocoder.geocode({ location: e.latLng }, (results, status) => {
          const link = `https://www.google.com/maps?q=${e.latLng!.lat()},${e.latLng!.lng()}`;
          
          if (status === "OK" && results?.[0]) {
            const address = results[0].formatted_address;
            
            console.log("📍 Map Link:", link);
            console.log("🏠 Address:", address);
            
            // ✅ Pass the formatted address
            onSelect(address, link);
            onClose();
          } else {
            console.error("Geocoding failed:", status);
            
            // ✅ Set error state instead of alert
            setError("Unable to get address for this location. Please try selecting a different location.");
            
            // Remove the marker since we couldn't get address
            if (markerRef.current) {
              markerRef.current.setMap(null);
              markerRef.current = null;
            }
            
            // Don't close the dialog, let user try again
            return;
          }
        });
      });
      

      setIsLoading(false);
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setMapError(err instanceof Error ? err.message : "Failed to load map");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    // Reset states when dialog opens
    setIsLoading(true);
    setError(null);
    setMapError(null);

    // Initialize map after a short delay to ensure dialog is fully rendered
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [open]);

  // Trigger map resize when dialog is fully open
  useEffect(() => {
    if (!open || !mapInstance.current || isLoading) return;

    const timer = setTimeout(() => {
      if (mapInstance.current) {
        google.maps.event.trigger(mapInstance.current, "resize");
        mapInstance.current.setCenter({ lat: 19.0760, lng: 72.8777 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, isLoading]);

  const handleRetry = () => {
    initializeMap();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Select Location on Map</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Click on the map to select a location
          </p>
        </DialogHeader>
        
        <div className="relative w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden">
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
              <div className="flex flex-col items-center gap-4 p-6 text-center max-w-md">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-medium text-sm">Address Not Found</p>
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
          
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-muted-foreground">
            Click anywhere on the map to select that location
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}