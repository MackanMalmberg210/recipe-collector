"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "../ui/ToastProvider";

export default function AuthCallbackListener() {
  const router = useRouter();
  const pathname = usePathname();
  const { error: showErrorToast, info: showInfoToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) return;

    // 1. Handle Expired OTP or Access Denied
    if (hash.includes("error=access_denied") || hash.includes("otp_expired") || hash.includes("error_description")) {
      showErrorToast("This password reset link has expired or was already used. Please request a new one. ⏳");
      // Clean up URL hash
      window.history.replaceState(null, "", pathname || "/");
      if (pathname !== "/login") {
        router.push("/login?mode=forgot_password");
      }
      return;
    }

    // 2. Handle Password Recovery Token Hash -> Navigate to /reset-password
    if (hash.includes("type=recovery")) {
      if (pathname !== "/reset-password") {
        showInfoToast("Reset link verified! Please choose your new password. 🔑");
        router.push(`/reset-password${hash}`);
      }
    }
  }, [pathname, router, showErrorToast, showInfoToast]);

  return null;
}
