"use client";

import React from "react";
import Lottie from "lottie-react";
import loaderAnimation from "../../../public/furnixLoader.json";

interface LoaderProps {
  size?: number; // custom size
  fullScreen?: boolean; // if true, covers the entire screen
  message?: string; // optional loading message
  animationData?: object; // custom animation (optional)
}

const Loader: React.FC<LoaderProps> = ({
  size = 300,
  fullScreen = false,
  message,
  animationData,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-2">
      <Lottie
        animationData={animationData || loaderAnimation}
        loop
        style={{ width: size, height: size }}
      />
      {message && <p className="text-sm md:text-xl text-gray-600 -mt-20">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
