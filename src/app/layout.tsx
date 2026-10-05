import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "../components/Navbar";
import "./globals.css";
import { ToastProvider } from "../components/ui/ToastProvider";
import { AuthProvider } from "../contexts/AuthContext";
import FloatingGroceryDrawer from "../components/grocery/FloatingGroceryDrawer";
import AuthCallbackListener from "../components/auth/AuthCallbackListener";
import Footer from "../components/Footer";
import ServiceWorkerRegister from "../components/pwa/ServiceWorkerRegister";
import InstallAppBanner from "../components/pwa/InstallAppBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: {
    template: "%s • Culineer",
    default: "Culineer • Your Culinary Co-pilot",
  },
  description: "Your everyday culinary co-pilot for saving recipes, smart meal planning, and distraction-free cooking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="dark"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('recipe_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-[#f8f6f1] text-[#1c1917] dark:bg-[#12100e] dark:text-[#fafaf9] min-h-screen pb-16 md:pb-0 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200 flex flex-col justify-between"
      >
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingGroceryDrawer />
            <AuthCallbackListener />
            <ServiceWorkerRegister />
            <InstallAppBanner />
          </ToastProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
