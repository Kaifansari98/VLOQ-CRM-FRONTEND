"use client";

import React from "react";
import Lottie from "lottie-react";
import CatAnimation from "../../../public/Loader-Cat-Animation.json";

interface TimeLoaderComponentProps {
  open: boolean;
  message?: string;
}

const TimeLoaderComponent: React.FC<TimeLoaderComponentProps> = ({
  open,
  message = "Switching franchise...",
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="flex flex-col items-center gap-3">
        <Lottie
          animationData={CatAnimation}
          loop
          style={{ width: 220, height: 220 }}
        />
        {/* {message && (
          <p className="text-sm md:text-base text-white/90">{message}</p>
        )} */}
      </div>
    </div>
  );
};

export default TimeLoaderComponent;
