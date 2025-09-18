"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react"; // Lucide se image icon

interface ImageCardProps {
  image: {
    id: number;
    signed_url?: string;
    doc_og_name?: string;
  };
  onClick?: () => void;
  size?: "small" | "medium" | "large"; // optional, height control
}

const sizeClasses = {
  small: "h-20 sm:h-24",
  medium: "h-28 sm:h-32",
  large: "h-32 sm:h-36",
};

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onClick,
  size = "medium",
}) => {
  const hasImage = !!image.signed_url;

  return (
    <div className="relative group">
      {hasImage ? (
        <img
          src={image.signed_url}
          alt={image.doc_og_name ?? "image"}
          className={`${sizeClasses[size]} w-full object-cover rounded-lg border-2 border-gray-200 
            hover:border-blue-400 transition-colors cursor-pointer shadow-sm hover:shadow-md`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400`}
        >
          <ImageIcon className="h-8 w-8 mb-1 opacity-60" />
        </div>
      )}

      {hasImage && (
        <div
          onClick={onClick}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity cursor-pointer"
        >
          <span className="text-white text-xs sm:text-sm font-medium px-2 text-center">
            {image.doc_og_name ?? "image"}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
