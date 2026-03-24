"use client";

import React from "react";
import Lottie from "lottie-react";
import animationData from "../../../public/still-yet-to-come-animation.json";

interface ComingSoonProps {
  heading: string;
  description: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  heading,
  description,
}) => {
  return (
    <div className="w-full h-[50vh] flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Animation */}
      <div className="w-52 h-52 md:w-120 md:h-fit">
        <Lottie animationData={animationData} loop autoplay />
      </div>

      {/* Heading */}
      <h2 className="mt-14 text-lg font-semibold text-foreground">
        {heading}
      </h2>

      {/* Description */}
      <p className="mt-1 text-sm text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default ComingSoon;
