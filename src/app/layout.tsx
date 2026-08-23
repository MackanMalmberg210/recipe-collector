import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import Navbar from "../components/Navbar";
import "./globals.css";
import { ToastProvider } from "../components/ui/ToastProvider";
import FloatingGroceryDrawer from "../components/grocery/FloatingGroceryDrawer";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    template: "%s • Recipe Collector",
    default: "Recipe Collector • Culinary Studio & Planner",
  },
  description: "A distraction-free studio for recipes, smart meal planning, and everyday cooking.",
};

import Footer from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`dark ${jakartaSans.variable} ${playfairDisplay.variable}`}
    >
      <head>
        <script
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
        </ToastProvider>
      </body>
    </html>
  );
}
