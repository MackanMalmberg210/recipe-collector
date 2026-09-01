import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "../components/Navbar";
import "./globals.css";
import { ToastProvider } from "../components/ui/ToastProvider";
import FloatingGroceryDrawer from "../components/grocery/FloatingGroceryDrawer";
import AuthCallbackListener from "../components/auth/AuthCallbackListener";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: {
    template: "%s • Recipe Collector",
    default: "Recipe Collector • Culinary Studio & Planner",
  },
  description: "A distraction-free studio for recipes, smart meal planning, and everyday cooking.",
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
        className="font-sans antialiased bg-[#f7f5f0] text-stone-900 dark:bg-[#12100e] dark:text-stone-100 min-h-screen pb-16 md:pb-0 selection:bg-amber-500/30 selection:text-amber-200 flex flex-col justify-between"
      >
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingGroceryDrawer />
          <AuthCallbackListener />
        </ToastProvider>
      </body>
    </html>
  );
}
