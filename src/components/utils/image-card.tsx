"use client";

import React from "react";

interface ImageCardProps {
  image: {
    id: number;
    signed_url: string;
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

const ImageCard: React.FC<ImageCardProps> = ({ image, onClick, size = "medium" }) => {
  return (
    <div className="relative group">
      <img
        src={image.signed_url}
        alt={image.doc_og_name ?? "image"}
        className={`${sizeClasses[size]} w-full object-cover rounded-lg border-2 border-gray-200 
          hover:border-blue-400 transition-colors cursor-pointer shadow-sm hover:shadow-md`}
      />
      <div
        onClick={onClick}
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity cursor-pointer"
      >
        <span className="text-white text-xs sm:text-sm font-medium px-2 text-center">
          {image.doc_og_name ?? "image"}
        </span>
      </div>
    </div>
  );
};

export default ImageCard;
