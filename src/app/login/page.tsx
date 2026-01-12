"use client";

import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [logoSrc, setLogoSrc] = useState("/logos/vloq.png");
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const [heroSrc, setHeroSrc] = useState("/image.png");

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token) {
      console.log(user && token);
      router.replace("/dashboard");
    }
    console.log("Token fetch Successfully: ", token);
  }, [user, token, router]);

  useEffect(() => {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";

    if (hostname.includes("shambhala")) {
      setUseFallbackLogo(false);
      setLogoSrc("/logos/shambhala.png");
      setHeroSrc("/Shambhala-Login-Page-Image.png");
      return;
    }

    if (hostname.includes("vloq")) {
      setUseFallbackLogo(true);
      setLogoSrc("/logos/furnix-logo-light.png");
      setHeroSrc("/image.png");
      return;
    }

    setUseFallbackLogo(true);
    setLogoSrc("/logos/furnix-logo-light.png");
    setHeroSrc("/image.png");
  }, []);

  return (
    <div className="grid min-h-svh lg:grid-cols-2 w-full">
      {/* Left Section */}
      <div className="flex flex-1 justify-center gap-6 flex-col p-6 md:p-10">
        {/* Logo */}
        <div className="flex justify-center md:justify-center mb-6">
          <a href="#" className="flex items-center gap-2">
            {useFallbackLogo ? (
              <>
                <Image
                  src="/logos/furnix-logo-dark.png"
                  alt="Brand Logo"
                  width={250}
                  height={48}
                  className="object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/logos/furnix-logo-light.png"
                  alt="Brand Logo"
                  width={250}
                  height={48}
                  className="object-contain hidden dark:block"
                  priority
                />
              </>
            ) : (
              <Image
                src={logoSrc}
                alt="Brand Logo"
                width={250}
                height={48}
                className="object-contain"
                priority
              />
            )}
          </a>
        </div>

        {/* Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="bg-muted relative hidden lg:block">
        <Image
          src={heroSrc}
          alt="Background Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          fill
        />
      </div>
    </div>
  );
}
