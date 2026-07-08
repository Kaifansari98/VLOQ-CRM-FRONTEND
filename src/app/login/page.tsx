"use client";

import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { fetchVendorBySubdomain } from "@/api/vendors";

export default function LoginPage() {
  const router = useRouter();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [logoSrc, setLogoSrc] = useState("/logos/furnix-logo-light.png");
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
    const fetchVendorLogo = async () => {
      const hostname = typeof window !== "undefined" ? window.location.hostname : "";
      const urlParams = new URLSearchParams(window.location.search);
      let subdomain = urlParams.get("subdomain") || urlParams.get("vendor");
      
      if (!subdomain && hostname) {
        const hostParts = hostname.split(".");
        if (hostParts.length > 2) {
          subdomain = hostParts[0];
        } else if (hostname.includes("localhost") && hostParts.length > 1) {
          subdomain = hostParts[0];
        } else if (hostname.includes("vloq.com")) {
          subdomain = "vloq";
        }
      }

      if (subdomain === "localhost") {
        subdomain = null;
      }

      const applyHardcodedFallback = (sub: string) => {
        if (sub.includes("frankvin")) {
          setUseFallbackLogo(false);
          setLogoSrc("/logos/frankvin.png");
          setHeroSrc("/image.png");
          return true;
        }
        if (sub.includes("shambhala")) {
          setUseFallbackLogo(false);
          setLogoSrc("/logos/shambhala.png");
          setHeroSrc("/Shambhala-Login-Page-Image.png");
          return true;
        }
        if (sub.includes("vloq")) {
          setUseFallbackLogo(true);
          setLogoSrc("/logos/furnix-logo-light.png");
          setHeroSrc("/image.png");
          return true;
        }
        return false;
      };

      if (subdomain) {
        try {
          const res = await fetchVendorBySubdomain(subdomain);
          console.log("Response: ", res.data);
          if (res.success && res.data?.logoUrl) {
            setUseFallbackLogo(false);
            setLogoSrc(res.data.logoUrl);
            setHeroSrc("/image.png");
            return;
          }
        } catch (error) {
          console.error("Failed to fetch custom vendor branding:", error);
        }

        if (applyHardcodedFallback(subdomain)) {
          return;
        }
      }

      setUseFallbackLogo(true);
      setLogoSrc("/logos/furnix-logo-light.png");
      setHeroSrc("/image.png");
    };

    fetchVendorLogo();
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
