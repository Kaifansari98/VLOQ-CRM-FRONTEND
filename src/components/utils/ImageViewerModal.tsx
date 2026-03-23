"use client";

import { createPortal } from "react-dom";
import { X, Plus, Minus, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
}

export default function ImageViewerModal({ open, onClose, imageUrl }: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Open/Close logic with animation
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = "hidden";
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 250);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, shouldRender]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 250);
  };

  if (!shouldRender) return null;

  // Reset zoom
  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom Functions
  const zoomIn = () => setScale((s) => Math.min(s + 0.3, 5));
  const zoomOut = () => setScale((s) => (s <= 1 ? 1 : Math.max(s - 0.3, 1)));

  // Drag logic
  const handleMouseDown = (e: any) => {
    if (scale === 1) return;
    setDragging(true);
    setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e: any) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - startDrag.x, y: e.clientY - startDrag.y });
  };
  const handleMouseUp = () => setDragging(false);

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[999999]
        bg-black/80 backdrop-blur-sm
        flex items-center justify-center
        overflow-hidden
        transition-all duration-200
        ${isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
      `}
      style={{ pointerEvents: "auto" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-6 bg-white p-2 rounded-md"
      >
        <X size={26} className="text-black" />
      </button>
      {/* Image */}
      <img
        src={imageUrl}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onMouseDown={handleMouseDown}
        className="rounded-lg cursor-grab active:cursor-grabbing select-none shadow-xl"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: dragging ? "none" : "transform 0.2s ease",
          maxHeight: "95vh",
          maxWidth: "95vw",
          objectFit: "contain",
        }}
      />

      {/* Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3">
        {scale > 1 && (
          <button className="p-2.5 bg-white rounded-lg shadow" onClick={reset}>
            <RefreshCcw className="text-black " size={26} />
          </button>
        )}

        <button className="p-2.5 bg-white rounded-lg shadow" onClick={zoomIn}>
          <Plus className="text-black " size={26} />
        </button>

        <button
          className={`p-2.5 rounded-lg shadow 
            ${scale <= 1 ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
          `}
          disabled={scale <= 1}
          onClick={zoomOut}
        >
          <Minus className="text-black " size={26} />
        </button>
      </div>
    </div>,
    document.body
  );
}
