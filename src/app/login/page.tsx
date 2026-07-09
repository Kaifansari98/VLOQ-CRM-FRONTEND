"use client";

import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import logo from "../../../public/logos/shambhala.png"

import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { fetchVendorBySubdomain } from "@/api/vendors";

export default function LoginPage() {
  const router = useRouter();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [logoSrc, setLogoSrc] = useState("/logos/furnix-logo-dark.png");
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const [heroSrc, setHeroSrc] = useState("/image.png");
  const [logoNaturalSize, setLogoNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      if (subdomain) {
        try {
          const res = await fetchVendorBySubdomain(subdomain);
          console.log("res: ", res)
          console.log("Response: ", res.data);
          if (res.success && res.data) {
            setUseFallbackLogo(false);
            if (res.data.logoUrl) {
              setLogoSrc(res.data.logoUrl);
            } else {
              setLogoSrc("/logos/furnix-logo-dark.png");
            }

            if (res.data.loginImageUrl) {
              setHeroSrc(res.data.loginImageUrl);
            } else {
              setHeroSrc("/image.png");
            }
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Failed to fetch custom vendor branding:", error);
        }
      }

      // Default Fallback
      setUseFallbackLogo(false);
      setLogoSrc("/logos/furnix-logo-dark.png");
      setHeroSrc("/image.png");
      setIsLoading(false);
    };

    fetchVendorLogo();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 w-full">
      {/* Left Section */}
      <div className="flex flex-1 justify-center gap-20 flex-col p-6 md:p-10">
        {/* Logo */}
        <div className="flex justify-center md:justify-center mb-6">
          <a href="#" className="flex items-center gap-2">
            {useFallbackLogo ? (
              <>
                <Image
                  src="/logos/furnix-logo-dark.png"
                  alt="Brand Logo"
                  width={220}
                  height={48}
                  className="object-contain dark:hidden"
                  style={{ maxHeight: "48px", width: "auto" }}
                  priority
                />
                <Image
                  src="/logos/furnix-logo-light.png"
                  alt="Brand Logo"
                  width={220}
                  height={48}
                  className="object-contain hidden dark:block"
                  style={{ maxHeight: "48px", width: "auto" }}
                  priority
                />
              </>
            ) : (
              <div
                className="flex items-center justify-center"
                style={{ maxWidth: "360px", maxHeight: "120px", minHeight: "60px" }}
              >
                <Image
                  src={logo}
                  alt="Brand Logo"
                  width={logoNaturalSize?.width ?? 360}
                  height={logoNaturalSize?.height ?? 120}
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    setLogoNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                  onError={() => {
                    setUseFallbackLogo(true);
                  }}
                  className="object-contain"
                  style={{
                    maxWidth: "300px",
                    maxHeight: "120px",
                    width: "auto",
                    height: "auto",
                  }}
                  priority
                />
              </div>
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
          onError={() => setHeroSrc("/image.png")}
        />
      </div>
    </div>
  );
}
