"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md">
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
    </div>,
    document.body
  );
};

export default TimeLoaderComponent;
