// ImageCarouselModal.tsx
"use client";
import React from "react";
import { X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "../ui/carousel";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";

type SitePhoto = { id: number; signed_url: string; doc_og_name?: string };

interface Props {
  open: boolean;
  initialIndex: number;
  images: SitePhoto[];
  onClose: () => void;
}

export default function ImageCarouselModal({
  open,
  initialIndex,
  images,
  onClose,
}: Props) {
  const [emblaApi, setEmblaApi] = React.useState<CarouselApi | null>(null);
  const [selected, setSelected] = React.useState<number>(initialIndex || 0);
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  // lock background scroll while modal is open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // focus modal container for keyboard usability
  React.useEffect(() => {
    if (open) modalRef.current?.focus();
  }, [open]);

  // when emblaApi becomes available (or initialIndex changes) scroll to the requested slide
  React.useEffect(() => {
    if (!open || !emblaApi) return;
    const safeIndex = Math.max(
      0,
      Math.min(initialIndex, Math.max(0, images.length - 1))
    );
    // emblaApi.scrollTo exists on the Embla API
    emblaApi.scrollTo(safeIndex);
    setSelected(safeIndex);
  }, [emblaApi, initialIndex, images.length, open]);

  // track selected index as user navigates
  React.useEffect((): (() => void) | void => {
    if (!emblaApi) return;
    const updateSelected = () => {
      const idx = (emblaApi as any).selectedScrollSnap?.() ?? 0;
      setSelected(typeof idx === "number" ? idx : 0);
    };
    emblaApi.on("select", updateSelected);
    updateSelected();
    return () => {
      emblaApi.off("select", updateSelected);
    };
  }, [emblaApi]);

  // Esc to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="p-0 h-[90vh] rounded-lg bg-background/10 overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <Button
          onClick={onClose}
          aria-label="Close gallery"
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full z-20 bg-black/20 hover:bg-black/40 text-white"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex items-center justify-center min-h-0 ">
          <Carousel
            setApi={setEmblaApi}
            opts={{ loop: false }}
            className="w-full h-full flex items-center justify-center"
          >
            <CarouselContent className="h-full items-center">
              {images.map((img) => (
                <CarouselItem
                  key={img.id}
                  className="flex items-center justify-center h-full "
                >
                  <div className="flex items-center justify-center w-full h-full p-4">
                    <img
                      src={img.signed_url}
                      alt={img.doc_og_name ?? "site photo"}
                      className="w-full h-full object-contain"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="!left-4 md:!left-6" />
            <CarouselNext className="!right-4 md:!right-6" />
          </Carousel>
        </div>

        <div className="p-3 text-center text-sm text-foreground bg-background/30 backdrop-blur-sm border-t">
          {selected + 1} / {images.length}
        </div>
      </DialogContent>
    </Dialog>
  );
}
